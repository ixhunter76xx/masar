import "server-only";

import { notFound } from "next/navigation";

import { auth } from "@/auth";
import { db } from "@/server/db";
import { Role, TermStatus, EnrollmentStatus } from "@/generated/prisma/enums";

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
/*  الفصول الدراسية                                                            */
/* -------------------------------------------------------------------------- */

export async function listTerms() {
  return db.term.findMany({
    orderBy: [{ status: "asc" }, { startsOn: "desc" }],
    select: {
      id: true,
      name: true,
      startsOn: true,
      endsOn: true,
      status: true,
      _count: { select: { courses: true } },
    },
  });
}

/** الفصول النشطة فقط — لقوائم اختيار الفصل عند إنشاء مقرر */
export async function listActiveTerms() {
  return db.term.findMany({
    where: { status: TermStatus.ACTIVE },
    orderBy: { startsOn: "desc" },
    select: { id: true, name: true },
  });
}

/* -------------------------------------------------------------------------- */
/*  المقررات                                                                   */
/* -------------------------------------------------------------------------- */

export async function listCoursesForAdmin() {
  return db.course.findMany({
    orderBy: [{ term: { startsOn: "desc" } }, { code: "asc" }],
    select: {
      id: true,
      code: true,
      title: true,
      term: { select: { name: true, status: true } },
      instructor: { select: { name: true } },
      _count: { select: { enrollments: true } },
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
      term: { select: { name: true } },
      instructor: { select: { name: true } },
      enrollments: {
        orderBy: { enrolledAt: "asc" },
        select: {
          id: true,
          status: true,
          enrolledAt: true,
          student: { select: { id: true, name: true, username: true } },
        },
      },
    },
  });
}

/** الطلاب النشطون غير المسجَّلين في هذا المقرر */
export async function listEnrollableStudents(courseId: string) {
  return db.user.findMany({
    where: {
      role: Role.STUDENT,
      isActive: true,
      enrollments: { none: { courseId } },
    },
    orderBy: { name: "asc" },
    select: { id: true, name: true, username: true },
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
      _count: { select: { enrollments: true, coursesTaught: true } },
    },
  });
}

/** المدربون النشطون — لقائمة إسناد المقرر */
export async function listInstructors() {
  return db.user.findMany({
    where: { role: Role.INSTRUCTOR, isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
}

export { TermStatus, EnrollmentStatus, Role };
