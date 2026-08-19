"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { createFaculty } from "@/app/(app)/settings/faculties/actions";
import { FormAlert } from "@/components/ui/FormAlert";

/** إضافة كلية جديدة — السَّلَك اختياري ويُشتقّ من الاسم إن تُرك فارغًا. */
export function CreateFacultyForm() {
  const router = useRouter();
  const [name, setName] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [done, setDone] = React.useState(false);

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError(null);
        setDone(false);
        const r = await createFaculty({ name, slug: slug || undefined });
        if (r.ok) {
          setName("");
          setSlug("");
          setDone(true);
          router.refresh();
        } else {
          setError(r.message);
        }
        setBusy(false);
      }}
      className="space-y-3"
    >
      {error && <FormAlert>{error}</FormAlert>}
      {done && <FormAlert tone="success">أُضيفت الكلية.</FormAlert>}

      <div className="grid gap-3 sm:grid-cols-[1fr_12rem]">
        <div>
          <label htmlFor="fac-name" className="mb-1.5 block text-[11px] text-muted">
            اسم الكلية
          </label>
          <input
            id="fac-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="كلية الحقوق"
            required
            className="input-field text-[13px]"
          />
        </div>
        <div>
          <label htmlFor="fac-slug" className="mb-1.5 block text-[11px] text-muted">
            السَّلَك (اختياري)
          </label>
          <input
            id="fac-slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="law"
            className="input-field code text-[13px]"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={busy || name.trim().length < 2}
        className="press inline-flex min-h-touch items-center rounded-field bg-action px-5 text-sm font-semibold text-ink disabled:opacity-50"
      >
        {busy ? "جارٍ الإضافة…" : "أضِف الكلية"}
      </button>
    </form>
  );
}
