import type { Metadata } from "next";

import { auth } from "@/auth";
import { CatalogBackdrop } from "@/components/public/CatalogBackdrop";
import { CourseOffer, type OfferTier } from "@/components/public/CourseOffer";
import { NavLink as Link } from "@/components/ui/NavLink";
import { Num } from "@/components/ui/Num";
import { ownedLessonIdsForViewer } from "@/lib/data/access";
import { bundleSaving } from "@/lib/price";
import { getCachedPublicCourse } from "@/lib/public-course-cache";
import { SITE } from "@/lib/site";

/**
 * حالة الباقة بالنسبة لمن يقرأ الصفحة.
 *
 * الصفحة عامة، لكنها ليست عمياء عن الزائر: من اشترى «المنتصف» يجب
 * ألّا يُعرض عليه شراؤه ثانية، ومن يطلب «الكاملة» بعده يدفع الفرق.
 * الحساب هنا للعرض وحده — الحارس الملزم في `requestProductOrder`.
 */
type TierState =
  | { kind: "new" }
  | { kind: "owned" }
  | { kind: "upgrade"; dueFils: number };

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const course = await getCachedPublicCourse(slug);
  const title = `${course.code} — ${course.title}`;
  const description = course.summary ?? SITE.shortDescription;

  /**
   * صفحة المقرر هي الرابط الذي يُشارَك فعلًا — عبر واتساب أساسًا،
   * وهي قناة البيع الأولى في هذا المنتج. فبطاقتها تحمل اسم المقرر
   * ورمزه ووصفه، لا عنوان المنصّة العامّ.
   *
   * و`canonical` مطلوبٌ هنا تحديدًا: النطاق يستجيب بـ`www` وبدونه،
   * والنسختان تعرضان الصفحة نفسها. وبلا رابطٍ معياريّ يعدّهما جوجل
   * صفحتين متكرّرتين ويقسم وزنهما.
   */
  return {
    title,
    description,
    alternates: { canonical: `/courses/${course.slug}` },
    openGraph: {
      type: "article",
      url: `/courses/${course.slug}`,
      title,
      description,
      siteName: SITE.name,
      locale: "ar_BH",
    },
    twitter: { card: "summary", title, description },
  };
}

/** تنسيق ثانية إلى mm:ss — الفيديو لا يُعرض بالثواني الخام */
function clock(seconds: number | null): string | null {
  if (!seconds) return null;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/** مدّة المقرر من مدد دروسه الفعلية، لا رقمًا تمثيليًّا من المرجع. */
function courseDuration(seconds: number): string | null {
  if (seconds <= 0) return null;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);
  if (hours > 0 && minutes > 0) return `${hours} س ${minutes} د`;
  if (hours > 0) return `${hours} س`;
  return `${minutes} د`;
}

/**
 * ══ صفحة المقرر — إعادة التصميم 2026-09-14 ══════════════════════════
 *
 * عمودان: المقرر وباقاته ودروسها، وإلى جانبها الباقة المختارة وزرّها
 * وخطوات الدفع في عمودٍ لاصق. وعلى الهاتف عمودٌ واحد وشريطٌ لاصق.
 *
 * ── ما تركتُه من النموذج عمدًا ───────────────────────────────────────
 * · زرّ «شاهد الآن» على المعاينة المجانية: لا مسار تشغيلٍ اليوم يفتح
 *   درس المعاينة لمن لم يشترِ، وزرٌّ لا يعمل أسوأ من غيابه. المعاينة
 *   تُسمّى وتُعلَّم في القائمة، ولا تُعِد بما لا يحدث بعد.
 * · «٦ ساعات شرح» و«٤ وحدات» و«عربية»: أرقامُ مثالٍ لا حقول. المعروض
 *   هنا ما تحمله البيانات فعلًا — عدد الدروس ومدّتها المسجّلة وعدد
 *   الباقات.
 * · «خلال ساعات العمل» و«وصول دائم»: التزاماتٌ لم يُقرّرها المالك.
 * ═══════════════════════════════════════════════════════════════════
 */
