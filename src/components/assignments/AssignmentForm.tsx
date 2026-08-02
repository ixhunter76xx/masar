"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { FormField, Label, Checkbox } from "@/components/ui/Field";
import {
  createAssignment,
  updateAssignment,
} from "@/app/(app)/courses/[courseId]/assignments/actions";

export type AssignmentSettings = {
  id: string;
  title: string;
  description: string | null;
  totalPoints: number;
  dueAt: Date | null;
  allowLate: boolean;
  latePenaltyPercent: number;
  allowedExtensions: string[];
  maxFileMb: number;
};

/** Date → قيمة datetime-local بالتوقيت المحلي */
function toLocalInput(d: Date | null): string {
  if (!d) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

export function AssignmentForm({
  courseId,
  assignment,
}: {
  courseId: string;
  assignment?: AssignmentSettings;
}) {
  const router = useRouter();
  const formRef = React.useRef<HTMLFormElement>(null);
  const [allowLate, setAllowLate] = React.useState(
    assignment?.allowLate ?? false,
  );
  const [busy, setBusy] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setSaved(false);

    const data = new FormData(event.currentTarget);
    const result = assignment
      ? await updateAssignment(courseId, assignment.id, data)
      : await createAssignment(courseId, data);

    if (result.ok) {
      if (assignment) {
        setSaved(true);
        router.refresh();
        setTimeout(() => setSaved(false), 2000);
      } else {
        formRef.current?.reset();
        router.push(`/courses/${courseId}/assignments/${result.id}`);
      }
    } else {
      setError(result.message);
    }
    setBusy(false);
  }

  return (
    <Card className="mb-6 px-5 py-5">
      <h2 className="mb-4 text-sm font-medium text-paper">
        {assignment ? "إعدادات الواجب" : "واجب جديد"}
      </h2>

      <form ref={formRef} onSubmit={onSubmit} noValidate className="space-y-3">
        <FormField
          id="a-title"
          name="title"
          label="عنوان الواجب"
          placeholder="الواجب الأول — المشتقات"
          defaultValue={assignment?.title}
          required
        />

        <div>
          <Label htmlFor="a-desc">وصف المطلوب</Label>
          <textarea
            id="a-desc"
            name="description"
            rows={3}
            defaultValue={assignment?.description ?? ""}
            placeholder="حلّ التمارين من ١ إلى ١٠ وارفع الحل بصيغة PDF…"
            className="w-full rounded-[10px] bg-ink px-4 py-3 text-sm text-paper
              border border-line placeholder:text-disabled leading-relaxed
              transition-colors duration-150 hover:border-accent-deep
              focus:border-accent focus:outline-none resize-y"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <FormField
            id="a-points"
            name="totalPoints"
            label="الدرجة الكاملة"
            type="number"
            min={1}
            max={1000}
            numeric
            defaultValue={assignment?.totalPoints ?? 10}
            required
          />
          <FormField
            id="a-due"
            name="dueAt"
            label="موعد التسليم (اختياري)"
            type="datetime-local"
            defaultValue={toLocalInput(assignment?.dueAt ?? null)}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <FormField
            id="a-ext"
            name="allowedExtensions"
            label="الصيغ المسموحة"
            placeholder="pdf, docx, zip"
            defaultValue={(assignment?.allowedExtensions ?? [
              "pdf",
              "docx",
              "zip",
              "png",
              "jpg",
            ]).join(", ")}
            hint="افصل بينها بفاصلة."
          />
          <FormField
            id="a-size"
            name="maxFileMb"
            label="أقصى حجم للملف (ميجابايت)"
            type="number"
            min={1}
            max={200}
            numeric
            defaultValue={assignment?.maxFileMb ?? 20}
          />
        </div>

        <div className="space-y-3 rounded-[10px] border border-line px-4 py-3">
          <Checkbox
            id="a-late"
            name="allowLate"
            label="قبول التسليم المتأخر"
            checked={allowLate}
            onChange={(e) => setAllowLate(e.target.checked)}
          />
          {allowLate && (
            <FormField
              id="a-penalty"
              name="latePenaltyPercent"
              label="نسبة الخصم على التأخير (٪)"
              type="number"
              min={0}
              max={100}
              numeric
              defaultValue={assignment?.latePenaltyPercent ?? 0}
              hint="٠ يعني قبول التأخير بلا خصم. الخصم يُطبَّق تلقائيًا عند التصحيح."
            />
          )}
        </div>

        {error && (
          <p role="alert" className="text-xs leading-relaxed text-danger">
            {error}
          </p>
        )}

        <Button type="submit" size="sm" loading={busy}>
          {assignment ? (saved ? "حُفظ ✓" : "حفظ الإعدادات") : "إنشاء الواجب"}
        </Button>
      </form>
    </Card>
  );
}
