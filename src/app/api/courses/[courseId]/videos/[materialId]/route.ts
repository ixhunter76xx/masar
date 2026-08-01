import { NextResponse } from "next/server";
import { DeleteObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";

import { auth } from "@/auth";
import { db } from "@/server/db";
import { r2, r2Bucket } from "@/server/r2";
import { canManageCourse } from "@/lib/data/materials";

/**
 * حذف مادة تعليمية.
 *
 * الترتيب مقصود: **الملف من R2 أولًا، ثم السجل من قاعدة البيانات**.
 * لو عُكس الترتيب وفشل حذف الملف، لبقي كائن يتيم في التخزين بلا أي
 * سجل يشير إليه — أي تكلفة صامتة لا يمكن تتبّعها.
 *
 * وإن كان الكائن غير موجود أصلًا (رفع فاشل مثلًا) نُكمل حذف السجل،
 * فالهدف النهائي هو ألا يبقى أثر في الطرفين.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ courseId: string; materialId: string }> },
) {
  const { courseId, materialId } = await params;

  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "غير مصرّح." }, { status: 401 });
  }

  // الطالب لا يحذف إطلاقًا؛ المدرب في مقرراته فقط
  const allowed = await canManageCourse(
    courseId,
    session.user.id,
    session.user.role,
  );
  if (!allowed) {
    return NextResponse.json(
      { error: "ليس لديك صلاحية الحذف في هذا المقرر." },
      { status: 403 },
    );
  }

  const material = await db.courseMaterial.findFirst({
    where: { id: materialId, courseId },
    select: { id: true, objectKey: true, title: true },
  });

  if (!material) {
    return NextResponse.json({ error: "المادة غير موجودة." }, { status: 404 });
  }

  const client = r2();
  const Bucket = r2Bucket();
  const Key = material.objectKey;

  if (Key) {
    try {
      await client.send(new DeleteObjectCommand({ Bucket, Key }));

      // DeleteObject في S3 ينجح حتى لو لم يكن المفتاح موجودًا،
      // لذلك نتأكد فعليًا من اختفاء الكائن قبل حذف السجل.
      try {
        await client.send(new HeadObjectCommand({ Bucket, Key }));
        // وصلنا هنا يعني أن الكائن ما يزال موجودًا
        return NextResponse.json(
          { error: "تعذّر حذف الملف من التخزين. لم يُحذف السجل." },
          { status: 502 },
        );
      } catch (headError) {
        const name = (headError as { name?: string }).name;
        const status = (headError as { $metadata?: { httpStatusCode?: number } })
          .$metadata?.httpStatusCode;
        // 404/NotFound هو المتوقّع بعد حذف ناجح
        const gone = name === "NotFound" || name === "NoSuchKey" || status === 404;
        if (!gone) throw headError;
      }
    } catch (error) {
      console.error("[r2] فشل حذف الكائن:", error);
      return NextResponse.json(
        {
          error:
            "تعذّر الاتصال بخدمة التخزين، فلم يُحذف شيء. حاول مرة أخرى.",
        },
        { status: 502 },
      );
    }
  }

  await db.courseMaterial.delete({ where: { id: material.id } });

  return NextResponse.json({ ok: true, deleted: material.title });
}
