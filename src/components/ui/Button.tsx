import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "quiet" | "danger";
type Size = "sm" | "md" | "lg";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  /** يعرض حالة انتظار ويعطّل الزر */
  loading?: boolean;
  fullWidth?: boolean;
}

const variants: Record<Variant, string> = {
  // أساسي: أزرق رمادي مُشبَع ونص داكن — يفتحّ عند hover ويغمق عند الضغط
  primary:
    "bg-action text-ink hover:bg-accent-bright active:bg-action-active " +
    "disabled:bg-disabled disabled:text-panel",
  // ثانوي: سطح داكن بحدود
  secondary:
    "bg-panel text-paper border border-line hover:border-accent-deep " +
    "hover:bg-[#16212d] active:bg-panel disabled:text-disabled disabled:hover:border-line",
  // هادئ: بلا خلفية
  quiet:
    "bg-transparent text-muted hover:text-paper hover:bg-panel " +
    "disabled:text-disabled disabled:hover:bg-transparent",
  // خطر: إطار أحمر
  danger:
    "bg-transparent text-danger border border-danger hover:bg-danger " +
    "hover:text-paper disabled:border-disabled disabled:text-disabled disabled:hover:bg-transparent",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-[13px]",
  md: "h-11 px-5 text-sm", // 44px = الحد الأدنى لمساحة اللمس
  lg: "h-12 px-6 text-[15px]",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      className,
      variant = "primary",
      size = "md",
      loading = false,
      fullWidth = false,
      disabled,
      children,
      type = "button",
      ...props
    },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-[10px]",
          "font-medium whitespace-nowrap select-none",
          "press",
          "disabled:cursor-not-allowed",
          variants[variant],
          sizes[size],
          fullWidth && "w-full",
          className,
        )}
        {...props}
      >
        {loading && <Spinner />}
        {children}
      </button>
    );
  },
);

function Spinner() {
  return (
    <svg
      className="size-4 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="2.5"
        opacity="0.25"
      />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
