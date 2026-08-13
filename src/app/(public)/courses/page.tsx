import type { Metadata } from "next";
import { Play } from "lucide-react";

import { Reveal } from "@/components/motion/Reveal";
import { FacultyStations } from "@/components/public/FacultyStations";
import { listCatalogueByFaculty } from "@/lib/data/courses";
import { buildStations } from "@/lib/faculties";
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
                [background-image:linear-gradient(160deg,var(--color-accent-lift)_0%,var(--color-accent-bright)_42%,var(--color-accent-deep)_100%)]"
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

      <div className="mb-7 mt-12 flex items-baseline justify-between gap-4">
        <h2 className="flex items-center gap-2.5 text-title-md">
          <span className="h-[19px] w-[3px] rounded-sm bg-gradient-to-b from-accent-bright to-accent-deep" />
          اختر كليتك
        </h2>
        <span className="text-xs text-subtle">المضاءة فيها مقررات الآن</span>
      </div>

      {courses.length === 0 ? (
        <p className="rounded-card border border-line bg-panel px-6 py-14 text-center text-sm text-subtle">
          لا مقررات منشورة بعد.
        </p>
      ) : (
        /* ── لماذا محطّات لا مجموعات مكدّسة ──────────────────────────
           كان لكل كلية عنوانٌ خافت وشبكة تحته. عند البيانات الحقيقية
           — كلية واحدة فيها مقرر واحد — تُصيّر الشبكةُ بطاقةً وحيدة
           في صفٍّ ثلاثي الأعمدة، فيبدو ثلثا الصفحة فارغًا وكأن شيئًا
           لم يُحمَّل. والكليات نفسها كانت عناوين صامتة لا يمكن
           اختيارها.

           المحطّات تحلّ الاثنين معًا: الصفحة تمتلئ بالكليات لا
           بالمقررات، والاختيار حاضر بلا بوّابة تسبق المحتوى. */
        <FacultyStations stations={buildStations(groups)} />
      )}
    </div>
  );
}
