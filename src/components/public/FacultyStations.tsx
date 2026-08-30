"use client";

import * as React from "react";
import { Atom, Cpu, GraduationCap, Layers, Wrench, type LucideIcon } from "lucide-react";

import { CourseCard } from "@/components/public/CourseCard";
import { EngineeringScene, ItScene } from "@/components/public/FacultyScenes";
import { Counted } from "@/components/ui/Num";
import { NOT_OFFERED_LABEL, type FacultyIconKey, type Station } from "@/lib/faculties";
import type { CourseCard as CourseCardData } from "@/lib/data/courses";

/**
 * ══ محطّات الكليات ═══════════════════════════════════════════════════
 *
 * الكليات محطّات على المسار، والاختيار يحرّك علامة الموقع ويبدّل
 * المشهد الخلفيّ.
 *
 * ── لماذا صارت أفقية ────────────────────────────────────────────────
 * كانت رأسية، وكان تعليلها أن الرأسيّ بلا اتجاهٍ أفقيّ فلا يحتاج
 * قلبًا في RTL. والقرار تبدّل بطلب المالك، والسبب البصريّ وجيه:
 * الهوية نفسها **طريقٌ أفقيّ** يمشي عليه خرّيج، فالمحطّات على خطٍّ
 * أفقيّ تعيد الاستعارة نفسها بدل أن تناقضها. والصفّ الأفقيّ يترك
 * العرض كلَّه للبطاقات، فتظهر المقررات أوسع وأقرب إلى العين.
 *
 * ── وكيف عولج الاتجاه بدل تفاديه ────────────────────────────────────
 * لا `translateX` مكتوبةً بيد، ولا افتراض جهة. تُقاس مواضع العقد
 * بـ`getBoundingClientRect` نسبةً إلى الحاوية، وتُقرأ الجهةُ من
 * `getComputedStyle(...).direction` — فيُبنى الشريط المملوء من
 * **بداية السطر** أيًّا كانت. أي أن الاتجاه معطًى مقيس لا ثابتٌ
 * مكتوب، وهي الطريقة الوحيدة التي لا تنكسر عند قلب `dir`.
 *
 * ── لماذا بلا `spark` ───────────────────────────────────────────────
 * اللون الجريء محجوز بقاعدة صريحة للتقدّم والإنجاز. «أين أقف» موقعٌ
 * لا إنجاز، واستعماله هنا يستهلك أثره. المحطّة النشطة تأخذ
 * `accent-bright`/`action` وهي لغة الاختيار في المنصة.
 * ═══════════════════════════════════════════════════════════════════
 */

const ICONS: Record<FacultyIconKey, LucideIcon> = {
  arts: GraduationCap,
  it: Cpu,
  science: Atom,
  engineering: Wrench,
  /* كلية من قاعدة البيانات خارج قائمة المنصة — تُعرض ولا تُخفى */
  other: Layers,
};

const ARTS_GLYPHS = [
  { glyph: "ب", top: 12, start: 8, size: 2.5, rotate: 7 },
  { glyph: "ن", top: 58, start: 22, size: 1.7, rotate: -6 },
  { glyph: "ر", top: 26, start: 38, size: 3.1, rotate: 7 },
  { glyph: "ك", top: 72, start: 52, size: 1.9, rotate: -6 },
  { glyph: "ع", top: 40, start: 66, size: 2.2, rotate: 7 },
  { glyph: "م", top: 16, start: 80, size: 1.6, rotate: -6 },
  { glyph: "ه", top: 64, start: 92, size: 2.8, rotate: 7 },
] as const;

/**
 * الرسم الخلفيّ المميّز لكل كلية.
 *
 * «الآداب» و«العلوم» كما في المعاينة المعتمدة حرفًا بحرف. أمّا
 * «تقنية المعلومات» و«الهندسة» فمشهدان مستقلّان في `FacultyScenes`،
 * أُعيد رسمهما على مرجعين اعتمدهما المالك.
 */
