import { cn } from "@/lib/utils";

/**
 * عدّاد دائري صغير.
 * قاعدة التصميم: يظهر **فقط** عند وجود عناصر تتطلب إجراءً من المستخدم.
 */
export function CountBadge({
  count,
  tone = "neutral",
  className,
}: {
  count: number;
  tone?: "neutral" | "danger";
  className?: string;
}) {
  if (count <= 0) return null;

  return (
    <span
      className={cn(
        "inline-flex min-w-[22px] h-[22px] items-center justify-center",
        "rounded-full px-1.5 numeric text-[11px] leading-none",
        tone === "danger"
          ? "bg-danger text-paper"
          : "bg-line text-muted",
        className,
      )}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}
