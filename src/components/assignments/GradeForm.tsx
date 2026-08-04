"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Field";
import { gradeSubmission } from "@/app/(app)/learn/[courseId]/assignments/actions";

export function GradeForm({
  courseId,
  assignmentId,
  submissionId,
  totalPoints,
  rawPoints,
  feedback,
  isLate,
  penaltyPercent,
}: {
  courseId: string;
  assignmentId: string;
  submissionId: string;
  totalPoints: number;
  rawPoints: number | null;
  feedback: string | null;
  isLate: boolean;
  penaltyPercent: number;
}) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setSaved(false);

    const result = await gradeSubmission(
      courseId,
      assignmentId,
      submissionId,
      new FormData(event.currentTarget),
    );

    if (result.ok) {
      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 2000);
    } else {
      setError(result.message);
    }
    setBusy(false);
  }

  return (
    <form onSubmit={onSubmit} noValidate className="mt-4 border-t border-line pt-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-32">
          <Label htmlFor={`g-${submissionId}`}>
            الدرجة من <span className="numeric">{totalPoints}</span>
          </Label>
          <Input
            id={`g-${submissionId}`}
            name="rawPoints"
            type="number"
            min={0}
            max={totalPoints}
            numeric
            defaultValue={rawPoints ?? ""}
            required
          />
        </div>

        <div className="min-w-[220px] flex-1">
          <Label htmlFor={`f-${submissionId}`}>تعليق (اختياري)</Label>
          <Input
            id={`f-${submissionId}`}
            name="feedback"
            defaultValue={feedback ?? ""}
            placeholder="ملاحظات على الحل…"
          />
        </div>

        <Button type="submit" size="md" loading={busy}>
          {saved ? "حُفظ ✓" : "اعتماد الدرجة"}
        </Button>
      </div>

      {isLate && penaltyPercent > 0 && (
        <p className="mt-2 text-[11px] text-warning">
          تسليم متأخر — سيُخصم{" "}
          <span className="numeric">{penaltyPercent}</span>٪ تلقائيًا من الدرجة
          المُدخلة.
        </p>
      )}

      {error && (
        <p role="alert" className="mt-2 text-xs text-danger">
          {error}
        </p>
      )}
    </form>
  );
}
