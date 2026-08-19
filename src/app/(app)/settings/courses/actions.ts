"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/server/db";
import { requireAdmin } from "@/lib/data/admin";
import { revalidatePublicCourses } from "@/lib/public-course-cache";
import { ProductItemKind, Role } from "@/generated/prisma/enums";

export type ActionResult = { ok: true } | { ok: false; message: string };

const ok: ActionResult = { ok: true };
const fail = (message: string): ActionResult => ({ ok: false, message });

function firstIssue(error: z.ZodError): string {
  return error.issues[0]?.message ?? "البيانات المُدخلة غير صالحة.";
}

/* -------------------------------------------------------------------------- */
/*  المقررات                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * المسار العام يُشتقّ من الرمز ولا يُطلب من المدير.
 *
 * حقلان يحملان المعنى نفسه (`ARAB110` و`arab110`) يفترقان عند أول خطأ
 * طباعة، والمسار هو ما يُشارَك في واتساب فلا يُصلَح بعدها. والاشتقاق
 * يجعل الرابط دائمًا صورةً من الرمز الذي يعرفه الطالب.
 */
function slugFromCode(code: string): string {
  return code.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

const courseSchema = z.object({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .min(3, "رمز المقرر قصير جدًا.")
    .max(16)
    .regex(/^[A-Z0-9]+$/, "الرمز: حروف لاتينية وأرقام فقط، مثل ARAB110."),
  title: z.string().trim().min(3, "عنوان المقرر قصير جدًا.").max(160),
  summary: z.string().trim().max(300).optional(),
  description: z.string().trim().max(2000).optional(),
  facultyId: z.string().trim().min(1, "اختر الكلية."),
  presenterId: z.string().trim().optional(),
});

export async function createCourse(formData: FormData): Promise<ActionResult> {
  await requireAdmin();

  const parsed = courseSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail(firstIssue(parsed.error));

  const { code, title, summary, description, facultyId, presenterId } = parsed.data;
  const slug = slugFromCode(code);

  const clash = await db.course.findFirst({
    where: { OR: [{ code }, { slug }] },
    select: { id: true },
  });
  if (clash) return fail("رمز المقرر مستخدَم بالفعل.");

  const faculty = await db.faculty.findUnique({
    where: { id: facultyId },
    select: { id: true },
  });
  if (!faculty) return fail("الكلية غير موجودة.");

  /* المقدّم اختياري، ولا يُقبل إلا إن كان مدرّبًا فعلًا: تمرير معرّف
     طالب هنا يجعله يرى محتوى غير منشور عبر `staffAccess`. */
  if (presenterId) {
    const presenter = await db.user.findFirst({
      where: { id: presenterId, role: Role.INSTRUCTOR },
      select: { id: true },
    });
    if (!presenter) return fail("المقدّم المختار ليس مدرّبًا.");
  }

  /* يُنشأ غير منشور دائمًا: مقرر بلا دروس ولا أسعار لا يُعرض للبيع،
     والنشر فعل منفصل بعد اكتمال محتواه. */
  await db.course.create({
    data: {
      code,
      slug,
      title,
      summary: summary || null,
      description: description || null,
      facultyId,
      presenterId: presenterId || null,
      isPublished: false,
    },
  });

  revalidatePath("/settings/courses");
  revalidatePublicCourses();
  return ok;
}

export async function setCoursePublished(
  courseId: string,
  isPublished: boolean,
): Promise<ActionResult> {
  await requireAdmin();

  /* لا يُنشر مقرر بلا باقة: الزائر يصل إلى صفحة بلا أي زرّ شراء،
     وهي أسوأ من غياب المقرر لأنها تبدو معطّلة. */
  if (isPublished) {
    const products = await db.product.count({
      where: { courseId, isPublished: true },
    });
    if (products === 0) {
      return fail("أضف باقة منشورة واحدة على الأقل قبل نشر المقرر.");
    }
  }

  await db.course.update({ where: { id: courseId }, data: { isPublished } });

  revalidatePath("/settings/courses");
  revalidatePublicCourses();
  return ok;
}

/**
 * إسناد مقدّم إلى مقرر قائم أو نزعه.
 *
 * كان الإسناد ممكنًا عند الإنشاء فقط، فتغييره بعدها يحتاج قاعدة
 * البيانات — وهو أكثر ما يتغيّر فعلًا: المدرّب يتبدّل والمقرر يبقى.
 *
 * المقدّم يمنح معاينة المحتوى غير المنشور عبر `staffAccess`، فيُشترط
 * أن يكون مدرّبًا فعلًا. تمرير معرّف طالب هنا يفتح له مسودات المقرر.
 */
export async function setCoursePresenter(
  courseId: string,
  presenterId: string | null,
): Promise<ActionResult> {
  await requireAdmin();

  if (presenterId) {
    const presenter = await db.user.findFirst({
      where: { id: presenterId, role: Role.INSTRUCTOR, isActive: true },
      select: { id: true },
    });
    if (!presenter) return fail("المقدّم المختار ليس مدرّبًا نشطًا.");
  }

  await db.course.update({
    where: { id: courseId },
    data: { presenterId },
  });

  revalidatePath("/settings/courses");
  revalidatePublicCourses();
  return ok;
}

/* -------------------------------------------------------------------------- */
/*  الباقات                                                                    */
/* -------------------------------------------------------------------------- */

const productSchema = z.object({
  courseId: z.string().trim().min(1),
  title: z.string().trim().min(3, "عنوان الباقة قصير جدًا.").max(120),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(2, "معرّف الباقة قصير جدًا.")
    .max(40)
    .regex(/^[a-z0-9-]+$/, "معرّف الباقة: حروف لاتينية صغيرة وأرقام وشرطة."),
  /* السعر يُدخَل بالدينار ويُخزَّن بالفلس. الإدخال بالفلس يدعو لخطأ
     من ألف ضعف لا يُلاحَظ إلا بعد أول عملية بيع. */
  priceDinars: z.coerce
    .number()
    .min(0, "السعر لا يكون سالبًا.")
    .max(999, "السعر أكبر من المتوقّع."),
  lessonIds: z.array(z.string()).min(1, "اختر درسًا واحدًا على الأقل."),
});

export async function createProduct(input: {
  courseId: string;
  title: string;
  slug: string;
  priceDinars: number;
  lessonIds: string[];
}): Promise<ActionResult> {
  await requireAdmin();

  const parsed = productSchema.safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error));

  const { courseId, title, slug, priceDinars, lessonIds } = parsed.data;

  const clash = await db.product.findFirst({
    where: { courseId, slug },
    select: { id: true },
  });
  if (clash) return fail("معرّف الباقة مستخدَم في هذا المقرر.");

  /* الدروس تُتحقَّق أنها من هذا المقرر: معرّف من مقرر آخر يُنشئ باقة
     تبيع محتوى لا يملكه هذا المقرر. */
  const lessons = await db.courseMaterial.findMany({
    where: { id: { in: lessonIds }, courseId },
    select: { id: true },
  });
  if (lessons.length !== lessonIds.length) {
    return fail("بعض الدروس المختارة ليست من هذا المقرر.");
  }

  await db.product.create({
    data: {
      courseId,
      title,
      slug,
      priceFils: Math.round(priceDinars * 1000),
      isPublished: true,
      items: {
        create: lessons.map((lesson, position) => ({
          kind: ProductItemKind.LESSON,
          lessonId: lesson.id,
          position,
        })),
      },
    },
  });

  revalidatePath(`/settings/courses/${courseId}`);
  revalidatePublicCourses();
  return ok;
}

