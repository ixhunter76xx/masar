"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { motion } from "motion/react";

import { Label, Input, HelpText, type InputProps } from "@/components/ui/Field";
import { estimateStrength, type StrengthLevel } from "@/lib/password-strength";
import { DUR, EASE, SPRING } from "@/lib/motion";
import { cn } from "@/lib/utils";

export interface PasswordFieldProps
  extends Omit<InputProps, "id" | "type"> {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  /** يعرض مؤشّر القوة — للإنشاء والتغيير لا لتسجيل الدخول */
  showStrength?: boolean;
  /** يُخفي التسمية بصريًا ويُبقيها لقارئ الشاشة — للحقول داخل صفّ */
  hideLabel?: boolean;
}

/**
 * حقل كلمة مرور بزرّ إظهار/إخفاء، ومؤشّر قوة اختياري.
 *
 * ── الإظهار ليس رفاهية ───────────────────────────────────────────────
 * على الهاتف تُكتب كلمة المرور بلوحة مفاتيح صغيرة ولا يُرى ما كُتب، وهو
 * سبب شائع لفشل الدخول المتكرّر ثم قفل الحساب. الزرّ يحلّ ذلك، وهو
 * توصية NIST الصريحة.
 *
 * `type` وحده يتبدّل — الحقل نفسه لا يُعاد تركيبه، فلا يفقد التركيز ولا
 * موضع المؤشّر عند الضغط.
 * ─────────────────────────────────────────────────────────────────────
 */
export const PasswordField = React.forwardRef<
  HTMLInputElement,
  PasswordFieldProps
>(function PasswordField(
  {
    id,
    label,
    hint,
    error,
    showStrength = false,
    hideLabel = false,
    onChange,
    ...inputProps
  },
  ref,
) {
  const [visible, setVisible] = React.useState(false);
  const [value, setValue] = React.useState("");

  /**
   * تصفير المؤشّر عند تفريغ النموذج.
   *
   * `form.reset()` يمسح قيمة الحقل في DOM لكنه **لا يُطلق `change`**،
   * فتبقى حالة المؤشّر هنا على آخر قيمة كُتبت. أثر ذلك مرئي: بعد إنشاء
   * حساب بنجاح يفرغ الحقل ويبقى تحته "ضعيفة" — تقييم لكلمة لم تعد
   * موجودة. الاستماع لحدث `reset` على النموذج المالك يحلّها.
   *
   * `visible` يعود إلى الإخفاء أيضًا: نموذج جديد يبدأ بحقل مغطّى.
   */
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    const form = inputRef.current?.form;
    if (!form) return;

    const onReset = () => {
      setValue("");
      setVisible(false);
    };
    form.addEventListener("reset", onReset);
    return () => form.removeEventListener("reset", onReset);
  }, []);

  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const strengthId = showStrength ? `${id}-strength` : undefined;

  const strength = showStrength ? estimateStrength(value) : null;

  return (
    <div>
      <Label htmlFor={id} className={hideLabel ? "sr-only" : undefined}>
        {label}
      </Label>

      <div className="relative">
        <Input
          id={id}
          ref={(node) => {
            inputRef.current = node;
            if (typeof ref === "function") ref(node);
            else if (ref) ref.current = node;
          }}
          type={visible ? "text" : "password"}
          invalid={Boolean(error)}
          aria-describedby={cn(errorId, hintId, strengthId) || undefined}
          onChange={(event) => {
            if (showStrength) setValue(event.target.value);
            onChange?.(event);
          }}
          /* مساحة للزرّ على جهة النهاية — منطقية فتنقلب مع الاتجاه */
          className="pe-12"
          {...inputProps}
        />

        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          /* aria-pressed لا aria-label متبدّل: قارئ الشاشة يعلن الحالة
             بدل أن يبدو الزرّ وكأنه تغيّر إلى زرّ آخر */
          aria-pressed={visible}
          aria-controls={id}
          aria-label="إظهار كلمة المرور"
          title={visible ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
          className="press absolute inset-y-0 end-0 grid w-11 place-items-center
            rounded-e-[10px] text-subtle hover:text-paper"
        >
          {visible ? (
            <EyeOff size={17} strokeWidth={1.75} aria-hidden="true" />
          ) : (
            <Eye size={17} strokeWidth={1.75} aria-hidden="true" />
          )}
        </button>
      </div>

      {strength && <StrengthMeter id={strengthId!} {...strength} />}

      {error ? (
        <HelpText id={errorId} tone="danger" role="alert">
          {error}
        </HelpText>
      ) : hint ? (
        <HelpText id={hintId}>{hint}</HelpText>
      ) : null}
    </div>
  );
});

/* -------------------------------------------------------------------------- */

const BAR_COLOR: Record<StrengthLevel, string> = {
  0: "bg-danger",
  1: "bg-warning",
  2: "bg-action",
  3: "bg-success",
};

/**
 * مؤشّر القوة — **عرض بحت**.
 *
 * لا يستقبل أي دالة ولا يصدر أي حدث، فلا يستطيع منع إرسال ولا تعطيل
 * زرّ حتى لو أراد مطوّر لاحق ذلك سهوًا. كلمة ضعيفة تُرسل كما تُرسل
 * القوية؛ القرار للمستخدم، والحدّ الأدنى الفعلي على الخادم وحده.
 *
 * `aria-live="polite"` لا `assertive`: يُعلَن التغيّر عند توقّف الكتابة
 * لا مع كل حرف.
 */
function StrengthMeter({
  id,
  level,
  label,
  hint,
}: {
  id: string;
  level: StrengthLevel;
  label: string;
  hint: string | null;
}) {
  return (
    <div id={id} className="mt-2.5" aria-live="polite">
      <div className="flex items-center gap-2">
        <div className="flex flex-1 gap-1" aria-hidden="true">
          {[0, 1, 2, 3].map((index) => (
            <span
              key={index}
              className="h-1 flex-1 overflow-hidden rounded-full bg-line"
            >
              <motion.span
                className={cn("block h-full origin-[inline-start]", BAR_COLOR[level])}
                initial={false}
                animate={{ scaleX: index <= level ? 1 : 0 }}
                transition={SPRING.soft}
              />
            </span>
          ))}
        </div>

        <motion.span
          key={label}
          initial={{ opacity: 0, y: -3 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: DUR.fast, ease: EASE.out }}
          className="text-[11px] text-muted"
        >
          {label}
        </motion.span>
      </div>

      {hint && <p className="mt-1.5 text-[11px] text-subtle">{hint}</p>}
      <span className="sr-only">قوة كلمة المرور: {label}. مؤشّر إرشادي فقط.</span>
    </div>
  );
}
