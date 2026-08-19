"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { setFacultyVisible } from "@/app/(app)/settings/faculties/actions";

/**
 * إظهار محطّة كلية في الكتالوج أو إخفاؤها.
 *
 * الرفض يُعرَض بجانب الضابط لا في تنبيه عائم: سببه محدَّد (الكلية تحمل
 * مقررًا منشورًا) وعلاجه في الشاشة نفسها.
 */
export function FacultyVisibilityToggle({
  facultyId,
  isVisible,
  name,
}: {
  facultyId: string;
  isVisible: boolean;
  name: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  return (
    <>
      <button
        type="button"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setError(null);
          const r = await setFacultyVisible(facultyId, !isVisible);
          if (r.ok) router.refresh();
          else setError(r.message);
          setBusy(false);
        }}
        aria-pressed={isVisible}
        className={
          "press inline-flex min-h-touch items-center rounded-field border px-4 text-[12px] " +
          (isVisible
            ? "border-line text-muted hover:border-accent-deep hover:text-paper"
            : "border-accent-deep/60 bg-[var(--sunk)] text-accent")
        }
      >
        {busy ? "…" : isVisible ? "إخفاء المحطة" : "إظهار المحطة"}
      </button>

      {error && (
        <p role="alert" className="basis-full text-[11px] leading-[1.7] text-danger">
          {error}
        </p>
      )}
      <span className="sr-only">{name}</span>
    </>
  );
}
