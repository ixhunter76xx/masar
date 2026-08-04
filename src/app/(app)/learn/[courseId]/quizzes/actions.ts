"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { auth } from "@/auth";
import { db } from "@/server/db";
import { canManageCourse } from "@/lib/data/materials";
import { getQuizForEditing, publishBlockers } from "@/lib/data/quizzes";
import { QuizStatus, QuestionKind } from "@/generated/prisma/enums";

export type ActionResult =
  | { ok: true; id?: string }
  | { ok: false; message: string };

const fail = (message: string): ActionResult => ({ ok: false, message });

/** يتحقق أن المستخدم مدرب هذا المقرر أو إدارة */
async function requireManager(courseId: string) {
  const session = await auth();
  if (!session?.user) return null;
  const allowed = await canManageCourse(
    courseId,
    session.user.id,
    session.user.role,
  );
  return allowed ? session.user : null;
}

/** يتحقق من الصلاحية ومن أن الاختبار يخصّ المقرر */
async function requireQuiz(courseId: string, quizId: string) {
  const user = await requireManager(courseId);
  if (!user) return null;
  const quiz = await db.quiz.findFirst({
    where: { id: quizId, courseId },
    select: { id: true, status: true, _count: { select: { attempts: true } } },
  });
  return quiz ? { user, quiz } : null;
}

function bump(courseId: string, quizId?: string) {
  revalidatePath(`/learn/${courseId}`);
  if (quizId) revalidatePath(`/learn/${courseId}/quizzes/${quizId}`);
}

/* -------------------------------------------------------------------------- */
/*  الاختبار                                                                   */
/* -------------------------------------------------------------------------- */

const quizSchema = z.object({
  title: z.string().trim().min(3, "عنوان الاختبار قصير جدًا.").max(200),
  description: z.string().trim().max(2000).optional(),
  maxAttempts: z.coerce
    .number()
    .int()
    .min(1, "عدد المحاولات لا يقل عن ١.")
    .max(10, "عدد المحاولات لا يزيد على ١٠."),
  timeLimitMin: z
    .union([z.coerce.number().int().min(1).max(600), z.literal("")])
    .optional(),
  shuffleQuestions: z.union([z.literal("on"), z.literal("")]).optional(),
});

export async function createQuiz(
  courseId: string,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireManager(courseId);
  if (!user) return fail("ليس لديك صلاحية إنشاء اختبار في هذا المقرر.");

  const parsed = quizSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "البيانات غير صالحة.");
  }

  const { title, description, maxAttempts, timeLimitMin, shuffleQuestions } =
    parsed.data;

  const quiz = await db.quiz.create({
    data: {
      courseId,
      title,
      description: description || null,
      maxAttempts,
      timeLimitMin: timeLimitMin === "" || timeLimitMin === undefined ? null : timeLimitMin,
      shuffleQuestions: shuffleQuestions === "on",
      authorId: user.id,
    },
    select: { id: true },
  });

  bump(courseId);
  return { ok: true, id: quiz.id };
}

export async function updateQuiz(
  courseId: string,
  quizId: string,
  formData: FormData,
): Promise<ActionResult> {
  const found = await requireQuiz(courseId, quizId);
  if (!found) return fail("غير مصرّح أو الاختبار غير موجود.");

  const parsed = quizSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "البيانات غير صالحة.");
  }

  const { title, description, maxAttempts, timeLimitMin, shuffleQuestions } =
    parsed.data;

  await db.quiz.update({
    where: { id: quizId },
    data: {
      title,
      description: description || null,
      maxAttempts,
      timeLimitMin: timeLimitMin === "" || timeLimitMin === undefined ? null : timeLimitMin,
      shuffleQuestions: shuffleQuestions === "on",
    },
  });

  bump(courseId, quizId);
  return { ok: true };
}

export async function setQuizStatus(
  courseId: string,
  quizId: string,
  status: QuizStatus,
): Promise<ActionResult> {
  const found = await requireQuiz(courseId, quizId);
  if (!found) return fail("غير مصرّح أو الاختبار غير موجود.");

  if (status === QuizStatus.PUBLISHED) {
    const full = await getQuizForEditing(quizId, courseId);
    if (!full) return fail("الاختبار غير موجود.");

    // اختبار بلا إجابة صحيحة يستحيل تصحيحه — نمنع نشره
    const blockers = publishBlockers(full);
    if (blockers.length > 0) return fail(blockers[0]);
  }

  await db.quiz.update({ where: { id: quizId }, data: { status } });

  bump(courseId, quizId);
  return { ok: true };
}

