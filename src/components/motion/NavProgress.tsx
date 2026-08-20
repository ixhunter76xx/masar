"use client";

import * as React from "react";

import {
  getNavServerSnapshot,
  getNavSnapshot,
  subscribeNav,
} from "@/lib/nav-progress";

/** لا يظهر شريطٌ لتنقّلةٍ أسرع منه — التنقّلة المُسبَّقة تصل قبل هذا */
const ARM_MS = 130;
/** الزحف حتى ٧٨٪: منحنى `ease-out` وحده يبطئ كلّما اقترب، بلا مؤقّتات */
const CREEP_MS = 2200;
const CREEP_TO = 0.78;
/** الإكمال بعد وصول البيانات — خاطف، فهو تأكيدٌ لا انتظار */
const DONE_MS = 170;
const FADE_MS = 260;

/**
 * ══ شريط تقدّم التنقّل ══════════════════════════════════════════════
 *
 * خيطٌ بسُمك ٢px أعلى النافذة يقول «طلبك قيد التنفيذ» طوال ما بين
 * النقرة ووصول الصفحة. مصدره عدّاد `nav-progress` الذي تغذّيه
 * `LinkPending` من داخل كل رابط.
 *
 * ── لماذا `scaleX` لا `width` ───────────────────────────────────────
 * `width` يعيد التخطيط في كل إطار طوال ثانيةٍ ونصف — وهو بالضبط
 * الصنف الذي أزالته جولة الأداء من المنصّة كلّها. `scaleX` يعمل على
 * المركّب وحده.
 *
 * ── ولماذا انتقالان لا حلقة رسم ─────────────────────────────────────
 * «الزحف» ليس محاكاةً لتقدّمٍ حقيقيّ — لا أحد يعرف كم بقي. فهو انتقالٌ
 * واحد إلى ٧٨٪ بمنحنى `--ease-out`: ينطلق سريعًا ثم يبطئ حتى يكاد
 * يقف. أي أن الشكل المطلوب يخرج من المنحنى نفسه، بلا `requestAnimationFrame`
 * ولا سلسلة مؤقّتات تتراكم إن تداخلت تنقّلتان.
 *
 * ── ولماذا الكتابة على DOM مباشرةً ──────────────────────────────────
 * الشريط زخرفةٌ خالصة لا يقرؤها أحد ولا تشتقّ منها حالة. وتمثيل آلته
 * بحالة React كان يعني إعادة تصييرٍ لكل مرحلة، وسباقًا بين المؤقّت
 * والتصيير عند تداخل تنقّلتين. العنصر مركَّبٌ دائمًا، وما يتبدّل ثلاث
 * خصائص أسلوبٍ عليه.
 *
 * ── الاتجاه ─────────────────────────────────────────────────────────
 * ينمو من **بداية السطر**: يمينًا في RTL. و`transform-origin` لا يقبل
 * الكلمات المنطقية، فالقاعدة في `globals.css` مشروطة بـ`[dir]`.
 *
 * ── الحركة المخفَّضة — مقيسةٌ لا مفترضة ─────────────────────────────
 * كتلة `@media` في `globals.css` تفرض بـ`!important` قائمةَ خصائص
 * انتقالٍ **لا `transform` فيها**، ومدّةً قدرها `--dur-fast`. والمقيس
 * في المتصفّح عند `prefers-reduced-motion: reduce`:
 *
 *   transition-property: opacity, color, background-color, …
 *   transition-duration: 0.15s
 *
 * فالنتيجة أن الشريط **لا يزحف**: يظهر عند ٧٨٪ مباشرةً، ثم يقفز إلى
 * المئة عند الوصول، ويتلاشى. وهذا هو الصواب لا نقصٌ فيه — الزحف
 * حركةٌ أفقية مستمرّة، وهي أوّل ما يُطلب إسقاطه. أمّا **الخبر** —
 * «نقرتك وصلت، والصفحة قادمة» — فيبقى كاملًا بالشفافية وحدها.
 *
 * ولذلك لا يُخفى الشريط عند تخفيض الحركة: إخفاؤه يحرم من طلب حركةً
 * أقلّ من الإشارة الوحيدة إلى أن نقرته سُمعت.
 * ═══════════════════════════════════════════════════════════════════
 */
