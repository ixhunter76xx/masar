"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ListChecks, ToggleLeft } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { addQuestion } from "@/app/(app)/courses/[courseId]/quizzes/actions";
import { QuestionKind } from "@/generated/prisma/enums";

export function AddQuestionButtons({
  courseId,
  quizId,
}: {
  courseId: string;
  quizId: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = React.useState<QuestionKind | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  async function add(kind: QuestionKind) {
    setBusy(kind);
    setError(null);
    const result = await addQuestion(courseId, quizId, kind);
    if (result.ok) router.refresh();
    else setError(result.message);
    setBusy(null);
  }

  return (
    <div className="mt-4">
      <div className="flex flex-wrap gap-2">
        <Button
          variant="secondary"
          size="sm"
          loading={busy === QuestionKind.MULTIPLE_CHOICE}
          onClick={() => add(QuestionKind.MULTIPLE_CHOICE)}
        >
          <ListChecks size={15} strokeWidth={1.75} aria-hidden="true" />
          سؤال اختيار من متعدد
        </Button>
        <Button
          variant="secondary"
          size="sm"
          loading={busy === QuestionKind.TRUE_FALSE}
          onClick={() => add(QuestionKind.TRUE_FALSE)}
        >
          <ToggleLeft size={15} strokeWidth={1.75} aria-hidden="true" />
          سؤال صح / خطأ
        </Button>
      </div>
      {error && (
        <p role="alert" className="mt-2 text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
