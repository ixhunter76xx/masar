"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { setCoursePresenter } from "@/app/(app)/settings/courses/actions";

/**
 * إسناد مقدّم إلى مقرر من صفّه في القائمة.
 *
 * قائمة اختيار لا حقل بحث: المدرّبون قلّة معروفة، وعرضهم كلهم يجعل
 * البدائل والمُسنَد الحالي مقروءَين في نظرة واحدة. والحارس على الخادم
 * في `setCoursePresenter` — هذا مدخل لا قرار.
 */
export function CoursePresenterSelect({
  courseId,
  presenterId,
  courseTitle,
  instructors,
}: {
  courseId: string;
  presenterId: string | null;
  courseTitle: string;
  instructors: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const current = presenterId ?? "";

  async function onChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const next = event.target.value;
    if (next === current) return;

    setBusy(true);
    setError(null);

    const result = await setCoursePresenter(courseId, next || null);
    if (result.ok) {
      router.refresh();
    } else {
      setError(result.message);
      // نُعيد الاختيار إلى المُسنَد الفعلي حتى لا يبدو ما لم يُحفظ محفوظًا
      event.target.value = current;
    }
    setBusy(false);
  }

  return (
    <>
      <label htmlFor={`presenter-${courseId}`} className="sr-only">
        مقدّم {courseTitle}
      </label>
      <select
        id={`presenter-${courseId}`}
        defaultValue={current}
        onChange={onChange}
        disabled={busy}
        className="field-motion min-h-touch rounded-[10px] border border-line bg-ink
          px-2.5 text-[11px] text-paper hover:border-accent-deep
          focus:border-accent focus:outline-none
          disabled:cursor-not-allowed disabled:opacity-60"
      >
        <option value="">— بلا مقدّم —</option>
        {instructors.map((instructor) => (
          <option key={instructor.id} value={instructor.id}>
            {instructor.name}
          </option>
        ))}
      </select>

      {error && (
        <p role="alert" className="basis-full text-[11px] text-danger">
          {error}
        </p>
      )}
    </>
  );
}
