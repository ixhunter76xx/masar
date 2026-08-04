"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Play } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { startAttempt } from "@/app/(app)/learn/[courseId]/quizzes/attempt-actions";

export function StartAttemptButton({
  courseId,
  quizId,
  label,
}: {
  courseId: string;
  quizId: string;
  label: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function start() {
    setBusy(true);
    setError(null);

    const result = await startAttempt(courseId, quizId);
    if (result.ok) {
      router.push(
        `/learn/${courseId}/quizzes/${quizId}/attempt/${result.attemptId}`,
      );
    } else {
      setError(result.message);
      setBusy(false);
    }
  }

  return (
    <div>
      <Button size="md" loading={busy} onClick={start}>
        <Play size={15} strokeWidth={1.75} aria-hidden="true" />
        {label}
      </Button>
      {error && (
        <p role="alert" className="mt-2 text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
