import "server-only";

import { db } from "@/server/db";
import { accessibleLessonIds, canViewAssignment, enrolledInCourse } from "@/lib/data/access";
import {
  Role,
  AssignmentStatus,
  SubmissionStatus,
} from "@/generated/prisma/enums";

/** بطاقة واجب في قائمة المحتوى */
export type AssignmentSummary = {
  id: string;
  title: string;
  description: string | null;
  status: AssignmentStatus;
  totalPoints: number;
  dueAt: Date | null;
  submissionCount: number;
  /** حالة الطالب نفسه — null للمدرب */
  mySubmission: { submittedAt: Date; isLate: boolean; earnedPoints: number | null } | null;
};

export async function getCourseAssignments(
  courseId: string,
  userId: string,
  role: Role,
): Promise<AssignmentSummary[]> {
  const canSeeDrafts = role === Role.INSTRUCTOR || role === Role.ADMIN;

  // `owned` لا `viewable`: المعاينة المجانية لا تفتح تقييمًا
  const [{ isStaff, owned }, rows] = await Promise.all([
    accessibleLessonIds(courseId),
    db.assignment.findMany({
      where: {
        courseId,
        ...(canSeeDrafts
          ? {}
          : {
              status: {
                in: [AssignmentStatus.PUBLISHED, AssignmentStatus.CLOSED],
              },
            }),
      },
      orderBy: [{ dueAt: "asc" }, { createdAt: "desc" }],
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        totalPoints: true,
        dueAt: true,
        lessonId: true,
        _count: { select: { submissions: true } },
        // تسليم هذا المستخدم فقط — لا تسليمات غيره
        submissions: {
          where: { studentId: userId },
          select: { submittedAt: true, isLate: true, earnedPoints: true },
        },
      },
    }),
  ]);

  // النطاق يتبع الدرس — نفس قاعدة canViewAssignment
  const visible = isStaff
    ? rows
    : rows.filter((a) => a.lessonId === null || owned.has(a.lessonId));

  return visible.map((a) => ({
    id: a.id,
    title: a.title,
    description: a.description,
    status: a.status,
    totalPoints: a.totalPoints,
    dueAt: a.dueAt,
    submissionCount: a._count.submissions,
    mySubmission: a.submissions[0] ?? null,
  }));
}

/** واجب للمدرب مع كل التسليمات */
export async function getAssignmentForManaging(
  assignmentId: string,
  courseId: string,
) {
  return db.assignment.findFirst({
    where: { id: assignmentId, courseId },
    select: {
      id: true,
      courseId: true,
      title: true,
      description: true,
      status: true,
      totalPoints: true,
      dueAt: true,
      allowLate: true,
      latePenaltyPercent: true,
      allowedExtensions: true,
      maxFileMb: true,
      submissions: {
        orderBy: { submittedAt: "asc" },
        select: {
          id: true,
          note: true,
          fileName: true,
          fileSizeBytes: true,
          objectKey: true,
          submittedAt: true,
          isLate: true,
          status: true,
          rawPoints: true,
          earnedPoints: true,
          feedback: true,
          gradedAt: true,
          student: { select: { id: true, name: true, username: true } },
        },
      },
    },
  });
}

export type AssignmentForManaging = NonNullable<
  Awaited<ReturnType<typeof getAssignmentForManaging>>
>;

/**
 * واجب للطالب مع **تسليمه هو فقط**.
 * الاستعلام نفسه يتحقق من التسجيل، فلا يمكن فتح واجب مقرر غير مسجَّل فيه.
 */
export async function getAssignmentForStudent(
  assignmentId: string,
  courseId: string,
  userId: string,
  role: Role,
) {
  if (role !== Role.STUDENT) return null;

  /* الحارس داخل الدالة كما في `getQuizForStudent`: المرشّح أدناه نطاقه
     المقرر، والواجب نطاقه درسه. */
  if (!(await canViewAssignment(assignmentId))) return null;

  return db.assignment.findFirst({
    where: {
      id: assignmentId,
      courseId,
      status: { in: [AssignmentStatus.PUBLISHED, AssignmentStatus.CLOSED] },
      course: enrolledInCourse(userId),
    },
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
      totalPoints: true,
      dueAt: true,
      allowLate: true,
      latePenaltyPercent: true,
      allowedExtensions: true,
      maxFileMb: true,
      submissions: {
        where: { studentId: userId },
        select: {
          id: true,
          note: true,
          fileName: true,
          fileSizeBytes: true,
          submittedAt: true,
          isLate: true,
          status: true,
          earnedPoints: true,
          feedback: true,
          gradedAt: true,
        },
      },
    },
  });
}

/** هل يُقبل التسليم الآن؟ يُحسب على الخادم */
export function submissionBlocker(
  assignment: {
    status: AssignmentStatus;
    dueAt: Date | null;
    allowLate: boolean;
  },
  now: Date = new Date(),
): string | null {
  if (assignment.status === AssignmentStatus.CLOSED) {
    return "الواجب مغلق ولا يقبل تسليمات.";
  }
  if (assignment.status === AssignmentStatus.DRAFT) {
    return "الواجب غير متاح.";
  }
  if (assignment.dueAt && now > assignment.dueAt && !assignment.allowLate) {
    return "انتهى موعد التسليم ولا يقبل هذا الواجب التسليم المتأخر.";
  }
  return null;
}

/** الدرجة النهائية بعد خصم التأخير */
export function applyLatePenalty(
  rawPoints: number,
  isLate: boolean,
  penaltyPercent: number,
): number {
  if (!isLate || penaltyPercent <= 0) return rawPoints;
  const kept = rawPoints * (1 - penaltyPercent / 100);
  return Math.max(0, Math.round(kept));
}

export { AssignmentStatus, SubmissionStatus };
