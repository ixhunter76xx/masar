"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Price } from "@/components/public/Price";
import { Counted } from "@/components/ui/Num";
import { cn } from "@/lib/utils";
import type { CourseCard as CourseCardData } from "@/lib/data/courses";

/**
 * بطاقة مقرر في الكتالوج.
 *
 * نُقلت من صفحة الكتالوج إلى هنا لأن محطّات الكليات تعيد رسم الشبكة
 * عند كل اختيار — وهو تفاعل عميل. المكوّن الخادمي لا يُعاد تصييره
 * على حالة العميل، فبقاؤه هناك يعني بطاقة مجمَّدة على أول كلية.
 */
export function CourseCard({ course }: { course: CourseCardData }) {
  return (
    <Link
      href={`/courses/${course.slug}`}
      className="group glow-edge relative flex h-full flex-col overflow-hidden rounded-card
        border border-line p-[1.375rem] surface-card
        transition-[transform,border-color,box-shadow] duration-[320ms] ease-out
        hover:-translate-y-1.5 hover:border-accent-deep/85"
    >
      {/* ضوء يسقط من الأعلى عند التصويب — لا ظل عام بلا مصدر */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-36 opacity-0
          transition-opacity duration-[320ms] ease-out group-hover:opacity-100
          [background:radial-gradient(70%_100%_at_50%_0%,color-mix(in_srgb,var(--color-accent-bright)_13%,transparent),transparent_72%)]"
      />

      <div className="flex items-start justify-between gap-4">
        <h3 className="text-title-sm">{course.title}</h3>
        <span className="code shrink-0 rounded-[7px] border border-line bg-ink/80 px-2 py-[0.3rem] text-[11px] text-accent">
          {course.code}
        </span>
      </div>

      {course.summary && (
        <p className="mt-3 text-body-sm text-muted">{course.summary}</p>
      )}

      {/* ── عمود الدروس ═══════════════════════════════════════════════
          الشكوى المعالَجة: «مستطيلات متماثلة». والعلاج ليس زخرفة
          تُضاف من خارج، بل بيانٌ يُعرض — عدد الدروس يتفاوت بين
          المقررات، فرسمُه علاماتٍ يجعل البطاقة تُظهر مقاسها بنفسها،
          فتختلف البطاقات لأن محتواها مختلف لا لأننا زخرفناها.

          والدرس المجاني علامة **أطول** لا ملوّنة — تمييزٌ بالامتلاء
          والحجم، كما يقتضي نظامٌ أحاديّ مأخوذ من لوغو أحاديّ. */}
      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="flex h-[18px] items-end gap-[3px]" aria-hidden="true">
          {Array.from({ length: course.lessonCount }, (_, i) => {
            const lit = course.hasFreePreview && i === 0;
            return (
              <i
                key={i}
                className={cn(
                  "w-2 rounded-[2px] transition-[height,background-color] duration-200",
                  lit
                    ? "h-[18px] bg-accent group-hover:bg-accent-bright"
                    : "h-2 bg-line group-hover:bg-accent-deep",
                )}
              />
            );
          })}
        </span>
        <span className="text-[11px] text-subtle">
          <Counted n={course.lessonCount} few="دروس" many="درسًا" />
          {course.hasFreePreview && " · أوّلها مجاني"}
        </span>
      </div>

      <div className="mt-auto flex items-end justify-between gap-4 border-t border-line/75 pt-[1.125rem]">
        <span className="flex items-center gap-2 text-xs text-subtle">
          {course.presenterName && (
            <>
              <span
                className="grid size-7 shrink-0 place-items-center rounded-full text-[11px]
                  font-bold text-ink shadow-[inset_0_1px_0_rgba(255,255,255,0.075)]
                  [background:linear-gradient(160deg,var(--color-accent-bright),var(--color-accent-deep))]"
                aria-hidden="true"
              >
                {course.presenterName.replace(/^د\.\s*/, "").charAt(0)}
              </span>
              {course.presenterName}
            </>
          )}
        </span>

        {course.fromPriceFils !== null && (
          <span className="text-start">
            <small className="block text-[11px] text-subtle">يبدأ من</small>
            <Price fils={course.fromPriceFils} />
          </span>
        )}
      </div>

      <span
        className="press mt-[1.125rem] flex min-h-touch items-center justify-center gap-1.5
          rounded-field border border-line bg-ink/70 text-sm font-medium text-paper
          transition-colors duration-200
          group-hover:border-transparent group-hover:text-ink
          group-hover:[background:linear-gradient(180deg,var(--color-accent-bright),var(--color-action))]"
      >
        استعرض المقرر والأسعار
        <ArrowLeft
          size={14}
          strokeWidth={2}
          aria-hidden="true"
          className="transition-transform duration-200 ease-out group-hover:-translate-x-1"
        />
      </span>
    </Link>
  );
}