export async function deleteProduct(productId: string): Promise<ActionResult> {
  await requireAdmin();

  const product = await db.product.findUnique({
    where: { id: productId },
    select: { id: true, courseId: true, _count: { select: { enrollments: true, orderItems: true } } },
  });
  if (!product) return fail("الباقة غير موجودة.");

  /* باقة اشتُريت لا تُحذف: الحذف يقطع `OrderItem` عن منتجه ويمحو ما
     يفتحه `Enrollment`. من أراد إيقاف البيع يُلغي النشر. */
  if (product._count.enrollments > 0 || product._count.orderItems > 0) {
    return fail("هذه الباقة مرتبطة بطلبات أو اشتراكات — أوقف نشرها بدل حذفها.");
  }

  await db.product.delete({ where: { id: productId } });

  revalidatePath(`/settings/courses/${product.courseId}`);
  revalidatePublicCourses();
  return ok;
}

export async function setProductPublished(
  productId: string,
  isPublished: boolean,
): Promise<ActionResult> {
  await requireAdmin();

  const product = await db.product.update({
    where: { id: productId },
    data: { isPublished },
    select: { courseId: true },
  });

  revalidatePath(`/settings/courses/${product.courseId}`);
  revalidatePublicCourses();
  return ok;
}

/* -------------------------------------------------------------------------- */
/*  تحرير المقرر وأرشفته — لوحة التحكم                                          */
/* -------------------------------------------------------------------------- */

