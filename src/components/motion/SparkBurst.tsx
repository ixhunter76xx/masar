"use client";

import { motion } from "motion/react";

import { EASE } from "@/lib/motion";

/**
 * الاحتفال البصري عند إنجاز — حلقة تتمدّد وشُعاعات تنطلق مرة واحدة.
 *
 * ── لماذا لا قصاصات ورق (confetti) ──────────────────────────────────
 * القصاصات لغة عامة تراها في كل تطبيق، ولا تقول شيئًا عن «مسار».
 * هنا الاحتفال من نفس مفردات المنصة: الشرارة تنطلق من العقدة كما
 * تنطلق على السكّة — أي أن الاحتفال جزء من الطريق لا زينة فوقه.
 *
 * يعمل مرة واحدة عند التركيب ثم يختفي، ولا يعترض النقر (`pointer-events`)،
 * ولا يُعلَن لقارئ الشاشة: النتيجة نفسها مكتوبة نصًّا بجواره.
 *
 * الأداء: `scale` و`opacity` فقط، على ٩ عناصر تختفي بعد ٩٠٠ms.
 */
export function SparkBurst({ size = 44 }: { size?: number }) {
  const rays = Array.from({ length: 8 }, (_, i) => (i * 360) / 8);

  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute start-0 top-1/2 -translate-y-1/2"
      style={{ width: size, height: size }}
    >
      {/* الحلقة: تتمدّد وتتلاشى */}
      <motion.span
        className="absolute inset-0 rounded-full border-2 border-spark"
        initial={{ scale: 0.35, opacity: 0.9 }}
        animate={{ scale: 2.1, opacity: 0 }}
        transition={{ duration: 0.75, ease: EASE.out }}
      />

      {/* الشعاعات: تنطلق للخارج ثم تنطفئ */}
      {rays.map((deg) => (
        <motion.span
          key={deg}
          className="absolute start-1/2 top-1/2 h-[2px] w-[7px] rounded-full bg-spark"
          style={{ rotate: `${deg}deg`, transformOrigin: "0% 50%" }}
          initial={{ scaleX: 0, opacity: 0, x: size * 0.16 }}
          animate={{ scaleX: [0, 1, 0.2], opacity: [0, 1, 0], x: size * 0.62 }}
          transition={{ duration: 0.62, ease: EASE.out, delay: 0.04 }}
        />
      ))}
    </span>
  );
}
