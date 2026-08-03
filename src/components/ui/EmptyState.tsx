import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/Card";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  /** دعوة اختيارية لفعل يُخرج المستخدم من الحالة الفارغة */
  action?: { href: string; label: string };
}) {
  return (
    <Card className="flex flex-col items-center px-6 py-14 text-center">
      <span className="grid size-12 place-items-center rounded-full border border-line bg-ink text-subtle">
        <Icon size={22} strokeWidth={1.5} aria-hidden="true" />
      </span>
      <p className="mt-4 text-sm font-medium text-paper">{title}</p>
      <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-muted">
        {description}
      </p>

      {action && (
        <Link
          href={action.href}
          className="press mt-5 inline-flex min-h-touch items-center rounded-[10px]
            bg-action px-5 text-sm font-medium text-ink hover:bg-accent-bright"
        >
          {action.label}
        </Link>
      )}
    </Card>
  );
}
