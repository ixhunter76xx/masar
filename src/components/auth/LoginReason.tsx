"use client";

import { useSearchParams } from "next/navigation";

/**
 * يقول للزائر **لماذا** وجد نفسه هنا.
 *
 * ── العلّة ──────────────────────────────────────────────────────────
 * الضغط على «الدراسة» في مبدّل المنطقتين يقصد `/dashboard`، والحارس
 * يردّ الزائر المجهول بـ`307` إلى `/login?next=%2Fdashboard`. وهو
 * سلوكٌ صحيح ومقصود — لكن صفحة الدخول كانت تستقبله بنموذج أصمّ:
 * لا سطر يقول إنه طُلب منه الدخول، ولا إلى أين سيعود بعده.
 *
 * فمن ضغط «الدراسة» ورأى نموذج دخولٍ بلا تفسير يقرأ الأمر
 * «الزرّ لا يعمل» لا «عليك الدخول أولًا» — وهو بالضبط ما أبلغ به
 * المالك على الهاتف والحاسوب معًا.
 *
 * ── لماذا مكوّن عميل ────────────────────────────────────────────────
 * `useSearchParams` يحتاج العميل، والصفحة تُصيَّر ثابتة. يُلفّ في
 * `Suspense` مثل `LoginForm` تمامًا.
 */

/** وجهات نعرف كيف نسمّيها للمستخدم؛ ما عداها يأخذ نصًّا عامًّا. */
const AREA_LABELS: { test: RegExp; label: string }[] = [
  { test: /^\/dashboard/, label: "منطقة الدراسة" },
  { test: /^\/learn/, label: "منطقة الدراسة" },
  { test: /^\/grades/, label: "درجاتك" },
  { test: /^\/messages/, label: "رسائلك" },
  { test: /^\/orders/, label: "طلباتك" },
  { test: /^\/profile/, label: "ملفّك الشخصي" },
  { test: /^\/settings/, label: "لوحة الإدارة" },
];

export function LoginReason() {
  const next = useSearchParams().get("next");
  if (!next || !next.startsWith("/")) return null;

  const area = AREA_LABELS.find((a) => a.test.test(next))?.label;

  return (
    <p
      role="status"
      className="mb-[1.2rem] rounded-field border border-line-soft bg-[var(--sunk)]
        px-4 py-[0.75rem] text-center text-[12.5px] leading-[1.75] text-subtle"
    >
      {area ? (
        <>
          سجّل الدخول للوصول إلى <span className="text-paper">{area}</span> — ونعيدك
          إليها فور دخولك.
        </>
      ) : (
        <>سجّل الدخول للمتابعة — ونعيدك إلى حيث كنت فور دخولك.</>
      )}
    </p>
  );
}
