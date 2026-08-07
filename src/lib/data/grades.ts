import "server-only";

import { db } from "@/server/db";
import { enrolledInCourse } from "@/lib/data/access";
import {
  Role,
  SubmissionStatus,
  QuizStatus,
  AssignmentStatus,
} from "@/generated/prisma/enums";

/** نوع عنصر التقييم — المصدران يُقرآن بنفس الشكل */
export type AssessmentKind = "quiz" | "assignment";

/** درجة واحدة موحّدة، أيًا كان مصدرها */
export type GradeItem = {
  id: string;
  kind: AssessmentKind;
  title: string;
  courseId: string;
  courseTitle: string;
  courseCode: string;
  earnedPoints: number;
  totalPoints: number;
  gradedAt: Date;
  href: string;
  isLate?: boolean;
};

/**
 * درجة الاختبار المعتمدة = **أعلى محاولة مُسلَّمة**.
 * القاعدة نفسها المعلنة للطالب في صفحة الاختبار.
 */
function bestAttempt<T extends { earnedPoints: number | null }>(
  attempts: T[],
): T | null {
  return attempts.reduce<T | null>(
    (best, a) =>
      a.earnedPoints === null
        ? best
        : best === null || a.earnedPoints > (best.earnedPoints ?? -1)
          ? a
          : best,
    null,
  );
}

/* -------------------------------------------------------------------------- */
/*  درجات الطالب                                                               */
/* -------------------------------------------------------------------------- */

export type CourseGrades = {
  courseId: string;
  courseTitle: string;
  courseCode: string;
  items: GradeItem[];
  earned: number;
  total: number;
};

/**
 * كل درجات الطالب عبر مقرراته، مجمّعة حسب المقرر.
 * لا تُحتسب إلا العناصر **المصحّحة** — فالطالب لا يُعاقب على ما لم
 * يصحّحه المدرب بعد.
 */
export async function getStudentGrades(
  userId: string,
): Promise<CourseGrades[]> {
  const courses = await db.course.findMany({
    where: {
      ...enrolledInCourse(userId),
    },
    orderBy: [ { code: "asc" }],
    select: {
      id: true,
      code: true,
      title: true,
      quizzes: {
        where: { status: { in: [QuizStatus.PUBLISHED, QuizStatus.CLOSED] } },
        select: {
          id: true,
          title: true,
          attempts: {
            where: { studentId: userId, submittedAt: { not: null } },
            select: {
              id: true,
              earnedPoints: true,
              totalPoints: true,
              submittedAt: true,
            },
          },
        },
      },
      assignments: {
        where: {
          status: { in: [AssignmentStatus.PUBLISHED, AssignmentStatus.CLOSED] },
        },
        select: {
          id: true,
          title: true,
          totalPoints: true,
          submissions: {
            where: { studentId: userId, status: SubmissionStatus.GRADED },
            select: {
              id: true,
              earnedPoints: true,
              isLate: true,
              gradedAt: true,
            },
          },
        },
      },
    },
  });

  return courses
    .map((c) => {
      const items: GradeItem[] = [];

      for (const q of c.quizzes) {
        const best = bestAttempt(q.attempts);
        if (!best || best.earnedPoints === null) continue;

        items.push({
          id: `q-${q.id}`,
          kind: "quiz",
          title: q.title,
          courseId: c.id,
          courseTitle: c.title,
          courseCode: c.code,
          earnedPoints: best.earnedPoints,
          totalPoints: best.totalPoints ?? 0,
          gradedAt: best.submittedAt!,
          href: `/learn/${c.id}/quizzes/${q.id}`,
        });
      }

      for (const a of c.assignments) {
        const s = a.submissions[0];
        if (!s || s.earnedPoints === null) continue;

        items.push({
          id: `a-${a.id}`,
          kind: "assignment",
          title: a.title,
          courseId: c.id,
          courseTitle: c.title,
          courseCode: c.code,
          earnedPoints: s.earnedPoints,
          totalPoints: a.totalPoints,
          gradedAt: s.gradedAt!,
          href: `/learn/${c.id}/assignments/${a.id}`,
          isLate: s.isLate,
        });
      }

      items.sort((x, y) => y.gradedAt.getTime() - x.gradedAt.getTime());

      return {
        courseId: c.id,
        courseTitle: c.title,
        courseCode: c.code,
        items,
        earned: items.reduce((s, i) => s + i.earnedPoints, 0),
        total: items.reduce((s, i) => s + i.totalPoints, 0),
      };
    })
    .filter((c) => c.items.length > 0);
}

/* -------------------------------------------------------------------------- */
/*  دفتر درجات المقرر (للمدرب)                                                 */
/* -------------------------------------------------------------------------- */

