import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";

import { AppPage } from "@/components/shell/AppPage";
import { QuizSettingsForm } from "@/components/quizzes/QuizSettingsForm";
import { QuizToolbar } from "@/components/quizzes/QuizToolbar";
import { QuestionEditor } from "@/components/quizzes/QuestionEditor";
import { AddQuestionButtons } from "@/components/quizzes/AddQuestionButtons";
import { requireCourseAccess } from "@/lib/data/courses";
import { canManageCourse } from "@/lib/data/materials";
import { getQuizForEditing, publishBlockers } from "@/lib/data/quizzes";

type Params = { params: Promise<{ courseId: string; quizId: string }> };

export const metadata: Metadata = { title: "تحرير الاختبار" };

export default async function QuizEditorPage({ params }: Params) {
  const { courseId, quizId } = await params;
  const { user } = await requireCourseAccess(courseId);

  // صفحة تحرير — الطالب لا يصلها إطلاقًا، وإلا لرأى الإجابات الصحيحة
  const canManage = await canManageCourse(courseId, user.id, user.role);
  if (!canManage) notFound();

  const quiz = await getQuizForEditing(quizId, courseId);
  if (!quiz) notFound();

  const blockers = publishBlockers(quiz);
  const locked = quiz._count.attempts > 0;

  return (
    <AppPage title={quiz.title} hidePageHeader>
      <Link
        href={`/courses/${courseId}`}
        className="mb-4 inline-flex items-center gap-1.5 text-[12px] text-muted transition-colors hover:text-paper"
      >
        <ArrowRight size={14} strokeWidth={1.75} aria-hidden="true" />
        العودة إلى محتوى المقرر
      </Link>

      <QuizToolbar
        courseId={courseId}
        quizId={quiz.id}
        status={quiz.status}
        blockers={blockers}
        attemptCount={quiz._count.attempts}
      />

      <QuizSettingsForm
        courseId={courseId}
        quiz={{
          id: quiz.id,
          title: quiz.title,
          description: quiz.description,
          maxAttempts: quiz.maxAttempts,
          timeLimitMin: quiz.timeLimitMin,
          shuffleQuestions: quiz.shuffleQuestions,
        }}
      />

      <h3 className="mb-3 text-sm font-medium text-paper">
        الأسئلة{" "}
        <span className="numeric text-[11px] text-disabled">
          {quiz.questions.length}
        </span>
      </h3>

      <ol className="space-y-3">
        {quiz.questions.map((q, i) => (
          <li key={q.id}>
            <QuestionEditor
              courseId={courseId}
              quizId={quiz.id}
              question={q}
              index={i}
              locked={locked}
            />
          </li>
        ))}
      </ol>

      {!locked && <AddQuestionButtons courseId={courseId} quizId={quiz.id} />}
    </AppPage>
  );
}
