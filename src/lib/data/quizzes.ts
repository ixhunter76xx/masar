import "server-only";

import { db } from "@/server/db";
import { accessibleLessonIds } from "@/lib/data/access";
import { Role, QuizStatus, QuestionKind } from "@/generated/prisma/enums";

/** بطاقة اختبار كما تظهر في قائمة المحتوى */
export type QuizSummary = {
  id: string;
  title: string;
  description: string | null;
  status: QuizStatus;
  questionCount: number;
  totalPoints: number;
  maxAttempts: number;
  timeLimitMin: number | null;
  createdAt: Date;
};

/**
 * اختبارات المقرر.
 * الطالب يرى المنشورة والمغلقة فقط؛ المدرب والإدارة يريان المسودات أيضًا.
 *
 * ⚠ **النطاق يتبع الدرس.** اختبار مبني على درس لا يظهر إلا لمن يملك
 * حزمة تحوي ذلك الدرس؛ واختبار بلا درس (`lessonId = null`) على مستوى
 * المقرر يراه كل من دخله. نفس قاعدة `canViewQuiz` بالضبط، مطبَّقة هنا
 * على دفعة واحدة بدل استعلام لكل صف.
 */
export async function getCourseQuizzes(
  courseId: string,
  userId: string,
  role: Role,
): Promise<QuizSummary[]> {
  const canSeeDrafts = role === Role.INSTRUCTOR || role === Role.ADMIN;

  const [{ isStaff, lessonIds }, rows] = await Promise.all([
    accessibleLessonIds(courseId),
    db.quiz.findMany({
      where: {
        courseId,
        ...(canSeeDrafts
          ? {}
          : { status: { in: [QuizStatus.PUBLISHED, QuizStatus.CLOSED] } }),
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        maxAttempts: true,
        timeLimitMin: true,
        createdAt: true,
        lessonId: true,
        questions: { select: { points: true } },
      },
    }),
  ]);

  const visible = isStaff
    ? rows
    : rows.filter((q) => q.lessonId === null || lessonIds.has(q.lessonId));

  return visible.map((q) => ({
    id: q.id,
    title: q.title,
    description: q.description,
    status: q.status,
    questionCount: q.questions.length,
    totalPoints: q.questions.reduce((sum, x) => sum + x.points, 0),
    maxAttempts: q.maxAttempts,
    timeLimitMin: q.timeLimitMin,
    createdAt: q.createdAt,
  }));
}

/**
 * اختبار كامل بأسئلته وخياراته **مع الإجابات الصحيحة** — للمدرب فقط.
 *
 * لا تستدعِ هذه الدالة في أي مسار يصله طالب. النسخة الخاصة بالطلاب
 * تُبنى في مرحلة أداء الاختبار ولا تُحمّل حقل `isCorrect` إطلاقًا.
 */
export async function getQuizForEditing(
  quizId: string,
  courseId: string,
) {
  return db.quiz.findFirst({
    where: { id: quizId, courseId },
    select: {
      id: true,
      courseId: true,
      title: true,
      description: true,
      status: true,
      maxAttempts: true,
      timeLimitMin: true,
      shuffleQuestions: true,
      questions: {
        orderBy: { position: "asc" },
        select: {
          id: true,
          kind: true,
          text: true,
          points: true,
          position: true,
          options: {
            orderBy: { position: "asc" },
            select: { id: true, text: true, isCorrect: true, position: true },
          },
        },
      },
      _count: { select: { attempts: true } },
    },
  });
}

export type QuizForEditing = NonNullable<
  Awaited<ReturnType<typeof getQuizForEditing>>
>;
export type QuestionForEditing = QuizForEditing["questions"][number];

/**
 * أسباب منع نشر اختبار.
 * النشر بلا أسئلة أو بسؤال بلا إجابة صحيحة يعني اختبارًا معطوبًا
 * يستحيل تصحيحه — نمنعه قبل أن يراه أي طالب.
 */
export function publishBlockers(quiz: QuizForEditing): string[] {
  const problems: string[] = [];

  if (quiz.questions.length === 0) {
    problems.push("الاختبار لا يحتوي أي سؤال.");
  }

  quiz.questions.forEach((q, i) => {
    const n = i + 1;
    if (q.options.length < 2) {
      problems.push(`السؤال ${n}: يحتاج خيارين على الأقل.`);
    }
    const correct = q.options.filter((o) => o.isCorrect).length;
    if (correct === 0) {
      problems.push(`السؤال ${n}: لم تُحدَّد الإجابة الصحيحة.`);
    } else if (correct > 1 && q.kind === QuestionKind.TRUE_FALSE) {
      problems.push(`السؤال ${n}: صح/خطأ يقبل إجابة صحيحة واحدة.`);
    }
    if (q.text.trim().length === 0) {
      problems.push(`السؤال ${n}: نص السؤال فارغ.`);
    }
  });

  return problems;
}
