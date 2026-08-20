import type { Metadata } from "next";
import { ar } from "@/lib/numerals";
import { NavLink as Link } from "@/components/ui/NavLink";
import { notFound } from "next/navigation";
import { ArrowRight, CheckCircle2, XCircle } from "lucide-react";

import { AppPage } from "@/components/shell/AppPage";
import { Card } from "@/components/ui/Card";
import { AttemptRunner } from "@/components/quizzes/AttemptRunner";
import { requireCourseAccess } from "@/lib/data/courses";
import { db } from "@/server/db";
import {
  getAttemptForTaking,
  deadlineOf,
  shuffleForAttempt,
} from "@/lib/data/quiz-attempts";

type Params = {
  params: Promise<{ courseId: string; quizId: string; attemptId: string }>;
};

export const metadata: Metadata = { title: "الاختبار" };

export default async function AttemptPage({ params }: Params) {
  const { courseId, quizId, attemptId } = await params;
  const { user } = await requireCourseAccess(courseId);

  // الاستعلام نفسه يتحقق من ملكية المحاولة ومن التسجيل في المقرر
  const attempt = await getAttemptForTaking(
    attemptId,
    quizId,
    courseId,
    user.id,
  );
  if (!attempt) notFound();

  const back = (
    <Link
      href={`/learn/${courseId}/quizzes/${quizId}`}
      className="mb-4 inline-flex items-center gap-1.5 text-[12px] text-muted transition-colors hover:text-paper"
    >
      <ArrowRight size={14} strokeWidth={1.75} aria-hidden="true" />
      العودة إلى الاختبار
    </Link>
  );

  /* ---------------------------------------------------------------- */
  /*  النتيجة — بعد التسليم                                            */
  /* ---------------------------------------------------------------- */
  if (attempt.submittedAt) {
    // نعرض صواب/خطأ كل سؤال دون كشف الإجابة الصحيحة،
    // حتى لا يتحوّل عرض النتيجة إلى مصدر تسريب لبقية الطلاب.
    const answers = await db.answer.findMany({
      where: { attemptId: attempt.id },
      select: { questionId: true, isCorrect: true, earnedPoints: true },
    });
    const byQuestion = new Map(answers.map((a) => [a.questionId, a]));

    const earned = attempt.earnedPoints ?? 0;
    const total = attempt.totalPoints ?? 0;
    const pct = total > 0 ? Math.round((earned / total) * 100) : 0;

    return (
      <AppPage title={attempt.quiz.title} hidePageHeader>
        {back}

        <Card className="mb-6 px-5 py-6 text-center">
          <p className="text-[13px] text-muted">
            نتيجة المحاولة{" "}
            <span className="numeric">{ar(attempt.attemptNumber)}</span>
          </p>
          <p className="mt-3">
            <span className="numeric text-3xl font-bold text-paper">
              {ar(earned)}
            </span>
            <span className="text-xl text-subtle"> / </span>
            <span className="numeric text-xl text-muted">{ar(total)}</span>
          </p>
          <p className="numeric mt-2 text-[13px] text-accent">{ar(pct)}٪</p>
        </Card>

        <h3 className="mb-3 text-sm font-medium text-paper">مراجعة الأسئلة</h3>
        <ol className="space-y-2">
          {attempt.quiz.questions.map((q, i) => {
            const a = byQuestion.get(q.id);
            const correct = a?.isCorrect === true;

            return (
              <li key={q.id}>
                <Card className="flex items-start gap-3 px-5 py-3">
                  {correct ? (
                    <CheckCircle2
                      size={17}
                      strokeWidth={1.75}
                      aria-label="إجابة صحيحة"
                      className="mt-0.5 shrink-0 text-success"
                    />
                  ) : (
                    <XCircle
                      size={17}
                      strokeWidth={1.75}
                      aria-label="إجابة خاطئة"
                      className="mt-0.5 shrink-0 text-danger"
                    />
                  )}
                  <p className="flex-1 text-[13px] leading-relaxed text-paper">
                    <span className="numeric text-subtle">{ar(i + 1)}. </span>
                    {q.text}
                  </p>
                  <span className="numeric shrink-0 text-[11px] text-subtle">
                    {ar(a?.earnedPoints ?? 0)} / {ar(q.points)}
                  </span>
                </Card>
              </li>
            );
          })}
        </ol>
      </AppPage>
    );
  }

  /* ---------------------------------------------------------------- */
  /*  الأداء — محاولة مفتوحة                                           */
  /* ---------------------------------------------------------------- */
  const deadline = deadlineOf(attempt.startedAt, attempt.quiz.timeLimitMin);

  const questions = attempt.quiz.shuffleQuestions
    ? shuffleForAttempt(attempt.quiz.questions, attempt.id)
    : attempt.quiz.questions;

  return (
    <AppPage title={attempt.quiz.title} hidePageHeader>
      <h2 className="mb-1 text-lg font-bold text-paper">
        {attempt.quiz.title}
      </h2>
      <p className="mb-6 text-[12px] text-subtle">
        المحاولة <span className="numeric">{attempt.attemptNumber}</span>
      </p>

      <AttemptRunner
        courseId={courseId}
        quizId={quizId}
        attemptId={attempt.id}
        questions={questions}
        deadlineIso={deadline?.toISOString() ?? null}
      />
    </AppPage>
  );
}
