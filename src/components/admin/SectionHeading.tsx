import { Num } from "@/components/ui/Num";

/**
 * ترويسة قسم في مساحة عمل المقرر.
 *
 * ── لماذا تشبه محطّات السكّة أعلى الصفحة ────────────────────────────
 * السكّة تقول «أربع خطوات وأنت في الثانية»، ثم كانت الأقسام تحتها
 * عناوين رمادية متشابهة الوزن لا يربطها بالسكّة شيء إلا رقمٌ مكتوب
 * باليد داخل النصّ («١ · بيانات المقرر»). فالمستخدم يقرأ نظامين لا
 * نظامًا واحدًا.
 *
 * فالعقدة هنا هي عقدة المحطّة نفسها: المقاس نفسه، والحدّ نفسه، والرقم
 * بالأرقام العربية نفسها. حين ينزل النظر من السكّة إلى القسم يجد
 * الشكل الذي غادره — وذلك ما يجعل الصفحة تُقرأ لوحةً واحدة.
 *
 * ── والعدّ في شارة لا في النصّ ──────────────────────────────────────
 * كان العدد يُطبع ملاصقًا للعنوان («الوصول السارِي ٠»)، فيُقرأ الصفرُ
 * علامةَ ترقيم لا رقمًا. الشارة تفصله وتمنحه خلفيةً، فيصير عددًا.
 */
export function SectionHeading({
  step,
  title,
  count,
  description,
  id,
}: {
  /** رقم الخطوة — يقابل محطّتها في السكّة أعلى الصفحة */
  step?: number;
  title: string;
  count?: number;
  description?: string;
  id?: string;
}) {
  return (
    <div id={id} className="mb-3 scroll-mt-24">
      <div className="flex flex-wrap items-center gap-2.5">
        {step !== undefined && (
          <span
            aria-hidden="true"
            className="grid size-[23px] shrink-0 place-items-center rounded-full
              border border-line-soft bg-ink text-[10px] font-semibold text-subtle"
          >
            <Num>{step}</Num>
          </span>
        )}

        <h3 className="text-[13.5px] font-medium text-paper">{title}</h3>

        {count !== undefined && (
          <span className="rounded-full border border-line-soft bg-[var(--sunk)] px-2 py-0.5 text-[10.5px] text-subtle">
            <Num>{count}</Num>
          </span>
        )}
      </div>

      {description && (
        /* المقاس محدود بـ`65ch`: سطرٌ أطول من ذلك يُتعب العين في العودة
           إلى بدايته، والنصّ هنا شارح لا عنوان. */
        <p className="mt-1.5 max-w-[65ch] text-[12px] leading-[1.85] text-subtle [text-wrap:pretty]">
          {description}
        </p>
      )}
    </div>
  );
}
