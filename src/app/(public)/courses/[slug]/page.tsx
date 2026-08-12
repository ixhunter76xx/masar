import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, Lock, Play, ShieldCheck } from "lucide-react";

import { StaggerList, StaggerItem } from "@/components/motion/Stagger";
import { Reveal } from "@/components/motion/Reveal";
import { BuyButton } from "@/components/public/BuyButton";
import { Price } from "@/components/public/Price";
import { getPublicCourse } from "@/lib/data/courses";
import { ownedLessonIdsForViewer } from "@/lib/data/access";
import { bundleSaving, formatFils } from "@/lib/price";
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
  const course = await getPublicCourse(slug);
  return {
    title: `${course.code} — ${course.title}`,
    description: course.summary ?? undefined,
  };
}

/** تنسيق ثانية إلى mm:ss — الفيديو لا يُعرض بالثواني الخام */
function clock(seconds: number | null): string | null {
  if (!seconds) return null;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default async function PublicCoursePage({ params }: Params) {
  const { slug } = await params;
  const course = await getPublicCourse(slug);

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
    <div className="mx-auto max-w-[1120px] px-4 sm:px-8">
      <Link
        href="/courses"
        className="press group mt-2 inline-flex min-h-touch items-center gap-2 text-[13px] text-subtle hover:text-paper"
      >
        <ArrowRight
          size={15}
          strokeWidth={2}
          aria-hidden="true"
          className="transition-transform duration-200 ease-out group-hover:translate-x-1"
        />
        كل المقررات
      </Link>

      <header className="pb-10 pt-4">
        <span className="numeric inline-block rounded-[7px] border border-line bg-panel/90 px-2 py-[0.3rem] text-[11px] text-accent shadow-[inset_0_1px_0_rgba(255,255,255,0.045)]">
          {course.code}
        </span>
        <h1 className="mt-3.5 text-[clamp(1.5rem,4vw,2.25rem)] font-semibold leading-[1.35] tracking-[-0.03em]">
          {course.title}
        </h1>

        <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-4 text-[13px] text-subtle">
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
          <span className="flex items-center gap-2.5">
            <span className="numeric">{course.lessons.length}</span> دروس
            <Dot />
            وصول دائم
          </span>
        </div>
      </header>

      <hr className="h-px border-0 bg-gradient-to-l from-transparent via-line to-transparent" />

      <div className="mt-10 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_348px] lg:gap-11">
        <div>
          {course.freePreview ? (
            <PreviewPlayer
              title={course.freePreview.title}
              duration={clock(course.freePreview.durationSec)}
            />
          ) : (
            <div className="rounded-[20px] border border-line bg-panel px-6 py-14 text-center text-sm text-subtle">
              لا يوجد درس تجريبي في هذا المقرر بعد.
            </div>
          )}

          {course.description && (
            <Reveal>
              <SectionTitle className="mb-4 mt-11">عن المقرر</SectionTitle>
              <p className="max-w-[62ch] text-[0.9375rem] font-light leading-[2] text-muted">
                {course.description}
              </p>
            </Reveal>
          )}

          <Reveal>
            <SectionTitle className="mb-4 mt-11">مسار المقرر</SectionTitle>
          </Reveal>
          <LessonPath lessons={course.lessons} />
        </div>

        <aside className="grid gap-3.5 lg:sticky lg:top-[92px]">
          {/* ── ثلاث باقات ظاهرة، لا واحدة ────────────────────────────
              التقسيم نصف أول / نصف ثانٍ / كامل ليس خيار تسعير قابلًا
              للطيّ، بل نموذج العمل: طالبٌ يحتاج ما قبل الامتحان
              النصفي فقط، وآخر ما بعده، وثالث الكلّ. إخفاء أيٍّ منها
              خلف إفصاح يخفي المنتج نفسه عن نصف من يقصده.

              ما كان معطوبًا فعلًا ليس وجودها الثلاثي بل أنها لا
              تُميَّز: ثلاثة أزرار بنصّ واحد، ووصفٌ بـ«٢ بندًا في
              المنهج» لا يقول أيّ درسين. كلاهما مُصلَح أدناه. */}
          <div className="mb-1 flex items-baseline justify-between">
            <h2 className="text-[13px] font-semibold text-muted">اختر ما تحتاجه</h2>
            <span className="text-[11px] text-subtle">وصول دائم</span>
          </div>

          <StaggerList as="div" className="grid gap-3.5">
            {course.products.map((product) => (
              <StaggerItem key={product.id} as="div">
                <ProductCard
                  product={product}
                  best={bundle?.id === product.id && parts.length >= 2}
                  saving={bundle?.id === product.id ? saving : 0}
                  courseSlug={course.slug}
                  lessons={course.lessons}
                  state={stateOf(product)}
                />
              </StaggerItem>
            ))}
          </StaggerList>

          <p className="mt-1 flex gap-2.5 rounded-[10px] border border-line/70 bg-panel/45 px-[1.125rem] py-[0.9375rem] text-xs leading-[1.85] text-subtle">
            <ShieldCheck
              size={15}
              strokeWidth={1.75}
              aria-hidden="true"
              className="mt-0.5 shrink-0 text-accent-deep"
            />
            بعد الطلب تصلك تعليمات الدفع عبر واتساب. ما إن يُؤكَّد التحويل حتى
            يُفتح وصولك للدورة كاملة — بلا انتهاء صلاحية.
          </p>
        </aside>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function Dot() {
  return <span aria-hidden="true" className="size-[3px] rounded-full bg-disabled" />;
}

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
        className="group relative grid aspect-video place-items-center overflow-hidden
          rounded-[20px] border border-line/85 transition-colors duration-[320ms]
          ease-out hover:border-accent-deep/75
          shadow-[inset_0_1px_0_rgba(255,255,255,0.075),0_24px_60px_-18px_rgba(0,0,0,0.7)]
          [background:radial-gradient(130%_100%_at_50%_-10%,#1c2c3d_0%,#14202c_40%,var(--color-ink)_100%)]"
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-50
            [background:linear-gradient(color-mix(in_srgb,var(--color-accent-deep)_7%,transparent)_1px,transparent_1px)_0_0/100%_34px,linear-gradient(90deg,color-mix(in_srgb,var(--color-accent-deep)_7%,transparent)_1px,transparent_1px)_0_0/34px_100%]
            [mask-image:radial-gradient(70%_70%_at_50%_45%,#000_0%,transparent_78%)]"
        />

        <span className="absolute start-3.5 top-3.5 z-10 inline-flex items-center gap-1.5 rounded-full border border-success/50 bg-success/10 px-2.5 py-[0.3rem] text-[11px] font-medium text-success">
          <Play size={11} fill="currentColor" strokeWidth={0} aria-hidden="true" />
          درس مجاني
        </span>

        {/* المشغّل الحقيقي يأتي في مرحلة الشراء — هذا زرّ يمهّد له */}
        <button
          type="button"
          aria-label={`تشغيل الدرس التجريبي: ${title}`}
          className="relative z-10 grid size-[76px] place-items-center rounded-full
            transition-[transform,box-shadow] duration-200 ease-out
            hover:scale-105 active:scale-[0.98]
            shadow-[inset_0_1px_0_rgba(255,255,255,0.075),0_14px_44px_-10px_rgba(0,0,0,0.7)]
            hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.075),0_18px_52px_-10px_rgba(0,0,0,0.75),0_0_0_12px_color-mix(in_srgb,var(--color-action)_9%,transparent)]
            [background:linear-gradient(180deg,var(--color-accent-bright),var(--color-action))]"
        >
          <Play size={26} className="fill-ink ms-[3px]" strokeWidth={0} aria-hidden="true" />
        </button>

        {duration && (
          <span className="absolute bottom-3.5 end-3.5 z-10 rounded-md bg-black/55 px-2 py-1 text-[11px] backdrop-blur-sm">
            <span className="numeric">{duration}</span>
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
}: {
  lessons: { id: string; title: string; durationSec: number | null; isFreePreview: boolean }[];
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
                  ? "node-live node-live-success border-success/65 text-success"
                  : "border-line text-subtle group-hover:border-accent-deep group-hover:text-accent",
              )}
            >
              <span className="numeric">{index + 1}</span>
            </span>

            <div
              className={cn(
                "flex items-center gap-3.5 rounded-[10px] border bg-panel px-[1.125rem] py-[0.9375rem]",
                "shadow-[inset_0_1px_0_rgba(255,255,255,0.045)]",
                "transition-[border-color,background-color,transform] duration-200 ease-out",
                /* ⚠ كان `-translate-x-[3px]`. الإزاحة الأفقية تتحرّك
                   نحو اليسار الفيزيائي مهما كان اتجاه الصفحة، فمعناها
                   ينقلب بين LTR وRTL: «للأمام» في إحداهما و«للخلف» في
                   الأخرى. الإزاحة الرأسية بلا اتجاه، وهي نفس لغة
                   `.lift` في نظام التصميم. */
                "group-hover:-translate-y-[2px] group-hover:border-accent-deep/70",
                lesson.isFreePreview ? "border-success/30" : "border-line",
              )}
            >
              <span className="flex-1 text-sm font-medium">{lesson.title}</span>

              {lesson.isFreePreview ? (
                <span className="rounded-full border border-success/50 bg-success/10 px-2.5 py-[0.3rem] text-[11px] font-medium text-success">
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

function ProductCard({
  product,
  best,
  saving,
  courseSlug,
  lessons,
  state,
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
}) {
  const lessonCount = lessons.length;
  const coversAll = product.itemCount >= lessonCount;

  /* أرقام الدروس التي تفتحها هذه الباقة، بترتيب المقرر لا بترتيب
     البنود — الطالب يقرأ «١ و٢» مقابل مسار المقرر أعلى الصفحة. */
  const included = lessons
    .map((lesson, index) => ({ lesson, number: index + 1 }))
    .filter(({ lesson }) => product.lessonIds.includes(lesson.id));
  return (
    <div
      className={cn(
        "glow-edge rounded-[14px] border p-5",
        "transition-[transform,border-color,box-shadow] duration-[320ms] ease-out",
        "hover:-translate-y-[5px] hover:border-accent-deep/80",
        best
          ? /* الباقة الأوفر تحمل ضوءًا أعلى منها — لا حدًّا أعرض ولا
               لونًا آخر. الترجيح بالإضاءة يبقى مقروءًا لمن لا يميّز
               الألوان، والباقات الثلاث تبقى متساوية الوزن البنيوي. */
            "border-action/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.075),0_10px_30px_-10px_rgba(0,0,0,0.6)] [background:radial-gradient(130%_88%_at_50%_-8%,color-mix(in_srgb,var(--color-action)_14%,transparent),transparent_72%),linear-gradient(168deg,var(--color-panel-lift)_0%,var(--color-panel)_60%)]"
          : "border-line shadow-[inset_0_1px_0_rgba(255,255,255,0.045),0_1px_2px_rgba(0,0,0,0.35)] [background:linear-gradient(168deg,var(--color-panel-lift)_0%,var(--color-panel)_62%)]",
      )}
    >
      <div className="flex items-start justify-between gap-2.5">
        <h3 className="text-[0.9375rem] font-semibold tracking-[-0.01em]">
          {product.title}
        </h3>
        {best && (
          <span className="shrink-0 rounded-full border border-action/55 bg-action/10 px-2.5 py-[0.3rem] text-[11px] font-medium text-action">
            الأوفر
          </span>
        )}
      </div>

      {product.description && (
        <p className="mt-1.5 text-xs leading-[1.7] text-subtle">
          {product.description}
        </p>
      )}

      <p className="mt-4">
        {state.kind === "upgrade" ? (
          <>
            <Price fils={state.dueFils} size="lg" />
            {/* السعر الكامل مشطوبًا بجانبه: الفرق هو الحجّة، وإخفاء
                الأصل يجعل الخصم دعوى بلا مرجع */}
            <span className="ms-2 text-[13px] text-subtle line-through">
              <span className="numeric">{formatFils(product.priceFils)}</span>
            </span>
          </>
        ) : (
          <Price fils={product.priceFils} size="lg" />
        )}
      </p>

      {/* ── ما تفتحه هذه الباقة، بالاسم ────────────────────────────
          «٢ بندًا في المنهج» مصطلحُ قاعدة بيانات: لا يقول أيّ درسين،
          ومسارُ المقرر فوقه مباشرةً يسمّي الأربعة كلها. فالطالب كان
          يُطلب منه أن يخمّن ما يشتري. الآن الباقة تسمّي دروسها
          بأرقامها نفسها التي يراها في المسار. */}
      <ul className="mt-4 grid gap-2 border-t border-line/75 pt-4 text-xs text-muted">
        <Included>
          {coversAll ? (
            <>
              كل دروس المقرر — <span className="numeric">{lessonCount}</span> دروس
            </>
          ) : (
            <>
              <span className="numeric">{product.itemCount}</span> من{" "}
              <span className="numeric">{lessonCount}</span> دروس
            </>
          )}
        </Included>

        {included.length > 0 && (
          <li className="flex gap-2">
            <span aria-hidden="true" className="w-[13px] shrink-0" />
            <span className="flex flex-wrap gap-1.5">
              {included.map(({ lesson, number }) => (
                <span
                  key={lesson.id}
                  className="inline-flex items-center gap-1.5 rounded-full border
                    border-line bg-ink/70 px-2 py-[0.2rem] text-[11px] text-muted"
                >
                  <span className="numeric text-subtle">{number}</span>
                  {lesson.title}
                </span>
              ))}
            </span>
          </li>
        )}

        <Included>وصول دائم بلا انتهاء</Included>
        {saving > 0 && (
          <Included>
            توفير <span className="numeric">{formatFils(saving)}</span> د.ب
          </Included>
        )}
      </ul>

      {state.kind === "owned" ? (
        /* مملوكة: لا زرّ إطلاقًا. عرض زرٍّ معطّل يترك الطالب يجرّبه
           ليكتشف أنه لا يعمل؛ والوصول إلى ما اشتراه هو ما يريده هنا. */
        <p className="mt-5 flex min-h-touch items-center justify-center gap-2 rounded-[10px] border border-success/40 bg-success/5 text-sm font-medium text-success">
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
    <li className="flex items-center gap-2">
      <Check size={13} strokeWidth={2.5} aria-hidden="true" className="shrink-0 text-success" />
      {children}
    </li>
  );
}
