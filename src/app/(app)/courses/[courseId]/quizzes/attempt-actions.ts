"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { auth } from "@/auth";
import { db } from "@/server/db";
import {
  getQuizForStudent,
  listStudentAttempts,
  startBlocker,
  deadlineOf,
  SUBMIT_GRACE_MS,
} from "@/lib/data/quiz-attempts";
import { EnrollmentStatus } from "@/generated/prisma/enums";

export type StartResult =
  | { ok: true; attemptId: string }
  | { ok: false; message: string };

export type SubmitResult = { ok: true } | { ok: false; message: string };

/**
 * بدء محاولة جديدة، أو استئناف محاولة مفتوحة.
 *
 * كل القيود تُفرض هنا على الخادم: حالة الاختبار، نافذة الإتاحة، وعدد
 * المحاولات. الواجهة تعرضها فقط.
 */
export async function startAttempt(
  courseId: string,
  quizId: string,
): Promise<StartResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, message: "غير مصرّح." };

  const { id: userId, role } = session.user;

  const quiz = await getQuizForStudent(quizId, courseId, userId, role);
  if (!quiz) return { ok: false, message: "الاختبار غير متاح لك." };

  const attempts = await listStudentAttempts(quizId, userId);

  const blocker = startBlocker(quiz, attempts);
  if (blocker) return { ok: false, message: blocker };

  // محاولة مفتوحة؟ استأنفها بدل إنشاء واحدة جديدة
  const open = attempts.find((a) => a.submittedAt === null);
  if (open) return { ok: true, attemptId: open.id };

  const attempt = await db.quizAttempt.create({
    data: {
      quizId,
      studentId: userId,
      attemptNumber: attempts.length + 1,
    },
    select: { id: true },
  });

  revalidatePath(`/courses/${courseId}/quizzes/${quizId}`);
  return { ok: true, attemptId: attempt.id };
}

const submitSchema = z.object({
  answers: z.array(
    z.object({
      questionId: z.string().min(1),
      optionId: z.string().min(1),
    }),
  ),
});

/**
 * تسليم المحاولة وتصحيحها آليًا.
 *
 * التحققات قبل الاحتساب:
 *   • المحاولة تخصّ هذا الطالب وهذا الاختبار وهذا المقرر
 *   • لم تُسلَّم من قبل
 *   • لم تتجاوز المهلة (محسوبة من startedAt على الخادم)
 *   • كل سؤال مُجاب ينتمي لهذا الاختبار
 *   • كل خيار مختار ينتمي لسؤاله
 */
export async function submitAttempt(
  courseId: string,
  quizId: string,
  attemptId: string,
  payload: unknown,
): Promise<SubmitResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, message: "غير مصرّح." };

  const userId = session.user.id;

  const parsed = submitSchema.safeParse(payload);
  if (!parsed.success) return { ok: false, message: "بيانات التسليم غير صالحة." };

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
      startedAt: true,
      submittedAt: true,
      quiz: {
        select: {
          timeLimitMin: true,
          questions: {
            select: {
              id: true,
              points: true,
              options: { select: { id: true, isCorrect: true } },
            },
          },
        },
      },
    },
  });

  if (!attempt) return { ok: false, message: "المحاولة غير موجودة." };
  if (attempt.submittedAt) return { ok: false, message: "سُلِّمت هذه المحاولة من قبل." };

  const deadline = deadlineOf(attempt.startedAt, attempt.quiz.timeLimitMin);
  const now = new Date();
  const expired =
    deadline !== null && now.getTime() > deadline.getTime() + SUBMIT_GRACE_MS;

  // خريطة الأسئلة والخيارات المشروعة — مصدر الحقيقة الوحيد
  const questions = new Map(
    attempt.quiz.questions.map((q) => [
      q.id,
      {
        points: q.points,
        options: new Map(q.options.map((o) => [o.id, o.isCorrect])),
      },
    ]),
  );

  // نتجاهل إجابات ما بعد المهلة: المحاولة تُغلق بما هو مسجَّل (لا شيء)
  const submitted = expired ? [] : parsed.data.answers;

  for (const a of submitted) {
    const q = questions.get(a.questionId);
    if (!q) return { ok: false, message: "سؤال لا ينتمي لهذا الاختبار." };
    if (!q.options.has(a.optionId)) {
      return { ok: false, message: "خيار لا ينتمي لهذا السؤال." };
    }
  }

  // لا تُقبل إجابتان لنفس السؤال
  const seen = new Set<string>();
  for (const a of submitted) {
    if (seen.has(a.questionId)) {
      return { ok: false, message: "تكرار إجابة لنفس السؤال." };
    }
    seen.add(a.questionId);
  }

  const chosen = new Map(submitted.map((a) => [a.questionId, a.optionId]));

  let earned = 0;
  let total = 0;
  const rows: {
    attemptId: string;
    questionId: string;
    selectedOptionId: string | null;
    isCorrect: boolean;
    earnedPoints: number;
  }[] = [];

  for (const [questionId, q] of questions) {
    total += q.points;

    const optionId = chosen.get(questionId) ?? null;
    const isCorrect = optionId !== null && q.options.get(optionId) === true;
    const points = isCorrect ? q.points : 0;
    earned += points;

    rows.push({
      attemptId: attempt.id,
      questionId,
      selectedOptionId: optionId,
      isCorrect,
      earnedPoints: points,
    });
  }

  await db.$transaction([
    db.answer.createMany({ data: rows }),
    db.quizAttempt.update({
      where: { id: attempt.id },
      data: { submittedAt: now, earnedPoints: earned, totalPoints: total },
    }),
  ]);

  revalidatePath(`/courses/${courseId}/quizzes/${quizId}`);
  revalidatePath("/dashboard");

  return expired
    ? { ok: false, message: "انتهت مدة الاختبار قبل وصول التسليم." }
    : { ok: true };
}
