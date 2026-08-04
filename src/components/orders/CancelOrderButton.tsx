"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { cancelMyOrder } from "@/app/(app)/orders/actions";

/**
 * إلغاء الطلب — بتأكيد داخل الزرّ نفسه لا بنافذة منبثقة.
 *
 * النقرة الأولى تبدّل النصّ إلى «متأكد؟»، والثانية تُنفّذ. أخفّ من
 * حوار كامل لفعلٍ قابل للتكرار (يستطيع الطلب من جديد)، وأأمن من زرّ
 * يُلغي بنقرة واحدة.
 */
export function CancelOrderButton({ number }: { number: string }) {
  const [armed, setArmed] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();
  const router = useRouter();

  function onClick() {
    if (!armed) {
      setArmed(true);
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await cancelMyOrder(number);
      if (result.ok) router.refresh();
      else {
        setError(result.error ?? "تعذّر الإلغاء.");
        setArmed(false);
      }
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={onClick}
        onBlur={() => setArmed(false)}
        disabled={pending}
        className="press inline-flex min-h-touch items-center rounded-[10px] px-3 text-xs
          text-subtle transition-colors hover:text-danger disabled:cursor-not-allowed"
      >
        {pending ? "جارٍ الإلغاء" : armed ? "متأكد؟ اضغط للإلغاء" : "إلغاء الطلب"}
      </button>

      {error && (
        <span role="alert" className="text-[11px] text-danger">
          {error}
        </span>
      )}
    </div>
  );
}
