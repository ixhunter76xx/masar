import { OrderStatus } from "@/generated/prisma/enums";
import { cn } from "@/lib/utils";

/**
 * تسمية حالة الطلب.
 *
 * النصوص من زاوية الطالب لا من زاوية قاعدة البيانات: `PENDING` عنده
 * ليست «معلّق» بل «بانتظار الدفع» — أي أن الكرة في ملعبه، وهذا ما
 * يحتاج معرفته.
 */
const LABELS: Record<OrderStatus, { text: string; tone: string }> = {
  [OrderStatus.PENDING]: {
    text: "بانتظار الدفع",
    tone: "border-warning/50 bg-warning/10 text-warning",
  },
  [OrderStatus.PAID]: {
    text: "مدفوع — الوصول مفتوح",
    tone: "border-success/50 bg-success/10 text-success",
  },
  [OrderStatus.CANCELLED]: {
    text: "ملغى",
    tone: "border-line bg-panel text-subtle",
  },
  [OrderStatus.FAILED]: {
    text: "فشل الدفع",
    tone: "border-danger/50 bg-danger/10 text-danger",
  },
  [OrderStatus.REFUNDED]: {
    text: "مسترجَع",
    tone: "border-line bg-panel text-muted",
  },
};

export function OrderStatusBadge({
  status,
  className,
}: {
  status: OrderStatus;
  className?: string;
}) {
  const { text, tone } = LABELS[status];

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full border px-2.5 py-[0.3rem] text-[11px] font-medium",
        tone,
        className,
      )}
    >
      {text}
    </span>
  );
}
