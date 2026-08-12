"use client";

import * as React from "react";
import { Atom, Cpu, GraduationCap, Layers, Wrench, type LucideIcon } from "lucide-react";

import { CourseCard } from "@/components/public/CourseCard";
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

export function FacultyStations({
  stations,
}: {
  stations: Station<CourseCardData>[];
}) {
  const first = stations.find((s) => s.courses.length > 0) ?? stations[0];
  const [active, setActive] = React.useState(first?.slug ?? "");
  const railRef = React.useRef<HTMLUListElement>(null);
  const [mark, setMark] = React.useState({ y: 0, ready: false });

  const station = stations.find((s) => s.slug === active) ?? first;
  const lessons = station?.courses.reduce((n, c) => n + c.lessonCount, 0) ?? 0;

  React.useLayoutEffect(() => {
    const node = railRef.current?.querySelector<HTMLElement>(
      `[data-slug="${CSS.escape(active)}"] [data-node]`,
    );
    if (!node) return;
    setMark({ y: node.offsetTop + node.offsetHeight / 2, ready: true });
  }, [active, stations]);

  if (!station) return null;

  return (
    <div className="grid gap-8 lg:grid-cols-[16.5rem_1fr] lg:gap-10">
      {/* ══ السكّة ══════════════════════════════════════════════════ */}
      <div>
        <p className="mb-4 text-eyebrow">كليات جامعة البحرين</p>

        <div className="relative">
          {/* السكّة الكاملة — تُرسم مرة واحدة عند الدخول */}
          <span
            aria-hidden="true"
            className="track-draw absolute inset-y-3 start-[19px] w-0.5 origin-top rounded-full bg-line"
          />
          {/* الجزء المقطوع حتى المحطّة الحالية */}
          <span
            aria-hidden="true"
            className="absolute start-[19px] top-3 w-0.5 rounded-full
              bg-[linear-gradient(180deg,var(--color-accent-bright),var(--color-accent-deep))]"
            style={{
              height: Math.max(mark.y - 12, 0),
              transition: mark.ready ? "height var(--dur-slow) var(--ease-out)" : "none",
            }}
          />
          {/* هالة تتبع المحطّة الحالية */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute start-[-14px] size-[68px] rounded-full opacity-70
              [background:radial-gradient(circle,color-mix(in_srgb,var(--color-accent-bright)_16%,transparent),transparent_70%)]"
            style={{
              top: mark.y - 34,
              transition: mark.ready ? "top var(--dur-slow) var(--ease-out)" : "none",
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
                    className={`group flex w-full items-center gap-3 rounded-[11px] py-2 pe-3 ps-1.5
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
                            <span className="numeric">{s.courses.length}</span> مقرر
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
      <div key={active} className="anim-rise">
        <div className="mb-5 flex flex-wrap items-baseline justify-between gap-3 border-b border-line pb-4">
          <h2 className="text-title-lg">{station.name}</h2>
          <p className="text-xs text-subtle">
            {station.courses.length === 0 ? (
              "لا مقررات على المنصة من هذه الكلية"
            ) : (
              <>
                <span className="numeric">{station.courses.length}</span> مقرر ·{" "}
                <span className="numeric">{lessons}</span> درسًا مسجّلًا
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
          <div className="grid items-start gap-[1.125rem] [grid-template-columns:repeat(auto-fit,minmax(18.5rem,1fr))]">
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
