"use client";

import { useEffect, useRef, useState } from "react";

import { BOARD_EXAMPLES } from "@/lib/board-examples";
import { cn } from "@/lib/utils";

const ROTATE_MS = 7200;

/**
 * لوح الدرس — بطلُ الكتالوج.
 *
 * ── لماذا الشرحُ نفسه هو الصورة ─────────────────────────────────────
 * البديل المعتاد مشهدٌ يصوّر الجوّ: طالبٌ وليلٌ ومصباح. والجوّ لا يقول
 * ماذا نبيع، والزائر يعرف شكل مكتبه أصلًا. أما الشرح المعروض بحجمه
 * الكامل فهو **الدليل داخل الوعد**: يرى المرء جودة التدريس قبل أن
 * يدفع، لا صورةً عن مكان التدريس.
 *
 * ── ⚠ الارتفاع ثابت ─────────────────────────────────────────────────
 * الحالات الثلاث تختلف في طولها، وبلا حدٍّ أدنى يقفز الأبطل كلّه كلّ
 * ٧ ثوانٍ — وقفزةٌ دورية تُقرأ رخيصة مهما حَسُن ما بداخلها.
 *
 * ── والنقاط أزرار ───────────────────────────────────────────────────
 * فلا ينتظر أحد سبع ثوانٍ ليرى التالي. وكلّ تدخّل يدويّ يعيد ضبط
 * المؤقّت، وإلا قفز اللوح بعد النقر بلحظة.
 */
export function LessonBoard() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    /* احترام تفضيل تقليل الحركة: الدوران التلقائي حركةٌ لا يطلبها
       المستخدم، والنقاط تبقى فيتصفّح من يريد بيده. */
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (still || paused) return;

    timer.current = setInterval(
      () => setIndex((i) => (i + 1) % BOARD_EXAMPLES.length),
      ROTATE_MS,
    );
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [paused, index]);

  const example = BOARD_EXAMPLES[index];

  return (
    <div
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* بركة ضوء المصباح — تبقى من المشهد الذي حلّ اللوح محلّه، لأنها
          كانت أنجح ما فيه. والانسكاب من `blur` لا من إزاحة سالبة: تلك
          تزيد `scrollWidth` للصفحة، وهذا يرسم خارج الصندوق بلا أثر. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-x-0 -top-[18%] -bottom-[26%] blur-xl
          [background:radial-gradient(58%_46%_at_78%_-8%,color-mix(in_srgb,var(--color-warning)_28%,transparent),transparent_68%),radial-gradient(92%_66%_at_52%_44%,color-mix(in_srgb,var(--color-panel-high)_50%,transparent),transparent_74%)]"
      />

      <article
        key={index}
        className="animate-[boardIn_620ms_var(--ease-out)_both] relative flex min-h-[clamp(390px,44vw,480px)]
          flex-col rounded-[24px] p-6 sm:p-7
          shadow-[inset_0_1px_0_color-mix(in_srgb,var(--color-warning)_24%,transparent),0_46px_68px_-36px_var(--shadow-lift),0_12px_28px_-18px_var(--shadow)]
          [background:radial-gradient(120%_92%_at_80%_-12%,color-mix(in_srgb,var(--color-warning)_12%,transparent),transparent_58%),linear-gradient(166deg,var(--color-panel-high)_0%,var(--color-panel)_58%,var(--color-ink-lift)_100%)]"
      >
        <header className="mb-4 flex items-center gap-2 pb-3 text-[11px] shadow-[0_1px_0_color-mix(in_srgb,var(--color-paper)_9%,transparent)]">
          <span className="size-1.5 shrink-0 rounded-full bg-accent shadow-[0_0_0_4px_color-mix(in_srgb,var(--color-accent)_15%,transparent)]" />
          <span className="code text-accent">{example.code}</span>
          {/* `muted` لا `subtle`: الترويسة تقع على `panel-high`، وهو
              أفتح سطح في النظام، فيهبط `subtle` عليه دون العتبة. */}
          <span className="text-muted">{example.faculty}</span>
          <span className="ms-auto text-muted">{example.topic}</span>
        </header>

        <p className="mb-4 text-[13px] text-subtle">{example.lead}</p>

        <div className="flex min-h-0 flex-1 flex-col justify-center">
          {example.kind === "parse" ? (
            <>
              {/* التقسيم على المسافات لا داخل الكلمة، فلا وصل ينكسر */}
              <div className="flex flex-wrap items-start gap-x-8 gap-y-6">
                {example.words.map((w, i) => (
                  <span
                    key={w.word}
                    className="grid animate-[pwIn_520ms_var(--ease-out)_both] justify-items-center gap-2"
                    style={{ animationDelay: `${200 + i * 280}ms` }}
                  >
                    <span className="font-amiri text-[clamp(2.2rem,4.8vw,3.5rem)] leading-[1.18] text-paper">
                      {w.word}
                    </span>
                    <span className="h-[0.95rem] w-px [background:linear-gradient(180deg,color-mix(in_srgb,var(--color-paper)_32%,transparent),transparent)]" />
                    <span className="max-w-[11ch] text-center text-[11.5px] leading-[1.7] text-muted">
                      {w.ruling}
                    </span>
                  </span>
                ))}
              </div>
              <p className="mt-6 text-[13px] leading-[1.95] text-muted">{example.tail}</p>
            </>
          ) : (
            <>
              <code className="code block rounded-field bg-[var(--sunk)] px-3.5 py-3 text-[clamp(0.95rem,1.9vw,1.2rem)] text-paper">
                {example.expr}
              </code>
              <ol className="mt-4 grid gap-2">
                {example.steps.map((s, i) => (
                  <li
                    key={s}
                    className="flex animate-[pwIn_460ms_var(--ease-out)_both] items-start gap-2.5
                      text-[13px] leading-[1.8] text-muted"
                    style={{ animationDelay: `${420 + i * 300}ms` }}
                  >
                    <span className="mt-[0.66rem] size-1 shrink-0 rounded-full bg-accent-deep" />
                    <span dangerouslySetInnerHTML={{ __html: s }} />
                  </li>
                ))}
              </ol>
              {/* ⚠ الناتج بلون التمييز لا بالعنبر: العنبر محجوز
                  للتقدّم والإنجاز، و«نتيجة صحيحة» ليست تقدّمًا. */}
              <div className="mt-4 flex items-center gap-2.5 pt-3.5 shadow-[0_-1px_0_color-mix(in_srgb,var(--color-paper)_8%,transparent)]">
                <span className="text-[11px] text-subtle">{example.resultLabel}</span>
                <span className="code text-[15px] font-semibold text-accent-bright">
                  {example.result}
                </span>
              </div>
            </>
          )}
        </div>
      </article>

      <div className="mt-1 flex justify-center gap-1.5">
        {BOARD_EXAMPLES.map((ex, i) => (
          <button
            key={ex.code}
            type="button"
            onClick={() => setIndex(i)}
            aria-label={`${ex.faculty} — ${ex.topic}`}
            aria-current={i === index ? "true" : undefined}
            /* الحشو يرفع مساحة اللمس إلى ٤٤px والنقطة نفسها ٦px.
               قِسْتُها أولًا فكانت ٢٦×٣٨ — فوق حدّ WCAG الأدنى ودون
               عرف المشروع (`min-h-touch`)، فرُفعت إليه. */
            className="-mx-1 -my-1 grid min-h-touch place-items-center px-3.5 py-5"
          >
            <span
              className={cn(
                "block h-1.5 rounded-full transition-all duration-200",
                i === index ? "w-[18px] bg-accent" : "w-1.5 bg-line",
              )}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
