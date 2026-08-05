"use client";

import * as React from "react";
import { ArrowLeft, Loader2 } from "lucide-react";

import { requestPurchase } from "@/app/(app)/orders/actions";
import { cn } from "@/lib/utils";

/**
 * زرّ «طلب الدورة».
 *
 * ── لماذا ليس زرّ دفع ────────────────────────────────────────────────
 * لا بوابة دفع في هذه المرحلة: الطلب يُنشأ معلّقًا ويُتمّ الدفع في
 * محادثة واتساب. تسميته «شراء» أو «ادفع الآن» تَعِد بصفحة دفعٍ لن
 * تأتي، فينتظرها الطالب ثم يظنّ أن شيئًا تعطّل.
 *
 * الإجراء نفسه يتكفّل بالزائر غير المسجَّل: يحوّله إلى التسجيل حاملًا
 * وجهة العودة، فلا نحتاج فحص جلسة هنا — والفحص على الخادم أصدق.
 */
export function BuyButton({
  courseSlug,
  productSlug,
  best,
  label = "طلب الدورة",
}: {
  courseSlug: string;
  productSlug: string;
  best: boolean;
  /**
   * نصّ الزر. الافتراضي عامّ، والصفحة تمرّر اسم الدورة.
   *
   * ثلاثة أزرار متجاورة تحمل «طلب الدورة» نفسها لا تُميَّز إلا بموضعها
   * — وهو تمييز يضيع على قارئ الشاشة وعلى من يمسح الصفحة بعينه.
   */
  label?: string;
}) {
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  function onClick() {
    setError(null);
    startTransition(async () => {
      /* عند النجاح يرمي الإجراء تحويلًا فلا يعود بقيمة */
      const result = await requestPurchase(courseSlug, productSlug);
      if (result && !result.ok) setError(result.error);
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        aria-describedby={error ? `buy-error-${productSlug}` : undefined}
        className={cn(
          "press mt-5 flex min-h-touch w-full items-center justify-center gap-2 rounded-[10px] text-sm font-medium",
          "disabled:cursor-not-allowed disabled:opacity-70",
          best
            ? "text-ink shadow-[inset_0_1px_0_rgba(255,255,255,0.075),0_1px_2px_rgba(0,0,0,0.35)] [background:linear-gradient(180deg,var(--color-accent-bright),var(--color-action))] hover:[background:linear-gradient(180deg,#bcd4e3,var(--color-accent-bright))]"
            : "border border-line bg-panel text-paper hover:border-accent-deep hover:bg-[#16212d]",
        )}
      >
        {pending ? (
          <>
            <Loader2 size={15} className="animate-spin" aria-hidden="true" />
            جارٍ إنشاء الطلب
          </>
        ) : (
          <>
            {label}
            {best && <ArrowLeft size={15} strokeWidth={2} aria-hidden="true" />}
          </>
        )}
      </button>

      {error && (
        <p
          id={`buy-error-${productSlug}`}
          role="alert"
          className="mt-2 text-[11px] leading-relaxed text-danger"
        >
          {error}
        </p>
      )}
    </>
  );
}
