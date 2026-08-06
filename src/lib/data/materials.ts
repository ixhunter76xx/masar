import "server-only";

import { cache } from "react";

import { db } from "@/server/db";
import { accessibleLessonIds } from "@/lib/data/access";
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
 *
 * ⚠ **النطاق حزمة لا مقرر.** الطالب يرى دروس ما اشتراه فقط: مشتري
 * «دورة المنتصف» لا يرى درسَي النهائي. كانت هذه الدالة تصفّي بالمقرر
 * وحده ولا تستقبل `userId` أصلًا، فكانت أي حزمة تفتح المقرر كلّه —
 * ولم يظهر ذلك لأن كل الدروس `PENDING` فيحجبها مرشّح `READY` قبل أن
 * يهمّ المنتج. التصفية تتم في الذاكرة بعد استعلام واحد لمعرّفات
 * الدروس المتاحة، لا باستعلام لكل صف.
 */
export async function getCourseMaterials(
  courseId: string,
  userId: string,
  role: Role,
): Promise<MaterialListItem[]> {
  const canSeeDrafts = role === Role.INSTRUCTOR || role === Role.ADMIN;

  // المحاضرات تستخدم `viewable` — وهي وحدها ما تشمله المعاينة المجانية
  const [{ isStaff, viewable }, rows] = await Promise.all([
    accessibleLessonIds(courseId),
    db.courseMaterial.findMany({
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
    }),
  ]);

  const visible = isStaff ? rows : rows.filter((r) => viewable.has(r.id));

  return visible.map((r) => ({
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
