import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";

import { AppPage } from "@/components/shell/AppPage";
import { QuizSettingsForm } from "@/components/quizzes/QuizSettingsForm";
import { QuizToolbar } from "@/components/quizzes/QuizToolbar";
import { QuestionEditor } from "@/components/quizzes/QuestionEditor";
import { AddQuestionButtons } from "@/components/quizzes/AddQuestionButtons";
import { QuizOverview } from "@/components/quizzes/QuizOverview";
import { requireCourseAccess } from "@/lib/data/courses";
import { canManageCourse } from "@/lib/data/materials";
import { getQuizForEditing, publishBlockers } from "@/lib/data/quizzes";
import {
  getQuizForStudent,
  listStudentAttempts,
  startBlocker,
} from "@/lib/data/quiz-attempts";

type Params = { params: Promise<{ courseId: string; quizId: string }> };

export const metadata: Metadata = { title: "تحرير الاختبار" };

export default async function QuizEditorPage({ params }: Params) {
  const { courseId, quizId } = await params;
  const { user } = await requireCourseAccess(courseId);

  const canManage = await canManageCourse(courseId, user.id, user.role);

  // الطالب يرى نظرة عامة تُبنى من استعلام لا يُحمّل الإجابات الصحيحة
  if (!canManage) {
    const forStudent = await getQuizForStudent(
      quizId,
      courseId,
      user.id,
      user.role,
    );
    if (!forStudent) notFound();

    const attempts = await listStudentAttempts(quizId, user.id);

    return (
      <AppPage title={forStudent.title} hidePageHeader>
        <Link
          href={`/learn/${courseId}`}
          className="mb-4 inline-flex items-center gap-1.5 text-[12px] text-muted transition-colors hover:text-paper"
        >
          <ArrowRight size={14} strokeWidth={1.75} aria-hidden="true" />
          العودة إلى محتوى المقرر
        </Link>

        <QuizOverview
          courseId={courseId}
          quiz={{
            id: forStudent.id,
            title: forStudent.title,
            description: forStudent.description,
            maxAttempts: forStudent.maxAttempts,
            timeLimitMin: forStudent.timeLimitMin,
            questionCount: forStudent.questions.length,
            totalPoints: forStudent.questions.reduce(
              (sum, q) => sum + q.points,
              0,
            ),
          }}
          attempts={attempts}
          blocker={startBlocker(forStudent, attempts)}
        />
      </AppPage>
    );
  }

  const quiz = await getQuizForEditing(quizId, courseId);
  if (!quiz) notFound();

  const blockers = publishBlockers(quiz);
  const locked = quiz._count.attempts > 0;

  return (
    <AppPage title={quiz.title} hidePageHeader>
      <Link
        href={`/learn/${courseId}`}
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
        <span className="numeric text-[11px] text-subtle">
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
