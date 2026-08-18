"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { FormField, Label, Checkbox, Textarea } from "@/components/ui/Field";
import {
  createQuiz,
  updateQuiz,
} from "@/app/(app)/learn/[courseId]/quizzes/actions";

export type QuizSettings = {
  id: string;
  title: string;
  description: string | null;
  maxAttempts: number;
  timeLimitMin: number | null;
  shuffleQuestions: boolean;
};

export function QuizSettingsForm({
  courseId,
  quiz,
}: {
  courseId: string;
  quiz?: QuizSettings;
}) {
  const router = useRouter();
  const formRef = React.useRef<HTMLFormElement>(null);
  const [busy, setBusy] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setSaved(false);

    const data = new FormData(event.currentTarget);
    const result = quiz
      ? await updateQuiz(courseId, quiz.id, data)
      : await createQuiz(courseId, data);

    if (result.ok) {
      if (quiz) {
        setSaved(true);
        router.refresh();
        setTimeout(() => setSaved(false), 2000);
      } else {
        formRef.current?.reset();
        router.push(`/learn/${courseId}/quizzes/${result.id}`);
      }
    } else {
      setError(result.message);
    }
    setBusy(false);
  }

  return (
    <Card className="mb-6 px-5 py-5">
      <h2 className="mb-4 text-sm font-medium text-paper">
        {quiz ? "إعدادات الاختبار" : "اختبار جديد"}
      </h2>

      <form ref={formRef} onSubmit={onSubmit} noValidate className="space-y-3">
        <FormField
          id="quiz-title"
          name="title"
          label="عنوان الاختبار"
          placeholder="الاختبار القصير الأول"
          defaultValue={quiz?.title}
          required
        />

        <div>
          <Label htmlFor="quiz-desc">تعليمات للطالب (اختياري)</Label>
          <Textarea
            id="quiz-desc"
            name="description"
            rows={2}
            defaultValue={quiz?.description ?? ""}
            placeholder="اقرأ كل سؤال بعناية قبل الإجابة…"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <FormField
            id="quiz-attempts"
            name="maxAttempts"
            label="عدد المحاولات المسموحة"
            type="number"
            min={1}
            max={10}
            numeric
            defaultValue={quiz?.maxAttempts ?? 1}
            hint="الدرجة المعتمدة هي أعلى محاولة."
            required
          />
          <FormField
            id="quiz-time"
            name="timeLimitMin"
            label="المدة بالدقائق (اختياري)"
            type="number"
            min={1}
            max={600}
            numeric
            defaultValue={quiz?.timeLimitMin ?? ""}
            hint="اتركه فارغًا لاختبار بلا حد زمني."
          />
        </div>

        <div className="pt-1">
          <Checkbox
            id="quiz-shuffle"
            name="shuffleQuestions"
            label="ترتيب عشوائي للأسئلة"
            defaultChecked={quiz?.shuffleQuestions ?? false}
          />
        </div>

        {error && (
          <p role="alert" className="text-xs leading-relaxed text-danger">
            {error}
          </p>
        )}

        <Button type="submit" size="sm" loading={busy}>
          {quiz ? (saved ? "حُفظ ✓" : "حفظ الإعدادات") : "إنشاء الاختبار"}
        </Button>
      </form>
    </Card>
  );
}
