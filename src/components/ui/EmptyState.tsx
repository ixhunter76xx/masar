import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/Card";

export function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
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
    </Card>
  );
}
