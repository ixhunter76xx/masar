"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Send, Lock, RotateCcw, Trash2, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  setQuizStatus,
  deleteQuiz,
} from "@/app/(app)/courses/[courseId]/quizzes/actions";
import { QuizStatus } from "@/generated/prisma/enums";

export function QuizToolbar({
  courseId,
  quizId,
  status,
  blockers,
  attemptCount,
}: {
  courseId: string;
  quizId: string;
  status: QuizStatus;
  blockers: string[];
  attemptCount: number;
}) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function change(next: QuizStatus) {
    setBusy(true);
    setError(null);
    const result = await setQuizStatus(courseId, quizId, next);
    if (result.ok) router.refresh();
    else setError(result.message);
    setBusy(false);
  }

  async function remove() {
    setBusy(true);
    setError(null);
    const result = await deleteQuiz(courseId, quizId);
    if (result.ok) router.push(`/courses/${courseId}`);
    else {
      setError(result.message);
      setBusy(false);
    }
  }

  const canPublish = blockers.length === 0;

  return (
    <Card className="mb-6 px-5 py-4">
      <div className="flex flex-wrap items-center gap-2">
        {status === QuizStatus.DRAFT && (
          <Button
            size="sm"
            loading={busy}
            disabled={!canPublish}
            onClick={() => change(QuizStatus.PUBLISHED)}
          >
            <Send size={15} strokeWidth={1.75} aria-hidden="true" />
            نشر الاختبار
          </Button>
        )}

        {status === QuizStatus.PUBLISHED && (
          <Button
            variant="secondary"
            size="sm"
            loading={busy}
            onClick={() => change(QuizStatus.CLOSED)}
          >
            <Lock size={15} strokeWidth={1.75} aria-hidden="true" />
            إغلاق الاختبار
          </Button>
        )}

        {status === QuizStatus.CLOSED && (
          <Button
            variant="secondary"
            size="sm"
            loading={busy}
            onClick={() => change(QuizStatus.PUBLISHED)}
          >
            <RotateCcw size={15} strokeWidth={1.75} aria-hidden="true" />
            إعادة الفتح
          </Button>
        )}

        {attemptCount === 0 && (
          <Button
            variant="danger"
            size="sm"
            loading={busy}
            onClick={remove}
          >
            <Trash2 size={15} strokeWidth={1.75} aria-hidden="true" />
            حذف
          </Button>
        )}

        {attemptCount > 0 && (
          <span className="text-[11px] text-subtle">
            <span className="numeric">{attemptCount}</span> محاولة مسجَّلة —
            بنية الأسئلة مقفلة
          </span>
        )}
      </div>

      {status === QuizStatus.DRAFT && blockers.length > 0 && (
        <div className="mt-3 rounded-[10px] border border-warning/30 bg-warning/5 px-4 py-3">
          <p className="flex items-center gap-1.5 text-[12px] font-medium text-warning">
            <TriangleAlert size={13} strokeWidth={1.75} aria-hidden="true" />
            لا يمكن النشر قبل معالجة الآتي
          </p>
          <ul className="mt-2 space-y-1">
            {blockers.map((b) => (
              <li key={b} className="text-[11px] leading-relaxed text-muted">
                • {b}
              </li>
            ))}
          </ul>
        </div>
      )}

      {error && (
        <p role="alert" className="mt-3 text-xs text-danger">
          {error}
        </p>
      )}
    </Card>
  );
}
