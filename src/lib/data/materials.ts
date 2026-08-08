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
 * كل دروس المقرر بترتيبها — لشاشة التخطيط، للمدير وحده.
 *
 * تختلف عن `getCourseMaterials` عمدًا: تلك تصفّي بالحزمة وبحالة النشر
 * لأنها تجيب «ما الذي يراه هذا المستخدم؟». والتخطيط سؤال آخر: «ما
 * الذي في المقرر؟» — بما فيه المخطَّط الذي لا ملف له وغير المنشور.
 * خلطهما كان سيجعل السكّة تُخفي عن المدير ما جاء ليرتّبه.
 */
export async function listLessonsForPlanner(courseId: string) {
  const rows = await db.courseMaterial.findMany({
    where: { courseId },
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      title: true,
      isFreePreview: true,
      status: true,
      objectKey: true,
      publishedAt: true,
    },
  });

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    isFreePreview: row.isFreePreview,
    isReady: row.status === MaterialStatus.READY,
    /* وجود مفتاح لا حالةٌ: الدرس قد يكون قيد الرفع — له مفتاح ولم
       يكتمل. التمييز هو ما يفرّق «بانتظار الرفع» عن «قيد الرفع». */
    hasFile: row.objectKey !== null,
    isPublished: row.publishedAt !== null,
  }));
}

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
