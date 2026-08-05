import Link from "next/link";
import { Timer, Repeat, FileQuestion } from "lucide-react";

import { Card } from "@/components/ui/Card";
import { ScoreRing } from "@/components/grades/ScoreRing";
import { SparkBurst } from "@/components/motion/SparkBurst";
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

  /* `totalPoints` قد يكون null لمحاولة على اختبار بلا أسئلة — القسمة
     عليه تعطي NaN فتُرسم الحلقة فارغة بلا خطأ ظاهر. */
  const bestTotal = best?.totalPoints ?? 0;
  const bestPct =
    best && bestTotal > 0 ? ((best.earnedPoints ?? 0) / bestTotal) * 100 : 0;

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
        /* ── لحظة الإنجاز ────────────────────────────────────────────
           هذه أهمّ لحظة في المقرر كله، وكانت تُعرض سطرًا رماديًا بأيقونة
           صحّ. الآن: حلقة تُرسم بلون الشرارة، ورقم يظهر بعدها، وانفجار
           صغير مرة واحدة. الشرارة محجوزة للتقدّم — وهذا موضعها. */
        /* ── البطاقة مبنيّة حول الحلقة لا بجوارها ────────────────────
           كانت الحلقة عنصرًا صغيرًا مُلحقًا عند الحافة، والنصّ ملتصقًا
           بها، وبقية البطاقة فراغًا. الحلقة الآن ١١٦px وهي مركز الثقل
           البصري، والنصّ يتدرّج حولها من الأهم إلى الأقل، وضوء الشرارة
           يسقط خلفها فيربطها بالسطح بدل أن تطفو فوقه. */
        <Card
          className="relative mb-6 overflow-hidden px-6 py-7
            [background:radial-gradient(120%_140%_at_var(--pos)_-30%,color-mix(in_srgb,var(--color-spark)_11%,transparent),transparent_62%),linear-gradient(168deg,var(--color-panel-lift)_0%,var(--color-panel)_60%)]
            [--pos:88%]"
        >
          <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:items-center sm:gap-7 sm:text-start">
            <span className="relative grid shrink-0 place-items-center">
              <SparkBurst size={116} />
              <ScoreRing percent={bestPct} size={116}>
                <span className="numeric text-xl font-semibold">
                  {Math.round(bestPct)}%
                </span>
              </ScoreRing>
            </span>

            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-medium uppercase tracking-wide text-spark">
                أفضل نتيجة
              </p>
              <p className="mt-1.5 text-2xl font-semibold leading-none text-paper">
                <span className="numeric">{best.earnedPoints}</span>
                <span className="mx-1 text-lg text-subtle">/</span>
                <span className="numeric text-lg text-muted">
                  {best.totalPoints}
                </span>
                <span className="ms-2 text-sm font-normal text-subtle">درجة</span>
              </p>
              <p className="mt-2.5 text-[11px] leading-relaxed text-subtle">
                الدرجة المعتمدة هي الأعلى بين محاولاتك.
              </p>
            </div>
          </div>
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
                <Card className="lift hover:border-accent-deep">
                  <Link
                    href={`/learn/${courseId}/quizzes/${quiz.id}/attempt/${a.id}`}
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
