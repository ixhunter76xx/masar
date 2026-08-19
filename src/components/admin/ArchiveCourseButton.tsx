"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { setCourseArchived } from "@/app/(app)/settings/courses/actions";

/**
 * أرشفة مقرر — بخطوة تأكيد تُسمّي الأثر، لأنها تُخفي منتجًا من السوق.
 *
 * ولا يوجد «حذف» في هذه الشاشة عمدًا: حذف المقرر يُسقط باقاته، وسقوطها
 * يقطع بنود الطلبات عن منتجاتها ويُتلف ما تفتحه التسجيلات — أي يمحو
 * سجلّ من اشترى ماذا وبكم. الأرشفة تُحقّق الغرض نفسه بلا تلف.
 */
export function ArchiveCourseButton({
  courseId,
  title,
  archived,
}: {
  courseId: string;
  title: string;
  archived: boolean;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = React.useState(false);
  const [busy, setBusy] = React.useState(false);

  async function run(next: boolean) {
    setBusy(true);
    await setCourseArchived(courseId, next);
    setBusy(false);
    setConfirming(false);
    router.refresh();
  }

  if (archived) {
    return (
      <button
        type="button"
        disabled={busy}
        onClick={() => run(false)}
        className="press inline-flex min-h-touch items-center rounded-field border border-line px-3 text-xs text-muted hover:border-accent-deep hover:text-paper"
      >
        {busy ? "…" : "استعادة"}
      </button>
    );
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="press inline-flex min-h-touch items-center rounded-field border border-line px-3 text-xs text-muted hover:border-danger/60 hover:text-danger"
      >
        أرشفة
      </button>
    );
  }

  return (
    <span className="inline-flex flex-wrap items-center gap-2 rounded-field border border-danger/40 bg-danger/5 px-3 py-2">
      <span className="text-[11px] leading-[1.6] text-paper">
        يُخفى «{title}» من الكتالوج ومن هذه القائمة، ويُلغى نشره. الطلبات
        والتسجيلات تبقى كما هي.
      </span>
      <button
        type="button"
        disabled={busy}
        onClick={() => run(true)}
        className="press inline-flex min-h-touch items-center rounded-field bg-danger px-3 text-[12px] font-medium text-paper disabled:opacity-50"
      >
        {busy ? "…" : "أكّد الأرشفة"}
      </button>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        className="press tap-44 text-[12px] text-muted hover:text-paper"
      >
        تراجع
      </button>
    </span>
  );
}
