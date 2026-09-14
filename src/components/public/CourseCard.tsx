import { NavLink as Link } from "@/components/ui/NavLink";
import { Price } from "@/components/public/Price";
import { Counted } from "@/components/ui/Num";
import type { CourseCard as CourseCardData } from "@/lib/data/courses";
import { LESSON_FORMS } from "@/lib/numerals";

/**
 * بطاقة مقرر في الكتالوج — إعادة التصميم 2026-09-14.
 *
 * ── فعلٌ واحد، وهو ليس الشراء ───────────────────────────────────────
 * مسار لا تبيع من الشبكة. البطاقة كلّها رابطٌ إلى صفحة المقرر، وهناك
 * الباقات الثلاث والمعاينة. فالزرّ المرسوم أسفلها «استعرض المقرر»
 * **امتدادٌ للرابط نفسه** (`span` لا `button`): عنصرٌ تفاعليّ داخل
 * رابط يُكسر لوحة المفاتيح وقارئ الشاشة، وزرّان يعني قرارين.
 *
 * ── على الهاتف عمودان ───────────────────────────────────────────────
 * المقاسات تنكمش تحت `sm` لتتّسع بطاقتان في ٣٧٥px: الكثافة هنا هي ما
 * يجعل الكتالوج يُقرأ «مباشرًا» — الطالب يرى ستّ مقررات لا اثنين.
 */
export function CourseCard({ course }: { course: CourseCardData }) {
  return (
    <Link
      href={`/courses/${course.slug}`}
      className="group flex h-full flex-col rounded-[14px] border border-line-soft bg-panel p-3 sm:rounded-card sm:px-5 sm:pb-[18px] sm:pt-5
        transition-[translate,scale,border-color,background-color,box-shadow] duration-[320ms] ease-spring
        hover:-translate-y-1.5 hover:border-spark/40 hover:bg-panel-lift hover:shadow-[0_26px_50px_-34px_rgb(0_0_0/0.9)]
        active:scale-[0.985]"
    >
      {/* الرمز لاتينيّ (`.code` = `direction: ltr`)، فالتخطيط على غلافٍ
          خارجه — انظر قاعدة `.numeric` في globals.css */}
      <div>
        <span className="code text-[10.5px] font-medium text-spark sm:text-xs">
          {course.code}
        </span>
      </div>

      <h3 className="mt-2 text-[13px] font-semibold leading-[1.45] tracking-[-0.015em] sm:mt-3 sm:text-[1.0625rem] sm:leading-[1.5]">
        {course.title}
      </h3>

      <p className="mt-1 text-[10.5px] text-subtle sm:text-[12.5px]">
        {course.presenterName}
        {course.presenterName && course.lessonCount > 0 && (
          <span className="hidden sm:inline"> · </span>
        )}
        {/* الإخفاء على غلافٍ خارجيّ لا على `Counted`: صنفه يصل إلى الرقم
            وحده، فكان الهاتف يعرض «دروس» بلا عدد. */}
        {course.lessonCount > 0 && (
          <span className={course.presenterName ? "hidden sm:inline" : undefined}>
            <Counted n={course.lessonCount} {...LESSON_FORMS} />
          </span>
        )}
      </p>

      <div className="mt-2.5 flex flex-wrap items-center gap-1.5 sm:mt-3.5 sm:gap-2.5">
        {course.fromPriceFils !== null && (
          <span className="flex items-baseline gap-1 text-[10.5px] text-muted sm:text-[12.5px]">
            من
            <Price
              fils={course.fromPriceFils}
              size="sm"
              className="[&_b]:text-[13px] [&_b]:text-paper sm:[&_b]:text-[15px]"
            />
          </span>
        )}
        {course.hasFreePreview && (
          <span className="rounded-full border border-accent/30 bg-accent/8 px-[7px] py-[3px] text-[9.5px] font-medium text-accent sm:px-[9px] sm:py-1 sm:text-[11px]">
            <span className="sm:hidden">معاينة</span>
            <span className="hidden sm:inline">معاينة مجانية</span>
          </span>
        )}
      </div>

      <span className="min-h-1.5 flex-1" aria-hidden="true" />
      <span className="my-2.5 h-px bg-line-soft sm:mb-3.5 sm:mt-4" aria-hidden="true" />

      <span
        className="flex min-h-touch items-center justify-center rounded-[10px] bg-spark text-xs font-semibold text-on-spark sm:rounded-field sm:text-sm
          transition-[filter,translate] duration-200 ease-spring group-hover:-translate-y-0.5 group-hover:brightness-110"
      >
        استعرض المقرر
      </span>
    </Link>
  );
}
