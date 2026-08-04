import { formatFils } from "@/lib/price";
import { cn } from "@/lib/utils";

/**
 * سعر معروض — الرقم كبير والعملة صغيرة هادئة.
 *
 * التباين الحجمي بينهما مقصود: العين تقرأ الرقم أولًا، والعملة معلومة
 * تكميلية لا تنافسه. وكلاهما `numeric` فتتحاذى الأسعار عموديًا في العمود.
 */
export function Price({
  fils,
  size = "md",
  className,
}: {
  fils: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const scale = {
    sm: "text-base",
    md: "text-xl",
    lg: "text-[1.625rem] leading-none",
  }[size];

  return (
    <span className={cn("inline-flex items-baseline gap-1.5", className)}>
      <b className={cn("numeric font-semibold tracking-[-0.03em]", scale)}>
        {formatFils(fils)}
      </b>
      <span className="text-xs text-muted">د.ب</span>
    </span>
  );
}
