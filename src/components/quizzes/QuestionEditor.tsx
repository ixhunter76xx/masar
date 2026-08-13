"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Trash2, Check } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Label } from "@/components/ui/Field";
import {
  updateQuestion,
  deleteQuestion,
} from "@/app/(app)/learn/[courseId]/quizzes/actions";
import { QuestionKind } from "@/generated/prisma/enums";
import type { QuestionForEditing } from "@/lib/data/quizzes";
import { cn } from "@/lib/utils";

export function QuestionEditor({
  courseId,
  quizId,
  question,
  index,
  locked,
}: {
  courseId: string;
  quizId: string;
  question: QuestionForEditing;
  index: number;
  locked: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [correctId, setCorrectId] = React.useState(
    question.options.find((o) => o.isCorrect)?.id ?? "",
  );

  const isTrueFalse = question.kind === QuestionKind.TRUE_FALSE;

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setSaved(false);

    const result = await updateQuestion(
      courseId,
      quizId,
      question.id,
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

  async function remove() {
    setBusy(true);
    const result = await deleteQuestion(courseId, quizId, question.id);
    if (result.ok) router.refresh();
    else {
      setError(result.message);
      setBusy(false);
    }
  }

  return (
    <Card className="px-5 py-5">
      <form onSubmit={save} noValidate className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <span className="numeric mt-2 text-[11px] text-subtle">
            سؤال {index + 1}
          </span>
          <span className="rounded-full border border-line px-2 py-0.5 text-[10px] text-muted">
            {isTrueFalse ? "صح / خطأ" : "اختيار من متعدد"}
          </span>
        </div>

        <div>
          <Label htmlFor={`q-${question.id}-text`}>نص السؤال</Label>
          <textarea
            id={`q-${question.id}-text`}
            name="text"
            rows={2}
            defaultValue={question.text}
            disabled={locked}
            placeholder="اكتب نص السؤال…"
            className="w-full rounded-[10px] bg-ink px-4 py-3 text-sm text-paper
              border border-line placeholder:text-disabled leading-relaxed
              transition-colors duration-150 hover:border-accent-deep
              focus:border-accent focus:outline-none resize-y
              disabled:text-disabled disabled:cursor-not-allowed"
          />
        </div>

        <fieldset>
          <legend className="mb-2 block text-[13px] text-muted">
            الخيارات — اختر الإجابة الصحيحة
          </legend>

          <div className="space-y-2">
            {question.options.map((o) => (
              <label
                key={o.id}
                className={cn(
                  "flex items-center gap-3 rounded-[10px] border px-3 py-2 transition-colors",
                  correctId === o.id
                    ? "border-success/50 bg-success/5"
                    : "border-line",
                )}
              >
                <input
                  type="radio"
                  name="correctOptionId"
                  value={o.id}
                  checked={correctId === o.id}
                  onChange={() => setCorrectId(o.id)}
                  disabled={locked}
                  className="size-4 shrink-0 accent-[var(--color-success)]"
                  aria-label={`تحديد كإجابة صحيحة`}
                />

                {isTrueFalse ? (
                  <span className="flex-1 text-sm text-paper">{o.text}</span>
                ) : (
                  <Input
                    name={`option-${o.id}`}
                    defaultValue={o.text}
                    disabled={locked}
                    placeholder="نص الخيار"
                    className="h-9 border-0 bg-transparent px-0 hover:border-0 focus:border-0"
                  />
                )}

                {correctId === o.id && (
                  <Check
                    size={15}
                    strokeWidth={2}
                    aria-hidden="true"
                    className="shrink-0 text-success"
                  />
                )}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="flex flex-wrap items-end gap-3">
          <div className="w-28">
            <Label htmlFor={`q-${question.id}-points`}>الدرجة</Label>
            <Input
              id={`q-${question.id}-points`}
              name="points"
              type="number"
              min={1}
              max={100}
              numeric
              defaultValue={question.points}
              disabled={locked}
            />
          </div>

          {!locked && (
            <>
              <Button type="submit" size="sm" loading={busy}>
                {saved ? "حُفظ ✓" : "حفظ السؤال"}
              </Button>
              <Button
                variant="quiet"
                size="sm"
                disabled={busy}
                onClick={remove}
                aria-label={`حذف السؤال ${index + 1}`}
                className="hover:text-danger"
              >
                <Trash2 size={15} strokeWidth={1.75} aria-hidden="true" />
              </Button>
            </>
          )}
        </div>

        {error && (
          <p role="alert" className="text-xs text-danger">
            {error}
          </p>
        )}
      </form>
    </Card>
  );
}
