"use client";

import { motion } from "motion/react";

import { DUR, EASE } from "@/lib/motion";

/**
 * حلقة الدرجة — نسبةُ الطالب مرسومةً لا مكتوبةً فقط.
 *
 * ── لماذا حلقة لا شريط ──────────────────────────────────────────────
 * الشريط الأفقي في واجهة عربية يحمل اتجاهًا (من اليمين أو من اليسار)
 * ويجب عكسه، والعكس مصدر أخطاء صامتة. الحلقة بلا اتجاه لغوي: تُقرأ
 * كما هي في الاتجاهين، وتشغل مساحة أقل بجوار الرقم.
 *
 * القوس يُرسم بـ`pathLength` من motion — قيمة معياريّة بين ٠ و١ لا
 * تحتاج حساب محيط الدائرة يدويًا، فتغيير نصف القطر لا يكسر الحركة.
 *
 * الأداء: الحركة على `stroke-dashoffset` داخل SVG — طبقة رسم لا
 * تخطيط، فلا تُعيد حساب موضع أي عنصر في الصفحة.
 *
 * الرقم في المنتصف نصّ عادي يقرؤه قارئ الشاشة؛ الـSVG مخفيّ عنه.
 */
export function ScoreRing({
  percent,
  size = 68,
  children,
}: {
  percent: number;
  size?: number;
  children?: React.ReactNode;
}) {
  const value = Math.max(0, Math.min(100, percent));
  const stroke = 5;
  const r = (size - stroke) / 2;
  const c = size / 2;

  return (
    <span
      className="relative inline-grid shrink-0 place-items-center"
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        aria-hidden="true"
        className="absolute inset-0 -rotate-90"
      >
        <circle
          cx={c}
          cy={c}
          r={r}
          fill="none"
          strokeWidth={stroke}
          className="stroke-line/70"
        />
        <motion.circle
          cx={c}
          cy={c}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          stroke="var(--color-spark)"
          initial={{ pathLength: 0, opacity: 0.4 }}
          whileInView={{ pathLength: value / 100, opacity: 1 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.9, ease: EASE.out, delay: 0.1 }}
          style={{ filter: "drop-shadow(0 0 5px color-mix(in srgb, var(--color-spark) 45%, transparent))" }}
        />
      </svg>

      <motion.span
        className="relative text-[13px] font-semibold text-paper"
        initial={{ opacity: 0, scale: 0.85 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, amount: 0.6 }}
        transition={{ duration: DUR.slow, ease: EASE.out, delay: 0.25 }}
      >
        {children}
      </motion.span>
    </span>
  );
}
