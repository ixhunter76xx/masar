import "server-only";

import { notFound } from "next/navigation";

import { getLiveUser } from "@/lib/data/session";
import { db } from "@/server/db";
import { Role } from "@/generated/prisma/enums";

/**
 * حارس المنطقة الإدارية.
 *
 * يُستدعى في كل صفحة إدارية **وفي كل إجراء خادم** — لا في التخطيط وحده،
 * لأن Next.js ينفّذ التخطيط والصفحة على التوازي، ولأن إجراءات الخادم
 * نقاط دخول مستقلة يمكن استدعاؤها مباشرةً.
 *
 * الدور يُقرأ من الجدول لا من رمز الجلسة: أدمن أُنزل دوره أو عُطّل
 * حسابه كان يحتفظ بتأكيد المدفوعات وإنشاء الحسابات وإعادة تعيين
 * كلمات المرور حتى ينتهي رمزه — انظر `getLiveUser`.
 */
export async function requireAdmin() {
  const user = await getLiveUser();
  if (!user || user.role !== Role.ADMIN) notFound();
  return user;
}

/* -------------------------------------------------------------------------- */
/*  المقررات                                                                   */
/* -------------------------------------------------------------------------- */

export async function listCoursesForAdmin(options?: { includeArchived?: boolean }) {
  return db.course.findMany({
    /* المؤرشف مخفيّ افتراضيًا — موجود للتاريخ لا للعمل اليومي */
    where: options?.includeArchived ? {} : { archivedAt: null },
    orderBy: [{ code: "asc" }],
    select: {
      id: true,
      code: true,
      title: true,
      isPublished: true,
      archivedAt: true,
      faculty: { select: { id: true, name: true } },
      presenter: { select: { id: true, name: true } },
      _count: { select: { products: true, materials: true } },
    },
  });
}

export async function getCourseForAdmin(courseId: string) {
  return db.course.findUnique({
    where: { id: courseId },
    select: {
      id: true,
      code: true,
      title: true,
      presenter: { select: { name: true } },
      /* التسجيل صار على المنتج لا المقرر: نعرض منتجات المقرر ومن
         يملك كلًّا منها. */
      products: {
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          title: true,
          priceFils: true,
          isPublished: true,
          enrollments: {
            orderBy: { grantedAt: "asc" },
            select: {
              id: true,
              grantedAt: true,
              source: true,
              user: { select: { id: true, name: true, email: true } },
            },
          },
        },
      },
    },
  });
}

/**
 * الطلاب النشطون الذين لا يملكون هذا المنتج — لمنح إداري يدوي.
 *
 * المنح صار على مستوى المنتج لا المقرر: قد يملك الطالب "دورة المنتصف"
 * ويحتاج منحه "دورة النهائي" في المقرر نفسه.
 */
export async function listGrantableStudents(productId: string) {
  return db.user.findMany({
    where: {
      role: Role.STUDENT,
      isActive: true,
      enrollments: { none: { productId } },
    },
    orderBy: { name: "asc" },
    select: { id: true, name: true, email: true },
  });
}

/* -------------------------------------------------------------------------- */
/*  المستخدمون                                                                 */
/* -------------------------------------------------------------------------- */

export async function listUsers() {
  return db.user.findMany({
    orderBy: [{ role: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      role: true,
      isActive: true,
      lastLoginAt: true,
      mustChangePassword: true,
      _count: { select: { enrollments: true, coursesPresented: true } },
    },
  });
}

/** الأساتذة النشطون — لقائمة اختيار مقدّم المقرر */
export async function listInstructors() {
  return db.user.findMany({
    where: { role: Role.INSTRUCTOR, isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
}

/* -------------------------------------------------------------------------- */
/*  الطلاب — لوحة التحكم                                                       */
/* -------------------------------------------------------------------------- */

/** تسجيلٌ سارٍ: بلا انتهاء، أو انتهاؤه في المستقبل */
const ACTIVE_GRANT = { OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] };

/**
 * قائمة الطلاب مع بحث حرّ.
 *
 * البحث على الاسم والبريد معًا لأن المدير يصل من أحدهما: البريد إن جاء
 * من محادثة واتساب، والاسم إن جاء من الذاكرة. و`mode: "insensitive"`
 * لأن البريد يُكتب بأي حالة.
 */
export async function listStudentsForAdmin(search?: string) {
  const q = search?.trim();

  return db.user.findMany({
    where: {
      role: Role.STUDENT,
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" as const } },
              { email: { contains: q, mode: "insensitive" as const } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      isActive: true,
      createdAt: true,
      _count: { select: { orders: true } },
      enrollments: {
        where: ACTIVE_GRANT,
        select: { id: true },
      },
    },
  });
}

/** تفصيل طالب: تسجيلاته السارية والمنتهية، وطلباته. */
export async function getStudentForAdmin(userId: string) {
  return db.user.findFirst({
    where: { id: userId, role: Role.STUDENT },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      isActive: true,
      createdAt: true,
      enrollments: {
        orderBy: { grantedAt: "desc" },
        select: {
          id: true,
          grantedAt: true,
          expiresAt: true,
          source: true,
          product: {
            select: {
              id: true,
              title: true,
              priceFils: true,
              course: { select: { id: true, code: true, title: true } },
            },
          },
        },
      },
      orders: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          number: true,
          status: true,
          totalFils: true,
          createdAt: true,
          items: { select: { titleSnapshot: true } },
        },
      },
    },
  });
}

/** كل الباقات القابلة للمنح، مجمّعة بمقرراتها. */
export async function listAllProductsForGrant() {
  return db.product.findMany({
    where: { course: { archivedAt: null } },
    orderBy: [{ course: { code: "asc" } }, { sortOrder: "asc" }],
    select: {
      id: true,
      title: true,
      priceFils: true,
      course: { select: { code: true, title: true } },
    },
  });
}

/* -------------------------------------------------------------------------- */
/*  المدرّسون والكليات                                                          */
/* -------------------------------------------------------------------------- */

/**
 * المدرّسون ومقرراتهم.
 *
 * ⚠ القيد أحاديّ من جهة المقرر وحده: كل مقرر يحمل مقدّمًا واحدًا. أمّا
 * المدرّس فيُسنَد إلى أي عدد من المقررات — ولذلك تُرجع الدالة قائمة لا
 * حقلًا مفردًا.
 */
export async function listInstructorsForAdmin() {
  return db.user.findMany({
    where: { role: Role.INSTRUCTOR },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      isActive: true,
      coursesPresented: {
        where: { archivedAt: null },
        orderBy: { code: "asc" },
        select: { id: true, code: true, title: true, isPublished: true },
      },
    },
  });
}

/** الكليات مع عدد مقرراتها المنشورة — لشاشة الكتالوج. */
export async function listFacultiesForAdmin() {
  return db.faculty.findMany({
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      slug: true,
      name: true,
      isVisible: true,
      sortOrder: true,
      _count: { select: { courses: true } },
    },
  });
}

export { Role };