function FacultyScene({ icon, running }: { icon: FacultyIconKey; running: boolean }) {
  return (
    <div
      className="faculty-scene"
      data-paused={running ? undefined : "true"}
      aria-hidden="true"
    >
      {icon === "arts" && (
        <>
          <svg viewBox="0 0 900 300" preserveAspectRatio="xMidYMid meet">
            <g className="faculty-drift">
              <path className="faculty-draw" strokeWidth="1.4" d="M40,210 C170,60 300,250 430,140 S690,40 860,170" />
              <path className="faculty-draw" strokeWidth="1" opacity=".55" d="M40,250 C200,120 320,270 470,180 S720,90 860,215" />
              <path className="faculty-draw" strokeWidth=".8" opacity=".35" d="M60,150 C200,40 330,180 480,90 S700,10 850,120" />
              <path className="faculty-flow" strokeWidth="2.2" stroke="var(--color-spark)" strokeLinecap="round" d="M40,210 C170,60 300,250 430,140 S690,40 860,170" />
              <path className="faculty-flow" strokeWidth="1.6" stroke="var(--color-accent-bright)" strokeLinecap="round" opacity=".5" style={{ animationDuration: "34s", animationDelay: "-9s" }} d="M40,250 C200,120 320,270 470,180 S720,90 860,215" />
            </g>
          </svg>
          <div className="faculty-glyphs">
            {ARTS_GLYPHS.map((item) => (
              <span
                key={item.glyph}
                style={{
                  top: `${item.top}%`,
                  insetInlineStart: `${item.start}%`,
                  fontSize: `${item.size}rem`,
                  transform: `rotate(${item.rotate}deg)`,
                } as React.CSSProperties}
              >
                {item.glyph}
              </span>
            ))}
          </div>
        </>
      )}

      {icon === "it" && <ItScene />}

      {icon === "science" && (
        <svg viewBox="0 0 900 300" preserveAspectRatio="xMidYMid meet">
          <g className="faculty-spin" style={{ transformOrigin: "450px 150px" }}>
            <ellipse className="faculty-draw" cx="450" cy="150" rx="300" ry="96" strokeWidth="1.2" />
            <ellipse className="faculty-draw" cx="450" cy="150" rx="300" ry="96" strokeWidth="1" opacity=".6" transform="rotate(60 450 150)" />
            <ellipse className="faculty-draw" cx="450" cy="150" rx="300" ry="96" strokeWidth="1" opacity=".6" transform="rotate(-60 450 150)" />
          </g>
          <circle className="faculty-pulse" cx="450" cy="150" r="7" fill="var(--color-spark)" stroke="none" />
        </svg>
      )}

      {(icon === "engineering" || icon === "other") && <EngineeringScene />}
    </div>
  );
}

