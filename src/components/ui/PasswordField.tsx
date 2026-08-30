"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";

import { Label, Input, HelpText, type InputProps } from "@/components/ui/Field";
import { estimateStrength, type StrengthLevel } from "@/lib/password-strength";
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
          className="pe-[3.1rem]"
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
          /* مربّع ٤٠px مركّزٌ رأسيًّا داخل الحقل، لا شريطٌ ملتصق بحافّته:
             الحقل ٤٦px فالزرّ يطفو داخله بهامشٍ ظاهر.  و`rounded-field`
             رمزٌ لا رقمٌ مكتوب — نصف القطر يتغيّر من مكانٍ واحد. */
          className="press absolute end-[0.3rem] top-1/2 grid size-10 -translate-y-1/2
            place-items-center rounded-field text-subtle
            transition-colors hover:bg-panel-lift hover:text-paper"
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
              <span
                /* ⚠ `origin-[inline-start]` كان هنا، و`inline-start`
                   **قيمةٌ غير صالحة** لـ`transform-origin`: الخاصّية
                   لا تقبل الكلمات المنطقية أصلًا. فكان المتصفّح
                   يرفضها صامتًا ويعود إلى المركز — أي أن كل شريحةٍ
                   كانت تنمو من منتصفها إلى الطرفين بدل أن تمتلئ من
                   بداية السطر. مقيسٌ في المتصفّح: `50px 5px`.

                   والمنصّة RTL مثبَّتة في وسم `<html>`، فالبداية
                   يمينًا و`origin-right` هي الصحيحة صراحةً. */
                className={cn(
                  "block h-full origin-right transition-transform duration-[320ms] ease-[var(--ease-out)]",
                  BAR_COLOR[level],
                )}
                style={{ transform: `scaleX(${index <= level ? 1 : 0})` }}
              />
            </span>
          ))}
        </div>

        <span key={label} className="strength-label text-[11px] text-muted">
          {label}
        </span>
      </div>

      {hint && <p className="mt-1.5 text-[11px] text-subtle">{hint}</p>}
      <span className="sr-only">قوة كلمة المرور: {label}. مؤشّر إرشادي فقط.</span>
    </div>
  );
}
