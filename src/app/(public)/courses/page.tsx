import type { Metadata } from "next";
import { NavLink as Link } from "@/components/ui/NavLink";

import { Reveal } from "@/components/motion/Reveal";
import { FacultyStations } from "@/components/public/FacultyStations";
import { LessonBoard } from "@/components/public/LessonBoard";
import { amiri } from "@/lib/amiri-font";
import { buildStations } from "@/lib/faculties";
import { getCachedCatalogue, getCachedHiddenFaculties } from "@/lib/public-course-cache";
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
  const [groups, hiddenFaculties] = await Promise.all([
    getCachedCatalogue(),
    getCachedHiddenFaculties(),
  ]);
  const courses = groups.flatMap((group) => group.courses);
  const previewCourse = courses.find((course) => course.hasFreePreview);

  return (
    <div className={`${amiri.variable} mx-auto max-w-[1180px] px-4 sm:px-8`}>
      {/* ── الأبطل عمودان: الوعد، والدليل عليه ─────────────────────────
          العمود الثاني ليس زخرفة — هو الشرح نفسه بحجمه الكامل. الوعد
          وحده يقوله كل موقع تعليمي؛ والدليل بجانبه هو ما لا يُنسخ. */}
      <section className="grid items-center gap-[clamp(2rem,4vw,3.5rem)] pb-[clamp(2rem,5vw,3.5rem)] pt-[clamp(3rem,8vw,6rem)] min-[940px]:grid-cols-[0.92fr_1.08fr]">
        <div>
        {/* البطل يدخل بترتيب يقرأ به: الوسم، ثم العنوان، ثم الشرح،
            ثم الدعوة. التأخيرات صغيرة (٦٠ms) — تكفي لصنع تسلسل ولا
            تكفي لأن يشعر الزائر بأنه ينتظر. */}
        <Reveal delay={0}>
          <span className="inline-flex items-center gap-2 text-xs text-accent">
            <span className="h-0.5 w-3.5 rounded-full bg-accent-deep" />
            جامعة البحرين
          </span>
        </Reveal>

        {/* ── العنوان ─────────────────────────────────────────────────
            «شرح مقرَّرك الجامعي كما يُدرَّس لك» وصفٌ صحيح، لكنه وصفٌ
            يستطيع أي موقع تدريس أن يكتبه. وهذه تُدخل الاسم في الجملة
            نفسها: تذكر الآليةَ (مسارٌ للمقرر) لا النتيجةَ وحدها،
            وتُقرأ عربيةً سليمة لمن لا يعرف أن «مسار» اسم الموقع —
            فلا تطلب من الزائر حلَّ مفارقة قبل أن يفهم أين هو.

            و`text-wrap:balance` تقسمه سطرين متوازنين بدل سطرٍ طويل
            وكلمةٍ يتيمة تحته. */}
        <Reveal delay={0.06}>
          <h1 className="mt-4 text-display text-balance">
            حين يكون للمقرر{" "}
            <em
              className="bg-clip-text not-italic text-transparent
                [background-image:linear-gradient(160deg,var(--color-accent-lift)_0%,var(--color-accent-bright)_42%,var(--color-accent-deep)_100%)]"
            >
              مسار
            </em>
            ، يصبح أسهل.
          </h1>
        </Reveal>

        <Reveal delay={0.12}>
          <p className="mt-5 max-w-[38ch] text-[clamp(0.9375rem,1.6vw,1.0625rem)] font-light leading-[1.9] text-muted">
            دروس بالعربية، مبنية على توصيف مقرَّرك نفسه — وحداته،
            ومصطلحاته، وما يُسأل عنه فعلًا.
          </p>
        </Reveal>

        {/* ── لماذا لا صفّ إحصاءات هنا ────────────────────────────────
            كان أعلى الصفحة يحمل «١ مقرر متاح · ٤ درس مسجّل · ١ درس
            مجاني». الرقم يخدم المنصة الكبيرة؛ أما هنا فهو يعلن صغر
            الكتالوج في أول ما تقع عليه العين، ولا يجيب سؤال الزائر:
            هل عندكم مقرري؟ الجواب في البطاقات أسفله، فنُقدّمها. */}
        <Reveal delay={0.18}>
          <div className="mt-8 flex flex-wrap gap-3">
            {previewCourse && (
              <Link
                href={`/courses/${previewCourse.slug}`}
                className="press inline-flex min-h-touch items-center rounded-[10px] bg-action px-5 text-sm font-semibold text-ink hover:bg-accent-bright"
              >
                شاهد درسًا كاملًا مجانًا
              </Link>
            )}
            <a
              href="#examples"
              className="press inline-flex min-h-touch items-center rounded-[10px] border border-line bg-panel px-5 text-sm font-medium text-paper hover:border-accent-deep hover:bg-panel-lift"
            >
              كيف يُبنى الشرح؟
            </a>
          </div>
        </Reveal>
        </div>

        <Reveal delay={0.1}>
          <div id="examples" className="scroll-mt-24">
          <LessonBoard />
          </div>
        </Reveal>
      </section>

      <div className="mb-4 flex items-center gap-2.5">
        <h2 className="flex items-center gap-2.5 text-title-lg">
          <span className="h-[19px] w-[3px] rounded-sm bg-gradient-to-b from-accent-bright to-accent-deep" />
          اختر كليتك
        </h2>
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
        <FacultyStations stations={buildStations(groups, hiddenFaculties)} />
      )}
    </div>
  );
}