/**
 * تعديل بيانات مقرر قائم.
 *
 * الرمز قابل للتعديل، والمسار يُشتقّ منه كما في الإنشاء — فلا يفترقان
 * أبدًا. وتغيير الرمز يغيّر الرابط العام، وهو مقصود: الرابط صورةٌ من
 * الرمز لا معرّفٌ مستقلّ.
 */
export async function updateCourse(input: {
  courseId: string;
  code: string;
  title: string;
  summary?: string;
  description?: string;
  facultyId: string;
}): Promise<ActionResult> {
  await requireAdmin();

  const parsed = courseSchema
    .omit({ presenterId: true })
    .safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error));

  const { code, title, summary, description, facultyId } = parsed.data;
  const slug = slugFromCode(code);

  const clash = await db.course.findFirst({
    where: { NOT: { id: input.courseId }, OR: [{ code }, { slug }] },
    select: { id: true },
  });
  if (clash) return fail("رمز المقرر مستخدَم بالفعل.");

  const faculty = await db.faculty.findUnique({
    where: { id: facultyId },
    select: { id: true },
  });
  if (!faculty) return fail("الكلية المختارة غير موجودة.");

  await db.course.update({
    where: { id: input.courseId },
    data: {
      code,
      slug,
      title,
      summary: summary || null,
      description: description || null,
      facultyId,
    },
  });

  revalidatePath("/settings/courses");
  revalidatePath(`/settings/courses/${input.courseId}`);
  revalidatePublicCourses();
  return ok;
}

/**
 * أرشفة مقرر — حذفٌ ناعم.
 *
 * ⚠ لا حذف صلب هنا عمدًا. حذف المقرر يُسقط منتجاته (Cascade)، وسقوطها
 * يقطع `OrderItem` عن منتجه ويُتلف ما يفتحه `Enrollment` — أي يمحو
 * سجلّ من اشترى ماذا وبكم. والأرشفة تُخفي المقرر من الكتالوج ومن
 * شاشات الإدارة وتُبقي ذلك السجلّ كاملًا.
 *
 * والأرشفة تُلغي النشر معها: مقرر مؤرشف ظاهر في الكتالوج تناقض.
 */
export async function setCourseArchived(
  courseId: string,
  archived: boolean,
): Promise<ActionResult> {
  await requireAdmin();

  await db.course.update({
    where: { id: courseId },
    data: archived
      ? { archivedAt: new Date(), isPublished: false }
      : { archivedAt: null },
  });

  revalidatePath("/settings/courses");
  revalidatePublicCourses();
  return ok;
}

/* -------------------------------------------------------------------------- */
/*  تحرير الباقة ومنهجها                                                        */
/* -------------------------------------------------------------------------- */

