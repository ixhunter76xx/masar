"use client";

import * as React from "react";
import Link from "next/link";
import { TriangleAlert, RotateCcw } from "lucide-react";

/**
 * صفحة الخطأ العامة.
 *
 * تحلّ محل صفحة Next الافتراضية الإنجليزية. لا تعرض تفاصيل الخطأ
 * للمستخدم — قد تكشف بنية داخلية — بل معرّف `digest` فقط ليطابقه
 * الدعم الفني بسجلات الخادم.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error("[app] خطأ غير متوقع:", error);
  }, [error]);

  return (
    <main className="grid min-h-dvh place-items-center bg-ink px-4">
      <title>حدث خطأ — مركز حساب</title>
      <div className="w-full max-w-md rounded-[14px] border border-line bg-panel px-6 py-8 text-center">
        <span className="mx-auto grid size-12 place-items-center rounded-full border border-danger/40 bg-ink text-danger">
          <TriangleAlert size={22} strokeWidth={1.75} aria-hidden="true" />
        </span>

        <h1 className="mt-5 text-lg font-bold text-paper">حدث خطأ غير متوقع</h1>
        <p className="mt-2 text-[13px] leading-relaxed text-muted">
          تعذّر إتمام العملية. حاول مرة أخرى، وإن تكرر الخطأ تواصل مع الدعم
          الفني.
        </p>

        {error.digest && (
          <p className="mt-4 rounded-[10px] border border-line bg-ink px-3 py-2 text-[11px] text-subtle">
            رقم الخطأ:{" "}
            <span className="numeric text-muted">{error.digest}</span>
          </p>
        )}

        <div className="mt-6 flex justify-center gap-2">
          <button
            type="button"
            onClick={reset}
            className="inline-flex h-11 items-center gap-2 rounded-[10px] bg-action px-5 text-sm font-medium text-ink transition-colors hover:bg-accent-bright"
          >
            <RotateCcw size={15} strokeWidth={1.75} aria-hidden="true" />
            إعادة المحاولة
          </button>
          <Link
            href="/dashboard"
            className="inline-flex h-11 items-center rounded-[10px] border border-line px-5 text-sm text-muted press hover:border-accent-deep hover:text-paper"
          >
            العودة للرئيسية
          </Link>
        </div>
      </div>
    </main>
  );
}