export default async function PublicCoursePage({ params }: Params) {
  const { slug } = await params;
  const course = await getCachedPublicCourse(slug);

  /* الملكية والجلسة مستقلّتان — دورةٌ واحدة لا اثنتان */
  const [owned, session] = await Promise.all([ownedLessonIdsForViewer(course.id), auth()]);

  /* أغلى منتج هو الحزمة الكاملة عادةً؛ التوفير يُحسب مقابل مجموع ما
     عداه. لا نكتب «وفّر كذا» يدويًا — يُشتقّ من الأسعار الفعلية. */
  const sorted = [...course.products].sort((a, b) => b.priceFils - a.priceFils);
  const bundle = sorted[0];
  const parts = sorted.slice(1);
  const saving =
    bundle && parts.length >= 2
      ? bundleSaving(bundle.priceFils, parts.map((p) => p.priceFils))
      : 0;

  const duration = courseDuration(
    course.lessons.reduce((sum, lesson) => sum + (lesson.durationSec ?? 0), 0),
  );

  /** نفس قاعدة `requestProductOrder`: الملكية بالدروس والخصم بما تلغيه الترقية */
  function stateOf(product: (typeof course.products)[number]): TierState {
    if (owned.size === 0 || product.lessonIds.length === 0) return { kind: "new" };

    const missing = product.lessonIds.filter((id) => !owned.has(id));
    if (missing.length === 0) return { kind: "owned" };

    const target = new Set(product.lessonIds);
    const credit = course.products
      .filter(
        (other) =>
          other.lessonIds.length > 0 &&
          other.lessonIds.every((id) => owned.has(id) && target.has(id)),
      )
      .reduce((sum, other) => sum + other.priceFils, 0);

    return credit > 0
      ? { kind: "upgrade", dueFils: Math.max(0, product.priceFils - credit) }
      : { kind: "new" };
  }

  const tiers: OfferTier[] = course.products.map((product) => {
    const state = stateOf(product);
    const isBundle = bundle?.id === product.id && parts.length >= 2;
    return {
      id: product.id,
      slug: product.slug,
      title: product.title,
      description: product.description,
      priceFils: product.priceFils,
      state: state.kind,
      dueFils: state.kind === "upgrade" ? state.dueFils : product.priceFils,
      best: isBundle,
      savingFils: isBundle ? saving : 0,
      lessonIds: product.lessonIds,
    };
  });

  const lessons = course.lessons.map((lesson, index) => ({
    id: lesson.id,
    number: index + 1,
    title: lesson.title,
    duration: clock(lesson.durationSec),
    isFree: lesson.isFreePreview,
  }));

  const about = course.description ?? course.summary;
  const previewClock = course.freePreview ? clock(course.freePreview.durationSec) : null;

  return (
    <div className="relative isolate">
      <CatalogBackdrop short />

      <div className="mx-auto max-w-[1180px] px-3.5 sm:px-8">
        <nav
          aria-label="مسار التنقّل"
          className="flex items-center gap-2.5 py-5 text-xs text-subtle sm:py-6 sm:text-[13px]"
        >
          <Link href="/courses" className="press inline-flex min-h-touch items-center hover:text-paper">
            المقررات
          </Link>
          <span aria-hidden="true">›</span>
          <span aria-current="page" className="code text-muted">
            {course.code}
          </span>
        </nav>

        <CourseOffer
          courseSlug={course.slug}
          courseId={course.id}
          courseTitle={course.title}
          lessons={lessons}
          tiers={tiers}
          signedIn={Boolean(session?.user)}
        >
          <header>
            <div>
              <span className="code text-[11.5px] font-medium text-spark sm:text-xs">{course.code}</span>
            </div>
            <h1 className="mt-2.5 text-balance text-[1.5rem] font-bold leading-[1.36] tracking-[-0.032em] sm:mt-3 sm:text-[clamp(2rem,3.4vw,2.8rem)] sm:leading-[1.3] sm:tracking-[-0.036em]">
              {course.title}
            </h1>

            {course.presenter && (
              <div className="mt-3 flex items-center gap-2.5 sm:mt-5 sm:gap-3.5">
                <span
                  aria-hidden="true"
                  className="grid size-[30px] shrink-0 place-items-center rounded-full border border-line bg-panel-high/60 text-xs font-semibold sm:size-[38px] sm:text-sm"
                >
                  {course.presenter.name.replace(/^د\.\s*/, "").charAt(0)}
                </span>
                <span>
                  <span className="block text-[12.5px] text-muted sm:text-sm sm:font-medium sm:text-paper">
                    {course.presenter.name}
                  </span>
                  <span className="hidden text-xs text-subtle sm:block">أستاذ المقرر</span>
                </span>
              </div>
            )}

            {about && (
              <p className="mt-4 max-w-[58ch] text-[13px] font-light leading-[1.85] text-muted sm:mt-6 sm:text-[0.9375rem] sm:leading-[1.9]">
                {about}
              </p>
            )}
          </header>

          <dl className="mt-4 flex flex-wrap gap-x-[18px] gap-y-3 rounded-[14px] border border-line-soft bg-panel/80 px-4 py-3.5 sm:mt-[26px] sm:gap-x-[26px] sm:rounded-2xl sm:px-[22px] sm:py-[18px]">
            <Stat label="الدروس" value={<Num>{course.lessons.length}</Num>} />
            {duration && <Stat label="مدّة الشرح" value={<Num>{duration}</Num>} />}
            <Stat label="الباقات" value={<Num>{course.products.length}</Num>} />
          </dl>

          {course.freePreview && (
            <div className="mt-3 rounded-[14px] border border-accent/25 bg-accent/7 px-4 py-4 sm:mt-4 sm:rounded-[18px] sm:px-6 sm:py-[22px]">
              <p className="text-[10.5px] font-medium text-accent sm:text-xs">معاينة مجانية</p>
              <p className="mt-1.5 text-sm font-semibold sm:mt-2 sm:text-[1.0625rem]">
                «{course.freePreview.title}»
                {previewClock && (
                  <span className="font-normal text-subtle">
                    {" · "}
                    <Num>{previewClock}</Num>
                  </span>
                )}
              </p>
              <p className="mt-1 text-xs text-subtle sm:text-[13px]">
                درسُ المعاينة في هذا المقرر، مُعلَّمٌ «مجاني» في قائمة الدروس.
              </p>
            </div>
          )}
        </CourseOffer>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col-reverse">
      <dt className="mt-0.5 text-[10.5px] text-subtle sm:text-[11.5px]">{label}</dt>
      <dd className="text-[15px] font-semibold sm:text-[19px]">{value}</dd>
    </div>
  );
}