export type GradebookColumn = {
  id: string;
  kind: AssessmentKind;
  title: string;
  totalPoints: number;
  href: string;
};

export type GradebookRow = {
  studentId: string;
  name: string;
  /** البريد صار معرّف الطالب الظاهر بدل الرقم الأكاديمي */
  email: string | null;
  /** null = لم يُصحَّح أو لم يُسلَّم */
  cells: Record<string, number | null>;
  earned: number;
  /** مجموع درجات العناصر المصحّحة لهذا الطالب فقط */
  total: number;
};

export type Gradebook = {
  columns: GradebookColumn[];
  rows: GradebookRow[];
};

/**
 * مصفوفة الدرجات: كل طالب مسجَّل × كل عنصر تقييم.
 *
 * المجموع يُحسب على **العناصر المصحّحة لكل طالب** لا على كل عناصر
 * المقرر، فلا يبدو طالب لم يُصحَّح له بعد وكأنه راسب.
 */
export async function getCourseGradebook(
  courseId: string,
): Promise<Gradebook> {
  const [quizzes, assignments, enrollments] = await Promise.all([
    db.quiz.findMany({
      where: {
        courseId,
        status: { in: [QuizStatus.PUBLISHED, QuizStatus.CLOSED] },
      },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        title: true,
        questions: { select: { points: true } },
        attempts: {
          where: { submittedAt: { not: null } },
          select: { studentId: true, earnedPoints: true },
        },
      },
    }),
    db.assignment.findMany({
      where: {
        courseId,
        status: { in: [AssignmentStatus.PUBLISHED, AssignmentStatus.CLOSED] },
      },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        title: true,
        totalPoints: true,
        submissions: {
          where: { status: SubmissionStatus.GRADED },
          select: { studentId: true, earnedPoints: true },
        },
      },
    }),
    /* طلاب المقرر = من يملك أي منتج فيه. قد يملك الطالب منتجين في
       المقرر نفسه، فـ `distinct` يمنع تكراره في صفوف الدفتر. */
    db.enrollment.findMany({
      where: { product: { courseId } },
      distinct: ["userId"],
      orderBy: { grantedAt: "asc" },
      select: {
        user: { select: { id: true, name: true, email: true } },
      },
    }),
  ]);

  const columns: GradebookColumn[] = [
    ...quizzes.map((q) => ({
      id: `q-${q.id}`,
      kind: "quiz" as const,
      title: q.title,
      totalPoints: q.questions.reduce((s, x) => s + x.points, 0),
      href: `/learn/${courseId}/quizzes/${q.id}`,
    })),
    ...assignments.map((a) => ({
      id: `a-${a.id}`,
      kind: "assignment" as const,
      title: a.title,
      totalPoints: a.totalPoints,
      href: `/learn/${courseId}/assignments/${a.id}`,
    })),
  ];

  // أعلى محاولة لكل طالب في كل اختبار
  const quizBest = new Map<string, number>();
  for (const q of quizzes) {
    for (const at of q.attempts) {
      if (at.earnedPoints === null) continue;
      const key = `q-${q.id}|${at.studentId}`;
      const prev = quizBest.get(key);
      if (prev === undefined || at.earnedPoints > prev) {
        quizBest.set(key, at.earnedPoints);
      }
    }
  }

  const assignmentScore = new Map<string, number>();
  for (const a of assignments) {
    for (const s of a.submissions) {
      if (s.earnedPoints === null) continue;
      assignmentScore.set(`a-${a.id}|${s.studentId}`, s.earnedPoints);
    }
  }

  const rows: GradebookRow[] = enrollments.map(({ user: student }) => {
    const cells: Record<string, number | null> = {};
    let earned = 0;
    let total = 0;

    for (const col of columns) {
      const key = `${col.id}|${student.id}`;
      const score =
        col.kind === "quiz" ? quizBest.get(key) : assignmentScore.get(key);

      if (score === undefined) {
        cells[col.id] = null;
      } else {
        cells[col.id] = score;
        earned += score;
        total += col.totalPoints;
      }
    }

    return {
      studentId: student.id,
      name: student.name,
      email: student.email,
      cells,
      earned,
      total,
    };
  });

  return { columns, rows };
}

/** عدد التسليمات المنتظرة للتصحيح في مقررات المدرب — عدّاد قابل للإجراء */
export async function countPendingGrading(
  userId: string,
  role: Role,
): Promise<number> {
  if (role !== Role.INSTRUCTOR) return 0;

  return db.submission.count({
    where: {
      status: SubmissionStatus.SUBMITTED,
      assignment: { course: { presenterId: userId } },
    },
  });
}
