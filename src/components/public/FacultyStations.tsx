"use client";

import * as React from "react";
import { Atom, Cpu, GraduationCap, Layers, Wrench, type LucideIcon } from "lucide-react";

import { CourseCard } from "@/components/public/CourseCard";
import { Counted } from "@/components/ui/Num";
import { NOT_OFFERED_LABEL, type FacultyIconKey, type Station } from "@/lib/faculties";
import type { CourseCard as CourseCardData } from "@/lib/data/courses";

/**
 * ══ محطّات الكليات ═══════════════════════════════════════════════════
 *
 * الكليات محطّات على المسار، والاختيار يحرّك علامة الموقع.
 *
 * ── لماذا هذا الشكل ─────────────────────────────────────────────────
 * الاختيار والمحتوى في الإطار الأول معًا: لا بوّابة قبل المحتوى، ولا
 * نقرة للوصول إليه. والصفحة تمتلئ بالمحطّات لا بالمقررات — وهو ما
 * يجعلها تبدو مقصودة وهي تحمل مقرَّرًا واحدًا.
 *
 * ── لماذا رأسي ──────────────────────────────────────────────────────
 * ليس ذوقًا. المسار الرأسي بلا اتجاه أفقي، فلا `translateX` ولا
 * افتراض جهة: العلامة تتحرّك بـ`offsetTop` المقيس. في واجهة RTL لها
 * تاريخ أخطاء اتجاه موثّق، هذا يزيل فئة الأخطاء بدل أن يتفاداها.
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

/** رسمٌ دلالي خفيف يميّز كل كلية، من نفس SVG المعتمد في المعاينة. */
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

      {icon === "it" && (
        <svg viewBox="0 0 900 300" preserveAspectRatio="xMidYMid meet">
          <g strokeWidth="1" opacity=".22">
            {[50, 102, 154, 206, 258].map((y) => <line key={y} x1="30" y1={y} x2="870" y2={y} />)}
          </g>
          <g strokeWidth="1.3" opacity=".7">
            <path className="faculty-draw" d="M150,96 L150,164 L184,164 A34,34 0 0 0 184,96 Z" />
            <line className="faculty-draw" x1="104" y1="112" x2="150" y2="112" /><line className="faculty-draw" x1="104" y1="148" x2="150" y2="148" />
            <line className="faculty-draw" x1="218" y1="130" x2="300" y2="130" />
            <path className="faculty-draw" d="M340,96 Q372,130 340,164 Q392,164 414,130 Q392,96 340,164" />
            <path className="faculty-draw" d="M340,96 Q372,130 340,164" />
            <line className="faculty-draw" x1="300" y1="112" x2="344" y2="112" /><line className="faculty-draw" x1="300" y1="148" x2="344" y2="148" />
            <line className="faculty-draw" x1="414" y1="130" x2="520" y2="130" />
            <path className="faculty-draw" d="M560,100 L560,160 L610,130 Z" />
            <circle className="faculty-draw" cx="617" cy="130" r="7" />
            <line className="faculty-draw" x1="520" y1="130" x2="560" y2="130" /><line className="faculty-draw" x1="624" y1="130" x2="760" y2="130" />
          </g>
          <path className="faculty-flow" d="M104,112 L150,112 M218,130 L300,130 M414,130 L520,130 M624,130 L760,130" stroke="var(--color-spark)" strokeWidth="2.4" strokeLinecap="round" style={{ animationDuration: "14s" }} />
          {[300, 520, 760].map((x, i) => <circle key={x} className="faculty-pulse" cx={x} cy="130" r="4" fill="var(--color-spark)" stroke="none" style={{ animationDelay: `${i * 1.6}s` }} />)}
        </svg>
      )}

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

      {(icon === "engineering" || icon === "other") && (
        <svg viewBox="0 0 900 300" preserveAspectRatio="xMidYMid meet">
          {[{ x: 0, opacity: .55 }, { x: 400, opacity: .38 }].map((part, i) => (
            <g key={part.x} className="faculty-breathe" style={{ transformOrigin: `${250 + part.x}px 260px`, animationDelay: i ? "-7s" : undefined }}>
              <g strokeWidth="1.1" opacity={part.opacity}>
                <path className="faculty-draw" d={`M${80 + part.x},260 L${250 + part.x},60 L${420 + part.x},260 Z`} />
                <path className="faculty-draw" d={`M${250 + part.x},60 L${250 + part.x},260`} />
                <path className="faculty-draw" d={`M${165 + part.x},160 L${335 + part.x},160`} />
              </g>
              <path className="faculty-flow" d={`M${80 + part.x},260 L${250 + part.x},60 L${420 + part.x},260 Z`} stroke={i ? "var(--color-accent-bright)" : "var(--color-spark)"} strokeWidth={i ? 1.8 : 2.2} strokeLinecap="round" opacity={i ? .6 : 1} style={{ animationDuration: i ? "26s" : "20s", animationDelay: i ? "-11s" : undefined }} />
            </g>
          ))}
        </svg>
      )}
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
  const [mark, setMark] = React.useState({ y: 0, progress: 0, ready: false });

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

      const y = node.offsetTop + node.offsetHeight / 2;
      const drawable = Math.max(rail.offsetHeight - 24, 1);
      const progress = Math.min(Math.max((y - 12) / drawable, 0), 1);
      setMark((previous) =>
        previous.ready &&
        Math.abs(previous.y - y) < 0.5 &&
        Math.abs(previous.progress - progress) < 0.001
          ? previous
          : { y, progress, ready: true },
      );
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
    <div
      ref={sectionRef}
      className="grid gap-[2.6rem] min-[1000px]:grid-cols-[16.5rem_minmax(0,1fr)] min-[1000px]:gap-12"
    >
      {/* ══ السكّة ══════════════════════════════════════════════════ */}
      <div className="min-w-0">
        <p className="mb-[0.9rem] text-eyebrow">المضاءة فيها مقررات الآن</p>

        <div className="relative">
          {/* السكّة الكاملة — تُرسم مرة واحدة عند الدخول */}
          <span
            aria-hidden="true"
            className="track-draw absolute inset-y-3 start-[19px] w-0.5 origin-top rounded-full bg-line"
          />
          {/* الجزء المقطوع حتى المحطّة الحالية */}
          <span
            aria-hidden="true"
            className="absolute inset-y-3 start-[19px] w-0.5 origin-top rounded-full
              bg-[linear-gradient(180deg,var(--color-accent-bright),var(--color-accent-deep))]"
            style={{
              transform: `scaleY(${mark.progress})`,
              transition: mark.ready ? "transform var(--dur-slow) var(--ease-out)" : "none",
            }}
          />
          {/* هالة تتبع المحطّة الحالية */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute start-[-14px] top-0 size-[68px] rounded-full
              [background:radial-gradient(circle,color-mix(in_srgb,var(--color-accent-bright)_16%,transparent),transparent_70%)]"
            style={{
              opacity: mark.ready ? 0.7 : 0,
              transform: `translateY(${mark.y - 34}px)`,
              transition: mark.ready
                ? "transform var(--dur-slow) var(--ease-out), opacity var(--dur-fast) ease-out"
                : "none",
            }}
          />

          <ul ref={railRef} className="relative space-y-0.5">
            {stations.map((s) => {
              const Icon = ICONS[s.icon];
              const on = s.slug === active;
              const empty = s.courses.length === 0;
              return (
                <li key={s.slug} data-slug={s.slug}>
                  <button
                    type="button"
                    onClick={() => setActive(s.slug)}
                    aria-current={on ? "true" : undefined}
                    className={`group flex w-full items-center gap-3 rounded-field py-2 pe-3 ps-1.5
                      text-start transition-colors duration-200
                      ${on ? "bg-panel-lift/70" : "hover:bg-panel/60"}`}
                  >
                    <span
                      data-node
                      className={`grid size-9 shrink-0 place-items-center rounded-full border
                        shadow-[0_0_0_5px_var(--color-ink)]
                        transition-[transform,background-color,border-color,color] duration-[320ms] ease-out
                        ${
                          on
                            ? "scale-105 border-transparent text-ink [background:linear-gradient(180deg,var(--color-accent-bright),var(--color-action))]"
                            : empty
                              ? "border-dashed border-line bg-ink text-disabled"
                              : "border-line bg-ink text-accent group-hover:border-accent-deep group-hover:text-accent-bright"
                        }`}
                    >
                      <Icon size={16} strokeWidth={1.75} aria-hidden="true" />
                    </span>

                    <span className="min-w-0 flex-1">
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
                      <span className="block text-[10.5px] text-subtle">
                        {empty ? (
                          NOT_OFFERED_LABEL
                        ) : (
                          <>
                            <Counted n={s.courses.length} few="مقررات" many="مقررًا" />
                          </>
                        )}
                      </span>
                    </span>

                    {s.courses.some((c) => c.hasFreePreview) && (
                      <span
                        aria-label="فيها معاينة مجانية"
                        className="size-1.5 shrink-0 rounded-full bg-success"
                      />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* ══ المحتوى — حاضر من الإطار الأول ═════════════════════════ */}
      <div key={active} className="relative isolate min-w-0 anim-rise">
        <FacultyScene icon={station.icon} running={sceneVisible} />
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
