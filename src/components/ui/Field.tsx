"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/*  Label                                                                      */
/* -------------------------------------------------------------------------- */

export function Label({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("block text-[13px] text-muted mb-2", className)}
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
        aria-invalid={invalid || undefined}
        className={cn(
          "w-full h-11 px-4 rounded-[10px]",
          "bg-ink text-paper text-sm",
          "border border-line",
          "placeholder:text-disabled",
          "transition-colors duration-150",
          "hover:border-accent-deep",
          "focus:border-accent focus:outline-none",
          "focus-visible:outline-none",
          "disabled:bg-panel disabled:text-disabled disabled:border-line",
          "disabled:cursor-not-allowed disabled:hover:border-line",
          invalid &&
            "border-danger hover:border-danger focus:border-danger",
          numeric && "numeric text-start",
          className,
        )}
        {...props}
      />
    );
  },
);

/* -------------------------------------------------------------------------- */
/*  HelpText                                                                   */
/* -------------------------------------------------------------------------- */

export function HelpText({
  tone = "muted",
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement> & {
  tone?: "muted" | "danger";
}) {
  return (
    <p
      className={cn(
        "mt-2 text-xs leading-relaxed",
        tone === "danger" ? "text-danger" : "text-subtle",
        className,
      )}
      {...props}
    />
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
    <label
      htmlFor={id}
      className="group inline-flex items-center gap-2.5 cursor-pointer select-none"
    >
      <span className="relative inline-flex shrink-0">
        <input
          ref={ref}
          id={id}
          type="checkbox"
          className={cn(
            "peer appearance-none size-[18px] rounded-[5px]",
            "bg-ink border border-line",
            "transition-colors duration-150",
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
      <span className="text-[13px] text-muted group-hover:text-paper transition-colors">
        {label}
      </span>
    </label>
  );
});
