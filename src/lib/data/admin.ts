import "server-only";

import { notFound } from "next/navigation";

import { auth } from "@/auth";
import { db } from "@/server/db";
import { Role } from "@/generated/prisma/enums";

/**
 * حارس المنطقة الإدارية.
 *
 * يُستدعى في كل صفحة إدارية **وفي كل إجراء خادم** — لا في التخطيط وحده،
 * لأن Next.js ينفّذ التخطيط والصفحة على التوازي، ولأن إجراءات الخادم
 * نقاط دخول مستقلة يمكن استدعاؤها مباشرةً.
 */
export async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== Role.ADMIN) notFound();
  return session.user;
}

/* -------------------------------------------------------------------------- */
/*  المقررات                                                                   */
/* -------------------------------------------------------------------------- */

export async function listCoursesForAdmin() {
  return db.course.findMany({
    orderBy: [ { code: "asc" }],
    select: {
      id: true,
      code: true,
      title: true,
      presenter: { select: { name: true } },
      _count: { select: { products: true } },
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

export { Role };
