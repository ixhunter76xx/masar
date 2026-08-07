"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { setCoursePublished } from "@/app/(app)/settings/courses/actions";

/**
 * نشر مقرر أو سحبه من الكتالوج.
 *
 * الخطأ يُعرض بجانب الزرّ لا يُبتلع: أشهر سببٍ للرفض هو محاولة نشر
 * مقرر بلا باقة، وهي حالة يحتاج المدير أن يقرأها ليعرف ما ينقصه.
 */
export function CoursePublishToggle({
  courseId,
  isPublished,
}: {
  courseId: string;
  isPublished: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onClick() {
    setBusy(true);
    setError(null);

    const result = await setCoursePublished(courseId, !isPublished);
    if (result.ok) router.refresh();
    else setError(result.message);

    setBusy(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={onClick}
        disabled={busy}
        className="press inline-flex min-h-touch items-center rounded-[10px]
          border border-line bg-ink px-3 text-xs text-paper
          transition-colors hover:border-accent-deep disabled:cursor-not-allowed"
      >
        {isPublished ? "سحب من الكتالوج" : "نشر"}
      </button>

      {error && (
        <p role="alert" className="basis-full text-[11px] text-danger">
          {error}
        </p>
      )}
    </>
  );
}
