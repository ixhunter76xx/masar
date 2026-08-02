import { NextResponse } from "next/server";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { auth } from "@/auth";
import { db } from "@/server/db";
import { r2, r2Bucket } from "@/server/r2";
import { canManageCourse } from "@/lib/data/materials";
import { Role } from "@/generated/prisma/enums";

const DOWNLOAD_TTL = 10 * 60;

/**
 * تنزيل ملف تسليم.
 *
 * الصلاحية: مدرب المقرر أو الإدارة، أو **الطالب صاحب التسليم نفسه**.
 * أي طالب آخر يحصل على 404 — فلا يستطيع تنزيل عمل زميله ولو خمّن المعرّف.
 */
export async function GET(
  _request: Request,
  {
    params,
  }: {
    params: Promise<{
      courseId: string;
      assignmentId: string;
      submissionId: string;
    }>;
  },
) {
  const { courseId, assignmentId, submissionId } = await params;

  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "غير مصرّح." }, { status: 401 });
  }

  const { id: userId, role } = session.user;
  const canManage = await canManageCourse(courseId, userId, role);

  const submission = await db.submission.findFirst({
    where: {
      id: submissionId,
      assignmentId,
      assignment: { courseId },
      // الطالب مقصور على تسليمه هو
      ...(canManage ? {} : { studentId: userId }),
    },
    select: { objectKey: true, fileName: true, contentType: true },
  });

  if (!submission?.objectKey) {
    return NextResponse.json({ error: "غير موجود." }, { status: 404 });
  }

  // الطالب غير المسجَّل لا يصل أصلًا لأن الاستعلام يقيّده بمعرّفه
  if (!canManage && role !== Role.STUDENT) {
    return NextResponse.json({ error: "غير موجود." }, { status: 404 });
  }

  const url = await getSignedUrl(
    r2(),
    new GetObjectCommand({
      Bucket: r2Bucket(),
      Key: submission.objectKey,
      ResponseContentDisposition: `attachment; filename="${encodeURIComponent(
        submission.fileName ?? "submission",
      )}"`,
    }),
    { expiresIn: DOWNLOAD_TTL },
  );

  return NextResponse.redirect(url, {
    status: 302,
    headers: { "cache-control": "private, no-store" },
  });
}
