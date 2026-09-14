import type { Metadata } from "next";

import { CatalogBackdrop } from "@/components/public/CatalogBackdrop";
import { CatalogBrowser } from "@/components/public/CatalogBrowser";
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
 * لماذا ليس `text-start`: العنوان سطرٌ واحد مع خطٍّ يمتدّ بعده حتى
 * نهاية السطر — فاصلٌ يقول «هنا قسمٌ جديد» بلا صندوقٍ حوله.
 */
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3.5 sm:gap-5">
      <h2 className="whitespace-nowrap text-[1.0625rem] font-semibold tracking-[-0.02em] sm:text-[1.375rem] sm:tracking-[-0.026em]">
        {children}
      </h2>
      <span aria-hidden="true" className="h-px flex-1 bg-gradient-to-l from-line to-transparent" />
    </div>
  );
}

/**
 * ما يميّز مسار — ثلاث جمل، كلٌّ منها صحيحٌ اليوم حرفيًّا.
 *
 * ⚠ النموذج قال «الدرس الأول مفتوح في معظم المقررات» و«بلا تسجيل دخول».
 * وكلاهما غير صحيح اليوم: **لا مسار تشغيلٍ يفتح درس المعاينة لمن لم
 * يشترِ** (المعاينة علامةٌ في البيانات لم يُبنَ مشغّلها بعد). فالعمود
 * الثالث يقول ما يحدث فعلًا: كيف يُشترى بلا بطاقة. ويوم يُبنى مشغّل
 * المعاينة يعود «جرّب قبل أن تدفع» مكانه.
 */
const PILLARS = [
  {
    n: "٠١",
    title: "مبنيٌّ على توصيف مقرَّرك",
    body: "الوحدات والمصطلحات وترتيب الدروس مأخوذةٌ من توصيف المقرر في جامعتك، لا من منهجٍ عامّ.",
  },
  {
    n: "٠٢",
    title: "باقاتٌ بحجم حاجتك",
    body: "دورة المنتصف، أو النهائي، أو المقرر كاملًا. اشترِ ما تحتاجه الآن، وترقَّ إلى الكاملة لاحقًا بفرق السعر.",
  },
  {
    n: "٠٣",
    title: "اشترِ بلا بطاقة",
    body: "تطلب الباقة من صفحة المقرر، وتُتمّ التحويل ببنفت عبر واتساب، ويُفتح المقرر فور تأكيده.",
  },
] as const;

/**
 * كتالوج المقررات — أول صفحة يراها من لا حساب له.
 *
 * `listCatalogueByFaculty` لا تقرأ الجلسة إطلاقًا: هذه صفحة عامة، وأي
 * استدعاء لـ `auth()` هنا يخلط العام بالخاص بلا سبب.
 *
 * ══ الترتيب — إعادة التصميم 2026-09-14 ══════════════════════════════
 * سطران من الوعد، ثمّ المقررات. لا زرّ في البطل: الزائر يأتي بسؤالٍ
 * واحد — هل مقرَّري هنا؟ — وجوابه على بُعد نصف شاشة لا نقرة. ثمّ ما
 * يميّز مسار، ثمّ الدليل («كيف يُبنى الشرح؟») لمن أراد أن يقتنع.
 * ═══════════════════════════════════════════════════════════════════
 */
export default async function CatalogPage() {
  const [groups, hiddenFaculties] = await Promise.all([
    getCachedCatalogue(),
    getCachedHiddenFaculties(),
  ]);
  const stations = buildStations(groups, hiddenFaculties);
  const hasCourses = stations.some((s) => s.courses.length > 0);

  return (
    <div className={`${amiri.variable} relative isolate overflow-hidden`}>
      <CatalogBackdrop />

      <div className="mx-auto max-w-[1180px] px-3.5 sm:px-8">
        {/* ══ البطل ═════════════════════════════════════════════════════
            التأخيرات ‏٨٠ms: تكفي لتسلسلٍ يُقرأ، ولا تكفي لانتظار. */}
        <section className="flex flex-col items-center pb-10 pt-11 text-center sm:pb-[78px] sm:pt-[92px]">
          <span
            className="anim-rise inline-flex items-center gap-2 rounded-full border border-spark/30 bg-spark/8 px-3.5 py-[7px] text-[11px] font-medium text-spark sm:gap-[9px] sm:px-[18px] sm:py-2 sm:text-xs"
          >
            <span className="catalog-dot size-1 rounded-full bg-spark sm:size-[5px]" aria-hidden="true" />
            {SITE.name} · جامعة البحرين
          </span>

          <h1
            className="anim-rise mt-[18px] text-balance text-[1.5rem] font-bold leading-[1.42] tracking-[-0.032em] sm:mt-[26px] sm:text-[clamp(2.3rem,4.4vw,3.5rem)] sm:leading-[1.28] sm:tracking-[-0.038em]"
            style={{ animationDelay: "80ms" }}
          >
            حين يكون للمقرر <span className="text-spark">مسار</span>،
            <br />
            يصبح أسهل.
          </h1>

          <p
            className="anim-rise mx-auto mt-3.5 max-w-[56ch] text-balance text-[0.8125rem] font-light leading-[1.85] text-muted sm:mt-[22px] sm:text-[0.9375rem] sm:leading-[1.9]"
            style={{ animationDelay: "160ms" }}
          >
            دروس بالعربية، مبنية على توصيف مقرَّرك نفسه
            <span className="hidden sm:inline"> — وحداته، ومصطلحاته، وما يُسأل عنه فعلًا</span>.
          </p>
        </section>

        {/* ══ المقررات ═════════════════════════════════════════════════ */}
        <section aria-labelledby="catalog-courses">
          <SectionTitle>
            <span id="catalog-courses">المقررات المتاحة</span>
          </SectionTitle>

          {hasCourses ? (
            <CatalogBrowser stations={stations} />
          ) : (
            <p className="mt-5 rounded-card border border-line bg-panel px-6 py-14 text-center text-sm text-subtle">
              لا مقررات منشورة بعد.
            </p>
          )}
        </section>

        {/* ══ ما يميّز مسار ════════════════════════════════════════════ */}
        <section
          aria-label="ما يميّز مسار"
          className="mt-5 grid gap-2.5 sm:mt-[70px] sm:gap-4 md:grid-cols-3"
        >
          {PILLARS.map((pillar) => (
            <div
              key={pillar.n}
              className="rounded-[14px] border border-line-soft bg-panel/70 px-3.5 py-4 backdrop-blur-[6px] sm:rounded-card sm:px-6 sm:py-[26px]"
            >
              <div className="text-[10.5px] text-spark sm:text-xs">{pillar.n}</div>
              <h3 className="mt-2 text-[13.5px] font-semibold sm:mt-3.5 sm:text-[1.0625rem] sm:tracking-[-0.018em]">
                {pillar.title}
              </h3>
              <p className="mt-[7px] text-[0.75rem] font-light leading-[1.8] text-muted sm:mt-2.5 sm:text-[0.875rem] sm:leading-[1.85]">
                {pillar.body}
              </p>
            </div>
          ))}
        </section>

        {/* ══ الدليل — بعد السؤال لا قبله ═══════════════════════════════ */}
        <section id="examples" className="scroll-mt-24 pb-4 pt-12 sm:pt-[74px]">
          <SectionTitle>كيف يُبنى الشرح؟</SectionTitle>
          <div className="mt-5">
            <LessonBoard />
          </div>
        </section>
      </div>
    </div>
  );
}
