"use client";

import { MotionConfig } from "motion/react";

/**
 * جذر الحركة — يلفّ التطبيق كله.
 *
 * `reducedMotion="user"` يجعل motion يقرأ `prefers-reduced-motion` من
 * النظام ويُلغي تلقائيًا كل حركات التحويل (المسافة، الحجم، الدوران)
 * في كل مكوّن تحته، ويُبقي تلاشي الشفافية فقط. هذا يغطّي الحركة
 * المكتوبة بـ motion، بينما تغطّي كتلة `@media` في `globals.css`
 * الحركة المكتوبة بـ CSS. الاثنتان معًا تغطّيان المنصة كاملة.
 *
 * لا يُضبط على "always" ولا "never": القرار للمستخدم لا لنا.
 */
export function MotionRoot({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
