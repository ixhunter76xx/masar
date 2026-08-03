import { NextResponse } from "next/server";
import { z } from "zod";
import {
  PutObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { auth } from "@/auth";
import { db } from "@/server/db";
import { r2, r2Bucket, submissionObjectKey } from "@/server/r2";
import { submissionBlocker } from "@/lib/data/assignments";
import {
  Role,
  AssignmentStatus,
  SubmissionStatus,
} from "@/generated/prisma/enums";

const UPLOAD_TTL = 15 * 60;

const signSchema = z.object({
  action: z.literal("sign"),
  fileName: z.string().trim().min(1).max(255),
  contentType: z.string().trim().min(1).max(200),
  sizeBytes: z.number().int().positive(),
});

const finishSchema = z.object({
  action: z.literal("finish"),
  note: z.string().trim().max(2000).optional(),
  /** يُترك فارغًا إذا كان التسليم ملاحظة بلا ملف */
  uploaded: z.boolean().optional(),
});

const bodySchema = z.discriminatedUnion("action", [signSchema, finishSchema]);

function bad(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

/** يجلب الواجب ويتحقق أن الطالب مسجَّل في مقرره */
async function loadForStudent(
  assignmentId: string,
  courseId: string,
  userId: string,
) {
  return db.assignment.findFirst({
    where: {
      id: assignmentId,
      courseId,
      status: { in: [AssignmentStatus.PUBLISHED, AssignmentStatus.CLOSED] },
      course: {
        products: { some: { enrollments: { some: { userId: userId } } } },
      },
    },
    select: {
      id: true,
      status: true,
      dueAt: true,
      allowLate: true,
      allowedExtensions: true,
      maxFileMb: true,
    },
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ courseId: string; assignmentId: string }> },
) {
  const { courseId, assignmentId } = await params;

  const session = await auth();
  if (!session?.user) return bad("غير مصرّح.", 401);
  if (session.user.role !== Role.STUDENT) {
    return bad("التسليم متاح للطلاب فقط.", 403);
  }

  const userId = session.user.id;

  const assignment = await loadForStudent(assignmentId, courseId, userId);
  if (!assignment) return bad("الواجب غير متاح لك.", 404);

  const blocker = submissionBlocker(assignment);
  if (blocker) return bad(blocker, 403);

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return bad("طلب غير صالح.");

  const body = parsed.data;
  const client = r2();
  const Bucket = r2Bucket();

  /* ---------------------------------------------------------------- */
  /*  توقيع رابط الرفع                                                 */
  /* ---------------------------------------------------------------- */
  if (body.action === "sign") {
    const ext = body.fileName.split(".").pop()?.toLowerCase() ?? "";

    if (!assignment.allowedExtensions.includes(ext)) {
      return bad(
        `الصيغ المسموحة: ${assignment.allowedExtensions.join("، ")}.`,
      );
    }

    const maxBytes = assignment.maxFileMb * 1024 * 1024;
    if (body.sizeBytes > maxBytes) {
      return bad(`حجم الملف يتجاوز ${assignment.maxFileMb} ميجابايت.`);
    }

    // نُنشئ سجل التسليم أولًا لنشتق منه مفتاح الكائن
    const submission = await db.submission.upsert({
      where: { assignmentId_studentId: { assignmentId, studentId: userId } },
      update: {},
      create: { assignmentId, studentId: userId },
      select: { id: true },
    });

    const objectKey = submissionObjectKey(
      courseId,
      assignmentId,
      submission.id,
      ext,
    );

    try {
      const url = await getSignedUrl(
        client,
        new PutObjectCommand({
          Bucket,
          Key: objectKey,
          ContentType: body.contentType,
        }),
        { expiresIn: UPLOAD_TTL },
      );

      await db.submission.update({
        where: { id: submission.id },
        data: {
          objectKey,
          fileName: body.fileName,
          contentType: body.contentType,
        },
      });

      return NextResponse.json({ url, submissionId: submission.id });
    } catch (error) {
      console.error("[r2] فشل توقيع رفع التسليم:", error);
      return bad("تعذّر الاتصال بخدمة التخزين.", 502);
    }
  }

  /* ---------------------------------------------------------------- */
  /*  إنهاء التسليم                                                    */
  /* ---------------------------------------------------------------- */
  const existing = await db.submission.findUnique({
    where: { assignmentId_studentId: { assignmentId, studentId: userId } },
    select: { id: true, objectKey: true },
  });

  if (!existing && !body.note) {
    return bad("أرفق ملفًا أو اكتب ملاحظة.");
  }

  const now = new Date();
  const isLate = assignment.dueAt !== null && now > assignment.dueAt;

  let fileSizeBytes: bigint | null = null;

  // الملف لم يمرّ بخادمنا — نتحقق منه على R2 قبل اعتماد التسليم
  if (body.uploaded && existing?.objectKey) {
    try {
      const head = await client.send(
        new HeadObjectCommand({ Bucket, Key: existing.objectKey }),
      );
      const size = head.ContentLength ?? 0;
      const maxBytes = assignment.maxFileMb * 1024 * 1024;

      if (size <= 0 || size > maxBytes) {
        await client
          .send(new DeleteObjectCommand({ Bucket, Key: existing.objectKey }))
          .catch(() => undefined);
        await db.submission.update({
          where: { id: existing.id },
          data: { objectKey: null, fileName: null, contentType: null },
        });
        return bad("الملف المرفوع غير صالح — حُذف.", 422);
      }

      fileSizeBytes = BigInt(size);
    } catch (error) {
      console.error("[r2] فشل التحقق من ملف التسليم:", error);
      return bad("تعذّر التحقق من الملف المرفوع.", 502);
    }
  }

  const saved = await db.submission.upsert({
    where: { assignmentId_studentId: { assignmentId, studentId: userId } },
    update: {
      note: body.note || null,
      submittedAt: now,
      isLate,
      ...(fileSizeBytes !== null ? { fileSizeBytes } : {}),
      // إعادة التسليم تُلغي التصحيح السابق
      status: SubmissionStatus.SUBMITTED,
      rawPoints: null,
      earnedPoints: null,
      feedback: null,
      gradedAt: null,
      gradedById: null,
    },
    create: {
      assignmentId,
      studentId: userId,
      note: body.note || null,
      submittedAt: now,
      isLate,
    },
    select: { id: true, isLate: true },
  });

  return NextResponse.json({ ok: true, isLate: saved.isLate });
}
