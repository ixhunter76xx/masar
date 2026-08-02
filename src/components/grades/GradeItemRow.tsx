import Link from "next/link";
import { FileQuestion, ClipboardList } from "lucide-react";

import { Card } from "@/components/ui/Card";
import { relativeTime } from "@/lib/format";
import type { GradeItem } from "@/lib/data/grades";

export function GradeItemRow({ item }: { item: GradeItem }) {
  const Icon = item.kind === "quiz" ? FileQuestion : ClipboardList;
  const pct =
    item.totalPoints > 0
      ? Math.round((item.earnedPoints / item.totalPoints) * 100)
      : 0;

  return (
    <Card className="transition-colors hover:border-accent-deep">
      <Link href={item.href} className="flex items-center gap-4 px-5 py-3">
        <span className="grid size-8 shrink-0 place-items-center rounded-full border border-line bg-ink text-accent">
          <Icon size={15} strokeWidth={1.75} aria-hidden="true" />
          <span className="sr-only">
            {item.kind === "quiz" ? "اختبار" : "واجب"}
          </span>
        </span>

        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] text-paper">{item.title}</p>
          <p className="mt-0.5 text-[11px] text-subtle">
            {relativeTime(item.gradedAt)}
            {item.isLate && <span className="ms-2 text-warning">متأخر</span>}
          </p>
        </div>

        <p className="shrink-0 text-end">
          <span className="numeric text-sm font-medium text-paper">
            {item.earnedPoints}
          </span>
          <span className="text-subtle"> / </span>
          <span className="numeric text-sm text-muted">{item.totalPoints}</span>
          <span className="numeric block text-[11px] text-subtle">
            {pct}%
          </span>
        </p>
      </Link>
    </Card>
  );
}
