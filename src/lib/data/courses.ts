import "server-only";

import { cache } from "react";
import { notFound } from "next/navigation";

import { db } from "@/server/db";
import { auth } from "@/auth";
import {
  hasCourseAccess,
  enrolledInCourse,
  accessibleLessonIds,
} from "@/lib/data/access";
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

/** مجموعة كتالوج: كلية واحدة ومقرراتها */
export type FacultyGroup = {
  /** `null` لمقررات لم تُصنَّف بعد */
  slug: string | null;
  name: string;
  courses: CourseCard[];
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
      faculty: { select: { slug: true, name: true, sortOrder: true } },
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
 * الكتالوج مجموعًا بالكلية.
 *
 * الكليات الفارغة لا تُعرض: الزائر لا يفيده عنوان تحته لا شيء، وهو
 * أول ما يُلاحَظ حين تُضاف كلية قبل مقرراتها. وغير المصنَّف يُجمع في
 * مجموعة أخيرة بلا مسار — يظهر ولا يختفي، لأن إخفاءه يجعل مقررًا
 * منشورًا غير قابل للاكتشاف بسبب حقل إداري نُسي.
 */
export async function listCatalogueByFaculty(): Promise<FacultyGroup[]> {
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
      faculty: { select: { slug: true, name: true, sortOrder: true } },
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

  const groups = new Map<string, FacultyGroup & { order: number }>();

  for (const course of rows) {
    const key = course.faculty?.slug ?? "unassigned";
    if (!groups.has(key)) {
      groups.set(key, {
        slug: course.faculty?.slug ?? null,
        name: course.faculty?.name ?? "مقررات أخرى",
        // غير المصنَّف أخيرًا دائمًا
        order: course.faculty?.sortOrder ?? Number.MAX_SAFE_INTEGER,
        courses: [],
      });
    }

    groups.get(key)!.courses.push({
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
    });
  }

  return [...groups.values()]
    .sort((a, b) => a.order - b.order)
    .map(({ order: _order, ...group }) => group);
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
    /*
     * المطابقة بلا حساسية لحالة الأحرف.
     *
     * المسار مشتقّ من الرمز بحروف صغيرة (`arab110`)، بينما الصفحة
     * تعرض الرمز بحروف كبيرة (`ARAB110`) بوصفه هوية المقرر. فمن يكتب
     * ما يراه — أو يشارك الرابط بحروف كبيرة في واتساب، وهي قناة
     * الانتشار الأساسية — كان يصل إلى 404. اختُبر: `/courses/ARAB110`
     * كان يعيد 404 و`/courses/arab110` يعيد 200.
     */
    where: { slug: { equals: slug, mode: "insensitive" }, isPublished: true },
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

/**
 * ══ من أين يُستأنف المقرر ═══════════════════════════════════════════
 *
 * «مقرراتي» كانت تقول ما تملك ولا تقول أين وقفت — وأول ما يريده
 * العائد هو زرّ واحد يعيده إلى مكانه.
 *
 * ── لماذا لا تعتمد على التقدّم وحده ─────────────────────────────────
 * `LessonProgress` موجود في المخطط بفهرس `[userId, updatedAt]` — أي
 * فهرس استئناف بالضبط — لكن **لا شيء يكتب فيه بعد**: لا مشغّل يسجّل
 * الموضع. ميزةٌ تُبنى عليه وحده تظهر فارغة دائمًا فتبدو معطوبة.
 *
 * فالجواب مركّب: إن وُجد تقدّم فهو «تابع من»، وإلا فأول درس جاهز
 * يملكه الطالب وهو «ابدأ من». تصحّ اليوم، وتترقّى وحدها يوم يبدأ
 * التسجيل بلا تعديل هنا.
 *
 * ── الملكية تُسأل من البوّابة لا تُعاد اشتقاقًا ──────────────────────
 * `accessibleLessonIds` هي نفسها المستعملة في القوائم والصفحات. أي
 * استعلام ملكية جديد هنا يصير مصدرًا ثانيًا للحقيقة — وهو ما كلّف
 * هذا المشروع حدود الحزم مرة.
 * ═══════════════════════════════════════════════════════════════════
 */
export type CourseResume = {
  /** الدرس الذي يُفتح عند الضغط — فارغ إن لا درس جاهز متاح */
  lesson: { id: string; title: string; position: number } | null;
  /** هل يُستأنف من تقدّم محفوظ أم يبدأ من الأول */
  kind: "resume" | "start";
  /** دروس جاهزة يملكها المستخدم */
  ownedReady: number;
  /** دروس جاهزة في المقرر كلّه */
  totalReady: number;
  /** دروس أنهاها — صفر حتى يبدأ تسجيل التقدّم */
  completed: number;
};

export const getCourseResume = cache(async function getCourseResume(
  courseId: string,
): Promise<CourseResume> {
  const session = await auth();
  const empty: CourseResume = {
    lesson: null,
    kind: "start",
    ownedReady: 0,
    totalReady: 0,
    completed: 0,
  };
  if (!session?.user) return empty;

  const { isStaff, owned } = await accessibleLessonIds(courseId);

  /* الدروس الجاهزة والمنشورة فقط: الدرس المخطَّط بلا ملف لا يُستأنف */
  const ready = await db.courseMaterial.findMany({
    where: { courseId, status: "READY", publishedAt: { not: null } },
    orderBy: { position: "asc" },
    select: { id: true, title: true, position: true },
  });

  const mine = isStaff ? ready : ready.filter((m) => owned.has(m.id));
  if (mine.length === 0) {
    return { ...empty, totalReady: ready.length };
  }

  const mineIds = mine.map((m) => m.id);
  const progress = await db.lessonProgress.findMany({
    where: { userId: session.user.id, lessonId: { in: mineIds } },
    orderBy: { updatedAt: "desc" },
    select: { lessonId: true, completedAt: true },
  });

  const completed = progress.filter((p) => p.completedAt !== null).length;
  const lastOpen = progress.find((p) => p.completedAt === null);
  const lesson = lastOpen
    ? (mine.find((m) => m.id === lastOpen.lessonId) ?? mine[0])
    : mine[0];

  return {
    lesson,
    kind: lastOpen ? "resume" : "start",
    ownedReady: mine.length,
    totalReady: ready.length,
    completed,
  };
});
