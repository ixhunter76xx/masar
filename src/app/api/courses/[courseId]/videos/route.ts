import { NextResponse } from "next/server";
import { z } from "zod";
import {
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { auth } from "@/auth";
import { db } from "@/server/db";
import { r2, r2Bucket, videoObjectKey } from "@/server/r2";
import { canManageCourse } from "@/lib/data/materials";
import { MaterialStatus } from "@/generated/prisma/enums";
import {
  ALLOWED_VIDEO_TYPE,
  MAX_VIDEO_BYTES,
  PART_SIZE,
} from "@/lib/uploads";

/** مدة صلاحية رابط توقيع الجزء */
const PART_URL_TTL = 60 * 60; // ساعة

const createSchema = z.object({
  action: z.literal("create"),
  /**
   * درسٌ قائم يُرفع إليه — أي أن الرفع **يملأ** درسًا مخطَّطًا بدل أن
   * يُنشئ صفًّا جديدًا. فارغ يعني الرفع العام الذي يُنشئ درسًا بنفسه،
   * وهو ما يبقى للمواد غير المرتبطة بدرس بعينه.
   */
  materialId: z.string().min(1).optional(),
  /* العنوان مطلوب في الرفع العام وحده: الدرس القائم يحمل عنوانه
     ومكانه في السكّة، ولا يُطلبان من الرافع مرة أخرى. */
  title: z.string().trim().min(1, "العنوان مطلوب").max(200).optional(),
  description: z.string().trim().max(2000).optional(),
  contentType: z.literal(ALLOWED_VIDEO_TYPE, {
    message: "الصيغة المدعومة حاليًا هي MP4 فقط.",
  }),
  sizeBytes: z
    .number({ message: "حجم الملف غير صالح." })
    .int()
    .positive("الملف فارغ.")
    .max(MAX_VIDEO_BYTES, "حجم الملف يتجاوز الحد الأقصى (1 جيجابايت)."),
});

const signPartSchema = z.object({
  action: z.literal("sign-part"),
  materialId: z.string().min(1),
  uploadId: z.string().min(1),
  partNumber: z.number().int().min(1).max(10_000),
});

const completeSchema = z.object({
  action: z.literal("complete"),
  materialId: z.string().min(1),
  uploadId: z.string().min(1),
  parts: z
    .array(z.object({ partNumber: z.number().int().min(1), etag: z.string().min(1) }))
    .min(1),
});

const abortSchema = z.object({
  action: z.literal("abort"),
  materialId: z.string().min(1),
  uploadId: z.string().min(1),
});

const bodySchema = z.discriminatedUnion("action", [
  createSchema,
  signPartSchema,
  completeSchema,
  abortSchema,
]);

function bad(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

/** يحوّل أخطاء R2 إلى استجابة مفهومة بدل 500 فارغ */
function storageFailure(operation: string, error: unknown) {
  console.error(`[r2] فشل ${operation}:`, error);
  return NextResponse.json(
    {
      error:
        "تعذّر الاتصال بخدمة التخزين. تأكّد من صحة بيانات R2 في ملف .env.",
    },
    { status: 502 },
  );
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ courseId: string }> },
) {
  const { courseId } = await params;

  const session = await auth();
  if (!session?.user) return bad("غير مصرّح.", 401);

  // الطالب لا يرفع إطلاقًا؛ المدرب لمقرراته فقط
  const allowed = await canManageCourse(
    courseId,
    session.user.id,
    session.user.role,
  );
  if (!allowed) return bad("ليس لديك صلاحية الرفع في هذا المقرر.", 403);

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    // رسائل Zod الافتراضية إنجليزية — نستبدلها برسالة عربية عامة
    const message =
      issue && /^[\u0600-\u06FF]/.test(issue.message)
        ? issue.message
        : "طلب غير صالح.";
    return bad(message);
  }

  const body = parsed.data;
  const client = r2();
  const Bucket = r2Bucket();

  /* ---------------------------------------------------------------- */
  /*  بدء الرفع                                                        */
  /* ---------------------------------------------------------------- */
  if (body.action === "create") {
    /*
     * مسـاران: الرفع إلى درس قائم، أو إنشاء درس جديد.
     *
     * الأول هو ما يجعل تخطيط المنهج ممكنًا — السكّة تُبنى أولًا ثم
     * يُملأ كل درس في وقته. والثاني يبقى للرفع العام غير المرتبط بدرس.
     *
     * `attached` تُميّز الحالتين عند الفشل: صفٌّ أنشأناه للتوّ يُحذف،
     * وصفٌّ خطّطه المدرّس **لا يُحذف أبدًا** — إخفاق الرفع لا يجوز أن
     * يمحو تخطيطًا، ولا أن يقطع ما ارتبط به من باقات أو تقييمات.
     */
    const attached = Boolean(body.materialId);

    let materialId: string;

    if (body.materialId) {
      const existing = await db.courseMaterial.findFirst({
        where: { id: body.materialId, courseId },
        select: { id: true, status: true, objectKey: true },
      });
      if (!existing) return bad("الدرس غير موجود في هذا المقرر.", 404);

      /* درس جاهز لا يُرفع فوقه: الاستبدال يحتاج حذفًا صريحًا يمحو
         الكائن القديم من R2، وإلا بقي يتيمًا يُدفع ثمن تخزينه. */
      if (existing.status === MaterialStatus.READY) {
        return bad("هذا الدرس له فيديو بالفعل — احذفه أولًا لرفع غيره.", 409);
      }

      materialId = existing.id;
    } else {
      if (!body.title) return bad("العنوان مطلوب.");

      const created = await db.courseMaterial.create({
        data: {
          courseId,
          title: body.title,
          description: body.description || null,
          contentType: body.contentType,
          objectKey: null, // يُملأ بعد معرفة المعرّف
          uploadedById: session.user.id,
          status: MaterialStatus.PENDING,
        },
        select: { id: true },
      });
      materialId = created.id;
    }

    const material = { id: materialId };
    const objectKey = videoObjectKey(courseId, material.id);
    await db.courseMaterial.update({
      where: { id: material.id },
      data: { objectKey, contentType: body.contentType },
    });

    try {
      const created = await client.send(
        new CreateMultipartUploadCommand({
          Bucket,
          Key: objectKey,
          ContentType: body.contentType,
        }),
      );

      return NextResponse.json({
        materialId: material.id,
        uploadId: created.UploadId,
        partSize: PART_SIZE,
      });
    } catch (error) {
      if (attached) {
        /* درس مخطَّط: نُعيده إلى حالته لا نحذفه — التخطيط ليس أثرًا
           جانبيًا للرفع، وقد تكون باقةٌ تشير إليه بالفعل. */
        await db.courseMaterial
          .update({ where: { id: material.id }, data: { objectKey: null } })
          .catch(() => undefined);
      } else {
        // صفّ أنشأناه للتوّ: لا نتركه معلّقًا بلا رفع فعلي
        await db.courseMaterial
          .delete({ where: { id: material.id } })
          .catch(() => undefined);
      }
      return storageFailure("بدء الرفع المجزّأ", error);
    }
  }

  /* ---------------------------------------------------------------- */
  /*  توقيع جزء                                                        */
  /* ---------------------------------------------------------------- */
  const found = await db.courseMaterial.findFirst({
    where: { id: body.materialId, courseId },
    select: { id: true, objectKey: true, contentType: true },
  });
  if (!found) return bad("المادة غير موجودة.", 404);

  /*
   * الأفعال الثلاثة الباقية تخصّ رفعًا جاريًا، وهو لا يبدأ إلا بعد أن
   * يُكتب المفتاح في `create`. فمفتاح فارغ هنا يعني درسًا مخطَّطًا لم
   * يبدأ رفعه — لا حالة صالحة. نتحقّق صراحةً بدل تأكيد نوعٍ يُخفي
   * الحالة، فيُصبح الشرط النادر خطأً مقروءًا لا انهيارًا في R2.
   */
  if (found.objectKey === null) {
    return bad("لم يبدأ رفعٌ لهذا الدرس.", 409);
  }

  const material = { ...found, objectKey: found.objectKey };

  if (body.action === "sign-part") {
    try {
        const url = await getSignedUrl(
        client,
        new UploadPartCommand({
          Bucket,
          Key: material.objectKey,
          UploadId: body.uploadId,
          PartNumber: body.partNumber,
        }),
        { expiresIn: PART_URL_TTL },
      );
      return NextResponse.json({ url });
    } catch (error) {
      return storageFailure("توقيع جزء", error);
    }
  }

  /* ---------------------------------------------------------------- */
  /*  الإلغاء                                                          */
  /* ---------------------------------------------------------------- */
  if (body.action === "abort") {
    await client
      .send(
        new AbortMultipartUploadCommand({
          Bucket,
          Key: material.objectKey,
          UploadId: body.uploadId,
        }),
      )
      .catch(() => undefined);

    /*
     * الإلغاء يُرجع الدرس إلى «مخطَّط»، ولا يحذفه إلا إن كان الرفع هو
     * ما أنشأه.
     *
     * التمييز بأن الدرس **سبق أن نُشر** أو أن باقةً أو تقييمًا يشير
     * إليه: أيٌّ من ذلك يعني أنه جزء من تخطيط قائم، وحذفُه لإلغاء رفعٍ
     * يمحو ما لا علاقة له بالرفع — وقد يُنقص باقة مُباعة بلا إشعار.
     */
    const planned = await db.courseMaterial.findUnique({
      where: { id: material.id },
      select: {
        publishedAt: true,
        _count: { select: { productItems: true, quizzes: true, assignments: true } },
      },
    });

    const partOfPlan =
      planned !== null &&
      (planned.publishedAt !== null ||
        planned._count.productItems > 0 ||
        planned._count.quizzes > 0 ||
        planned._count.assignments > 0);

    if (partOfPlan) {
      await db.courseMaterial.update({
        where: { id: material.id },
        data: { objectKey: null, status: MaterialStatus.PENDING },
      });
    } else {
      await db.courseMaterial.delete({ where: { id: material.id } });
    }

    return NextResponse.json({ ok: true });
  }

  /* ---------------------------------------------------------------- */
  /*  الإتمام + التحقق من الملف فعليًا                                 */
  /* ---------------------------------------------------------------- */
  try {
    await client.send(
      new CompleteMultipartUploadCommand({
        Bucket,
        Key: material.objectKey,
        UploadId: body.uploadId,
        MultipartUpload: {
          Parts: body.parts
            .sort((a, b) => a.partNumber - b.partNumber)
            .map((p) => ({ PartNumber: p.partNumber, ETag: p.etag })),
        },
      }),
    );
  } catch (error) {
    await db.courseMaterial
      .update({
        where: { id: material.id },
        data: { status: MaterialStatus.FAILED },
      })
      .catch(() => undefined);
    return storageFailure("إتمام الرفع", error);
  }

  // الملف لم يمرّ بخادمنا إطلاقًا، لذا نتحقق منه الآن على R2.
  // حد الحجم لا يمكن فرضه داخل توقيع PUT، فهذا هو الفرض الحقيقي.
  const head = await client.send(
    new HeadObjectCommand({ Bucket, Key: material.objectKey }),
  );

  const size = head.ContentLength ?? 0;
  const type = head.ContentType ?? "";
  const invalid =
    size <= 0 || size > MAX_VIDEO_BYTES || type !== ALLOWED_VIDEO_TYPE;

  if (invalid) {
    await client
      .send(new DeleteObjectCommand({ Bucket, Key: material.objectKey }))
      .catch(() => undefined);

    await db.courseMaterial.update({
      where: { id: material.id },
      data: { status: MaterialStatus.FAILED },
    });

    return bad(
      size > MAX_VIDEO_BYTES
        ? "حجم الملف يتجاوز الحد المسموح — حُذف الملف."
        : "الملف المرفوع غير صالح — حُذف الملف.",
      422,
    );
  }

  await db.courseMaterial.update({
    where: { id: material.id },
    data: {
      status: MaterialStatus.READY,
      sizeBytes: BigInt(size),
      publishedAt: new Date(),
    },
  });

  return NextResponse.json({ ok: true, materialId: material.id });
}
