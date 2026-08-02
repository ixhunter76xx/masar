import { cache } from "react";
import { notFound } from "next/navigation";

import { auth } from "@/auth";
import { db } from "@/server/db";
import { Role, TermStatus, EnrollmentStatus } from "@/generated/prisma/enums";

/** مقرر كما يُعرض في الواجهة */
export type CourseSummary = {
  id: string;
  code: string;
  title: string;
  description: string | null;
  instructorName: string;
  studentCount: number;
};

/** مجموعة مقررات تخصّ فصلًا دراسيًا واحدًا */
export type TermGroup = {
  termId: string;
  termName: string;
  status: TermStatus;
  startsOn: Date;
  endsOn: Date;
  courses: CourseSummary[];
};

/** شرط الاختيار حسب الدور: الطالب يرى ما سُجِّل فيه، والمدرب ما يُدرّسه */
function courseScope(userId: string, role: Role) {
  if (role === Role.INSTRUCTOR) return { instructorId: userId };
  if (role === Role.STUDENT) {
    return {
      enrollments: {
        some: { studentId: userId, status: EnrollmentStatus.ACTIVE },
      },
    };
  }
  // الإدارة ترى كل المقررات
  return {};
}

/**
 * مقررات المستخدم مجمّعة حسب الفصل الدراسي.
 * الفصول النشطة أولًا، ثم المؤرشفة من الأحدث إلى الأقدم.
 */
export async function getCoursesByTerm(
  userId: string,
  role: Role,
): Promise<TermGroup[]> {
  const courses = await db.course.findMany({
    where: courseScope(userId, role),
    orderBy: [{ term: { startsOn: "desc" } }, { code: "asc" }],
    select: {
      id: true,
      code: true,
      title: true,
      description: true,
      instructor: { select: { name: true } },
      term: {
        select: {
          id: true,
          name: true,
          status: true,
          startsOn: true,
          endsOn: true,
        },
      },
      _count: { select: { enrollments: true } },
    },
  });

  const groups = new Map<string, TermGroup>();

  for (const c of courses) {
    let group = groups.get(c.term.id);

    if (!group) {
      group = {
        termId: c.term.id,
        termName: c.term.name,
        status: c.term.status,
        startsOn: c.term.startsOn,
        endsOn: c.term.endsOn,
        courses: [],
      };
      groups.set(c.term.id, group);
    }

    group.courses.push({
      id: c.id,
      code: c.code,
      title: c.title,
      description: c.description,
      instructorName: c.instructor.name,
      studentCount: c._count.enrollments,
    });
  }

  // النشط قبل المؤرشف، ثم الأحدث بداية أولًا
  return [...groups.values()].sort((a, b) => {
    if (a.status !== b.status) return a.status === TermStatus.ACTIVE ? -1 : 1;
    return b.startsOn.getTime() - a.startsOn.getTime();
  });
}

/**
 * تفاصيل مقرر واحد — يُرجع null إن لم يكن المستخدم مخوّلًا بالوصول.
 *
 * مخزّنة لكل طلب: `requireCourseAccess` تُستدعى في تخطيط المقرر وفي كل
 * صفحة تبويب (وهو مطلوب أمنيًا لأن Next ينفّذهما على التوازي)، لكن
 * الاستعلام لا يُنفَّذ إلا مرة واحدة.
 */
export const getCourseForUser = cache(async function getCourseForUser(
  courseId: string,
  userId: string,
  role: Role,
) {
  return db.course.findFirst({
    where: { id: courseId, ...courseScope(userId, role) },
    select: {
      id: true,
      code: true,
      title: true,
      description: true,
      instructor: { select: { name: true } },
      term: { select: { name: true, status: true, endsOn: true } },
      _count: { select: { enrollments: true } },
    },
  });
});

/** نوع مقرر مع بياناته المعروضة في رأس الصفحة */
export type CourseDetail = NonNullable<
  Awaited<ReturnType<typeof getCourseForUser>>
>;

/**
 * يجلب المقرر ويتحقق من صلاحية الوصول، أو يرمي 404.
 *
 * يُستدعى في تخطيط المقرر **وفي كل صفحة تبويب** — لأن Next.js ينفّذ
 * التخطيط والصفحة على التوازي، فلا يكفي التحقق في التخطيط وحده لمنع
 * الصفحة من قراءة بيانات ليست للمستخدم.
 */
export const requireCourseAccess = cache(async function requireCourseAccess(
  courseId: string,
) {
  const session = await auth();
  if (!session?.user) notFound();

  const course = await getCourseForUser(
    courseId,
    session.user.id,
    session.user.role,
  );
  if (!course) notFound();

  return { course, user: session.user };
});
