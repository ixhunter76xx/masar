"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, Check, Loader2, X } from "lucide-react";

import { requestPurchase } from "@/app/(app)/orders/actions";
import { Price } from "@/components/public/Price";
import { NavLink as Link } from "@/components/ui/NavLink";
import { Counted, Num } from "@/components/ui/Num";
import { arPrice, LESSON_FORMS } from "@/lib/numerals";
import { formatFils } from "@/lib/price";
import { cn } from "@/lib/utils";

/**
 * ══ اختيار الباقة وطلبها — إعادة التصميم 2026-09-14 ═════════════════
 *
 * كانت الباقات الثلاث بطاقاتٍ متجاورة لكلٍّ منها زرّ طلب، وقائمةُ
 * الدروس في عمودٍ آخر تُضاء بالتصويب. الآن **اختيارٌ ثمّ فعلٌ واحد**:
 * تختار الباقة فتتبدّل تحتها دروسها، ويبقى زرٌّ واحد يطلب ما اخترت —
 * في عمودٍ لاصق على الحاسوب، وفي شريطٍ لاصق أسفل الهاتف.
 *
 * ── ما لم يتغيّر ─────────────────────────────────────────────────────
 * الحساب كلّه على الخادم: الصفحة تمرّر حالة كل باقة (جديدة/مملوكة/
 * ترقية بمبلغٍ مستحقّ) كما كانت تحسبها، والحارس الملزم يبقى في
 * `requestProductOrder`. هذا المكوّن يعرض ويختار، ولا يقرّر سعرًا.
 *
 * ── ولماذا نافذة تأكيد قبل الطلب ────────────────────────────────────
 * الطلب يُنشأ فور النقر، ثمّ ينتقل الطالب إلى صفحته. نقرةٌ واحدة كانت
 * تكفي لإنشاء طلبٍ معلّق لم يقصده. النافذة تُري المقرر والباقة والمبلغ
 * قبل أن يُكتب شيء، وتقول ما سيحدث بعدها بالضبط.
 * ═══════════════════════════════════════════════════════════════════
 */

export type OfferLesson = {
  id: string;
  number: number;
  title: string;
  duration: string | null;
  isFree: boolean;
};

export type OfferTier = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  priceFils: number;
  state: "new" | "owned" | "upgrade";
  /** المستحقّ فعلًا — يساوي السعر إلا في الترقية */
  dueFils: number;
  best: boolean;
  savingFils: number;
  lessonIds: string[];
};

