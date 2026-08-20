import type { Metadata } from "next";
import { NavLink as Link } from "@/components/ui/NavLink";
import { Check, Lock, Play, ShieldCheck } from "lucide-react";

import { StaggerList, StaggerItem } from "@/components/motion/Stagger";
import { Reveal } from "@/components/motion/Reveal";
import { BuyButton } from "@/components/public/BuyButton";
import { OfferMap } from "@/components/public/OfferMap";
import { Price } from "@/components/public/Price";
import { ownedLessonIdsForViewer } from "@/lib/data/access";
import { bundleSaving, formatFils } from "@/lib/price";
import { arPrice } from "@/lib/numerals";
import { getCachedPublicCourse } from "@/lib/public-course-cache";
import { SITE } from "@/lib/site";
import { Num, Counted } from "@/components/ui/Num";
import { cn } from "@/lib/utils";

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

export default async function PublicCoursePage({ params }: Params) {
  const { slug } = await params;
  const course = await getCachedPublicCourse(slug);

  /* أغلى منتج هو الحزمة الكاملة عادةً؛ التوفير يُحسب مقابل مجموع ما
     عداه. لا نكتب «وفّر كذا» يدويًا — يُشتقّ من الأسعار الفعلية. */
  const sorted = [...course.products].sort((a, b) => b.priceFils - a.priceFils);
  const bundle = sorted[0];
  const parts = sorted.slice(1);
  const saving =
    bundle && parts.length >= 2
      ? bundleSaving(bundle.priceFils, parts.map((p) => p.priceFils))
      : 0;

  /* دروس هذا المقرر التي يملكها القارئ — فارغة للزائر المجهول */
  const owned = await ownedLessonIdsForViewer(course.id);
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

  return (
    <div className="mx-auto max-w-[1180px] px-4 pb-0 pt-[2.4rem] sm:px-8">
      {/* ── فتات الطريق ═════════════════════════════════════════════
          كان رابطًا واحدًا «كل المقررات». والفتات يقول أين أنت في
          الشجرة لا كيف تخرج منها فحسب — والكلية فيه تعود إلى الكتالوج
          عند محطّتها، فيصير الطريق الراجع خطوةً لا قفزة. */}
      <nav
        aria-label="مسار التنقّل"
        className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[12px] font-medium text-subtle"
      >
        <Link href="/courses" className="press py-1 hover:text-paper hover:underline">
          الكتالوج
        </Link>
        {/* ⚠ انحرافٌ أُعلنه: المعاينة تضع الكلية خطوةً وسطى
            («الكتالوج · كلية الآداب · …»). و`getPublicCourse` لا تُرجع
            الكلية، وملفّها داخل البصمة المنطقية المجمَّدة — فإضافة حقلٍ
            إلى `select` تكسر الضمانة التي أبني عليها كل تقرير.
            فالخطوة الوسطى محذوفة حتى تأذن بفكّ التجميد لأجلها؛
            والفتات يؤدّي وظيفته الأساسية بدونها. */}
        <span aria-hidden="true">·</span>
        <span aria-current="page" className="text-muted">
          {course.code}
        </span>
      </nav>

      <header>
        <div className="mb-[1.4rem] mt-[0.7rem] flex flex-wrap items-end gap-[1.2rem]">
          <h1 className="min-w-[16ch] flex-1 text-[clamp(1.5rem,4vw,2.25rem)] font-semibold leading-[1.35] tracking-[-0.03em]">
            {course.title}
          </h1>
          <span className="code inline-flex rounded-full border border-line bg-[var(--sunk)] px-[0.68rem] py-[0.28rem] text-[0.78rem] font-medium text-subtle">
            {course.code}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-x-[1.6rem] gap-y-4 text-[13px] text-subtle">
          {course.presenter && (
            <span className="flex items-center gap-2.5">
              <span
                aria-hidden="true"
                className="grid size-[34px] shrink-0 place-items-center rounded-full text-[13px]
                  font-bold text-ink shadow-[inset_0_1px_0_rgba(255,255,255,0.075),0_1px_2px_rgba(0,0,0,0.35)]
                  [background:linear-gradient(160deg,var(--color-accent-bright),var(--color-accent-deep))]"
              >
                {course.presenter.name.replace(/^د\.\s*/, "").charAt(0)}
              </span>
              <span>
                <b className="block text-sm font-medium text-paper">
                  {course.presenter.name}
                </b>
                <span className="text-[11px]">أستاذ المقرر</span>
              </span>
            </span>
          )}
          <span>
            <Counted n={course.lessons.length} few="دروس" many="درسًا" />
            {duration && <> · <span className="numeric">{duration}</span></>}
          </span>
          {course.freePreview && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-spark/45 bg-spark/10 px-[0.68rem] py-[0.28rem] text-[11px] font-medium text-spark">
              <Play size={11} fill="currentColor" strokeWidth={0} aria-hidden="true" />
              درس مجاني كامل
            </span>
          )}
        </div>
      </header>

      <OfferMap>
        <div className="mt-[2.2rem] grid items-start gap-[1.6rem] min-[1060px]:grid-cols-[minmax(0,1fr)_20rem]">
          <div>
          {course.freePreview ? (
            <PreviewPlayer
              title={course.freePreview.title}
              duration={clock(course.freePreview.durationSec)}
            />
          ) : (
            <div className="rounded-card border border-line bg-panel px-6 py-14 text-center text-sm text-subtle">
              لا يوجد درس تجريبي في هذا المقرر بعد.
            </div>
          )}

          <Reveal>
            <SectionTitle className="mb-4 mt-[2.6rem]">ماذا ستتعلّم — وما الذي تشتريه</SectionTitle>
          </Reveal>
          <BundleLessonGroups lessons={course.lessons} products={parts} />
          </div>

          <aside>
            <p className="mb-[0.8rem] text-eyebrow">اختر ما تحتاجه · وصول دائم</p>
            <StaggerList
              as="div"
              className="grid items-stretch gap-4 min-[760px]:grid-cols-[repeat(3,minmax(0,1fr))] min-[760px]:gap-[1.1rem] min-[1060px]:grid-cols-1"
            >
              {course.products.map((product) => (
                <StaggerItem key={product.id} as="div" className="h-full min-w-0">
                  <ProductCard
                    product={product}
                    best={bundle?.id === product.id && parts.length >= 2}
                    saving={bundle?.id === product.id ? saving : 0}
                    courseSlug={course.slug}
                    lessons={course.lessons}
                    state={stateOf(product)}
                    segment={product.id === bundle?.id ? "all" : product.slug}
                  />
                </StaggerItem>
              ))}
            </StaggerList>

            <p className="mt-4 flex gap-2.5 rounded-field border border-line-soft bg-[var(--sunk)] px-4 py-[0.9rem] text-xs leading-[1.85] text-subtle">
              <ShieldCheck
                size={15}
                strokeWidth={1.75}
                aria-hidden="true"
                className="mt-0.5 shrink-0 text-accent-deep"
              />
              بعد الطلب تصلك تعليمات الدفع عبر واتساب. ما إن يُؤكَّد التحويل حتى
              يُفتح وصولك — بلا انتهاء صلاحية.
            </p>
          </aside>
        </div>
      </OfferMap>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function SectionTitle({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h2
      className={cn(
        "flex items-center gap-2.5 text-[1.0625rem] font-semibold tracking-[-0.015em]",
        className,
      )}
    >
      <span className="h-[17px] w-[3px] rounded-sm bg-gradient-to-b from-accent-bright to-accent-deep" />
      {children}
    </h2>
  );
}

function PreviewPlayer({
  title,
  duration,
}: {
  title: string;
  duration: string | null;
}) {
  return (
    <div>
      <div
        className="group relative aspect-video overflow-hidden
          rounded-card border border-line/85 transition-colors duration-[320ms]
          ease-out hover:border-accent-deep/75
          shadow-[inset_0_1px_0_rgba(255,255,255,0.075),0_24px_60px_-18px_rgba(0,0,0,0.7)]
          [background:radial-gradient(130%_100%_at_50%_-10%,var(--color-panel-high)_0%,var(--color-panel)_40%,var(--color-ink)_100%)]"
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-50
            [background:linear-gradient(color-mix(in_srgb,var(--color-accent-deep)_7%,transparent)_1px,transparent_1px)_0_0/100%_34px,linear-gradient(90deg,color-mix(in_srgb,var(--color-accent-deep)_7%,transparent)_1px,transparent_1px)_0_0/34px_100%]
            [mask-image:radial-gradient(70%_70%_at_50%_45%,#000_0%,transparent_78%)]"
        />

        <span className="absolute start-3.5 top-3.5 z-10 inline-flex items-center gap-1.5 rounded-full border border-spark/45 bg-spark/10 px-2.5 py-[0.3rem] text-[11px] font-medium text-spark">
          <Play size={11} fill="currentColor" strokeWidth={0} aria-hidden="true" />
          درس مجاني
        </span>

        {/* ── الملصق: ما يُشرح، لا مستطيلٌ أسود ═══════════════════════
            كان أكبر عنصر في صفحةٍ وظيفتُها الإقناع بالدفع، ولا يحمل
            شيئًا. وصفحةُ بيعٍ تعرض مربّعًا أسود تطلب الدفع على الثقة.

            ⚠ انحرافٌ أُعلنه: المعاينة تعرض هنا **إعرابًا** لجملة من
            درس «الاستفهام». وذلك محتوى تحريريّ لدرسٍ بعينه، ولا حقل
            في المخطط يحمل «مثالًا محلولًا» لأي مقرر. فالمعروض هنا
            عنوانُ الدرس المجاني ومطلعُ المسار من بيانات المقرر نفسه:
            نفس **وظيفة** الملصق (يُري ما يُشترى) بمصدرٍ يعمّ كل مقرر
            بدل نصٍّ ثابت يكذب على مقرر غير عربي. */}
        <div className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-center gap-3 p-6 sm:p-8">
          <span className="text-[11px] font-medium text-subtle">الدرس المجاني</span>
          <p className="text-balance text-[clamp(1.125rem,2.6vw,1.75rem)] font-semibold leading-[1.4] tracking-[-0.02em] text-paper">
            {title}
          </p>
        </div>

        {/* ستارٌ يهبط نحو القاع فيبقى الزرّ أعلى تباينًا ممّا تحته */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-10
            [background:linear-gradient(0deg,color-mix(in_srgb,var(--color-ink)_88%,transparent)_0%,color-mix(in_srgb,var(--color-ink)_34%,transparent)_34%,color-mix(in_srgb,var(--color-ink)_14%,transparent)_100%)]"
        />

        {/* ⚠ زرٌّ مُسمّى في القاع، لا قرصٌ في المنتصف.
            القرص المركزيّ يحجب المتن الذي يُفترض أن يعلن عنه — جُرّب
            في المعاينة فاختفت الكلمة الوسطى تحته. والمُسمّى يقول ما
            سيحدث بدل أن يرمز إليه. */}
        <button
          type="button"
          aria-label={`تشغيل الدرس التجريبي: ${title}`}
          className="press absolute bottom-4 z-20 inline-flex items-center gap-2.5 rounded-full
            border-0 py-1.5 pe-4 ps-1.5 text-[13px] font-semibold text-ink
            transition-transform duration-200 ease-out group-hover:-translate-y-0.5
            shadow-[0_16px_40px_-14px_var(--shadow-lift)]
            [inset-inline-start:clamp(1rem,3vw,1.6rem)]
            [background:linear-gradient(180deg,var(--color-accent-bright),var(--color-action))]"
        >
          <span className="grid size-[34px] place-items-center rounded-full bg-[color-mix(in_srgb,var(--color-ink)_12%,transparent)]">
            <Play size={15} className="fill-ink ms-[2px]" strokeWidth={0} aria-hidden="true" />
          </span>
          شغّل الدرس المجاني
        </button>

        {duration && (
          <span className="absolute bottom-3.5 end-3.5 z-10 rounded-md bg-black/55 px-2 py-1 text-[11px] backdrop-blur-sm">
            <Num>{duration}</Num>
          </span>
        )}
      </div>

      <p className="mt-4 text-[13px] font-light text-muted">
        <b className="font-medium text-paper">الدرس الأول — {title}.</b> شاهده
        كاملًا قبل الشراء لتقيّم أسلوب الشرح.
      </p>
    </div>
  );
}

function LessonPath({
  lessons,
  numberById,
}: {
  lessons: { id: string; title: string; durationSec: number | null; isFreePreview: boolean }[];
  numberById?: Map<string, number>;
}) {
  return (
    <div className="relative ps-[2.125rem]">
      {/* ── الخيط ────────────────────────────────────────────────────
          اسم المنصة "مسار". فالمنهج خطّ متصل بعُقد لا صناديق منفصلة —
          والعقدة الأولى مضيئة لأنها المجانية، أي بداية الطريق. */}
      {/* السكّة تُرسم من الأعلى — نفس حركة مسار الدروس داخل المنصة.
          كانت أقوى حركتين في المنتج (`track-draw` و`node-live`)
          محبوستين خلف الدفع، أي غائبتين عن الصفحة الوحيدة التي
          وظيفتها الإقناع. */}
      <span
        aria-hidden="true"
        className="track-draw absolute inset-y-[18px_22px] start-[13px] w-0.5 origin-top rounded-sm
          [background:linear-gradient(180deg,color-mix(in_srgb,var(--color-success)_60%,transparent)_0%,var(--color-line)_16%,var(--color-line)_88%,transparent_100%)]"
      />

      <StaggerList as="ol" className="grid gap-2">
        {lessons.map((lesson, index) => (
          <StaggerItem key={lesson.id} className="group relative py-1">
            {/* ⚠ `numeric` على العنصر الداخلي لا على المُوضَّع.
                الصنف يضبط `direction: ltr` للأرقام، والخصائص المنطقية
                (`-start-`) تُحسب باتجاه العنصر **نفسه** لا باتجاه أبيه —
                فوضعه هنا كان يقلب العقدة إلى الجهة المقابلة للخيط. */}
            <span
              className={cn(
                "absolute -start-[2.125rem] top-[15px] grid size-7 place-items-center rounded-full",
                "border bg-ink text-[11px] shadow-[0_0_0_5px_var(--color-ink)]",
                "transition-colors duration-200 ease-out",
                /* العقدة المتاحة تتنفّس: هنا «المتاح» هو الدرس
                   المجاني، فتأخذ نفس الحركة بلون `success`. */
                lesson.isFreePreview
                  ? "node-live border-spark/65 text-spark"
                  : "border-line text-subtle group-hover:border-accent-deep group-hover:text-accent",
              )}
            >
              <Num>{numberById?.get(lesson.id) ?? index + 1}</Num>
            </span>

            <div
              className={cn(
                "flex items-center gap-3.5 rounded-field border bg-panel px-[1.125rem] py-[0.9375rem]",
                "shadow-[inset_0_1px_0_rgba(255,255,255,0.045)]",
                "transition-[border-color,background-color,transform] duration-200 ease-out",
                /* ⚠ كان `-translate-x-[3px]`. الإزاحة الأفقية تتحرّك
                   نحو اليسار الفيزيائي مهما كان اتجاه الصفحة، فمعناها
                   ينقلب بين LTR وRTL: «للأمام» في إحداهما و«للخلف» في
                   الأخرى. الإزاحة الرأسية بلا اتجاه، وهي نفس لغة
                   `.lift` في نظام التصميم. */
                "group-hover:-translate-y-[2px] group-hover:border-accent-deep/70",
                lesson.isFreePreview ? "border-spark/30" : "border-line",
              )}
            >
              <span className="flex-1 text-sm font-medium">{lesson.title}</span>

              {lesson.isFreePreview ? (
                <span className="rounded-full border border-spark/45 bg-spark/10 px-2.5 py-[0.3rem] text-[11px] font-medium text-spark">
                  مجاني
                </span>
              ) : (
                <Lock
                  size={14}
                  strokeWidth={1.75}
                  aria-label="يُفتح بعد الشراء"
                  className="shrink-0 text-disabled"
                />
              )}

              {clock(lesson.durationSec) && (
                <span className="numeric text-xs text-subtle">
                  {clock(lesson.durationSec)}
                </span>
              )}
            </div>
          </StaggerItem>
        ))}
      </StaggerList>
    </div>
  );
}

function BundleLessonGroups({
  lessons,
  products,
}: {
  lessons: { id: string; title: string; durationSec: number | null; isFreePreview: boolean }[];
  products: {
    id: string;
    slug: string;
    title: string;
    description: string | null;
    priceFils: number;
    lessonIds: string[];
  }[];
}) {
  const lessonOrder = new Map(lessons.map((lesson, index) => [lesson.id, index]));
  const lessonNumber = new Map(lessons.map((lesson, index) => [lesson.id, index + 1]));
  const groups = products
    .filter((product) => product.lessonIds.length > 0)
    .sort((a, b) => {
      const firstA = Math.min(...a.lessonIds.map((id) => lessonOrder.get(id) ?? Infinity));
      const firstB = Math.min(...b.lessonIds.map((id) => lessonOrder.get(id) ?? Infinity));
      return firstA - firstB;
    });

  if (groups.length === 0) return <LessonPath lessons={lessons} />;

  const groupedIds = new Set(groups.flatMap((product) => product.lessonIds));
  const ungrouped = lessons.filter((lesson) => !groupedIds.has(lesson.id));

  return (
    <div>
      {groups.map((product) => {
        const mine = lessons.filter((lesson) => product.lessonIds.includes(lesson.id));
        return (
          <section
            key={product.id}
            data-offer-segment={product.slug}
            className="mb-6 rounded-card border border-line-soft px-[1.15rem] pb-[1.15rem] pt-4 transition-[opacity,border-color,background-color] duration-200"
          >
            <header className="mb-[0.9rem] flex flex-wrap items-baseline gap-[0.7rem] border-b border-dashed border-line-soft pb-[0.7rem]">
              <h3 className="text-[0.95rem] font-semibold">{product.title}</h3>
              {product.description && (
                <p className="min-w-[8ch] flex-1 text-xs text-subtle">{product.description}</p>
              )}
              <Price fils={product.priceFils} size="sm" className="whitespace-nowrap" />
            </header>
            <LessonPath lessons={mine} numberById={lessonNumber} />
          </section>
        );
      })}

      {ungrouped.length > 0 && (
        <section className="mb-6 rounded-card border border-line-soft px-[1.15rem] pb-[1.15rem] pt-4">
          <header className="mb-[0.9rem] border-b border-dashed border-line-soft pb-[0.7rem]">
            <h3 className="text-[0.95rem] font-semibold">بقية مسار المقرر</h3>
          </header>
          <LessonPath lessons={ungrouped} numberById={lessonNumber} />
        </section>
      )}
    </div>
  );
}

function ProductCard({
  product,
  best,
  saving,
  courseSlug,
  lessons,
  state,
  segment,
}: {
  product: {
    id: string;
    slug: string;
    title: string;
    description: string | null;
    priceFils: number;
    itemCount: number;
    lessonIds: string[];
  };
  best: boolean;
  saving: number;
  courseSlug: string;
  /** دروس المقرر كلّها بترتيبها — بها نسمّي ما تفتحه الباقة */
  lessons: { id: string; title: string }[];
  state: TierState;
  segment: string;
}) {
  const lessonCount = lessons.length;

  /* أرقام الدروس التي تفتحها هذه الباقة، بترتيب المقرر لا بترتيب
     البنود — الطالب يقرأ «١ و٢» مقابل مسار المقرر أعلى الصفحة. */
  const included = lessons
    .map((lesson, index) => ({ lesson, number: index + 1 }))
    .filter(({ lesson }) => product.lessonIds.includes(lesson.id));
  const coversAll = included.length >= lessonCount;
  return (
    <div
      data-offer-segment={segment}
      className={cn(
        "glow-edge relative flex h-full min-w-0 flex-col rounded-card border p-[1.3rem] min-[1060px]:p-3",
        "transition-[transform,border-color,box-shadow,opacity] duration-[320ms] ease-out",
        "hover:-translate-y-[5px] hover:border-accent-deep/80",
        best
          ? /* الباقة الأوفر تحمل ضوءًا أعلى منها — لا حدًّا أعرض ولا
               لونًا آخر. الترجيح بالإضاءة يبقى مقروءًا لمن لا يميّز
               الألوان، والباقات الثلاث تبقى متساوية الوزن البنيوي. */
            "border-accent-bright/55 bg-gradient-to-br from-panel-high to-panel shadow-[inset_0_1px_0_var(--hair),0_2px_4px_var(--shadow)]"
          : "border-line bg-panel shadow-[inset_0_1px_0_var(--hair),0_2px_4px_var(--shadow)]",
      )}
    >
      {best && (
        <span className="absolute end-[1.1rem] top-[-0.62rem] rounded-full bg-gradient-to-b from-accent-bright to-action px-[0.6rem] py-[0.2rem] text-[0.64rem] font-semibold text-ink">
          الأوفر
        </span>
      )}
      <h3 className="text-[0.9375rem] font-semibold tracking-[-0.01em]">
        {product.title}
      </h3>

      <p className="mt-2 flex flex-wrap items-baseline gap-x-1.5 gap-y-1">
        {state.kind === "upgrade" ? (
          <>
            <Price fils={state.dueFils} size="md" />
            {/* السعر الكامل مشطوبًا بجانبه: الفرق هو الحجّة، وإخفاء
                الأصل يجعل الخصم دعوى بلا مرجع */}
            <span className="ms-2 text-[0.9rem] text-subtle line-through">
              <Num>{arPrice(formatFils(product.priceFils))}</Num>
            </span>
          </>
        ) : (
          <Price fils={product.priceFils} size="md" />
        )}
      </p>

      {/* ── ما تفتحه هذه الباقة، بالاسم ────────────────────────────
          «٢ بندًا في المنهج» مصطلحُ قاعدة بيانات: لا يقول أيّ درسين،
          ومسارُ المقرر فوقه مباشرةً يسمّي الأربعة كلها. فالطالب كان
          يُطلب منه أن يخمّن ما يشتري. الآن الباقة تسمّي دروسها
          بأرقامها نفسها التي يراها في المسار. */}
      <ul className="mt-[0.9rem] grid flex-1 gap-[0.42rem] text-[0.79rem] text-muted">
        <Included>
          {coversAll ? (
            <>
              دروس المقرر كلها — <Counted n={lessonCount} few="دروس" many="درسًا" />
            </>
          ) : (
            <>
              الدروس <Num>{included.map(({ number }) => number).join("، ")}</Num>
              {included.length > 0 && <> · {included.map(({ lesson }) => lesson.title).join("، ")}</>}
            </>
          )}
        </Included>
        <Included>وصول دائم بلا انتهاء</Included>
        {saving > 0 && (
          <Included>
            توفير <Num>{arPrice(formatFils(saving))}</Num> د.ب
          </Included>
        )}
      </ul>

      {state.kind === "owned" ? (
        /* مملوكة: لا زرّ إطلاقًا. عرض زرٍّ معطّل يترك الطالب يجرّبه
           ليكتشف أنه لا يعمل؛ والوصول إلى ما اشتراه هو ما يريده هنا. */
        <p className="mt-5 flex min-h-touch items-center justify-center gap-2 rounded-field border border-success/40 bg-success/5 text-sm font-medium text-success">
          <Check size={15} strokeWidth={2} aria-hidden="true" />
          تملك هذه الدورة
        </p>
      ) : (
        <BuyButton
          courseSlug={courseSlug}
          productSlug={product.slug}
          best={best}
          label={
            state.kind === "upgrade"
              ? `الترقية إلى ${product.title}`
              : `طلب ${product.title}`
          }
        />
      )}
    </div>
  );
}

function Included({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex min-w-0 items-start gap-2">
      <Check size={13} strokeWidth={2.5} aria-hidden="true" className="mt-[0.28rem] shrink-0 text-spark" />
      <span className="min-w-0 break-words">{children}</span>
    </li>
  );
}
