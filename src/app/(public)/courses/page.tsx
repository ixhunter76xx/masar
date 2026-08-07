import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Play } from "lucide-react";

import { StaggerList, StaggerItem } from "@/components/motion/Stagger";
import { Reveal } from "@/components/motion/Reveal";
import { Price } from "@/components/public/Price";
import { listCatalogueByFaculty, type CourseCard as CourseCardData } from "@/lib/data/courses";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "المقررات",
  description: SITE.shortDescription,
};

/**
 * كتالوج المقررات — أول صفحة يراها من لا حساب له.
 *
 * `listCatalogueByFaculty` لا تقرأ الجلسة إطلاقًا: هذه صفحة عامة، وأي
 * استدعاء لـ `auth()` هنا يخلط العام بالخاص بلا سبب.
 */
export default async function CatalogPage() {
  const groups = await listCatalogueByFaculty();
  const courses = groups.flatMap((group) => group.courses);
  const free = courses.filter((c) => c.hasFreePreview).length;

  return (
    <div className="mx-auto max-w-[1120px] px-4 sm:px-8">
      <section className="py-14 sm:py-20">
        {/* البطل يدخل بترتيب يقرأ به: الوسم، ثم العنوان، ثم الشرح،
            ثم الدعوة. التأخيرات صغيرة (٦٠ms) — تكفي لصنع تسلسل ولا
            تكفي لأن يشعر الزائر بأنه ينتظر. */}
        <Reveal delay={0}>
          <span className="inline-flex items-center gap-2 text-xs text-accent">
            <span className="h-0.5 w-3.5 rounded-full bg-accent-deep" />
            جامعة البحرين · مقررات اللغة العربية
          </span>
        </Reveal>

        <Reveal delay={0.06}>
          <h1
            className="mt-4 max-w-[17ch] text-[clamp(1.875rem,5.2vw,3.125rem)]
              font-semibold leading-[1.28] tracking-[-0.03em]"
          >
            شرح مقرَّرك الجامعي{" "}
            <em
              className="bg-clip-text not-italic text-transparent
                [background-image:linear-gradient(160deg,#c8dcea_0%,var(--color-accent-bright)_42%,var(--color-accent-deep)_100%)]"
            >
              كما يُدرَّس لك
            </em>
          </h1>
        </Reveal>

        <Reveal delay={0.12}>
          <p className="mt-5 max-w-[44ch] text-[clamp(0.9375rem,1.6vw,1.0625rem)] font-light leading-[1.9] text-muted">
            نتبع توصيف مقرَّرك نفسه — بوحداته ومصطلحاته وما يُسأل عنه في
            الامتحان.
          </p>
        </Reveal>

        {/* ── لماذا لا صفّ إحصاءات هنا ────────────────────────────────
            كان أعلى الصفحة يحمل «١ مقرر متاح · ٤ درس مسجّل · ١ درس
            مجاني». الرقم يخدم المنصة الكبيرة؛ أما هنا فهو يعلن صغر
            الكتالوج في أول ما تقع عليه العين، ولا يجيب سؤال الزائر:
            هل عندكم مقرري؟ الجواب في البطاقات أسفله، فنُقدّمها. */}
        {free > 0 && (
          <Reveal delay={0.18}>
            <p className="mt-8 inline-flex items-center gap-2 rounded-full border border-success/40 bg-success/[0.07] px-3.5 py-2 text-[13px] text-success">
              <Play size={11} fill="currentColor" strokeWidth={0} aria-hidden="true" />
              جرّب درسًا كاملًا مجانًا قبل أن تدفع
            </p>
          </Reveal>
        )}
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
        /* مجموعة لكل كلية.
           عنوان الكلية يُعرض حتى لو كانت المجموعة واحدة: هو ما يقول
           للزائر إن هذا كتالوج جامعة لا صفحة مقرر — وغيابه هو سبب
           قراءة الصفحة كموقع لمقرر واحد. */
        <div className="space-y-12">
          {groups.map((group) => (
            <section key={group.slug ?? "unassigned"}>
              <h3 className="mb-4 flex items-baseline gap-2.5 text-sm font-medium text-muted">
                <span className="h-[11px] w-[2px] rounded-sm bg-line" />
                {group.name}
                <span className="numeric text-[11px] text-subtle">
                  {group.courses.length}
                </span>
              </h3>

              {/* `auto-fill` يحجز أعمدة فارغة، فمقرر واحد يظهر بثلث
                  العرض وحوله فراغان — يبدو كأن شيئًا لم يُحمَّل.
                  `auto-fit` يطوي الأعمدة الفارغة، و`max-w` يمنع
                  البطاقة الوحيدة من التمدّد على كامل السطر. */}
              <StaggerList
                as="ul"
                className="grid items-start gap-[1.125rem]
                  [grid-template-columns:repeat(auto-fit,minmax(20.25rem,25.5rem))]"
              >
                {group.courses.map((course) => (
                  <StaggerItem key={course.id}>
                    <CourseCard course={course} />
                  </StaggerItem>
                ))}
              </StaggerList>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function CourseCard({
  course,
}: {
  course: CourseCardData;
}) {
  return (
    <Link
      href={`/courses/${course.slug}`}
      className="group glow-edge relative flex h-full flex-col overflow-hidden rounded-[14px]
        border border-line p-[1.375rem]
        shadow-[inset_0_1px_0_rgba(255,255,255,0.045),0_1px_2px_rgba(0,0,0,0.35)]
        transition-[transform,border-color,box-shadow] duration-[320ms] ease-out
        hover:-translate-y-1.5 hover:border-accent-deep/85
        [background:linear-gradient(168deg,var(--color-panel-lift)_0%,var(--color-panel)_58%)]"
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

      {/* «٣ دورات» و«٤ دروس» متجاورتين تسألان الزائر أن يفرّق بين
          مفهومين داخليين قبل أن يعرف ما المقرر أصلًا. عدد الدروس
          وحده يصف المحتوى؛ وعدد المنتجات قرارُ شراءٍ محلّه صفحة
          المقرر لا بطاقة الكتالوج. */}
      <div className="mt-4 flex flex-wrap gap-1.5">
        {course.hasFreePreview && (
          <Tag tone="free">
            <Play size={11} fill="currentColor" strokeWidth={0} aria-hidden="true" />
            درس مجاني
          </Tag>
        )}
        <Tag>
          <span className="numeric">{course.lessonCount}</span> دروس مسجّلة
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

      {/* كان رابطًا نصّيًا بلون خافت. البطاقة كلها قابلة للنقر، لكن
          الزائر يبحث بعينه عن زرّ — فليجد زرًّا. */}
      <span
        className="press mt-[1.125rem] flex min-h-touch items-center justify-center gap-1.5
          rounded-[10px] border border-line bg-ink/70 text-sm font-medium text-paper
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