export function NavProgress() {
  const running = React.useSyncExternalStore(
    subscribeNav,
    getNavSnapshot,
    getNavServerSnapshot,
  );
  const busy = running > 0;
  const barRef = React.useRef<HTMLDivElement>(null);
  /** هل الشريط ظاهرٌ الآن؟ مرجعٌ لا حالة — لئلّا يُعاد تشغيل التأثير */
  const shownRef = React.useRef(false);

  React.useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;

    const timers: number[] = [];
    const clearAll = () => timers.forEach(window.clearTimeout);

    if (busy) {
      /* التسلّح: إن وصلت الصفحة قبل انقضاء هذه المهلة لم يظهر شيء */
      timers.push(
        window.setTimeout(() => {
          shownRef.current = true;
          bar.style.transitionDuration = `${CREEP_MS}ms, ${FADE_MS}ms`;
          bar.style.opacity = "1";
          bar.style.transform = `scaleX(${CREEP_TO})`;
        }, ARM_MS),
      );
      return clearAll;
    }

    if (!shownRef.current) return;
    shownRef.current = false;

    bar.style.transitionDuration = `${DONE_MS}ms, ${FADE_MS}ms`;
    bar.style.transform = "scaleX(1)";

    /**
     * ── الرجوع إلى الصفر يُعلَّق على انتهاء التلاشي فعلًا ────────────
     *
     * ⚠ كان مؤقّتًا ثانيًا مدّته `DONE_MS + FADE_MS`، وكان ذلك خطأً
     * مقيسًا لا نظريًّا. سببان يجعلان المؤقّت يكذب:
     *
     * ١ · **الازدحام يجمع المؤقّتين.** بخنق معالجٍ ٢٠× قِيسَ أن كتابة
     *     الشفافية (‏١٧٠ms) وإعادة التصفير (‏٤٣٠ms) وقعتا في اللحظة
     *     نفسها ‏٢٦٢٦ms: فانكمش الخيط إلى الصفر **وهو ما يزال ظاهرًا
     *     تمامًا**، ثم تلاشى. أي أنه انسحب أمام العين — وهو بالضبط
     *     ما كُتب المؤقّت لتفاديه. والازدحام ليس حالةً نادرة هنا؛ هو
     *     الحالة التي يظهر فيها الشريط أصلًا.
     *
     * ٢ · **`FADE_MS` نفسه لا يطابق الواقع عند تخفيض الحركة.** كتلة
     *     `@media` في `globals.css` تفرض `transition-duration:
     *     var(--dur-fast)` بـ`!important`، أي ‏١٥٠ms لا ‏٢٦٠ms. فأي
     *     رقمٍ مكتوبٍ في جافاسكربت يخمّن مدّةً يملكها CSS.
     *
     * و`transitionend` يعرف متى انتهى التلاشي حقًّا، مهما كانت المدّة
     * ومهما ازدحم الخيط الرئيسي. والمهلة الاحتياطية أطول من كليهما،
     * فلا تسبق الحدث أبدًا — وهي للحالة التي لا يُطلق فيها الحدث
     * أصلًا (الشفافية صفرٌ سلفًا، أو التبويب مخفيّ).
     */
    const reset = () => {
      bar.style.transitionDuration = "0ms";
      bar.style.transform = "scaleX(0)";
    };
    const onFaded = (event: TransitionEvent) => {
      if (event.propertyName !== "opacity" || bar.style.opacity !== "0") return;
      bar.removeEventListener("transitionend", onFaded);
      reset();
    };

    timers.push(
      window.setTimeout(() => {
        bar.addEventListener("transitionend", onFaded);
        bar.style.opacity = "0";
      }, DONE_MS),
      window.setTimeout(() => {
        bar.removeEventListener("transitionend", onFaded);
        reset();
      }, DONE_MS + FADE_MS + 600),
    );

    return () => {
      clearAll();
      bar.removeEventListener("transitionend", onFaded);
    };
  }, [busy]);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-[2px]"
    >
      <div
        ref={barRef}
        className="nav-progress h-full w-full opacity-0
          bg-[linear-gradient(to_left,var(--color-accent-deep),var(--color-accent-bright))]
          shadow-[0_0_10px_-1px_var(--glow)]"
        style={{
          transform: "scaleX(0)",
          transitionProperty: "transform, opacity",
          transitionTimingFunction: "var(--ease-out)",
          transitionDuration: "0ms, 0ms",
        }}
      />
    </div>
  );
}
