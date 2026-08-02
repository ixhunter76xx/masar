import Link from "next/link";

import { Card } from "@/components/ui/Card";
import { relativeTime } from "@/lib/format";
import { ACTIVITY_META, type ActivityEvent } from "@/lib/data/activity";
import { cn } from "@/lib/utils";
import { StaggerList, StaggerItem } from "@/components/motion/Stagger";

const TONE_CLASSES = {
  neutral: "text-accent border-line",
  warning: "text-warning border-warning/30",
  success: "text-success border-success/30",
} as const;

export function ActivityFeed({ events }: { events: ActivityEvent[] }) {
  return (
    <StaggerList className="space-y-3">
      {events.map((event) => {
        const meta = ACTIVITY_META[event.kind];
        const Icon = meta.icon;
        const href =
          event.href ??
          (event.kind === "announcement"
            ? `/courses/${event.courseId}/announcements`
            : `/courses/${event.courseId}`);

        return (
          <StaggerItem key={event.id}>
            <Card className="lift hover:border-accent-deep">
              <Link href={href} className="flex gap-4 px-5 py-4">
                <span
                  className={cn(
                    "grid size-9 shrink-0 place-items-center rounded-full border bg-ink",
                    TONE_CLASSES[meta.tone],
                  )}
                >
                  <Icon size={17} strokeWidth={1.75} aria-hidden="true" />
                  <span className="sr-only">{meta.label}</span>
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-medium leading-snug text-paper">
                      {event.title}
                    </p>
                    <time
                      dateTime={event.at.toISOString()}
                      className="shrink-0 text-[11px] text-subtle"
                    >
                      {relativeTime(event.at)}
                    </time>
                  </div>

                  <p className="mt-1 text-xs text-accent">{event.course}</p>

                  {event.detail && (
                    <p className="mt-2 line-clamp-2 whitespace-pre-line text-[13px] leading-relaxed text-muted">
                      {event.detail}
                    </p>
                  )}
                </div>
              </Link>
            </Card>
          </StaggerItem>
        );
      })}
    </StaggerList>
  );
}
