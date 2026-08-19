"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { updateCourse } from "@/app/(app)/settings/courses/actions";
import { Select, Textarea } from "@/components/ui/Field";
import { FormAlert } from "@/components/ui/FormAlert";

/**
 * تحرير بيانات المقرر.
 *
 * ⚠ **الرمز يغيّر الرابط العام.** المسار يُشتقّ من الرمز ولا يُكتب
 * منفصلًا — حقلان يحملان المعنى نفسه يفترقان عند أول خطأ طباعة. وتغيير
 * الرمز بعد مشاركة الرابط في واتساب يكسر ما شُورك، فالتحذير مكتوب
 * بجانب الحقل لا في وثيقة بعيدة.
 */
export function CourseEditForm({
  courseId,
  initial,
  faculties,
}: {
  courseId: string;
  initial: {
    code: string;
    title: string;
    summary: string;
    description: string;
    facultyId: string;
  };
  faculties: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [form, setForm] = React.useState(initial);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [saved, setSaved] = React.useState(false);

  const codeChanged = form.code.trim().toUpperCase() !== initial.code;

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    const result = await updateCourse({
      courseId,
      code: form.code,
      title: form.title,
      summary: form.summary || undefined,
      description: form.description || undefined,
      facultyId: form.facultyId,
    });

    if (result.ok) {
      setSaved(true);
      router.refresh();
    } else {
      setError(result.message);
    }
    setBusy(false);
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      {error && <FormAlert>{error}</FormAlert>}
      {saved && <FormAlert tone="success">حُفظت بيانات المقرر.</FormAlert>}

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="c-code" className="mb-1.5 block text-[11px] text-muted">
            رمز المقرر
          </label>
          <input
            id="c-code"
            value={form.code}
            onChange={(e) => set("code", e.target.value)}
            className="input-field code text-[13px]"
            required
          />
          {codeChanged && (
            <p className="mt-1.5 text-[11px] leading-[1.7] text-warning">
              الرابط العام يتبع الرمز — سيصير{" "}
              <span className="code">
                /courses/{form.code.trim().toLowerCase()}
              </span>
              ، والرابط القديم يتوقّف.
            </p>
          )}
        </div>

        <div>
          <label htmlFor="c-faculty" className="mb-1.5 block text-[11px] text-muted">
            الكلية
          </label>
          <Select
            id="c-faculty"
            value={form.facultyId}
            onChange={(e) => set("facultyId", e.target.value)}
            required
          >
            {faculties.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div>
        <label htmlFor="c-title" className="mb-1.5 block text-[11px] text-muted">
          عنوان المقرر
        </label>
        <input
          id="c-title"
          value={form.title}
          onChange={(e) => set("title", e.target.value)}
          className="input-field text-[13px]"
          required
        />
      </div>

      <div>
        <label htmlFor="c-summary" className="mb-1.5 block text-[11px] text-muted">
          نبذة قصيرة — تظهر في بطاقة الكتالوج
        </label>
        <input
          id="c-summary"
          value={form.summary}
          onChange={(e) => set("summary", e.target.value)}
          className="input-field text-[13px]"
        />
      </div>

      <div>
        <label htmlFor="c-desc" className="mb-1.5 block text-[11px] text-muted">
          الوصف — يظهر في قاعة الدرس
        </label>
        <Textarea
          id="c-desc"
          rows={3}
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          className="text-[13px]"
        />
      </div>

      <button
        type="submit"
        disabled={busy}
        className="press inline-flex min-h-touch items-center rounded-field bg-action px-5 text-sm font-semibold text-ink disabled:opacity-50"
      >
        {busy ? "جارٍ الحفظ…" : "احفظ التعديلات"}
      </button>
    </form>
  );
}
