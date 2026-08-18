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
    <Card className="grid justify-items-center gap-[0.7rem] px-6 py-[3.2rem] text-center">
      <span className="grid size-[54px] place-items-center rounded-[17px] border border-line bg-[var(--sunk)] text-subtle">
        <Icon size={22} strokeWidth={1.5} aria-hidden="true" />
      </span>
      <p className="max-w-[34ch] text-sm font-medium text-paper">{title}</p>
      <p className="max-w-[34ch] text-[13px] leading-relaxed text-muted">
        {description}
      </p>

      {action && (
        <Link
          href={action.href}
          className="press mt-2 inline-flex min-h-touch items-center rounded-field
            bg-action px-5 text-sm font-medium text-ink hover:bg-accent-bright"
        >
          {action.label}
        </Link>
      )}
    </Card>
  );
}
