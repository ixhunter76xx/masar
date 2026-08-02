import "server-only";

import { db } from "@/server/db";
import {
  Role,
  QuizStatus,
  EnrollmentStatus,
} from "@/generated/prisma/enums";

/**
 * مهلة سماح بعد انتهاء المدة المحددة.
 * تغطي بطء الشبكة ولحظة التسليم التلقائي — لا تمنح وقتًا إضافيًا معتبرًا.
 */
export const SUBMIT_GRACE_MS = 120_000;

/* -------------------------------------------------------------------------- */
/*  الوصول                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * يتحقق أن الطالب **مسجَّل فعلًا** في مقرر هذا الاختبار، وأن الاختبار
 * متاح له. الإدارة تُعامل معاملة المشاهد ولا تؤدّي اختبارات.
 */
export async function getQuizForStudent(
  quizId: string,
  courseId: string,
  userId: string,
  role: Role,
) {
  if (role !== Role.STUDENT) return null;

  return db.quiz.findFirst({
    where: {
      id: quizId,
      courseId,
      status: { in: [QuizStatus.PUBLISHED, QuizStatus.CLOSED] },
      course: {
        enrollments: {
          some: { studentId: userId, status: EnrollmentStatus.ACTIVE },
        },
      },
    },
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
      maxAttempts: true,
      timeLimitMin: true,
      opensAt: true,
      closesAt: true,
      // عدد الأسئلة ومجموع الدرجات فقط — لا نصوص ولا خيارات
      questions: { select: { points: true } },
    },
  });
}

export type StudentAttempt = {
  id: string;
  attemptNumber: number;
  startedAt: Date;
  submittedAt: Date | null;
  earnedPoints: number | null;
  totalPoints: number | null;
};

export async function listStudentAttempts(
  quizId: string,
  userId: string,
): Promise<StudentAttempt[]> {
  return db.quizAttempt.findMany({
    where: { quizId, studentId: userId },
    orderBy: { attemptNumber: "asc" },
    select: {
      id: true,
      attemptNumber: true,
      startedAt: true,
      submittedAt: true,
      earnedPoints: true,
      totalPoints: true,
    },
  });
}

/** أسباب منع بدء محاولة جديدة — تُحسب على الخادم */
export function startBlocker(
  quiz: { status: QuizStatus; maxAttempts: number; opensAt: Date | null; closesAt: Date | null },
  attempts: StudentAttempt[],
  now: Date = new Date(),
): string | null {
  if (quiz.status === QuizStatus.CLOSED) return "الاختبار مغلق.";
  if (quiz.opensAt && now < quiz.opensAt) return "لم يُفتح الاختبار بعد.";
  if (quiz.closesAt && now > quiz.closesAt) return "انتهت فترة إتاحة الاختبار.";

  const open = attempts.find((a) => a.submittedAt === null);
  if (open) return null; // له محاولة جارية — يُستأنف لا يُمنع

  if (attempts.length >= quiz.maxAttempts) {
    return `استنفدت عدد المحاولات المسموح بها (${quiz.maxAttempts}).`;
  }
  return null;
}

/* -------------------------------------------------------------------------- */
/*  أداء المحاولة                                                              */
/* -------------------------------------------------------------------------- */

export type AttemptQuestion = {
  id: string;
  kind: string;
  text: string;
  points: number;
  options: { id: string; text: string }[];
};

/**
 * محاولة قيد الأداء بأسئلتها.
 *
 * ⚠️ حقل `isCorrect` **غير مُحمَّل إطلاقًا** في هذا الاستعلام — لا يصل
 * إلى الخادم فضلًا عن المتصفح. هذا هو الفرق الجوهري عن
 * `getQuizForEditing` المخصّصة للمدرب.
 */
export async function getAttemptForTaking(
  attemptId: string,
  quizId: string,
  courseId: string,
  userId: string,
) {
  const attempt = await db.quizAttempt.findFirst({
    where: {
      id: attemptId,
      quizId,
      studentId: userId,
      quiz: {
        courseId,
        course: {
          enrollments: {
            some: { studentId: userId, status: EnrollmentStatus.ACTIVE },
          },
        },
      },
    },
    select: {
      id: true,
      attemptNumber: true,
      startedAt: true,
      submittedAt: true,
      earnedPoints: true,
      totalPoints: true,
      quiz: {
        select: {
          id: true,
          title: true,
          description: true,
          timeLimitMin: true,
          shuffleQuestions: true,
          questions: {
            orderBy: { position: "asc" },
            select: {
              id: true,
              kind: true,
              text: true,
              points: true,
              options: {
                orderBy: { position: "asc" },
                select: { id: true, text: true },
              },
            },
          },
        },
      },
    },
  });

  return attempt;
}

/** لحظة انتهاء المحاولة محسوبة من الخادم — لا من ساعة المتصفح */
export function deadlineOf(
  startedAt: Date,
  timeLimitMin: number | null,
): Date | null {
  if (timeLimitMin === null) return null;
  return new Date(startedAt.getTime() + timeLimitMin * 60_000);
}

/**
 * خلط ثابت مبني على معرّف المحاولة.
 * يضمن ألا يتغيّر الترتيب عند تحديث الصفحة، ويظل مختلفًا بين المحاولات.
 */
export function shuffleForAttempt<T>(items: T[], seed: string): T[] {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }

  const next = () => {
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    return Math.abs(h) / 2147483647;
  };

  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
