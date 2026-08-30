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
 *
 * ══ لماذا صار الترتيب هكذا — قرار المالك بعد استعمال الموقع ═════════
 *
 * كان أعلى الصفحة عمودين: وعدٌ كبير إلى جانب لوحة شرحٍ كاملة. وكان
 * ذلك **شاشةً كاملة قبل أول مقرر**: يفتح الطالب الموقع فلا يرى ما جاء
 * من أجله إلا بعد تمريرٍ طويل. والزائر هنا لا يأتي ليُقنَع بالفكرة —
 * يأتي ليسأل سؤالًا واحدًا: **هل عندكم مقرَّري؟**
 *
 * فالبطل الآن سطران وسطرُ شرحٍ وزرّان، موسَّطًا ومضغوطًا، ثمّ المقررات
 * مباشرةً. وما كان يزاحمها — لوحةُ الشرح — نزل إلى أسفل بوصفه ما هو
 * فعلًا: **دليلٌ يُراجَع بعد السؤال، لا بوّابةٌ قبله.**
 *
 * والرابط `#examples` باقٍ يعمل: من أراد الدليل قفز إليه بنقرة، ومن
 * أراد مقرّره وجده بلا نقرة. وهذا هو الفرق كلّه.
 * ═══════════════════════════════════════════════════════════════════
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
      {/* ══ البطل — مضغوطٌ وموسَّط ═══════════════════════════════════
          التأخيرات صغيرة (٦٠ms): تكفي لصنع تسلسلٍ يُقرأ، ولا تكفي
          لأن يشعر الزائر بأنه ينتظر. */}
      <section className="mx-auto max-w-[46rem] pb-[clamp(1.75rem,4vw,2.5rem)] pt-[clamp(2rem,5vw,3.25rem)] text-center">
        <Reveal delay={0}>
          <span className="inline-flex items-center gap-2 rounded-full border border-line bg-panel/70 px-3 py-1 text-[11px] text-accent">
            <span className="size-1.5 rounded-full bg-spark" />
            جامعة البحرين
          </span>
        </Reveal>

        {/* الاسم داخل الجملة نفسها: تذكر الآليةَ (مسارٌ للمقرر) لا
            النتيجةَ وحدها، وتُقرأ عربيةً سليمة لمن لا يعرف أن «مسار»
            اسم الموقع — فلا تطلب حلَّ مفارقة قبل فهم أين هو. */}
        <Reveal delay={0.06}>
          <h1 className="mt-4 text-balance text-display">
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
          <p className="mx-auto mt-4 max-w-[46ch] text-balance text-[clamp(0.9375rem,1.6vw,1.0625rem)] font-light leading-[1.9] text-muted">
            دروس بالعربية، مبنية على توصيف مقرَّرك نفسه — وحداته،
            ومصطلحاته، وما يُسأل عنه فعلًا.
          </p>
        </Reveal>

        <Reveal delay={0.18}>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
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
      </section>

      {/* ══ المقررات — أول ما يُرى بعد سطرين ═══════════════════════ */}
      <div className="mb-5 flex items-center gap-2.5">
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
           لم يُحمَّل. والكليات نفسها كانت عناوين صامتة لا تُختار.

           المحطّات تحلّ الاثنين: الصفحة تمتلئ بالكليات لا بالمقررات،
           والاختيار حاضرٌ بلا بوّابة تسبق المحتوى. */
        <FacultyStations stations={buildStations(groups, hiddenFaculties)} />
      )}

      {/* ══ الدليل — بعد السؤال لا قبله ════════════════════════════
          العمود الذي كان يزاحم المقررات أعلى الصفحة. وهو ليس زخرفة:
          الوعد يقوله كل موقع تعليميّ، والدليل بجانبه هو ما لا يُنسخ —
          لكن موضعه بعد أن يجد الزائر مقرَّره، لا قبله. */}
      <section id="examples" className="scroll-mt-24 pb-4 pt-[clamp(3rem,7vw,4.5rem)]">
        <div className="mb-5 flex items-center gap-2.5">
          <h2 className="flex items-center gap-2.5 text-title-lg">
            <span className="h-[19px] w-[3px] rounded-sm bg-gradient-to-b from-accent-bright to-accent-deep" />
            كيف يُبنى الشرح؟
          </h2>
        </div>
        <Reveal>
          <LessonBoard />
        </Reveal>
      </section>
    </div>
  );
}
