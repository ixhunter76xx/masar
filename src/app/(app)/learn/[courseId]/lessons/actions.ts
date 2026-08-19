"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { auth } from "@/auth";
import { db } from "@/server/db";
import { canManageCourse } from "@/lib/data/materials";
import { revalidatePublicCourses } from "@/lib/public-course-cache";
import { MaterialStatus } from "@/generated/prisma/enums";

export type ActionResult = { ok: true } | { ok: false; message: string };

const fail = (message: string): ActionResult => ({ ok: false, message });

/**
 * ═══ تخطيط منهج المقرر ═══════════════════════════════════════════════
 *
 * الدرس يوجد قبل فيديوه. هذه الإجراءات تبني «سكّة المقرر» — العناوين
 * والترتيب وأيّها معاينة مجانية — بلا أن يُرفع شيء.
 *
 * ── التقاطع الذي يجب ألّا يُكسر ──────────────────────────────────────
 * كل منطق الحزم مبني على **معرّف الدرس**: `ProductItem.lessonId` يربط
 * الباقة بدروسها، و`Quiz.lessonId`/`Assignment.lessonId` يربطان التقييم
 * بدرسه، و`canViewLesson` تسأل عن الملكية بذلك المعرّف.
 *
 * لذلك إعادة الترتيب هنا **تغيّر `position` فقط ولا تمسّ معرّفًا**.
 * ترقيم العرض مشتقّ من الترتيب لا مخزَّن، فلا رابط يتحرّك معه. ولو
 * كانت السكّة تعيد إنشاء الصفوف عند الترتيب لانقطعت كل تلك الروابط
 * صامتةً — وهو ما يجعل «الترتيب» أخطر ما في هذه الشاشة رغم بساطته.
 * ═══════════════════════════════════════════════════════════════════
 */
async function requireManager(courseId: string) {
  const session = await auth();
  if (!session?.user) return null;
  const allowed = await canManageCourse(courseId, session.user.id, session.user.role);
  return allowed ? session.user : null;
}

const titleSchema = z
  .string()
  .trim()
  .min(2, "عنوان الدرس قصير جدًا.")
  .max(160, "عنوان الدرس طويل جدًا.");

/** إنشاء درس مخطَّط — بلا ملف، في آخر السكّة */
export async function createPlannedLesson(
  courseId: string,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireManager(courseId);
  if (!user) return fail("ليس لديك صلاحية في هذا المقرر.");

  const parsed = titleSchema.safeParse(formData.get("title"));
  if (!parsed.success) return fail(parsed.error.issues[0]!.message);

  const last = await db.courseMaterial.findFirst({
    where: { courseId },
    orderBy: { position: "desc" },
    select: { position: true },
  });

  await db.courseMaterial.create({
    data: {
      courseId,
      title: parsed.data,
      /* لا مفتاح ولا ملف: `PENDING` مع `objectKey = null` هو تعريف
         «مخطَّط». الرفع لاحقًا يملأ الاثنين. */
      objectKey: null,
      status: MaterialStatus.PENDING,
      position: (last?.position ?? -1) + 1,
      uploadedById: user.id,
    },
  });

  revalidatePath(`/learn/${courseId}`);
  revalidatePublicCourses();
  return { ok: true };
}

export async function renameLesson(
  courseId: string,
  materialId: string,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireManager(courseId);
  if (!user) return fail("ليس لديك صلاحية في هذا المقرر.");

  const parsed = titleSchema.safeParse(formData.get("title"));
  if (!parsed.success) return fail(parsed.error.issues[0]!.message);

  const { count } = await db.courseMaterial.updateMany({
    where: { id: materialId, courseId },
    data: { title: parsed.data },
  });
  if (count === 0) return fail("الدرس غير موجود.");

  revalidatePath(`/learn/${courseId}`);
  revalidatePublicCourses();
  return { ok: true };
}

/**
 * تعيين درس معاينة مجانية — **أكثر من واحد مسموح**.
 *
 * ── ما تغيّر ولماذا ────────────────────────────────────────────────
 * كان التعيين يُلغي العلامة عن بقية دروس المقرر، بحجّة أن المتجر يقرأ
 * `materials.find(m => m.isFreePreview)` فيصير المعروض رهنَ ترتيب
 * الاستعلام. وتلك الحجّة لم تكن صحيحة: الاستعلام في `getPublicCourse`
 * مرتَّب بـ`orderBy: { position: "asc" }`، فـ`find` تُرجع **أوّل درس
 * مجاني بترتيب المنهج** — قرارٌ محدَّد لا صدفة.
 *
 * فالقيد كان يحمي من خطر غير قائم، ويمنع المالك من عرض أكثر من درس
 * للتجربة. والوصول كان صحيحًا أصلًا: `canViewLesson` يفحص علم الدرس
 * **نفسه** لا علمًا على مستوى المقرر، فتعدّد المعاينات يعمل بلا تغيير.
 *
 * ⚠ الأثر الباقي: بطاقة المتجر تعرض في المشغّل **أوّل** مجاني بترتيب
 * المنهج، وقائمة الدروس تعلّم كلّ المجانية. أي أن ترتيب الدروس صار هو
 * ما يحدّد الدرس المعروض في البطل — وهو ضابط مفهوم للمالك.
 */