export function CourseOffer({
  courseSlug,
  courseId,
  courseTitle,
  lessons,
  tiers,
  signedIn,
  children,
}: {
  courseSlug: string;
  courseId: string;
  courseTitle: string;
  lessons: OfferLesson[];
  tiers: OfferTier[];
  signedIn: boolean;
  /** رأس المقرر — يُصيَّر على الخادم ويجلس أعلى العمود الرئيسيّ */
  children: React.ReactNode;
}) {
  /* الافتراضيّ: الأوفر ما لم يُملَك، ثمّ أوّل ما لم يُملَك */
  const initial =
    tiers.find((t) => t.best && t.state !== "owned") ??
    tiers.find((t) => t.state !== "owned") ??
    tiers[0];

  const [selectedId, setSelectedId] = React.useState(initial?.id ?? "");
  const [confirming, setConfirming] = React.useState(false);

  const tier = tiers.find((t) => t.id === selectedId) ?? initial;
  const tierLessons = tier ? lessons.filter((l) => tier.lessonIds.includes(l.id)) : [];

  const action = tier && (
    <PrimaryAction tier={tier} courseId={courseId} onRequest={() => setConfirming(true)} />
  );

  return (
    <div>
      <div className="grid items-start gap-6 min-[1060px]:grid-cols-[minmax(0,1fr)_minmax(300px,372px)] min-[1060px]:gap-[46px]">
        <div className="min-w-0">
          {children}

          <h2 className="mt-10 text-[15px] font-semibold tracking-[-0.02em] sm:mt-[52px] sm:text-[1.375rem] sm:tracking-[-0.026em]">
            اختر باقتك
          </h2>
          <p className="mt-1 text-[11.5px] text-subtle sm:mt-2 sm:text-[13px]">
            الباقات متداخلة — اشترِ ما تحتاجه الآن، وترقَّ إلى الكاملة لاحقًا بفرق السعر.
          </p>

          {tiers.length === 0 ? (
            <p className="mt-5 rounded-card border border-dashed border-line bg-panel/40 px-6 py-10 text-center text-sm text-subtle">
              لم تُطرح باقات هذا المقرر بعد.
            </p>
          ) : (
            <div
              role="group"
              aria-label="باقات المقرر"
              className="mt-5 grid gap-2.5 pt-2 sm:mt-[26px] sm:grid-cols-[repeat(auto-fit,minmax(190px,1fr))] sm:gap-3.5"
            >
              {tiers.map((t) => (
                <TierCard
                  key={t.id}
                  tier={t}
                  on={t.id === tier?.id}
                  onSelect={() => setSelectedId(t.id)}
                />
              ))}
            </div>
          )}

          {tier && (
            <section
              aria-live="polite"
              className="mt-4 rounded-[14px] border border-line-soft bg-panel p-3.5 sm:mt-6 sm:rounded-card sm:p-5"
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-xs font-semibold sm:text-[13px]">دروس {tier.title}</h3>
                <span className="text-[11px] text-subtle sm:text-xs">
                  <Counted n={tierLessons.length} {...LESSON_FORMS} />
                </span>
              </div>

              {tierLessons.length === 0 ? (
                <p className="mt-3 text-xs text-subtle">لم تُسنَد دروسٌ إلى هذه الباقة بعد.</p>
              ) : (
                /* `key` يعيد الدخول المتعاقب مع كل اختيار: القائمة تبدّلت */
                <ol key={tier.id} className="mt-2.5 flex flex-col gap-0.5 sm:mt-3.5">
                  {tierLessons.map((lesson, i) => (
                    <li
                      key={lesson.id}
                      className={cn(
                        "anim-rise flex min-h-10 items-center gap-2.5 rounded-[10px] border px-2.5 sm:min-h-12 sm:gap-3.5 sm:rounded-field sm:px-3.5",
                        lesson.isFree ? "border-accent/25 bg-accent/7" : "border-transparent",
                      )}
                      style={{ animationDelay: `${Math.min(i * 35, 420)}ms` }}
                    >
                      <span className="min-w-4 text-[10.5px] text-subtle sm:min-w-5 sm:text-xs">
                        <Num>{lesson.number}</Num>
                      </span>
                      <span className="min-w-0 flex-1 text-[12.5px] sm:text-sm">{lesson.title}</span>
                      {lesson.isFree && (
                        <span className="text-[10.5px] font-medium text-accent sm:text-[11px]">مجاني</span>
                      )}
                      {lesson.duration && (
                        <span className="text-[10.5px] text-subtle sm:text-xs">
                          <Num>{lesson.duration}</Num>
                        </span>
                      )}
                    </li>
                  ))}
                </ol>
              )}
            </section>
          )}
        </div>

        <aside className="rounded-[18px] border border-line-soft bg-panel p-4 sm:rounded-[22px] sm:p-[26px] min-[1060px]:sticky min-[1060px]:top-24">
          {/* ملخّص الباقة والزرّ على الحاسوب وحده — الهاتف يحملهما في
              الشريط اللاصق أسفل الشاشة، فلا يتكرّر الفعل مرّتين. */}
          {tier && (
            <div className="hidden min-[1060px]:block">
              <p className="text-xs text-subtle">الباقة المختارة</p>
              <p className="mt-1.5 text-[1.1875rem] font-semibold">{tier.title}</p>
              <p className="mt-2">
                <Price fils={tier.dueFils} className="[&_b]:text-[2rem] [&_b]:font-bold" />
              </p>
              <p className="mt-1 text-[12.5px] text-muted">
                <Counted n={tier.lessonIds.length} {...LESSON_FORMS} />
                {tier.state === "upgrade" && " · بعد خصم ما تملكه"}
              </p>
              <div className="mt-5">{action}</div>
              <div className="my-5 h-px bg-line-soft" aria-hidden="true" />
            </div>
          )}

          <p className="text-xs text-subtle">كيف يتمّ الدفع</p>
          <ol className="mt-3 flex flex-col gap-3">
            {[
              "تؤكّد طلبك فيُنشأ برقمٍ خاصّ بك، وتجد في صفحته رابط واتساب جاهزًا بتفاصيله.",
              "تتّفق مع الإدارة على التحويل ببنفت داخل المحادثة.",
              "يُفتح المقرر في «مقرراتي» فور تأكيد التحويل.",
            ].map((step, i) => (
              <li key={step} className="flex items-start gap-3">
                <span
                  aria-hidden="true"
                  className={cn(
                    "grid size-[22px] shrink-0 place-items-center rounded-full border text-[11px]",
                    i === 2
                      ? "border-spark/40 bg-spark/15 text-spark"
                      : "border-line bg-panel-high/40 text-muted",
                  )}
                >
                  <Num>{i + 1}</Num>
                </span>
                <span className="text-[13px] font-light leading-[1.8] text-muted">{step}</span>
              </li>
            ))}
          </ol>
        </aside>
      </div>

      {/* ── الشريط اللاصق على الهاتف ─────────────────────────────────
          `sticky` لا `fixed`: يلتصق بأسفل الشاشة ما دام المحتوى تحته،
          ويتوقّف عند نهايته فلا يغطّي التذييل. وهو خارج الشبكة عمدًا —
          عنصرُ الشبكة لا يلتصق خارج خانته. */}
      {tier && (
        <div className="sticky bottom-0 z-30 -mx-3.5 mt-6 border-t border-line-soft bg-ink/95 px-3.5 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur-md sm:-mx-8 sm:px-8 min-[1060px]:hidden">
          <div className="mb-2.5 flex items-baseline justify-between gap-3">
            <span className="truncate text-xs text-subtle">{tier.title}</span>
            <Price fils={tier.dueFils} className="[&_b]:text-[19px] [&_b]:font-bold" />
          </div>
          {action}
          <p className="mt-2 text-center text-[10.5px] text-subtle">
            تحويلٌ ببنفت عبر واتساب، ويُفتح المقرر فور تأكيده
          </p>
        </div>
      )}

      {confirming && tier && tier.state !== "owned" && (
        <ConfirmDialog
          tier={tier}
          courseTitle={courseTitle}
          courseSlug={courseSlug}
          signedIn={signedIn}
          onClose={() => setConfirming(false)}
        />
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function TierCard({
  tier,
  on,
  onSelect,
}: {
  tier: OfferTier;
  on: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onSelect}
      className={cn(
        "relative flex flex-col items-start gap-1.5 rounded-[14px] border px-3.5 py-4 text-start sm:rounded-card sm:px-[22px] sm:py-6",
        "transition-[translate,background-color,border-color,box-shadow] duration-[340ms] ease-spring",
        on
          ? "-translate-y-[5px] border-spark/45 bg-panel-lift shadow-[0_18px_40px_-28px_color-mix(in_srgb,var(--color-spark)_55%,transparent)]"
          : "border-line-soft bg-panel hover:border-line",
      )}
    >
      {tier.best && (
        <span className="absolute -top-[11px] start-[22px] rounded-full bg-spark px-3 py-1 text-[11px] font-semibold text-on-spark">
          الأوفر
        </span>
      )}

      <span className="flex w-full items-center justify-between gap-3">
        <span className="text-[14.5px] font-semibold sm:text-[15px]">{tier.title}</span>
        <span
          aria-hidden="true"
          className={cn(
            "size-[18px] shrink-0 rounded-full border-2 transition-[background-color,border-color,scale] duration-300 ease-spring",
            on
              ? "scale-110 border-spark bg-spark shadow-[inset_0_0_0_3px_var(--color-panel-lift)]"
              : "border-line",
          )}
        />
      </span>

      {tier.description && (
        <span className="text-[11.5px] leading-[1.7] text-subtle sm:text-xs">{tier.description}</span>
      )}

      <span className="mt-2 flex flex-wrap items-baseline gap-x-2 sm:mt-3">
        <Price
          fils={tier.dueFils}
          className="[&_b]:text-[22px] [&_b]:font-bold sm:[&_b]:text-[27px]"
        />
        {/* السعر الكامل مشطوبًا بجانب المستحقّ: الفرق هو الحجّة */}
        {tier.state === "upgrade" && (
          <s className="text-xs text-subtle">
            <Num>{arPrice(formatFils(tier.priceFils))}</Num>
          </s>
        )}
      </span>

      <span className="text-[11.5px] text-muted sm:text-xs">
        <Counted n={tier.lessonIds.length} {...LESSON_FORMS} />
      </span>

      {tier.state === "owned" && (
        <span className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-success">
          <Check size={13} strokeWidth={2.5} aria-hidden="true" />
          تملكها
        </span>
      )}
      {tier.state === "upgrade" && (
        <span className="mt-1.5 text-xs font-medium text-spark">ترقية بفرق السعر</span>
      )}
      {tier.state === "new" && tier.savingFils > 0 && (
        <span className="mt-1.5 text-xs font-medium text-spark">
          توفّر <Num>{arPrice(formatFils(tier.savingFils))}</Num> د.ب
        </span>
      )}
    </button>
  );
}

function PrimaryAction({
  tier,
  courseId,
  onRequest,
}: {
  tier: OfferTier;
  courseId: string;
  onRequest: () => void;
}) {
  if (tier.state === "owned") {
    /* مملوكة: لا زرّ شراء معطّل يُجرَّب ليُكتشف أنه لا يعمل — بل الباب
       إلى ما اشتراه، وهو ما يريده هنا. */
    return (
      <Link
        href={`/learn/${courseId}`}
        className="press flex min-h-[52px] w-full items-center justify-center gap-2 rounded-field border border-success/40 bg-success/10 text-[15px] font-semibold text-success"
      >
        ادخل إلى المقرر
        <ArrowLeft size={15} strokeWidth={2} aria-hidden="true" />
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onRequest}
      className="press flex min-h-[52px] w-full items-center justify-center gap-2 rounded-field bg-action text-[15px] font-semibold text-on-accent
        transition-[translate,box-shadow] duration-[240ms] ease-spring
        hover:-translate-y-0.5 hover:shadow-[0_16px_34px_-22px_color-mix(in_srgb,var(--color-action)_50%,transparent)]"
    >
      {tier.state === "upgrade" ? "أكمل الترقية عبر واتساب" : "أكمل الطلب عبر واتساب"}
    </button>
  );
}

function ConfirmDialog({
  tier,
  courseTitle,
  courseSlug,
  signedIn,
  onClose,
}: {
  tier: OfferTier;
  courseTitle: string;
  courseSlug: string;
  signedIn: boolean;
  onClose: () => void;
}) {
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();
  const confirmRef = React.useRef<HTMLButtonElement>(null);
  const dialogRef = React.useRef<HTMLDivElement>(null);

  /* التركيز إلى الفعل، ومنع تمرير الصفحة خلف النافذة، ثمّ إعادة كل
     شيء كما كان عند الإغلاق. */
  React.useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    confirmRef.current?.focus();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
      opener?.focus?.();
    };
  }, []);

  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !pending) onClose();
      if (event.key !== "Tab" || !dialogRef.current) return;
      const items = [
        ...dialogRef.current.querySelectorAll<HTMLElement>("button:not([disabled])"),
      ];
      if (items.length === 0) return;
      const first = items[0]!;
      const last = items[items.length - 1]!;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose, pending]);

  function onConfirm() {
    setError(null);
    startTransition(async () => {
      /* عند النجاح يرمي الإجراء تحويلًا (إلى صفحة الطلب، أو إلى التسجيل
         لمن لا حساب له) فلا يعود بقيمة. */
      const result = await requestPurchase(courseSlug, tier.slug);
      if (result && !result.ok) setError(result.error);
    });
  }

  /* بوّابة إلى `body`: الصفحة العامة داخل `PageTransition` المتحرّك،
     و`transform` على سلفٍ يجعل `position: fixed` يُحسب عليه لا على
     النافذة — فتخرج «النافذة» بحجم الصفحة لا بحجم الشاشة. */
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-6">
      <button
        type="button"
        aria-label="إغلاق"
        tabIndex={-1}
        onClick={() => !pending && onClose()}
        className="anim-fade absolute inset-0 cursor-default bg-black/70 backdrop-blur-[5px]"
      />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="order-confirm-title"
        className="order-dialog relative w-full max-w-[440px] rounded-t-[22px] border-t border-line bg-panel px-[18px] pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-[22px]
          shadow-[0_40px_90px_-50px_rgb(0_0_0/0.9)] sm:rounded-[22px] sm:border sm:p-[30px]"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-spark">تأكيد الطلب</span>
          <button
            type="button"
            onClick={onClose}
            disabled={pending}
            aria-label="إغلاق"
            className="press -me-2.5 grid size-11 place-items-center rounded-full text-subtle hover:text-paper disabled:opacity-50"
          >
            <X size={18} strokeWidth={1.75} aria-hidden="true" />
          </button>
        </div>

        <h3
          id="order-confirm-title"
          className="text-[1.0625rem] font-semibold tracking-[-0.024em] sm:text-[1.25rem]"
        >
          راجع طلبك قبل إنشائه
        </h3>

        <dl className="mt-4 flex flex-col gap-2.5 rounded-[14px] border border-line-soft bg-panel-lift px-4 py-4 text-[13px] sm:mt-5 sm:text-[13.5px]">
          <div className="flex justify-between gap-4">
            <dt className="text-subtle">المقرر</dt>
            <dd className="text-end">{courseTitle}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-subtle">الباقة</dt>
            <dd>{tier.title}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-subtle">الدروس</dt>
            <dd>
              <Counted n={tier.lessonIds.length} {...LESSON_FORMS} />
            </dd>
          </div>
          <div className="h-px bg-line-soft" aria-hidden="true" />
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-subtle">
              {tier.state === "upgrade" ? "المستحقّ بعد الخصم" : "الإجمالي"}
            </dt>
            <dd>
              <Price fils={tier.dueFils} className="[&_b]:text-[20px] [&_b]:font-bold" />
            </dd>
          </div>
        </dl>

        <p className="mt-4 text-[12.5px] font-light leading-[1.8] text-subtle">
          {signedIn
            ? "يُنشأ الطلب الآن معلّقًا وتنتقل إلى صفحته، وفيها رابط واتساب برقمه. الدفع ببنفت داخل المحادثة، ويُفتح المقرر فور تأكيده."
            : "ستُنشئ حسابًا أوّلًا — دقيقةٌ واحدة — ثمّ تعود إلى هذه الصفحة لتُكمل الطلب."}
        </p>

        {error && (
          <p role="alert" className="mt-3 text-xs leading-relaxed text-danger">
            {error}
          </p>
        )}

        <div className="mt-5 flex gap-2.5">
          <button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            disabled={pending}
            className="press flex min-h-12 flex-1 items-center justify-center gap-2 rounded-field bg-action text-[14.5px] font-semibold text-on-accent disabled:cursor-not-allowed disabled:opacity-70"
          >
            {pending ? (
              <>
                <Loader2 size={15} className="animate-spin" aria-hidden="true" />
                جارٍ إنشاء الطلب
              </>
            ) : signedIn ? (
              "أنشئ الطلب"
            ) : (
              "أنشئ حسابًا للمتابعة"
            )}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={pending}
            className="press min-h-12 rounded-field border border-line px-5 text-sm text-muted hover:border-accent-deep hover:text-paper disabled:opacity-50"
          >
            تراجع
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
