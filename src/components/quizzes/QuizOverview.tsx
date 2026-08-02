import Link from "next/link";
import { Timer, Repeat, FileQuestion, CheckCircle2 } from "lucide-react";

import { Card } from "@/components/ui/Card";
import { StartAttemptButton } from "@/components/quizzes/StartAttemptButton";
import { relativeTime } from "@/lib/format";
import type { StudentAttempt } from "@/lib/data/quiz-attempts";

export function QuizOverview({
  courseId,
  quiz,
  attempts,
  blocker,
}: {
  courseId: string;
  quiz: {
    id: string;
    title: string;
    description: string | null;
    maxAttempts: number;
    timeLimitMin: number | null;
    questionCount: number;
    totalPoints: number;
  };
  attempts: StudentAttempt[];
  blocker: string | null;
}) {
  const open = attempts.find((a) => a.submittedAt === null);
  const graded = attempts.filter((a) => a.submittedAt !== null);
  const best = graded.reduce<StudentAttempt | null>(
    (acc, a) =>
      acc === null || (a.earnedPoints ?? 0) > (acc.earnedPoints ?? 0) ? a : acc,
    null,
  );

  return (
    <>
      <Card className="mb-6 px-5 py-5">
        <h2 className="text-lg font-bold text-paper">{quiz.title}</h2>

        {quiz.description && (
          <p className="mt-2 text-[13px] leading-relaxed text-muted">
            {quiz.description}
          </p>
        )}

        <dl className="mt-5 grid gap-4 border-t border-line pt-4 text-[13px] sm:grid-cols-3">
          <Meta icon={FileQuestion} label="الأسئلة">
            <span className="numeric">{quiz.questionCount}</span> ·{" "}
            <span className="numeric">{quiz.totalPoints}</span> درجة
          </Meta>
          <Meta icon={Timer} label="المدة">
            {quiz.timeLimitMin === null ? (
              "بلا حد زمني"
            ) : (
              <>
                <span className="numeric">{quiz.timeLimitMin}</span> دقيقة
              </>
            )}
          </Meta>
          <Meta icon={Repeat} label="المحاولات">
            <span className="numeric">{graded.length}</span> من{" "}
            <span className="numeric">{quiz.maxAttempts}</span>
          </Meta>
        </dl>
      </Card>

      {best && (
        <Card className="mb-6 flex items-center gap-3 px-5 py-4">
          <CheckCircle2
            size={18}
            strokeWidth={1.75}
            aria-hidden="true"
            className="text-success"
          />
          <p className="flex-1 text-sm text-paper">
            أفضل نتيجة:{" "}
            <span className="numeric font-medium">{best.earnedPoints}</span>
            <span className="text-subtle"> / </span>
            <span className="numeric text-muted">{best.totalPoints}</span>
          </p>
          <span className="text-[11px] text-subtle">
            الدرجة المعتمدة هي الأعلى
          </span>
        </Card>
      )}

      {blocker ? (
        <Card className="mb-6 px-5 py-4 text-[13px] text-warning">
          {blocker}
        </Card>
      ) : (
        <div className="mb-6">
          <StartAttemptButton
            courseId={courseId}
            quizId={quiz.id}
            label={open ? "استئناف المحاولة" : "بدء الاختبار"}
          />
        </div>
      )}

      {graded.length > 0 && (
        <>
          <h3 className="mb-3 text-sm font-medium text-paper">المحاولات</h3>
          <ol className="space-y-2">
            {graded.map((a) => (
              <li key={a.id}>
                <Card className="transition-colors hover:border-accent-deep">
                  <Link
                    href={`/courses/${courseId}/quizzes/${quiz.id}/attempt/${a.id}`}
                    className="flex items-center justify-between gap-3 px-5 py-3"
                  >
                    <span className="text-[13px] text-paper">
                      المحاولة <span className="numeric">{a.attemptNumber}</span>
                    </span>
                    <span className="flex items-center gap-3">
                      <span className="text-[11px] text-subtle">
                        {relativeTime(a.submittedAt!)}
                      </span>
                      <span className="numeric text-sm text-paper">
                        {a.earnedPoints}
                        <span className="text-subtle"> / </span>
                        <span className="text-muted">{a.totalPoints}</span>
                      </span>
                    </span>
                  </Link>
                </Card>
              </li>
            ))}
          </ol>
        </>
      )}
    </>
  );
}

function Meta({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof Timer;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <dt className="flex items-center gap-1.5 text-[11px] text-subtle">
        <Icon size={13} strokeWidth={1.75} aria-hidden="true" />
        {label}
      </dt>
      <dd className="mt-1 text-paper">{children}</dd>
    </div>
  );
}
