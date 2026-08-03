import "server-only";

import { cache } from "react";

import { db } from "@/server/db";
import { auth } from "@/auth";
import { Role } from "@/generated/prisma/enums";

/**
 * ═══ البوّابة الوحيدة لحقّ الوصول في مسار ═══════════════════════════
 *
 * في مركز حساب كان السؤال «هل الطالب مسجَّل في هذا المقرر؟». في مسار
 * صار «هل يملك منتجًا يفتح له هذا المحتوى؟» — وهو سؤال مختلف: الطالب قد
 * يملك "دورة المنتصف" من ARAB110 فيرى نصف دروسه لا كلّها.
 *
 * كل فحص وصول في المنصة يمرّ من هنا. الميزات الموروثة — الإعلانات
 * والاختبارات والواجبات والرسائل — استُبدلت فحوصها بهذه الدوال بدل
 * الاستعلام عن `Enrollment` مباشرةً، فبقيت تعمل بلا تعديل منطقها.
 *
 * `cache()` يمنع تكرار الاستعلام داخل الطلب الواحد: صفحة الدرس تسأل
 * عن الوصول، والتخطيط يسأل، والقائمة الجانبية تسأل.
 * ═══════════════════════════════════════════════════════════════════
 */

/** الوصول لم ينتهِ بعد — `expiresAt` فارغ يعني دائمًا */
function notExpired() {
  return { OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] };
}

/**
 * الإدارة والأستاذ المقدّم يريان المحتوى بلا شراء.
 *
 * الإدارة لأنها تبني المنتجات وتحتاج معاينتها قبل النشر. والأستاذ لأنه
 * صاحب المحتوى — لكن مقرراته وحدها، لا كل المنصة.
 */
async function staffAccess(courseId: string) {
  const session = await auth();
  if (!session?.user) return { user: null, isStaff: false };

  const { id, role } = session.user;
  if (role === Role.ADMIN) return { user: session.user, isStaff: true };

  if (role === Role.INSTRUCTOR) {
    const owned = await db.course.findFirst({
      where: { id: courseId, presenterId: id },
      select: { id: true },
    });
    return { user: session.user, isStaff: Boolean(owned) };
  }

  return { user: session.user, isStaff: false };
}

/** هل يملك المستخدم هذا المنتج تحديدًا؟ */
export const hasProductAccess = cache(async function hasProductAccess(
  productId: string,
): Promise<boolean> {
  const session = await auth();
  if (!session?.user) return false;

  if (session.user.role !== Role.STUDENT) {
    const product = await db.product.findUnique({
      where: { id: productId },
      select: { courseId: true },
    });
    if (!product) return false;
    return (await staffAccess(product.courseId)).isStaff;
  }

  const grant = await db.enrollment.findFirst({
    where: { userId: session.user.id, productId, ...notExpired() },
    select: { id: true },
  });
  return Boolean(grant);
});

/**
 * هل يملك المستخدم **أي** منتج في هذا المقرر؟
 *
 * هذا هو البديل المباشر لـ«مسجَّل في المقرر» القديم، وتستخدمه الميزات
 * التي نطاقها المقرر لا المنتج: الإعلانات والرسائل.
 */
export const hasCourseAccess = cache(async function hasCourseAccess(
  courseId: string,
): Promise<boolean> {
  const { user, isStaff } = await staffAccess(courseId);
  if (!user) return false;
  if (isStaff) return true;

  const grant = await db.enrollment.findFirst({
    where: { userId: user.id, product: { courseId }, ...notExpired() },
    select: { id: true },
  });
  return Boolean(grant);
});

/**
 * هل يفتح المستخدم هذا الدرس؟
 *
 * ثلاثة أبواب: درس معاينة مجاني يفتحه أي زائر، أو منتج مملوك يحويه،
 * أو صلاحية إدارية. الأول هو ما يجعل الفيديو التجريبي ممكنًا بلا حساب.
 */
export const canViewLesson = cache(async function canViewLesson(
  lessonId: string,
): Promise<boolean> {
  const lesson = await db.courseMaterial.findUnique({
    where: { id: lessonId },
    select: { courseId: true, isFreePreview: true, course: { select: { isPublished: true } } },
  });
  if (!lesson) return false;

  // المعاينة المجانية لا تُفتح إلا من مقرر منشور
  if (lesson.isFreePreview && lesson.course.isPublished) return true;

  const { user, isStaff } = await staffAccess(lesson.courseId);
  if (!user) return false;
  if (isStaff) return true;

  const grant = await db.enrollment.findFirst({
    where: {
      userId: user.id,
      ...notExpired(),
      product: { items: { some: { lessonId } } },
    },
    select: { id: true },
  });
  return Boolean(grant);
});

/** هل يفتح المستخدم هذا الاختبار؟ لا معاينة مجانية للاختبارات */
export const canViewQuiz = cache(async function canViewQuiz(
  quizId: string,
): Promise<boolean> {
  const quiz = await db.quiz.findUnique({
    where: { id: quizId },
    select: { courseId: true },
  });
  if (!quiz) return false;

  const { user, isStaff } = await staffAccess(quiz.courseId);
  if (!user) return false;
  if (isStaff) return true;

  const grant = await db.enrollment.findFirst({
    where: {
      userId: user.id,
      ...notExpired(),
      product: { items: { some: { quizId } } },
    },
    select: { id: true },
  });
  return Boolean(grant);
});

/** معرّفات المقررات التي يملك المستخدم فيها شيئًا — لقوائم "مقرراتي" */
export const accessibleCourseIds = cache(async function accessibleCourseIds(
  userId: string,
): Promise<string[]> {
  const rows = await db.enrollment.findMany({
    where: { userId, ...notExpired() },
    select: { product: { select: { courseId: true } } },
  });
  return [...new Set(rows.map((row) => row.product.courseId))];
});