/**
 * تعديل بيانات باقة قائمة — الاسم والسعر والوصف.
 *
 * ⚠ تغيير السعر **لا يمسّ الطلبات السابقة**، وهذا ليس أثرًا جانبيًا بل
 * تصميم: `OrderItem.unitPriceFils` و`titleSnapshot` يجمّدان السعر
 * والاسم وقت الشراء. فمن اشترى بثمانية يبقى سجلّه ثمانية مهما تغيّر
 * السعر بعده. الشاشة تعرض هذا طمأنةً لا تحذيرًا.
 *
 * والمعرّف (`slug`) غير قابل للتعديل: هو ما يربط الباقة بسجلّاتها،
 * وتغييره يفصل تاريخًا عن حاضره بلا مقابل.
 */
export async function updateProduct(input: {
  productId: string;
  title: string;
  priceDinars: number;
  description?: string;
}): Promise<ActionResult> {
  await requireAdmin();

  const parsed = z
    .object({
      title: z.string().trim().min(2, "اسم الباقة قصير جدًا.").max(120),
      priceDinars: z
        .number({ message: "السعر رقم بالدينار." })
        .min(0, "السعر لا يكون سالبًا.")
        .max(9999),
      description: z.string().trim().max(400).optional(),
    })
    .safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error));

  const { title, priceDinars, description } = parsed.data;

  const product = await db.product.findUnique({
    where: { id: input.productId },
    select: { courseId: true },
  });
  if (!product) return fail("الباقة غير موجودة.");

  await db.product.update({
    where: { id: input.productId },
    data: {
      title,
      /* الفلس هو وحدة التخزين — لا عشريّات عائمة على مسار المال */
      priceFils: Math.round(priceDinars * 1000),
      description: description || null,
    },
  });

  revalidatePath(`/settings/courses/${product.courseId}`);
  revalidatePublicCourses();
  return ok;
}

/**
 * بناء المنهج: تحديد الدروس التي تفتحها الباقة.
 *
 * ── لماذا استبدالٌ كامل لا إضافة/حذف مفردة ─────────────────────────
 * الشاشة تعرض مربّعات اختيار وتُرسل الحالة النهائية. والاستبدال داخل
 * معاملة واحدة يجعل النتيجة هي ما رآه المدير بالضبط، ولا يترك حالة
 * وسطى إن انقطع النداء في منتصفه.
 *
 * ⚠ والحذف هنا يمسّ `ProductItem` وحده — أي **ما تفتحه** الباقة، لا
 * من اشتراها. `Enrollment` و`OrderItem` يشيران إلى `Product` نفسه
 * فلا يمسّهما تغيير المحتوى. لكن انتبه: تضييق باقة مُباعة يسحب
 * دروسًا من طلاب يملكونها فعلًا — ولذلك تحذّر الشاشة قبل الحفظ.
 */
export async function setProductLessons(input: {
  productId: string;
  lessonIds: string[];
}): Promise<ActionResult> {
  await requireAdmin();

  const product = await db.product.findUnique({
    where: { id: input.productId },
    select: { id: true, courseId: true },
  });
  if (!product) return fail("الباقة غير موجودة.");

  /* لا تبيع الباقة محتوى لا يملكه مقررها */
  const owned = await db.courseMaterial.findMany({
    where: { id: { in: input.lessonIds }, courseId: product.courseId },
    select: { id: true },
  });
  if (owned.length !== input.lessonIds.length) {
    return fail("بعض الدروس المختارة ليست من هذا المقرر.");
  }

  await db.$transaction(async (tx) => {
    await tx.productItem.deleteMany({
      where: { productId: product.id, kind: ProductItemKind.LESSON },
    });
    if (input.lessonIds.length > 0) {
      await tx.productItem.createMany({
        data: input.lessonIds.map((lessonId, index) => ({
          productId: product.id,
          kind: ProductItemKind.LESSON,
          lessonId,
          position: index,
        })),
      });
    }
  });

  revalidatePath(`/settings/courses/${product.courseId}`);
  revalidatePublicCourses();
  return ok;
}
