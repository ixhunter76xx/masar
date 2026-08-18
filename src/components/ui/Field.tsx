"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/* ==========================================================================
   الحقول — منقولة من معرض الحالات في المعاينة المعتمدة
   (`design/vision/index.html` السطور ٦٢٦-٦٧٥ على فرع `masar-vision`).

   المعرض هناك ليس شاشةً تُعرض، بل **المرجع** الذي تُشتقّ منه النماذج
   الثلاثة عشر: عادي · تلميح · خطأ · معطَّل · منطقة نصّ · قائمة · مربّع
   اختيار.  الشكل نفسه يعيش في `.input-field` في `globals.css` صنفًا
   واحدًا، وهذه الملفّات تركّبه — فلا يُخترع تصميم الحقل من جديد مع كل
   نموذج، وهو ما حدث فعلًا قبل هذا النقل.
   ========================================================================== */

/* -------------------------------------------------------------------------- */
/*  Label                                                                      */
/* -------------------------------------------------------------------------- */

export function Label({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("block text-[13px] font-medium text-muted mb-1.5", className)}
      {...props}
    />
  );
}

/* -------------------------------------------------------------------------- */
/*  Input                                                                      */
/* -------------------------------------------------------------------------- */

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
  /** يستخدم خط Mono — للأرقام والمعرّفات */
  numeric?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  function Input({ className, invalid, numeric, disabled, ...props }, ref) {
    return (
      <input
        ref={ref}
        disabled={disabled}
        /* `aria-invalid` هو ما يلوّن الحدّ في `.input-field` — الحالة
           تُقال لقارئ الشاشة وللعين من مصدرٍ واحد، فلا تفترقان. */
        aria-invalid={invalid || undefined}
        className={cn("input-field", numeric && "numeric text-start", className)}
        {...props}
      />
    );
  },
);

/* -------------------------------------------------------------------------- */
/*  Textarea                                                                   */
/* -------------------------------------------------------------------------- */

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ className, invalid, ...props }, ref) {
    return (
      <textarea
        ref={ref}
        aria-invalid={invalid || undefined}
        className={cn("input-field", className)}
        {...props}
      />
    );
  },
);

/* -------------------------------------------------------------------------- */
/*  Select                                                                     */
/* -------------------------------------------------------------------------- */

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  function Select({ className, invalid, children, ...props }, ref) {
    return (
      <select
        ref={ref}
        aria-invalid={invalid || undefined}
        className={cn("input-field", className)}
        {...props}
      >
        {children}
      </select>
    );
  },
);

/* -------------------------------------------------------------------------- */
/*  HelpText                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * نصّ المساعدة أو الخطأ.
 *
 * ⚠ **الخطأ لا يُقال باللون وحده.** من لا يميّز الأحمر يجب أن يعرف أن
 * هذا خطأ لا تلميح، فيسبقه رمزٌ صريح — وهو شرط WCAG 1.4.1 لا زينة.
 * الرمز `aria-hidden` لأن `role="alert"` على الفقرة يُعلن النصّ نفسه،
 * فإعلان «علامة تعجّب» فوقه ضجيج.
 */
export function HelpText({
  tone = "muted",
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement> & {
  tone?: "muted" | "danger";
}) {
  const danger = tone === "danger";

  return (
    <p
      className={cn(
        "mt-1.5 text-[0.74rem] leading-[1.7]",
        danger
          ? "flex items-start gap-1.5 text-danger"
          : "text-subtle",
        className,
      )}
      {...props}
    >
      {danger && (
        <span
          aria-hidden="true"
          className="mt-[0.15rem] grid size-3.5 shrink-0 place-items-center
            rounded-full bg-danger text-[0.6rem] font-bold text-ink"
        >
          !
        </span>
      )}
      {danger ? <span>{children}</span> : children}
    </p>
  );
}

/* -------------------------------------------------------------------------- */
/*  FormField — يجمع التسمية والحقل ونص المساعدة                                */
/* -------------------------------------------------------------------------- */

export interface FormFieldProps extends Omit<InputProps, "id"> {
  id: string;
  label: string;
  hint?: string;
  error?: string;
}

export const FormField = React.forwardRef<HTMLInputElement, FormFieldProps>(
  function FormField({ id, label, hint, error, ...inputProps }, ref) {
    const hintId = hint ? `${id}-hint` : undefined;
    const errorId = error ? `${id}-error` : undefined;

    return (
      <div>
        <Label htmlFor={id}>{label}</Label>
        <Input
          id={id}
          ref={ref}
          invalid={Boolean(error)}
          aria-describedby={cn(errorId, hintId) || undefined}
          {...inputProps}
        />
        {/* التلميح يشرح والخطأ يصحّح — ولا يظهران معًا */}
        {error ? (
          <HelpText id={errorId} tone="danger" role="alert">
            {error}
          </HelpText>
        ) : hint ? (
          <HelpText id={hintId}>{hint}</HelpText>
        ) : null}
      </div>
    );
  },
);

/* -------------------------------------------------------------------------- */
/*  Checkbox                                                                   */
/* -------------------------------------------------------------------------- */

export const Checkbox = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { label: string }
>(function Checkbox({ className, label, id, ...props }, ref) {
  return (
    /* الحد الأدنى ٤٤ بكسل ارتفاعًا: المربع نفسه ١٨ بكسل بصريًا، والتسمية
       تحمله فتصير هي منطقة اللمس. `-my-2` يلغي الارتفاع الزائد من تدفّق
       التخطيط فلا يتغيّر شكل النموذج. */
    <label
      htmlFor={id}
      className="group inline-flex min-h-touch -my-2 items-center gap-2.5
        cursor-pointer select-none"
    >
      <span className="relative inline-flex shrink-0">
        <input
          ref={ref}
          id={id}
          type="checkbox"
          className={cn(
            "peer appearance-none size-[18px] rounded-[5px]",
            "bg-ink border border-line",
            "field-motion",
            "hover:border-accent-deep",
            "checked:bg-action checked:border-action",
            "disabled:cursor-not-allowed disabled:border-line disabled:bg-panel",
            className,
          )}
          {...props}
        />
        <svg
          className="pointer-events-none absolute inset-0 size-[18px] p-[2px] text-ink opacity-0 peer-checked:opacity-100"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="m5 13 4 4L19 7"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span className="text-[0.82rem] text-muted group-hover:text-paper transition-colors">
        {label}
      </span>
    </label>
  );
});
