import "server-only";

import { cache } from "react";
import { notFound } from "next/navigation";

import { db } from "@/server/db";
import { auth } from "@/auth";
import { hasCourseAccess, enrolledInCourse } from "@/lib/data/access";
import { Role } from "@/generated/prisma/enums";

export type CourseCard = {
  id: string;
  code: string;
  slug: string;
  title: string;
  summary: string | null;
  presenterName: string | null;
  /** عدد المنتجات المنشورة — يُعرض في الكتالوج */
  productCount: number;
  /** عدد الدروس في المقرر كله */
  lessonCount: number;
  /** هل فيه درس معاينة مجاني؟ — أقوى إشارة في بطاقة الكتالوج */
  hasFreePreview: boolean;
  /** أرخص سعر متاح، بالفلس — «يبدأ من» */
  fromPriceFils: number | null;
};

/* -------------------------------------------------------------------------- */
/*  الكتالوج العام — بلا جلسة                                                  */
/* -------------------------------------------------------------------------- */

/**
 * المقررات المنشورة لكل زائر.
 *
 * لا تقرأ الجلسة إطلاقًا: هذه أول صفحة يراها من لا حساب له، وأي استدعاء
 * لـ `auth()` هنا يجعلها ديناميكية بلا سبب ويخلط العام بالخاص.
 */
export async function listPublishedCourses(): Promise<CourseCard[]> {
  const rows = await db.course.findMany({
    where: { isPublished: true },
    orderBy: [{ sortOrder: "asc" }, { code: "asc" }],
    select: {
      id: true,
      code: true,
      slug: true,
      title: true,
      summary: true,
      presenter: { select: { name: true } },
      products: {
        where: { isPublished: true },
        select: { priceFils: true },
        orderBy: { priceFils: "asc" },
      },
      _count: { select: { materials: true } },
      materials: {
        where: { isFreePreview: true },
        select: { id: true },
        take: 1,
      },
    },
  });

  return rows.map((course) => ({
    id: course.id,
    code: course.code,
    slug: course.slug,
    title: course.title,
    summary: course.summary,
    presenterName: course.presenter?.name ?? null,
    productCount: course.products.length,
    lessonCount: course._count.materials,
    hasFreePreview: course.materials.length > 0,
    fromPriceFils: course.products[0]?.priceFils ?? null,
  }));
}

/**
 * صفحة المقرر العامة بالمسار النصّي (slug).
 *
 * تُرجع المنتجات المنشورة بأسعارها وعدد دروسها، ودرس المعاينة المجاني
 * إن وُجد. `notFound()` للمقرر غير المنشور: الزائر لا يعرف أنه موجود.
 */
export const getPublicCourse = cache(async function getPublicCourse(
  slug: string,
) {
  const course = await db.course.findFirst({
    where: { slug, isPublished: true },
    select: {
      id: true,
      code: true,
      slug: true,
      title: true,
      summary: true,
      description: true,
      presenter: { select: { name: true } },
      products: {
        where: { isPublished: true },
        orderBy: [{ sortOrder: "asc" }, { priceFils: "asc" }],
        select: {
          id: true,
          slug: true,
          title: true,
          description: true,
          priceFils: true,
          currency: true,
          /* معرّفات دروس الباقة — بها تسمّي الصفحةُ ما تشتريه بالضبط
             بدل رقم مجرّد. قراءة عرضٍ فقط، لا منطق. */
          items: {
            orderBy: { position: "asc" },
            select: { lessonId: true },
          },
          _count: { select: { items: true } },
        },
      },
      /* كل الدروس لا المعاينة وحدها: إخفاء ما لم يُشترَ يجعل القيمة
         مجهولة، وإظهاره مقفلًا يجعلها ملموسة. */
      materials: {
        orderBy: { position: "asc" },
        select: {
          id: true,
          title: true,
          durationSec: true,
          isFreePreview: true,
        },
      },
    },
  });

  if (!course) notFound();

  return {
    ...course,
    lessons: course.materials,
    freePreview: course.materials.find((m) => m.isFreePreview) ?? null,
    products: course.products.map((p) => ({
      id: p.id,
      slug: p.slug,
      title: p.title,
      description: p.description,
      priceFils: p.priceFils,
      currency: p.currency,
      itemCount: p._count.items,
      lessonIds: p.items
        .map((i) => i.lessonId)
        .filter((id): id is string => id !== null),
    })),
  };
});

/* -------------------------------------------------------------------------- */
/*  بيئة التعلم — تتطلّب حقّ وصول                                              */
/* -------------------------------------------------------------------------- */

/** المقررات التي يملك المستخدم فيها منتجًا واحدًا على الأقل */
export const getMyCourses = cache(async function getMyCourses() {
  const session = await auth();
  if (!session?.user) return [];

  const { id: userId, role } = session.user;

  /* الإدارة ترى كل شيء لتعاينه، والأستاذ يرى مقرراته، والطالب يرى
     ما اشتراه. ثلاثة مرشّحات على نفس الاستعلام لا ثلاثة استعلامات. */
  const where =
    role === Role.ADMIN
      ? {}
      : role === Role.INSTRUCTOR
        ? { presenterId: userId }
        : enrolledInCourse(userId);

  return db.course.findMany({
    where,
    orderBy: [{ sortOrder: "asc" }, { code: "asc" }],
    select: {
      id: true,
      code: true,
      slug: true,
      title: true,
      summary: true,
      presenter: { select: { name: true } },
      products: {
        where:
          role === Role.STUDENT
            ? { enrollments: { some: { userId } } }
            : undefined,
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          slug: true,
          title: true,
          _count: { select: { items: true } },
        },
      },
    },
  });
});

/**
 * مقرر واحد داخل بيئة التعلم، بعد التحقّق من حقّ الوصول.
 *
 * التحقّق عبر `hasCourseAccess` لا عبر استعلام تسجيل: في مسار الوصول
 * يأتي من امتلاك منتج، والدالة هي البوّابة الوحيدة لهذا السؤال.
 */
export const requireCourseAccess = cache(async function requireCourseAccess(
  courseId: string,
) {
  const session = await auth();
  if (!session?.user) notFound();

  const allowed = await hasCourseAccess(courseId);
  if (!allowed) notFound();

  const course = await db.course.findUnique({
    where: { id: courseId },
    select: {
      id: true,
      code: true,
      slug: true,
      title: true,
      summary: true,
      description: true,
      presenter: { select: { name: true } },
    },
  });
  if (!course) notFound();

  return { course, user: session.user };
});

/** يُبقي الاسم القديم عاملًا في الصفحات التي لم تُحدَّث بعد */
export const getCourseForUser = requireCourseAccess;
