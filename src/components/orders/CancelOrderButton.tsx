"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { cancelMyOrder } from "@/app/(app)/orders/actions";
import { cn } from "@/lib/utils";

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
        className="press relative inline-flex min-h-touch items-center justify-center
          rounded-[10px] px-3 text-xs text-subtle transition-colors
          hover:text-danger disabled:cursor-not-allowed"
      >
        {/*
          ── العرض محجوزٌ لأطول الحالات ────────────────────────────
          النصّ يتبدّل بين ثلاث حالات بأطوالٍ مختلفة («إلغاء الطلب»
          ← «متأكد؟ اضغط للإلغاء»)، فكان الزرّ يقفز عرضًا تحت الإصبع
          في اللحظة نفسها التي يُطلب فيها تأكيدٌ واعٍ. وزرٌّ يتحرّك
          وقت التأكيد يدعو إلى نقرةٍ في غير موضعها.

          الحالات الثلاث مرصوفةٌ في خليّة شبكةٍ واحدة، فالعرض عرضُ
          أطولها دائمًا، والمعروض منها واحدةٌ بالشفافية. لا قفزة،
          ولا حركةَ تخطيطٍ تُحسب.
        */}
        <span className="grid [grid-template-areas:'s']">
          {[
            { key: "idle", text: "إلغاء الطلب", on: !pending && !armed },
            { key: "armed", text: "متأكد؟ اضغط للإلغاء", on: !pending && armed },
            { key: "busy", text: "جارٍ الإلغاء", on: pending },
          ].map((state) => (
            <span
              key={state.key}
              aria-hidden={!state.on}
              className={cn(
                "[grid-area:s] whitespace-nowrap transition-opacity duration-150",
                state.on ? "opacity-100" : "invisible opacity-0",
              )}
            >
              {state.text}
            </span>
          ))}
        </span>
      </button>

      {error && (
        <span role="alert" className="text-[11px] text-danger">
          {error}
        </span>
      )}
    </div>
  );
}