export function FacultyStations({
  stations,
}: {
  stations: Station<CourseCardData>[];
}) {
  const first = stations.find((s) => s.courses.length > 0) ?? stations[0];
  const [active, setActive] = React.useState(first?.slug ?? "");
  const sectionRef = React.useRef<HTMLDivElement>(null);
  const railRef = React.useRef<HTMLUListElement>(null);
  const [sceneVisible, setSceneVisible] = React.useState(true);
  /** الشريط المملوء بالبكسل — يُقاس ولا يُفترض، فينقلب مع `dir` وحده */
  const [fill, setFill] = React.useState({ left: 0, width: 0, ready: false });

  const station = stations.find((s) => s.slug === active) ?? first;
  const lessons = station?.courses.reduce((n, c) => n + c.lessonCount, 0) ?? 0;

  React.useLayoutEffect(() => {
    const rail = railRef.current;
    if (!rail) return;

    const measure = () => {
      const node = rail.querySelector<HTMLElement>(
        `[data-slug="${CSS.escape(active)}"] [data-node]`,
      );
      if (!node) return;

      const railBox = rail.getBoundingClientRect();
      const nodeBox = node.getBoundingClientRect();
      const centre = nodeBox.left + nodeBox.width / 2 - railBox.left;
      const rtl = getComputedStyle(rail).direction === "rtl";

      /* من بداية السطر إلى مركز المحطّة: يمينًا في RTL ويسارًا في LTR */
      const next = rtl
        ? { left: centre, width: Math.max(railBox.width - centre, 0) }
        : { left: 0, width: Math.max(centre, 0) };

      setFill((previous) =>
        previous.ready &&
        Math.abs(previous.left - next.left) < 0.5 &&
        Math.abs(previous.width - next.width) < 0.5
          ? previous
          : { ...next, ready: true },
      );

      /* المحطّة المختارة تُجلب إلى المرأى على الشاشات الضيّقة */
      node.scrollIntoView({ block: "nearest", inline: "nearest" });
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(rail);
    return () => observer.disconnect();
  }, [active, stations]);

  React.useEffect(() => {
    const node = sectionRef.current;
    if (!node || !("IntersectionObserver" in window)) return;

    const observer = new IntersectionObserver(
      ([entry]) => setSceneVisible(entry.isIntersecting),
      { rootMargin: "160px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  if (!station) return null;

  return (
    <div ref={sectionRef} className="relative isolate">
      <FacultyScene icon={station.icon} running={sceneVisible} />

      {/* ══ السكّة الأفقية ═══════════════════════════════════════════
          تمرير أفقيّ عند الضيق بدل عصر المحطّات: أربع كليات لا تتّسع
          على ٣٧٥px إلا بتصغيرٍ يجعلها غير مقروءة. */}
      <div className="relative -mx-4 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden">
        <ul
          ref={railRef}
          className="relative flex min-w-max items-start gap-1 sm:min-w-0 sm:gap-2"
        >
          {/* الخطّ الكامل — يُرسم مرّةً عند الدخول */}
          <span
            aria-hidden="true"
            className="track-draw-x absolute end-0 start-0 top-[21px] h-0.5 rounded-full bg-line"
          />
          {/* المقطوع حتى المحطّة الحالية */}
          <span
            aria-hidden="true"
            className="absolute top-[21px] h-0.5 rounded-full
              [background:linear-gradient(90deg,var(--color-accent-deep),var(--color-accent-bright))]"
            style={{
              left: `${fill.left}px`,
              width: `${fill.width}px`,
              opacity: fill.ready ? 1 : 0,
              transition: fill.ready
                ? "left var(--dur-slow) var(--ease-out), width var(--dur-slow) var(--ease-out)"
                : "none",
            }}
          />

          {stations.map((s) => {
            const Icon = ICONS[s.icon];
            const on = s.slug === active;
            const empty = s.courses.length === 0;
            return (
              <li key={s.slug} data-slug={s.slug} className="relative flex-1">
                <button
                  type="button"
                  onClick={() => setActive(s.slug)}
                  aria-current={on ? "true" : undefined}
                  className="group flex w-full min-w-[7.5rem] flex-col items-center gap-2 rounded-field px-2 pb-2 pt-0 text-center"
                >
                  <span
                    data-node
                    className={`grid size-11 shrink-0 place-items-center rounded-full border
                      shadow-[0_0_0_6px_var(--color-ink)]
                      transition-[transform,background-color,border-color,color] duration-[320ms] ease-out
                      ${
                        on
                          ? "scale-105 border-transparent text-ink [background:linear-gradient(180deg,var(--color-accent-bright),var(--color-action))]"
                          : empty
                            ? "border-dashed border-line bg-ink text-disabled"
                            : "border-line bg-ink text-accent group-hover:border-accent-deep group-hover:text-accent-bright"
                      }`}
                  >
                    <Icon size={18} strokeWidth={1.75} aria-hidden="true" />
                  </span>

                  <span className="min-w-0">
                    <span
                      className={`block truncate text-[13px] transition-colors duration-200 ${
                        on
                          ? "font-semibold text-paper"
                          : empty
                            ? "text-subtle"
                            : "text-muted group-hover:text-paper"
                      }`}
                    >
                      {s.name}
                    </span>
                    <span className="mt-0.5 flex items-center justify-center gap-1.5 text-[10.5px] text-subtle">
                      {empty ? (
                        NOT_OFFERED_LABEL
                      ) : (
                        <>
                          <Counted n={s.courses.length} few="مقررات" many="مقررًا" />
                          {s.courses.some((c) => c.hasFreePreview) && (
                            <span
                              aria-label="فيها معاينة مجانية"
                              className="size-1.5 shrink-0 rounded-full bg-success"
                            />
                          )}
                        </>
                      )}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* ══ المحتوى ══════════════════════════════════════════════════ */}
      <div key={active} className="anim-rise mt-7 min-w-0">
        <div className="mb-5 flex flex-wrap items-baseline justify-between gap-3 border-b border-line pb-4">
          <h2 className="text-title-lg">{station.name}</h2>
          <p className="text-xs text-subtle">
            {station.courses.length === 0 ? (
              "لا مقررات على المنصة من هذه الكلية"
            ) : (
              <>
                <Counted n={station.courses.length} few="مقررات" many="مقررًا" /> ·{" "}
                <Counted n={lessons} few="دروس" many="درسًا" /> مسجّلة
              </>
            )}
          </p>
        </div>

        {station.courses.length === 0 ? (
          <div className="rounded-card border border-dashed border-line bg-panel/30 px-6 py-14 text-center">
            <p className="text-sm text-muted">{station.name} محطّة على المسار لم تُطرح بعد.</p>
            <p className="mx-auto mt-2 max-w-[38ch] text-xs leading-[1.9] text-subtle">
              نضيف المقررات كلية بعد كلية، ولا نعِد بموعد. اختر محطّة مضاءة الآن.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 items-start gap-[1.125rem] min-[520px]:[grid-template-columns:repeat(auto-fit,minmax(18.5rem,1fr))]">
            {station.courses.map((c, i) => (
              <div
                key={c.id}
                style={{ animationDelay: `${i * 45}ms` }}
                className="anim-rise"
              >
                <CourseCard course={c} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