export async function setFreePreviewLesson(
  courseId: string,
  materialId: string,
  isFreePreview: boolean,
): Promise<ActionResult> {
  const user = await requireManager(courseId);
  if (!user) return fail("ليس لديك صلاحية في هذا المقرر.");

  const lesson = await db.courseMaterial.findFirst({
    where: { id: materialId, courseId },
    select: { id: true },
  });
  if (!lesson) return fail("الدرس غير موجود.");

  await db.courseMaterial.update({
    where: { id: lesson.id },
    data: { isFreePreview },
  });

  revalidatePath(`/learn/${courseId}`);
  revalidatePublicCourses();
  return { ok: true };
}

/**
 * تحريك درس خطوة في السكّة.
 *
 * تبديل `position` بين الدرس وجاره — لا حذف ولا إنشاء، فمعرّفات الدروس
 * ثابتة و`ProductItem` والتقييمات المرتبطة بها لا تتأثّر إطلاقًا.
 */
export async function moveLesson(
  courseId: string,
  materialId: string,
  direction: "up" | "down",
): Promise<ActionResult> {
  const user = await requireManager(courseId);
  if (!user) return fail("ليس لديك صلاحية في هذا المقرر.");

  const lessons = await db.courseMaterial.findMany({
    where: { courseId },
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
    select: { id: true, position: true },
  });

  const index = lessons.findIndex((lesson) => lesson.id === materialId);
  if (index === -1) return fail("الدرس غير موجود.");

  const target = direction === "up" ? index - 1 : index + 1;
  if (target < 0 || target >= lessons.length) return { ok: true };

  /* نعيد ترقيم السكّة كلها بدل تبديل قيمتين: الصفوف القديمة قد تحمل
     `position = 0` جميعًا (القيمة الافتراضية)، وتبديلُ متساويين لا
     يحرّك شيئًا. إعادة الترقيم تُصلح ذلك مرة واحدة وإلى الأبد. */
  const ordered = [...lessons];
  [ordered[index], ordered[target]] = [ordered[target]!, ordered[index]!];

  await db.$transaction(
    ordered.map((lesson, position) =>
      db.courseMaterial.update({ where: { id: lesson.id }, data: { position } }),
    ),
  );

  revalidatePath(`/learn/${courseId}`);
  revalidatePublicCourses();
  return { ok: true };
}

/**
 * حذف درس مخطَّط لم يُرفع له ملف.
 *
 * الدرس الذي رُفع له فيديو يُحذف من شاشته الخاصة، لأن حذفه يجب أن يمحو
 * الكائن من R2 أيضًا — وذلك مسار قائم لا نكرّره هنا.
 *
 * ── ولماذا يُمنع الحذف إن كان في باقة أو تحته تقييم ─────────────────
 * `ProductItem.lessonId` يُحذف بالتتالي، فحذف الدرس **يُنقص باقةً
 * مُباعة بلا إشعار**؛ ومن اشتراها يفقد جزءًا دفع ثمنه. و`Quiz.lessonId`
 * يصير `NULL`، أي أن اختبارًا مخصَّصًا لدرس يتحوّل صامتًا إلى اختبار
 * على مستوى المقرر فيراه من لم يشترِ ذلك الدرس. كلاهما فقدُ معنى لا
 * يُلاحَظ من هذه الشاشة، فيُرفض هنا صراحةً.
 */
export async function deletePlannedLesson(
  courseId: string,
  materialId: string,
): Promise<ActionResult> {
  const user = await requireManager(courseId);
  if (!user) return fail("ليس لديك صلاحية في هذا المقرر.");

  const lesson = await db.courseMaterial.findFirst({
    where: { id: materialId, courseId },
    select: {
      id: true,
      objectKey: true,
      status: true,
      _count: { select: { productItems: true, quizzes: true, assignments: true } },
    },
  });
  if (!lesson) return fail("الدرس غير موجود.");

  if (lesson.objectKey !== null || lesson.status === MaterialStatus.READY) {
    return fail("هذا الدرس له فيديو مرفوع — احذفه من صفحة الدرس ليُمحى الملف معه.");
  }

  if (lesson._count.productItems > 0) {
    return fail("هذا الدرس ضمن باقة — أزِله من الباقة قبل حذفه.");
  }

  if (lesson._count.quizzes > 0 || lesson._count.assignments > 0) {
    return fail("هذا الدرس مرتبط باختبار أو واجب — افصلهما عنه قبل حذفه.");
  }

  await db.courseMaterial.delete({ where: { id: lesson.id } });

  revalidatePath(`/learn/${courseId}`);
  revalidatePublicCourses();
  return { ok: true };
}
