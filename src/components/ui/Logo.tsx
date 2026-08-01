import Image from "next/image";
import { cn } from "@/lib/utils";

/** شكل مربّع الهوية المحيط بالشعار */
type LogoShape = "square" | "circle";

/**
 * أي نسخة من الشعار تُعرض:
 * - `full` الشعار الكامل: الرمز + كتابة "مركز حساب للتعليم والتدريب"
 * - `mark` الرمز وحده بلا كتابة
 * - `auto` (الافتراضي) يختار حسب المقاس
 */
type LogoVariant = "auto" | "full" | "mark";

/**
 * الحد الذي تصبح تحته كتابة الشعار غير مقروءة، فنكتفي بالرمز.
 * الشعار الكامل مخصّص لشاشة الدخول والأحجام الكبيرة فقط.
 */
const FULL_LOGO_MIN_SIZE = 64;

const SOURCES: Record<Exclude<LogoVariant, "auto">, string> = {
  full: "/logo-hisab.png",
  mark: "/logo-hisab-mark.png",
};

export function Logo({
  size = 80,
  shape = "square",
  variant = "auto",
  className,
}: {
  size?: number;
  shape?: LogoShape;
  variant?: LogoVariant;
  className?: string;
}) {
  const resolved =
    variant === "auto"
      ? size >= FULL_LOGO_MIN_SIZE
        ? "full"
        : "mark"
      : variant;

  // الرمز وحده أعرض من الشعار الكامل نسبيًا، فيأخذ نسبة أصغر من المربّع
  const ratio = resolved === "mark" ? 0.68 : 0.8;
  const inner = Math.round(size * ratio);

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center shrink-0",
        shape === "circle" ? "rounded-full" : "rounded-[14px]",
        "bg-gradient-to-b from-accent-bright to-accent",
        "border border-accent-bright/25",
        className,
      )}
      style={{ width: size, height: size }}
    >
      <Image
        src={SOURCES[resolved]}
        alt="شعار مركز حساب للتعليم والتدريب"
        width={inner}
        height={inner}
        priority
        className="object-contain"
        style={{ width: inner, height: inner }}
      />
    </span>
  );
}
