"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Timer, Send, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { submitAttempt } from "@/app/(app)/courses/[courseId]/quizzes/attempt-actions";
import { cn } from "@/lib/utils";
import type { AttemptQuestion } from "@/lib/data/quiz-attempts";

/** عدّاد تنازلي — عرضي فقط؛ الخادم هو من يفرض المهلة فعليًا */
function useCountdown(deadlineIso: string | null) {
  const [left, setLeft] = React.useState<number | null>(null);

  React.useEffect(() => {
    if (!deadlineIso) return;
    const end = new Date(deadlineIso).getTime();

    const tick = () => setLeft(Math.max(0, end - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [deadlineIso]);

  return left;
}

function formatLeft(ms: number) {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function AttemptRunner({
  courseId,
  quizId,
  attemptId,
  questions,
  deadlineIso,
}: {
  courseId: string;
  quizId: string;
  attemptId: string;
  questions: AttemptQuestion[];
  deadlineIso: string | null;
}) {
  const router = useRouter();
  const [answers, setAnswers] = React.useState<Record<string, string>>({});
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const submittedRef = React.useRef(false);

  const left = useCountdown(deadlineIso);
  const answeredCount = Object.keys(answers).length;

  const send = React.useCallback(async () => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setBusy(true);
    setError(null);

    const payload = {
      answers: Object.entries(answers).map(([questionId, optionId]) => ({
        questionId,
        optionId,
      })),
    };

    const result = await submitAttempt(courseId, quizId, attemptId, payload);

    // في الحالتين تُغلق المحاولة، فننتقل إلى النتيجة
    if (!result.ok) setError(result.message);
    router.replace(
      `/courses/${courseId}/quizzes/${quizId}/attempt/${attemptId}`,
    );
    router.refresh();
  }, [answers, attemptId, courseId, quizId, router]);

  // تسليم تلقائي عند انتهاء الوقت
  React.useEffect(() => {
    if (left !== null && left <= 0 && !submittedRef.current) void send();
  }, [left, send]);

  return (
    <>
      {deadlineIso && (
        <Card
          className={cn(
            "sticky top-20 z-30 mb-6 flex items-center justify-between gap-3 px-5 py-3",
            left !== null && left < 60_000 && "border-danger/50",
          )}
        >
          <span className="inline-flex items-center gap-2 text-[13px] text-muted">
            <Timer size={15} strokeWidth={1.75} aria-hidden="true" />
            الوقت المتبقي
          </span>
          <span
            role="timer"
            aria-live="off"
            className={cn(
              "numeric text-sm font-medium",
              left !== null && left < 60_000 ? "text-danger" : "text-paper",
            )}
          >
            {left === null ? "—" : formatLeft(left)}
          </span>
        </Card>
      )}

      <ol className="space-y-3">
        {questions.map((q, i) => (
          <li key={q.id}>
            <Card className="px-5 py-5">
              <fieldset disabled={busy}>
                <legend className="mb-3">
                  <span className="numeric text-[11px] text-disabled">
                    سؤال {i + 1} من {questions.length}
                  </span>
                  <span className="numeric ms-3 text-[11px] text-disabled">
                    {q.points} درجة
                  </span>
                  <p className="mt-2 text-sm leading-relaxed text-paper">
                    {q.text}
                  </p>
                </legend>

                <div className="space-y-2">
                  {q.options.map((o) => (
                    <label
                      key={o.id}
                      className={cn(
                        "flex cursor-pointer items-center gap-3 rounded-[10px] border px-4 py-3 transition-colors",
                        answers[q.id] === o.id
                          ? "border-action bg-action/5"
                          : "border-line hover:border-accent-deep",
                      )}
                    >
                      <input
                        type="radio"
                        name={q.id}
                        value={o.id}
                        checked={answers[q.id] === o.id}
                        onChange={() =>
                          setAnswers((prev) => ({ ...prev, [q.id]: o.id }))
                        }
                        className="size-4 shrink-0 accent-[#8FB2C8]"
                      />
                      <span className="text-sm text-paper">{o.text}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            </Card>
          </li>
        ))}
      </ol>

      <Card className="mt-6 px-5 py-4">
        {answeredCount < questions.length && (
          <p className="mb-3 flex items-center gap-1.5 text-[12px] text-warning">
            <TriangleAlert size={13} strokeWidth={1.75} aria-hidden="true" />
            أجبت عن{" "}
            <span className="numeric">{answeredCount}</span> من{" "}
            <span className="numeric">{questions.length}</span> — الأسئلة غير
            المُجابة تُحتسب صفرًا.
          </p>
        )}

        <Button size="md" loading={busy} onClick={send}>
          <Send size={15} strokeWidth={1.75} aria-hidden="true" />
          تسليم الاختبار
        </Button>

        {error && (
          <p role="alert" className="mt-3 text-xs text-danger">
            {error}
          </p>
        )}
      </Card>
    </>
  );
}
