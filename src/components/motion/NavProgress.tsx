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
 * ── الحركة المخفَّضة ────────────────────────────────────────────────
 * لا يُستثنى: كتلة `@media` في `globals.css` تُقصّر مدد الحركة لا
 * الانتقالات، والشريط انتقالٌ محض. وهو **معلومة** لا زخرفة — إخفاؤه
 * عمّن طلب حركةً أقلّ يحرمه الإشارة الوحيدة إلى أن نقرته وصلت. ولذلك
 * يبقى، وهو أصلًا لا يزيح شيئًا ولا يتحرّك في المكان.
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
    timers.push(
      window.setTimeout(() => {
        bar.style.opacity = "0";
      }, DONE_MS),
      /* الرجوع إلى الصفر بلا زمن، وبعد اكتمال التلاشي — وإلا انسحب
         الخيط للخلف أمام العين بدل أن يختفي مكتملًا */
      window.setTimeout(() => {
        bar.style.transitionDuration = "0ms";
        bar.style.transform = "scaleX(0)";
      }, DONE_MS + FADE_MS),
    );
    return clearAll;
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
