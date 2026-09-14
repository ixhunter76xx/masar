"use client";

import * as React from "react";

import { CourseCard } from "@/components/public/CourseCard";
import { cn } from "@/lib/utils";
import { NOT_OFFERED_LABEL, type Station } from "@/lib/faculties";
import type { CourseCard as CourseCardData } from "@/lib/data/courses";

/**
 * ══ فرز الكتالوج بالحبوب ════════════════════════════════════════════
 *
 * حلّ محلّ محطّات الكليات بقرار المالك (إعادة التصميم 2026-09-14):
 * «الكل» أوّلًا ثمّ الكليات، والشبكة تحتها مباشرة. الحبّة سطرٌ واحد
 * يلتفّ على الهاتف، فلا تمرير أفقيّ ولا قياس اتجاه — وهو ما كانت
 * المحطّات تحتاجه.
 *
 * ── ما بقي من المحطّات عمدًا ────────────────────────────────────────
 * الكلية التي لم تُطرح تبقى حبّةً ظاهرة بحدٍّ متقطّع، ويقول اختيارُها
 * «لم تُطرح بعد» — القائمة خارطةُ طريقٍ صادقة لا دليلُ جامعة (انظر
 * `lib/faculties.ts`). و`buildStations` نفسها تضمن ألّا يختفي مقررٌ
 * منشور لكليةٍ خارج القائمة.
 *
 * ── لماذا «الكل» هو الافتراضيّ ──────────────────────────────────────
 * الزائر يأتي بسؤالٍ واحد: هل مقرَّري هنا؟ فأوّلُ ما يراه كلُّ ما
 * عندنا، والفرز اختصارٌ لمن كثرت المقررات أمامه — لا بوّابةٌ قبلها.
 * ═══════════════════════════════════════════════════════════════════
 */

const ALL = "__all";

/** «كلية الآداب» ← «الآداب»: الحبّة تحت عنوانٍ يقول إنها كليات */
const shortName = (name: string) => name.replace(/^كلية\s+/, "");

export function CatalogBrowser({
  stations,
}: {
  stations: Station<CourseCardData>[];
}) {
  const [active, setActive] = React.useState(ALL);

  const allCourses = React.useMemo(
    () => stations.flatMap((s) => s.courses),
    [stations],
  );
  const station = stations.find((s) => s.slug === active);
  const courses = active === ALL ? allCourses : (station?.courses ?? []);

  const chips = [
    { slug: ALL, label: "الكل", empty: false },
    ...stations.map((s) => ({
      slug: s.slug,
      label: shortName(s.name),
      empty: s.courses.length === 0,
    })),
  ];

  return (
    <div>
      <div
        role="group"
        aria-label="فرز المقررات حسب الكلية"
        className="mt-4 flex flex-wrap gap-[7px] sm:mt-5 sm:gap-2"
      >
        {chips.map((chip) => {
          const on = chip.slug === active;
          return (
            <button
              key={chip.slug}
              type="button"
              aria-pressed={on}
              onClick={() => setActive(chip.slug)}
              className={cn(
                "inline-flex min-h-touch items-center whitespace-nowrap rounded-full border px-3 text-[12px] sm:px-[18px] sm:text-[13px]",
                "transition-[background-color,color,border-color,scale] duration-200 ease-spring",
                on
                  ? "scale-[1.02] border-spark bg-spark font-semibold text-on-spark"
                  : chip.empty
                    ? "border-dashed border-line bg-panel/40 text-subtle hover:border-accent-deep hover:text-muted"
                    : "border-line-soft bg-panel/60 text-subtle hover:border-line hover:text-paper",
              )}
            >
              {chip.label}
            </button>
          );
        })}
      </div>

      {/* `key` يعيد تركيب الشبكة عند كل فرز، فيُعاد الدخول المتعاقب —
          وهو ما يقول للعين إن القائمة تبدّلت لا إن شيئًا اختفى. */}
      <div key={active} className="mt-4 sm:mt-[22px]">
        {courses.length === 0 ? (
          <div className="anim-rise rounded-card border border-dashed border-line bg-panel/30 px-6 py-14 text-center">
            <p className="text-sm text-muted">
              {station ? `${station.name} — ${NOT_OFFERED_LABEL}.` : "لا مقررات منشورة بعد."}
            </p>
            <p className="mx-auto mt-2 max-w-[38ch] text-xs leading-[1.9] text-subtle">
              نضيف المقررات كليةً بعد كلية، ولا نعِد بموعد.
            </p>
          </div>
        ) : (
          <ul className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-3">
            {courses.map((course, i) => (
              <li
                key={course.id}
                className="anim-rise"
                style={{ animationDelay: `${Math.min(i * 50, 450)}ms` }}
              >
                <CourseCard course={course} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
