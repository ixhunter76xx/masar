"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import {
  renameFaculty,
  setFacultyVisible,
} from "@/app/(app)/settings/faculties/actions";
import { countedPhrase, COURSE_FORMS } from "@/lib/numerals";

/**
 * صفّ كلية — إعادة تسمية وإظهار/إخفاء في مكان واحد.
 *
 * الاسم يُحرَّر في مكانه لا في نموذج منفصل: تغيير اسم كلية عملٌ نادر
 * وصغير، ونقلُه إلى شاشة أخرى يجعل الشاشتين أكبر من العمل نفسه.
 */
export function FacultyRow({
  id,
  name,
  slug,
  isVisible,
  courseCount,
  notOfferedLabel,
}: {
  id: string;
  name: string;
  slug: string;
  isVisible: boolean;
  courseCount: number;
  notOfferedLabel: string;
}) {
  const router = useRouter();
  const [editing, setEditing] = React.useState(false);
  const [value, setValue] = React.useState(name);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function run(fn: () => Promise<{ ok: boolean; message?: string }>) {
    setBusy(true);
    setError(null);
    const r = await fn();
    if (r.ok) {
      setEditing(false);
      router.refresh();
    } else {
      setError(r.message ?? "تعذّر الحفظ.");
    }
    setBusy(false);
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="min-w-0 flex-1">
        {editing ? (
          <div className="flex flex-wrap items-center gap-2">
            <label htmlFor={`fac-${id}`} className="sr-only">
              اسم {name}
            </label>
            <input
              id={`fac-${id}`}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="input-field max-w-[16rem] text-[13px]"
            />
            <button
              type="button"
              disabled={busy}
              onClick={() => run(() => renameFaculty(id, value))}
              className="press tap-44 text-[12px] text-accent hover:underline disabled:opacity-50"
            >
              حفظ
            </button>
            <button
              type="button"
              onClick={() => { setEditing(false); setValue(name); setError(null); }}
              className="press tap-44 text-[12px] text-muted hover:text-paper"
            >
              تراجع
            </button>
          </div>
        ) : (
          <>
            <p className="text-[13px] text-paper">
              {name}
              {!isVisible && (
                <span className="ms-2 rounded-full border border-warning/50 px-2 py-0.5 text-[10px] text-warning">
                  مخفيّة
                </span>
              )}
            </p>
            <p className="mt-0.5 text-[11px] text-subtle">
              <span className="code">{slug}</span>
              {" · "}
              {courseCount > 0 ? countedPhrase(courseCount, COURSE_FORMS) : notOfferedLabel}
            </p>
          </>
        )}

        {error && (
          <p role="alert" className="mt-1 text-[11px] leading-[1.7] text-danger">
            {error}
          </p>
        )}
      </div>

      {!editing && (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="press inline-flex min-h-touch items-center rounded-field border border-line px-3 text-[12px] text-muted hover:border-accent-deep hover:text-paper"
          >
            إعادة تسمية
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => run(() => setFacultyVisible(id, !isVisible))}
            aria-pressed={isVisible}
            className={
              "press inline-flex min-h-touch items-center rounded-field border px-3 text-[12px] disabled:opacity-50 " +
              (isVisible
                ? "border-line text-muted hover:border-accent-deep hover:text-paper"
                : "border-accent-deep/60 bg-[var(--sunk)] text-accent")
            }
          >
            {busy ? "…" : isVisible ? "إخفاء" : "إظهار"}
          </button>
        </div>
      )}
    </div>
  );
}
