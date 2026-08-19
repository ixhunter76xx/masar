"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { revokeEnrollment } from "@/app/(app)/settings/students/actions";

/**
 * سحب وصول — بخطوة تأكيد تُسمّي الأثر.
 *
 * السحب يُغلق محتوًى يملكه الطالب الآن، فلا يقع بنقرة واحدة. والسبب
 * مطلوب لأنه ما يجيب سؤال النزاع لاحقًا.
 */
export function RevokeEnrollmentButton({
  enrollmentId,
  label,
}: {
  enrollmentId: string;
  label: string;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [reason, setReason] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="press text-[11px] text-danger hover:underline"
      >
        اسحب الوصول
      </button>
    );
  }

  return (
    <div className="basis-full rounded-field border border-danger/40 bg-danger/5 p-3">
      <p className="mb-2 text-[12px] leading-[1.7] text-paper">
        سيُغلق «{label}» عن الطالب فورًا. السجلّ يبقى محفوظًا — من اشترى ومتى
        وتحت أي طلب — ويمكن منحه ثانيةً بعدها.
      </p>

      {error && <p className="mb-2 text-[11px] text-danger">{error}</p>}

      <input
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="سبب السحب (مطلوب)"
        className="input-field mb-2 text-[12px]"
      />

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={busy || reason.trim().length < 3}
          onClick={async () => {
            setBusy(true);
            setError(null);
            const r = await revokeEnrollment({ enrollmentId, reason });
            if (r.ok) {
              setOpen(false);
              setReason("");
              router.refresh();
            } else {
              setError(r.message);
            }
            setBusy(false);
          }}
          className="press inline-flex min-h-touch items-center rounded-field bg-danger px-4 text-[12px] font-medium text-paper disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? "جارٍ السحب…" : "أكّد السحب"}
        </button>
        <button
          type="button"
          onClick={() => { setOpen(false); setError(null); }}
          className="press text-[12px] text-muted hover:text-paper"
        >
          تراجع
        </button>
      </div>
    </div>
  );
}
