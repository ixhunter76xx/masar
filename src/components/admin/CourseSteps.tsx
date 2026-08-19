import Link from "next/link";
import { Check } from "lucide-react";

import { Num } from "@/components/ui/Num";

/**
 * دليل الخطوات — «ماذا أفعل الآن؟» مكتوبًا لا مستنتَجًا.
 *
 * ── العلّة التي وُجد لها ─────────────────────────────────────────────
 * أنشأ المالك مقررًا ثم وقف: الشاشة عرضت نماذج ولم تقل أيّها أوّلًا.
 * والترتيب هنا ليس ذوقًا بل تفرضه البيانات — الباقة تشير إلى دروس، فلا
 * تُبنى قبلها؛ والنشر يحتاج باقةً منشورة، فلا يسبقها.
 *
 * فالمكوّن يقرأ حالة المقرر ويقول الخطوة التالية بالاسم، ويربطها
 * بقسمها في الصفحة نفسها — لا بصفحة أخرى.
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
      label: "بيانات المقرر",
      hint: "الاسم والرمز والكلية والوصف",
      done: true,
    },
    {
      id: "lessons",
      label: "مسار الدروس",
      hint:
        lessonCount > 0
          ? `${lessonCount} درسًا في المسار`
          : "أضِف عناوين الدروس — بلا رفع فيديو",
      done: lessonCount > 0,
    },
    {
      id: "products",
      label: "الباقات وأسعارها",
      hint:
        productCount > 0
          ? `${productCount} باقة`
          : "قسّم الدروس إلى باقات وسعّرها",
      done: productCount > 0,
    },
    {
      id: "publish",
      label: "النشر",
      hint: isPublished
        ? "المقرر ظاهر في الكتالوج"
        : publishedProductCount > 0
          ? "جاهز للنشر"
          : "انشر باقةً واحدة على الأقل أولًا",
      done: isPublished,
    },
  ];

  const next = steps.find((s) => !s.done);

  return (
    <div className="mb-6 rounded-card border border-line bg-panel px-5 py-4">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-sm font-medium text-paper">خطوات إعداد المقرر</h2>
        {next ? (
          <p className="text-[12px] text-spark">
            التالي: <span className="font-semibold">{next.label}</span>
          </p>
        ) : (
          <p className="text-[12px] text-success">اكتمل الإعداد — المقرر منشور.</p>
        )}
      </div>

      <ol className="grid gap-2 sm:grid-cols-2">
        {steps.map((step, index) => {
          const isNext = next?.id === step.id;
          return (
            <li key={step.id}>
              <Link
                href={`#${step.id}`}
                className={
                  "flex items-start gap-3 rounded-field border px-3 py-2.5 transition-colors " +
                  (step.done
                    ? "border-line-soft bg-[var(--sunk)]"
                    : isNext
                      ? "border-spark/45 bg-spark/[0.06]"
                      : "border-line-soft opacity-70 hover:opacity-100")
                }
              >
                <span
                  aria-hidden="true"
                  className={
                    "mt-0.5 grid size-5 shrink-0 place-items-center rounded-full text-[10px] font-semibold " +
                    (step.done
                      ? "bg-success/20 text-success"
                      : isNext
                        ? "bg-spark/20 text-spark"
                        : "bg-panel-high text-subtle")
                  }
                >
                  {step.done ? <Check size={12} strokeWidth={3} /> : <Num>{index + 1}</Num>}
                </span>

                <span className="min-w-0">
                  <span className="block text-[13px] text-paper">{step.label}</span>
                  <span className="mt-0.5 block text-[11px] leading-[1.6] text-subtle">
                    {step.hint}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
