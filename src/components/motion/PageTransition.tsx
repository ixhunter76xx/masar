"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { LayoutRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";

import { APP_PAGE, PAGE } from "@/lib/motion";

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
function FrozenRouter({
  children,
  mountedPath,
}: {
  children: React.ReactNode;
  /** المسار الذي رُكِّبت به هذه النسخة — لا يتغيّر لأن `key` هو المسار */
  mountedPath: string;
}) {
  const context = React.useContext(LayoutRouterContext);
  const frozen = React.useRef(context).current;
  const pathname = usePathname();

  /**
   * ⚠ التجميد للنسخة **الخارجة** وحدها.
   *
   * كان التجميد يشمل النسخة الحيّة أيضًا، لأن المرجع يُلتقط مرة واحدة
   * ويبقى ما بقي المفتاح. والمفتاح هو المسار، فهو لا يتبدّل عند
   * `router.refresh()` — أي أن الشجرة تظل تقرأ سياقًا قديمًا وتتجاهل
   * حمولة RSC الجديدة بصمت.
   *
   * الأثر كان أوسع من الحركة بكثير: كل `router.refresh()` في المنصة
   * يتوقف عن التحديث. إضافة سؤال إلى اختبار تنجح على الخادم ولا تظهر،
   * وتأكيد دفع في طابور الإدارة ينجح ولا يظهر — بلا رسالة خطأ في
   * الحالتين، فيبدو الزر معطّلًا وهو يعمل. (شُخِّص هذا سابقًا على أنه
   * أثر CSP في بيئة الاختبار، وهو ليس كذلك: طلب `?_rsc=` يعود 200.)
   *
   * التمييز هنا: النسخة التي مسارُها هو المسار الحالي حيّة فتقرأ
   * السياق مباشرة؛ والنسخة التي بقي مسارها مخالفًا هي الخارجة فتُجمَّد
   * حتى تنتهي حركة خروجها.
   */
  const isExiting = pathname !== mountedPath;

  if (!frozen || !isExiting) return <>{children}</>;
  return (
    <LayoutRouterContext.Provider value={frozen}>
      {children}
    </LayoutRouterContext.Provider>
  );
}

/**
 * انتقال الصفحات: خروج خاطف للأعلى ودخول فوري من الأسفل.
 *
 * `popLayout` يخرج الصفحة القديمة من التخطيط فورًا، فتبدأ الجديدة بلا
 * بوابة انتظار. تبقى نسخة الخروج مجمّدة بسياقها الصحيح حتى تنتهي.
 *
 * المسافة ٦ بكسلات فقط: تكفي ليقرأها المخّ كحركة، ولا تكفي لتبدو
 * كصفحة تقفز. عند تفعيل `prefers-reduced-motion` يُلغي `MotionRoot`
 * الإزاحة ويُبقي التلاشي.
 */
export function PageTransition({
  children,
  stationary = false,
}: {
  children: React.ReactNode;
  /** تلاشي في الموضع نفسه للواجهات ذات الرأس والشريط الجانبي الثابتين */
  stationary?: boolean;
}) {
  const pathname = usePathname();
  const profile = stationary ? APP_PAGE : PAGE;

  return (
    <AnimatePresence mode="popLayout" initial={false}>
      <motion.div
        key={pathname}
        initial={profile.initial}
        animate={{ ...profile.animate, transition: profile.enterTransition }}
        exit={{ ...profile.exit, transition: profile.exitTransition }}
      >
        <FrozenRouter mountedPath={pathname}>{children}</FrozenRouter>
      </motion.div>
    </AnimatePresence>
  );
}
