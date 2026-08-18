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
        "inline-flex min-w-5 h-5 items-center justify-center",
        "rounded-full px-[0.35rem] numeric text-[0.66rem] font-semibold leading-none",
        tone === "danger"
          ? "bg-danger/20 text-danger"
          : "bg-panel-high text-muted",
        className,
      )}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}
