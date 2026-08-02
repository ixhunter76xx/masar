"use client";

import { motion } from "motion/react";

import { STAGGER } from "@/lib/motion";

/**
 * ظهور تسلسلي لعناصر القوائم.
 *
 * العناصر تظهر تباعًا بفارق ٤٥ms بدل أن تهبط دفعة واحدة. الفائدة ليست
 * زينة: التتابع يعطي العين ترتيبًا تقرأ به، ويجعل القائمة الطويلة
 * تبدو أنها تُبنى أمامك لا أنها ظهرت فجأة.
 *
 * ── لماذا مكوّنان لا مكوّن واحد يلفّ الأبناء ─────────────────────────
 * لو لفّ المكوّن كل ابن في `div` لكسر بنية `ol > li`، وهي دلالة
 * وصولية حقيقية: قارئ الشاشة يُعلن "قائمة من ٥ عناصر". فالحاوية
 * والعنصر مكوّنان منفصلان يحلّان محلّ الوسمين الأصليين مباشرة بلا
 * إضافة أي عقدة في الشجرة.
 * ─────────────────────────────────────────────────────────────────────
 *
 * `MotionRoot` يُلغي إزاحة العناصر عند `prefers-reduced-motion`
 * ويُبقي التلاشي، فيبقى التتابع مقروءًا بلا حركة.
 */
export function StaggerList({
  children,
  className,
  as = "ol",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "ol" | "ul" | "div";
}) {
  const Component = motion[as];
  return (
    <Component
      className={className}
      variants={STAGGER.container}
      initial="hidden"
      animate="show"
    >
      {children}
    </Component>
  );
}

export function StaggerItem({
  children,
  className,
  as = "li",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "li" | "div";
}) {
  const Component = motion[as];
  return (
    <Component className={className} variants={STAGGER.item}>
      {children}
    </Component>
  );
}
