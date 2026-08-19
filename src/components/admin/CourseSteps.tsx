import Link from "next/link";
import { Check } from "lucide-react";

import { Num } from "@/components/ui/Num";
import { countWord } from "@/lib/numerals";

/**
 * خطوات إعداد المقرر — مرسومةً **مسارًا**، لا أربع بطاقات.
 *
 * ── لماذا مسار ──────────────────────────────────────────────────────
 * المنتج اسمه «مسار»، والمعاينة المعتمدة تبني الكتالوج على محطّات
 * متّصلة بسكّة. فإعداد المقرر — وهو أربع خطوات مرتّبة لا يجوز قلبها —
 * أولى ما يُرسم بذلك اللسان: السكّة تقول إن هناك ترتيبًا، والمحطة
 * المضاءة تقول أين أنت منه. وأربع بطاقات متجاورة تقول «أربعة أشياء
 * افعلها» ولا تقول أيّها أوّلًا.
 *
 * ── والترتيب تفرضه البيانات لا الذوق ────────────────────────────────
 * الباقة تشير إلى دروس فلا تُبنى قبلها، والنشر يحتاج باقةً منشورة فلا
 * يسبقها. فالسكّة هنا تصف قيدًا حقيقيًّا، لا زينةً على قائمة.
 *
 * ⚠ ولا `spark` هنا: القاعدة تحجزه للإنجاز والتقدّم. المحطة التالية
 * تأخذ `accent-bright` — «أين أنت» موضعٌ لا إنجاز.
 */
export function CourseSteps({
  lessonCount,
  productCount,
  publishedProductCount,
  isPublished,
}: {
  lessonCount: number;
  productCount: number;
  publishedProductCount: number;
  isPublished: boolean;
}) {
  const steps = [
    {
      id: "details",
      label: "البيانات",
      hint: <>الاسم والرمز والكلية</>,
      done: true,
    },
    {
      id: "lessons",
      label: "مسار الدروس",
      hint:
        lessonCount > 0 ? (
          <>
            <Num>{lessonCount}</Num> {countWord(lessonCount, "دروس", "درسًا")}
          </>
        ) : (
          <>أضِف العناوين — بلا فيديو</>
        ),
      done: lessonCount > 0,
    },
    {
      id: "products",
      label: "الباقات",
      hint:
        productCount > 0 ? (
          <>
            <Num>{productCount}</Num> {countWord(productCount, "باقات", "باقة")}
          </>
        ) : (
          <>قسّمها وسعّرها</>
        ),
      done: productCount > 0,
    },
    {
      id: "publish",
      label: "النشر",
      hint: isPublished ? (
        <>ظاهر في الكتالوج</>
      ) : publishedProductCount > 0 ? (
        <>جاهز للنشر</>
      ) : (
        <>انشر باقةً أولًا</>
      ),
      done: isPublished,
    },
  ];

  const nextIndex = steps.findIndex((s) => !s.done);
  const doneCount = steps.filter((s) => s.done).length;

  return (
    <section
      aria-label="خطوات إعداد المقرر"
      className="mb-7 rounded-card border border-line bg-panel px-5 py-4"
    >
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-[13px] font-medium text-paper">إعداد المقرر</h2>
        <p className="text-[11.5px] text-subtle">
          {nextIndex === -1 ? (
            <span className="text-success">اكتمل — المقرر منشور</span>
          ) : (
            <>
              <Num>{doneCount}</Num> من <Num>{steps.length}</Num> ·{" "}
              <span className="text-accent-bright">
                التالي: {steps[nextIndex].label}
              </span>
            </>
          )}
        </p>
      </div>

      {/* السكّة: أربع محطّات على خطٍّ واحد.
          `minmax(0,1fr)` لا `1fr` — الحدّ الأدنى الضمنيّ يدفع الشبكة خارج
          الصفحة متى طال نصّ محطّة. */}
      <ol className="grid grid-cols-[repeat(4,minmax(0,1fr))] gap-x-1">
        {steps.map((step, index) => {
          const isNext = index === nextIndex;
          const isLast = index === steps.length - 1;

          return (
            <li key={step.id} className="relative min-w-0">
              {/* وصلة السكّة إلى المحطة التالية — تبدأ من مركز العقدة.
                  `start-1/2` منطقيّ: يمين في RTL بلا قلب يدويّ. */}
              {!isLast && (
                <span
                  aria-hidden="true"
                  className={
                    "absolute top-[11px] -z-0 h-px w-full start-1/2 " +
                    (step.done ? "bg-accent-deep/55" : "bg-line-soft")
                  }
                />
              )}

              <Link
                href={`#${step.id}`}
                aria-current={isNext ? "step" : undefined}
                className="press group relative z-10 flex flex-col items-center gap-1.5 rounded-field px-1 py-1 text-center"
              >
                <span
                  aria-hidden="true"
                  className={
                    "grid size-[23px] shrink-0 place-items-center rounded-full border text-[10px] font-semibold transition-colors " +
                    (step.done
                      ? "border-accent-deep/60 bg-accent-deep/20 text-accent"
                      : isNext
                        ? "node-live border-accent-bright/70 bg-ink text-accent-bright"
                        : "border-line-soft bg-ink text-subtle")
                  }
                >
                  {step.done ? (
                    <Check size={12} strokeWidth={2.5} />
                  ) : (
                    <Num>{index + 1}</Num>
                  )}
                </span>

                <span className="min-w-0">
                  <span
                    className={
                      "block truncate text-[12px] transition-colors " +
                      (step.done || isNext
                        ? "text-paper"
                        : "text-subtle group-hover:text-muted")
                    }
                  >
                    {step.label}
                  </span>
                  <span className="mt-0.5 block truncate text-[10.5px] leading-[1.5] text-subtle">
                    {step.hint}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
