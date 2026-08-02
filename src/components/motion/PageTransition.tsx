"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { LayoutRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";

import { PAGE } from "@/lib/motion";

/**
 * تجميد الموجّه أثناء الخروج.
 *
 * ── المشكلة التي يحلّها ──────────────────────────────────────────────
 * في App Router لا يمرّ محتوى الصفحة عبر خاصية تتبدّل، بل يُحقن من
 * سياق `LayoutRouterContext`. فعند التنقّل يُحدَّث السياق فورًا، ويُعاد
 * تصيير الشجرة **الخارجة** بمحتوى الصفحة **الجديدة**. النتيجة: تراه
 * يومض بالمحتوى الجديد ثم يختفي — وهو أسوأ من غياب الحركة أصلًا.
 *
 * الحل: نلتقط قيمة السياق عند أول تركيب لهذا المفتاح ونُثبّتها. تبقى
 * الشجرة الخارجة تعرض محتواها الأصلي حتى تنتهي حركة خروجها.
 *
 * الاستيراد من `next/dist/...` مقصود وواعٍ: لا يوجد بديل عام لهذا
 * السياق. إن كسره تحديث لاحق لـ Next سيفشل البناء بخطأ استيراد واضح،
 * لا بسلوك صامت — وحينها احذف هذا الغلاف وستبقى حركة الدخول تعمل.
 * ─────────────────────────────────────────────────────────────────────
 */
function FrozenRouter({ children }: { children: React.ReactNode }) {
  const context = React.useContext(LayoutRouterContext);
  const frozen = React.useRef(context).current;

  if (!frozen) return <>{children}</>;
  return (
    <LayoutRouterContext.Provider value={frozen}>
      {children}
    </LayoutRouterContext.Provider>
  );
}

/**
 * انتقال الصفحات: خروج قصير للأعلى ثم دخول من الأسفل.
 *
 * الخروج (١٦٠ms) أقصر من الدخول (٣٢٠ms) عمدًا — الخروج تنظيف والدخول
 * هو ما ينبغي أن يُلاحَظ. و`mode="wait"` يمنع تراكب الصفحتين.
 *
 * المسافة ١٠ بكسل فقط: تكفي ليقرأها المخّ كحركة، ولا تكفي لتبدو
 * كصفحة تقفز. عند تفعيل `prefers-reduced-motion` يُلغي `MotionRoot`
 * الإزاحة ويُبقي التلاشي.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={PAGE.initial}
        animate={{ ...PAGE.animate, transition: PAGE.enterTransition }}
        exit={{ ...PAGE.exit, transition: PAGE.exitTransition }}
      >
        <FrozenRouter>{children}</FrozenRouter>
      </motion.div>
    </AnimatePresence>
  );
}
