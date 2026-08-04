import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Play } from "lucide-react";

import { StaggerList, StaggerItem } from "@/components/motion/Stagger";
import { Price } from "@/components/public/Price";
import { listPublishedCourses } from "@/lib/data/courses";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "المقررات",
  description: SITE.shortDescription,
};

/**
 * كتالوج المقررات — أول صفحة يراها من لا حساب له.
 *
 * `listPublishedCourses` لا تقرأ الجلسة إطلاقًا: هذه صفحة عامة، وأي
 * استدعاء لـ `auth()` هنا يخلط العام بالخاص بلا سبب.
 */
export default async function CatalogPage() {
  const courses = await listPublishedCourses();
  const live = courses.length;
  const lessons = courses.reduce((sum, c) => sum + c.lessonCount, 0);
  const free = courses.filter((c) => c.hasFreePreview).length;

  return (
    <div className="mx-auto max-w-[1120px] px-4 sm:px-8">
      <section className="py-14 sm:py-20">
        <span className="inline-flex items-center gap-2 text-xs text-accent">
          <span className="h-0.5 w-3.5 rounded-full bg-accent-deep" />
          جامعة البحرين · مقررات اللغة العربية
        </span>

        <h1
          className="mt-4 max-w-[17ch] text-[clamp(1.875rem,5.2vw,3.125rem)]
            font-semibold leading-[1.28] tracking-[-0.03em]"
        >
          شرح مقرَّرك الجامعي،{" "}
          <em className="bg-gradient-to-b from-accent-bright to-accent-deep bg-clip-text not-italic text-transparent">
            لا دورة عامة
          </em>
        </h1>

        <p className="mt-5 max-w-[44ch] text-[clamp(0.9375rem,1.6vw,1.0625rem)] font-light leading-[1.9] text-muted">
          لا نُعلّم «اللغة العربية». نشرح المقرر الجامعي كما يُدرَّس في خطتك —
          بوحداته ومصطلحاته وما يُسأل عنه في الامتحان.
        </p>

        <dl className="mt-9 flex flex-wrap items-center">
          {[
            { value: live, label: "مقرر متاح" },
            { value: lessons, label: "درس مسجّل" },
            { value: free, label: "درس مجاني" },
          ].map((stat, index) => (
            <div
              key={stat.label}
              className={
                index === 0
                  ? "pe-7"
                  : "border-s border-line/80 pe-7 ps-7"
              }
            >
              <dt className="sr-only">{stat.label}</dt>
              <dd>
                <b className="numeric block text-2xl font-semibold tracking-[-0.02em]">
                  {stat.value}
                </b>
                <span className="text-xs text-subtle">{stat.label}</span>
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <hr className="h-px border-0 bg-gradient-to-l from-transparent via-line to-transparent" />

      <div className="mb-6 mt-12 flex items-baseline justify-between gap-4">
        <h2 className="flex items-center gap-2.5 text-[1.0625rem] font-semibold tracking-[-0.015em]">
          <span className="h-[17px] w-[3px] rounded-sm bg-gradient-to-b from-accent-bright to-accent-deep" />
          المقررات المتاحة
        </h2>
        <span className="text-xs text-subtle">تُضاف مقررات كليات أخرى تباعًا</span>
      </div>

      {courses.length === 0 ? (
        <p className="rounded-[14px] border border-line bg-panel px-6 py-14 text-center text-sm text-subtle">
          لا مقررات منشورة بعد.
        </p>
      ) : (
        /* `auto-fill` يحجز أعمدة فارغة، فمقرر واحد يظهر بثلث العرض
           وحوله فراغان — يبدو كأن شيئًا لم يُحمَّل. `auto-fit` يطوي
           الأعمدة الفارغة، و`max-w` يمنع البطاقة الوحيدة من التمدّد
           على كامل السطر. الكتالوج يبدأ بمقرر واحد فعلًا، فهذه هي
           الحالة الشائعة لا الحالة الحدّية. */
        <StaggerList
          as="ul"
          className="grid items-start gap-[1.125rem]
            [grid-template-columns:repeat(auto-fit,minmax(20.25rem,25.5rem))]"
        >
          {courses.map((course) => (
            <StaggerItem key={course.id}>
              <CourseCard course={course} />
            </StaggerItem>
          ))}
        </StaggerList>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function CourseCard({
  course,
}: {
  course: Awaited<ReturnType<typeof listPublishedCourses>>[number];
}) {
  return (
    <Link
      href={`/courses/${course.slug}`}
      className="group relative flex h-full flex-col overflow-hidden rounded-[14px]
        border border-line bg-panel p-[1.375rem] shadow-[inset_0_1px_0_rgba(255,255,255,0.045),0_1px_2px_rgba(0,0,0,0.35)]
        transition-[transform,border-color,box-shadow] duration-200 ease-out
        hover:-translate-y-1 hover:border-accent-deep/85
        hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.075),0_8px_24px_-8px_rgba(0,0,0,0.55)]"
    >
      {/* ضوء يسقط من الأعلى عند التصويب — لا ظل عام بلا مصدر */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-36 opacity-0
          transition-opacity duration-[320ms] ease-out group-hover:opacity-100
          [background:radial-gradient(70%_100%_at_50%_0%,color-mix(in_srgb,var(--color-accent-bright)_13%,transparent),transparent_72%)]"
      />

      <div className="flex items-start justify-between gap-4">
        <h3 className="text-[1.0625rem] font-semibold leading-[1.5] tracking-[-0.015em]">
          {course.title}
        </h3>
        <span className="numeric shrink-0 rounded-[7px] border border-line bg-ink/80 px-2 py-[0.3rem] text-[11px] text-accent">
          {course.code}
        </span>
      </div>

      {course.summary && (
        <p className="mt-3 text-[13px] font-light leading-[1.85] text-muted">
          {course.summary}
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-1.5">
        {course.hasFreePreview && (
          <Tag tone="free">
            <Play size={11} fill="currentColor" strokeWidth={0} aria-hidden="true" />
            درس مجاني
          </Tag>
        )}
        <Tag>
          <span className="numeric">{course.productCount}</span> دورات
        </Tag>
        <Tag>
          <span className="numeric">{course.lessonCount}</span> دروس
        </Tag>
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

      <span className="mt-4 flex items-center gap-1.5 text-[13px] font-medium text-action transition-colors duration-200 group-hover:text-accent-bright">
        استعرض المقرر
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

function Tag({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone?: "free";
}) {
  return (
    <span
      className={
        tone === "free"
          ? "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-success/50 bg-success/10 px-2.5 py-[0.3rem] text-[11px] font-medium text-success"
          : "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-line bg-ink/70 px-2.5 py-[0.3rem] text-[11px] font-medium text-subtle"
      }
    >
      {children}
    </span>
  );
}