export async function deleteQuiz(
  courseId: string,
  quizId: string,
): Promise<ActionResult> {
  const found = await requireQuiz(courseId, quizId);
  if (!found) return fail("غير مصرّح أو الاختبار غير موجود.");

  // حذف اختبار له محاولات يمحو درجات الطلاب معه
  if (found.quiz._count.attempts > 0) {
    return fail(
      "لا يمكن حذف اختبار له محاولات مسجَّلة. أغلقه بدلًا من ذلك.",
    );
  }

  await db.quiz.delete({ where: { id: quizId } });

  bump(courseId);
  return { ok: true };
}

/* -------------------------------------------------------------------------- */
/*  الأسئلة                                                                    */
/* -------------------------------------------------------------------------- */

/** يمنع تعديل بنية اختبار بدأ الطلاب أداءه */
function lockedByAttempts(count: number): ActionResult | null {
  return count > 0
    ? fail("لا يمكن تعديل أسئلة اختبار له محاولات مسجَّلة.")
    : null;
}

export async function addQuestion(
  courseId: string,
  quizId: string,
  kind: QuestionKind,
): Promise<ActionResult> {
  const found = await requireQuiz(courseId, quizId);
  if (!found) return fail("غير مصرّح أو الاختبار غير موجود.");

  const locked = lockedByAttempts(found.quiz._count.attempts);
  if (locked) return locked;

  const last = await db.question.findFirst({
    where: { quizId },
    orderBy: { position: "desc" },
    select: { position: true },
  });

  const options =
    kind === QuestionKind.TRUE_FALSE
      ? [
          { text: "صح", position: 0, isCorrect: true },
          { text: "خطأ", position: 1, isCorrect: false },
        ]
      : [
          { text: "", position: 0, isCorrect: true },
          { text: "", position: 1, isCorrect: false },
          { text: "", position: 2, isCorrect: false },
          { text: "", position: 3, isCorrect: false },
        ];

  await db.question.create({
    data: {
      quizId,
      kind,
      text: "",
      position: (last?.position ?? -1) + 1,
      options: { create: options },
    },
  });

  bump(courseId, quizId);
  return { ok: true };
}

const questionSchema = z.object({
  text: z.string().trim().min(1, "نص السؤال مطلوب.").max(1000),
  points: z.coerce
    .number()
    .int()
    .min(1, "الدرجة لا تقل عن ١.")
    .max(100, "الدرجة لا تزيد على ١٠٠."),
  correctOptionId: z.string().min(1, "حدّد الإجابة الصحيحة."),
});

export async function updateQuestion(
  courseId: string,
  quizId: string,
  questionId: string,
  formData: FormData,
): Promise<ActionResult> {
  const found = await requireQuiz(courseId, quizId);
  if (!found) return fail("غير مصرّح أو الاختبار غير موجود.");

  const locked = lockedByAttempts(found.quiz._count.attempts);
  if (locked) return locked;

  const raw = Object.fromEntries(formData);
  const parsed = questionSchema.safeParse(raw);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "البيانات غير صالحة.");
  }

  const question = await db.question.findFirst({
    where: { id: questionId, quizId },
    select: { id: true, options: { select: { id: true } } },
  });
  if (!question) return fail("السؤال غير موجود.");

  const optionIds = new Set(question.options.map((o) => o.id));
  if (!optionIds.has(parsed.data.correctOptionId)) {
    return fail("الإجابة الصحيحة المختارة لا تنتمي لهذا السؤال.");
  }

  // نصوص الخيارات تصل بصيغة option-<id>
  const optionTexts = new Map<string, string>();
  for (const [key, value] of Object.entries(raw)) {
    if (key.startsWith("option-") && typeof value === "string") {
      optionTexts.set(key.slice("option-".length), value.trim());
    }
  }

  for (const id of optionIds) {
    const text = optionTexts.get(id);
    if (text !== undefined && text.length === 0) {
      return fail("لا يمكن ترك نص خيار فارغًا.");
    }
  }

  await db.$transaction([
    db.question.update({
      where: { id: questionId },
      data: { text: parsed.data.text, points: parsed.data.points },
    }),
    ...[...optionIds].map((id) =>
      db.questionOption.update({
        where: { id },
        data: {
          isCorrect: id === parsed.data.correctOptionId,
          ...(optionTexts.has(id) ? { text: optionTexts.get(id)! } : {}),
        },
      }),
    ),
  ]);

  bump(courseId, quizId);
  return { ok: true };
}

export async function deleteQuestion(
  courseId: string,
  quizId: string,
  questionId: string,
): Promise<ActionResult> {
  const found = await requireQuiz(courseId, quizId);
  if (!found) return fail("غير مصرّح أو الاختبار غير موجود.");

  const locked = lockedByAttempts(found.quiz._count.attempts);
  if (locked) return locked;

  const question = await db.question.findFirst({
    where: { id: questionId, quizId },
    select: { id: true },
  });
  if (!question) return fail("السؤال غير موجود.");

  await db.question.delete({ where: { id: questionId } });

  bump(courseId, quizId);
  return { ok: true };
}
