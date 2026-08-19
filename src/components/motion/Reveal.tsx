"use client";

import { motion } from "motion/react";

import { DUR, EASE } from "@/lib/motion";

/**
 * ظهور القسم عند بلوغه بالتمرير.
 *
 * ── لماذا لا يكفي `StaggerList` ──────────────────────────────────────
 * `StaggerList` يشتغل مرة واحدة عند تركيب المكوّن، أي أن كل ما تحت
 * الطيّة يكون قد "ظهر" قبل أن تراه العين. فالصفحة الطويلة تتحرّك في
 * أعلاها فقط ثم تسكن تمامًا — وهو ما يجعلها تبدو جامدة رغم وجود حركة.
 *
 * هنا الحركة مربوطة بالرؤية لا بالتركيب: القسم يظهر حين يدخل الإطار.
 *
 * `once` مقصود: التكرار كلما مرّ القسم يحوّل التمرير إلى استعراض.
 * و`amount: 0.15` يبدأ الحركة عند ظهور سُبع القسم تقريبًا، فتكتمل
 * قبل أن يصل مركز النظر إليه بدل أن تبدأ متأخّرة فتبدو كتقطيع.
 *
 * `prefers-reduced-motion` يُلغي الإزاحة ويُبقي التلاشي — motion يقرأ
 * التفضيل بنفسه عبر `MotionConfig` في `MotionRoot`.
 */
export function Reveal({
  children,
  className,
  delay = 0,
  as = "div",
}: {
  children: React.ReactNode;
  className?: string;
  /** تأخير بالثواني — لترتيب قسمين متجاورين */
  delay?: number;
  as?: "div" | "section" | "li";
}) {
  const Component = motion[as];
  return (
    <Component
      className={className}
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: DUR.slow, ease: EASE.out, delay }}
    >
      {children}
    </Component>
  );
}
