import "server-only";

import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { db } from "@/server/db";
import { r2, r2Bucket } from "@/server/r2";
import { Role, MaterialStatus, EnrollmentStatus } from "@/generated/prisma/enums";

/** مدة صلاحية رابط المشاهدة */
const PLAYBACK_TTL = 2 * 60 * 60; // ساعتان

/**
 * رابط مشاهدة مؤقّت لمادة فيديو.
 *
 * الدلو خاص بالكامل؛ لا يوجد رابط دائم. نتحقق أولًا من أن المستخدم
 * مسجَّل في المقرر (أو مدرّبه أو إدارة)، ثم نوقّع رابطًا صالحًا ساعتين.
 *
 * الرابط الموقّع **حامل للصلاحية** — من يحصل عليه خلال مدته يشاهد.
 * لذلك مدته قصيرة ولا يُخزَّن.
 */
export async function getPlaybackUrl(
  materialId: string,
  userId: string,
  role: Role,
): Promise<string | null> {
  const material = await db.courseMaterial.findFirst({
    where: {
      id: materialId,
      status: MaterialStatus.READY,
      ...(role === Role.ADMIN
        ? {}
        : role === Role.INSTRUCTOR
          ? { course: { instructorId: userId } }
          : {
              publishedAt: { not: null },
              course: {
                enrollments: {
                  some: { studentId: userId, status: EnrollmentStatus.ACTIVE },
                },
              },
            }),
    },
    select: { objectKey: true, contentType: true },
  });

  if (!material) return null;

  return getSignedUrl(
    r2(),
    new GetObjectCommand({
      Bucket: r2Bucket(),
      Key: material.objectKey,
      ResponseContentType: material.contentType,
    }),
    { expiresIn: PLAYBACK_TTL },
  );
}
