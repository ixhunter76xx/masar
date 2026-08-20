"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { LayoutRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";

import { APP_PAGE, PAGE, appPageTransitionKey } from "@/lib/motion";

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
  mountedKey,
  stationary,
}: {
  children: React.ReactNode;
  /** مفتاح النسخة؛ قد يجمع مسارات تبويبات تشترك في التخطيط نفسه */
  mountedKey: string;
  stationary: boolean;
}) {
  const context = React.useContext(LayoutRouterContext);
  const frozen = React.useRef(context);
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
  const currentKey = stationary ? appPageTransitionKey(pathname) : pathname;
  const isExiting = currentKey !== mountedKey;

  /* حين يبقى المفتاح حيًّا — بما فيه تبديل تبويب أو router.refresh —
     نحدّث آخر سياق سليم. وعند الخروج نجمّد هذه النسخة الأخيرة تحديدًا،
     لا سياق أول تبويب فُتح في المقرر. */
  if (!isExiting) {
    frozen.current = context;
    return <>{children}</>;
  }

  if (!frozen.current) return <>{children}</>;
  return (
    <LayoutRouterContext.Provider value={frozen.current}>
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
  const transitionKey = stationary
    ? appPageTransitionKey(pathname)
    : pathname;

  /**
   * ⚠ **`popLayout` لا يتعايش مع حدّ Suspense — والعطل صامت.**
   *
   * `popLayout` يلفّ كل ابن في `PopChild`، وهو مكوّن يقيس العنصر ويثبّت
   * موضعه. وحين يكون تحته حدّ Suspense — وهو ما يُنشئه `loading.tsx` —
   * **لا تُرطَّب الشجرة كلها**: لا خطأ في السجلّ، ولا رسالة في المتصفّح،
   * ولا فشل في البناء. الصفحة تُرسَم من الخادم كاملةً وتبدو سليمة،
   * ثم لا يعمل فيها زرّ ولا حقل ولا `useEffect` واحد.
   *
   * وهذا ما شلّ المنطقة المحمية كلها: `(app)/loading.tsx` موجود،
   * والمنطقة العامّة نجت لأنها بلا `loading.tsx`. عُزل السبب بالتجريب:
   *
   *   loading.tsx وحده            → يُرطَّب ✓
   *   popLayout وحده (العامّة)     → يُرطَّب ✓
   *   الاثنان معًا                 → لا ترطيب ✗
   *
   * ولذلك بقيت المنطقة المحمية بعيدةً عنه. وكانت تأخذ `wait` بديلًا،
   * ثم تبيّن أن `wait` نفسه يجمّدها على محتوًى قديم — انظر أدناه.
   */

  /**
   * ── ⚠ المنطقة المحمية بلا `AnimatePresence` — وهذا إصلاح عطل ──────
   *
   * كان `mode="wait"` هنا، وهو **يجمّد الشاشة على محتوًى قديم** عند
   * التنقّل السريع. مقيسٌ ٤ من ٤ محاولات: نقراتٌ متتابعة بين
   * «الإعدادات» و«مقرراتي» تنتهي بالمسار `/learn` بينما الشاشة تعرض
   * شريط تبويبات الإدارة ومحتواها. وهو بلاغ المالك حرفيًّا: «محتوى
   * مقرراتي لم يظهر في الشاشة أمامي».
   *
   * والآلية: `wait` يُبقي النسخة الخارجة حتى تُعلن انتهاء خروجها. وحين
   * يتبدّل المفتاح ثانيةً قبل ذلك — أو حين يعلّق حدُّ Suspense تحتها
   * (`loading.tsx`) إعلانَ الانتهاء — لا يُركَّب الابن الجديد أبدًا.
   * فيبقى الابن القديم، و`FrozenRouter` يؤدّي عمله بأمانة: يرى مفتاحه
   * مخالفًا للمسار فيحكم أنه «خارج»، ويخدمه سياقَه المجمَّد. النتيجة
   * صفحةٌ كاملة قديمة تحت عنوانٍ جديد، بلا خطأ في أي سجلّ.
   *
   * ── ولماذا الحذف هو العلاج لا التبديل ───────────────────────────
   * `APP_PAGE.exitTransition` مدّته **صفر** عمدًا (انظر تعليلها هناك).
   * فلا خروجَ يُنتظَر أصلًا — أي أن `AnimatePresence` هنا لا تشتري
   * شيئًا وتدفع ثمن آلة انتظارٍ كاملة. وبحذفها يفكّ React النسخة
   * القديمة في اللحظة نفسها، ويبقى الدخول كما هو: `key` جديد يعني
   * نسخةً جديدة تبدأ من `initial` وتتحرّك إلى `animate`.
   *
   * ولا يُستبدل بـ`popLayout`: ذاك يقتل الترطيب صامتًا تحت حدّ
   * Suspense كما في الكتلة أعلاه. وتبقى العامّة عليه كما صُمّمت —
   * لا `loading.tsx` تحتها، وخروجها له زمن فعليّ يستفيد منه.
   */
  if (stationary) {
    return (
      <motion.div
        key={transitionKey}
        initial={profile.initial}
        animate={{ ...profile.animate, transition: profile.enterTransition }}
      >
        <FrozenRouter mountedKey={transitionKey} stationary>
          {children}
        </FrozenRouter>
      </motion.div>
    );
  }

  return (
    <AnimatePresence mode="popLayout" initial={false}>
      <motion.div
        key={transitionKey}
        initial={profile.initial}
        animate={{ ...profile.animate, transition: profile.enterTransition }}
        exit={{ ...profile.exit, transition: profile.exitTransition }}
      >
        <FrozenRouter mountedKey={transitionKey} stationary={stationary}>
          {children}
        </FrozenRouter>
      </motion.div>
    </AnimatePresence>
  );
}
