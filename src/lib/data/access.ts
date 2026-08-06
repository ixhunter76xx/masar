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
 * هل **يملك** المستخدم هذا الدرس فعلًا؟ — ملكية عبر `ProductItem` أو
 * صلاحية إدارية، **بلا أي استثناء للمعاينة المجانية**.
 *
 * هذا هو الفحص الصارم الذي تُبنى عليه التقييمات. `canViewLesson` تضيف
 * فوقه باب المعاينة المجانية، والتقييمات لا تمرّ من ذلك الباب.
 */
const ownsLesson = cache(async function ownsLesson(
  lessonId: string,
): Promise<boolean> {
  const lesson = await db.courseMaterial.findUnique({
    where: { id: lessonId },
    select: { courseId: true },
  });
  if (!lesson) return false;

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

/**
 * هل يفتح المستخدم هذا الدرس؟ — للفيديو والمحتوى.
 *
 * ثلاثة أبواب: درس معاينة مجاني يفتحه أي زائر، أو منتج مملوك يحويه،
 * أو صلاحية إدارية. الأول هو ما يجعل الفيديو التجريبي ممكنًا بلا حساب.
 *
 * ⚠ لا تستخدمها لتقييم. المعاينة المجانية امتياز **محتوى** لا امتياز
 * تقييم — انظر `canViewQuiz`.
 */
export const canViewLesson = cache(async function canViewLesson(
  lessonId: string,
): Promise<boolean> {
  const lesson = await db.courseMaterial.findUnique({
    where: { id: lessonId },
    select: { isFreePreview: true, course: { select: { isPublished: true } } },
  });
  if (!lesson) return false;

  // المعاينة المجانية لا تُفتح إلا من مقرر منشور
  if (lesson.isFreePreview && lesson.course.isPublished) return true;

  return ownsLesson(lessonId);
});

/**
 * هل يملك المستخدم أي منتج في هذا المقرر؟ — نطاق المقرر لا الحزمة.
 *
 * تُستخدم للتقييم غير المربوط بدرس (`lessonId = null`): امتحان شامل أو
 * واجب عام لا يقيس وحدة بعينها، فيراه كل من دخل المقرر بأي حزمة.
 */
async function courseWideAccess(courseId: string): Promise<boolean> {
  const { user, isStaff } = await staffAccess(courseId);
  if (!user) return false;
  if (isStaff) return true;

  const grant = await db.enrollment.findFirst({
    where: { userId: user.id, ...notExpired(), product: { courseId } },
    select: { id: true },
  });
  return Boolean(grant);
}

/**
 * هل يفتح المستخدم هذا الاختبار؟
 *
 * **الاختبار يتبع نطاق درسه في الملكية، لا في المجانية.** إن كان مبنيًا
 * على درس فالسؤال يُحوَّل إلى `ownsLesson` — ملكية فعلية عبر
 * `ProductItem` أو صلاحية إدارية. وإن لم يكن مربوطًا بدرس فهو تقييم على
 * مستوى المقرر يراه كل مالك لأي حزمة فيه.
 *
 * ⚠ **`isFreePreview` لا أثر له هنا إطلاقًا.** المعاينة المجانية امتياز
 * محتوى: تُري الزائر فيديو ليقرّر الشراء. أما التقييم فعمل مُقيَّم
 * تُسجَّل فيه محاولة وتُحسب منه درجة، ولا يُفتح إلا لمن اشترى. لو مرّت
 * التقييمات عبر `canViewLesson` لصار ربط اختبار بالدرس المجاني كافيًا
 * ليؤدّيه **كل من يملك حسابًا** ولو لم يشترِ شيئًا — وهو ما لا يُلاحَظ
 * حتى يُربط أول اختبار بذلك الدرس.
 *
 * ولهذا لا نسأل `ProductItem` عن الاختبار نفسه: ذلك يفرض ربط كل اختبار
 * بكل حزمة تحوي درسه يدويًا، وهو تكرار للحقيقة نفسها ينحرف عند أول
 * نسيان — وقد انحرف فعلًا: لم يكن أي اختبار مربوطًا بأي حزمة، فصار
 * الجواب «لا أحد يملكه» بينما القوائم تعرضه للجميع.
 */
export const canViewQuiz = cache(async function canViewQuiz(
  quizId: string,
): Promise<boolean> {
  const quiz = await db.quiz.findUnique({
    where: { id: quizId },
    select: { courseId: true, lessonId: true },
  });
  if (!quiz) return false;

  const session = await auth();
  if (!session?.user) return false;

  if (quiz.lessonId) return ownsLesson(quiz.lessonId);
  return courseWideAccess(quiz.courseId);
});

/**
 * هل يفتح المستخدم هذا الواجب؟ — نفس قاعدة الاختبار حرفيًا، بما فيها
 * تجاهل `isFreePreview` تمامًا.
 *
 * الواجب لا يمكن أن يكون `ProductItem` بنفسه (`ProductItemKind` يعرف
 * الدرس والاختبار فقط)، فالربط بالدرس هو السبيل الوحيد لتحجيمه داخل
 * حزمة — ولهذا كانت الواجبات على مستوى المقرر دائمًا قبل هذا التغيير.
 */
export const canViewAssignment = cache(async function canViewAssignment(
  assignmentId: string,
): Promise<boolean> {
  const assignment = await db.assignment.findUnique({
    where: { id: assignmentId },
    select: { courseId: true, lessonId: true },
  });
  if (!assignment) return false;

  const session = await auth();
  if (!session?.user) return false;

  if (assignment.lessonId) return ownsLesson(assignment.lessonId);
  return courseWideAccess(assignment.courseId);
});

/**
 * دروس هذا المقرر بمجموعتين — استعلام واحد للقوائم.
 *
 * الإفراد (`canViewLesson` / `ownsLesson`) هو الصواب عند فتح صفحة
 * بعينها، لكن تصفية قائمة به تعني استعلامًا لكل عنصر. هذه نسختهما
 * المجمَّعة، وتُعيد **مجموعتين لا واحدة** لأن السؤالين مختلفان:
 *
 * - `owned` — ملكية فعلية عبر `ProductItem`. تُصفَّى بها **التقييمات**.
 * - `viewable` — `owned` زائد دروس المعاينة المجانية. تُصفَّى بها
 *   **المحاضرات** وحدها.
 *
 * دمجهما في مجموعة واحدة هو بالضبط الخطأ الذي يجعل اختبارًا مربوطًا
 * بالدرس المجاني يظهر لمن لم يشترِ شيئًا. الفصل هنا يطابق الفصل بين
 * `canViewLesson` و`ownsLesson` في الإفراد، فلا تتباعد القائمة عن
 * الصفحة.
 *
 * `isStaff` تُعاد منفصلة لا مدموجةً في المجموعتين: الإدارة والمدرّب
 * يريان المسودات وما لم يُربط بحزمة بعد، وهي حالة «الكل» لا قائمة.
 */
export const accessibleLessonIds = cache(async function accessibleLessonIds(
  courseId: string,
): Promise<{ isStaff: boolean; owned: Set<string>; viewable: Set<string> }> {
  const { user, isStaff } = await staffAccess(courseId);
  if (isStaff) {
    return { isStaff: true, owned: new Set<string>(), viewable: new Set<string>() };
  }

  const owned = new Set<string>();
  if (user) {
    const rows = await db.productItem.findMany({
      where: {
        lessonId: { not: null },
        product: {
          courseId,
          enrollments: { some: { userId: user.id, ...notExpired() } },
        },
      },
      select: { lessonId: true },
    });
    for (const item of rows) {
      if (item.lessonId) owned.add(item.lessonId);
    }
  }

  // الدرس المجاني مفتوح قبل الشراء وقبل تسجيل الدخول — للمحاضرات فقط
  const free = await db.courseMaterial.findMany({
    where: { courseId, isFreePreview: true, course: { isPublished: true } },
    select: { id: true },
  });

  const viewable = new Set(owned);
  for (const lesson of free) viewable.add(lesson.id);

  return { isStaff: false, owned, viewable };
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
