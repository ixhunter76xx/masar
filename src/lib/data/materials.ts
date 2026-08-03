import "server-only";

import { cache } from "react";

import { db } from "@/server/db";
import { Role, MaterialStatus } from "@/generated/prisma/enums";

/**
 * يتحقق أن المستخدم يملك حق **الرفع** في هذا المقرر:
 * مدرب المقرر نفسه، أو الإدارة. الطالب لا يرفع إطلاقًا.
 */
export const canManageCourse = cache(async function canManageCourse(
  courseId: string,
  userId: string,
  role: Role,
): Promise<boolean> {
  if (role === Role.ADMIN) {
    return (await db.course.count({ where: { id: courseId } })) > 0;
  }
  if (role === Role.INSTRUCTOR) {
    return (
      (await db.course.count({
        where: { id: courseId, presenterId: userId },
      })) > 0
    );
  }
  return false;
});

export type MaterialListItem = {
  id: string;
  title: string;
  description: string | null;
  status: MaterialStatus;
  sizeBytes: number | null;
  durationSec: number | null;
  isPublished: boolean;
  createdAt: Date;
};

/**
 * مواد المقرر.
 * الطالب يرى المنشورة الجاهزة فقط؛ المدرب والإدارة يريان كل شيء
 * بما فيه المسودات والرفعات الفاشلة.
 */
export async function getCourseMaterials(
  courseId: string,
  role: Role,
): Promise<MaterialListItem[]> {
  const canSeeDrafts = role === Role.INSTRUCTOR || role === Role.ADMIN;

  const rows = await db.courseMaterial.findMany({
    where: {
      courseId,
      ...(canSeeDrafts
        ? {}
        : { status: MaterialStatus.READY, publishedAt: { not: null } }),
    },
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
      sizeBytes: true,
      durationSec: true,
      publishedAt: true,
      createdAt: true,
    },
  });

  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    description: r.description,
    status: r.status,
    // BigInt لا يُسلسَل إلى JSON — نحوّله عند حدود طبقة البيانات
    sizeBytes: r.sizeBytes === null ? null : Number(r.sizeBytes),
    durationSec: r.durationSec,
    isPublished: r.publishedAt !== null,
    createdAt: r.createdAt,
  }));
}
