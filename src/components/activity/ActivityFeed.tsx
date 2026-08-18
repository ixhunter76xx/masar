import Link from "next/link";

import { relativeTime } from "@/lib/format";
import { ar } from "@/lib/numerals";
import { ACTIVITY_META, type ActivityEvent } from "@/lib/data/activity";
import { cn } from "@/lib/utils";
import { StaggerList, StaggerItem } from "@/components/motion/Stagger";

const TONE_CLASSES = {
  neutral: "text-accent",
  warning: "text-warning",
  success: "text-success",
} as const;

export function ActivityFeed({ events }: { events: ActivityEvent[] }) {
  return (
    <StaggerList className="space-y-[0.55rem]">
      {events.map((event) => {
        const meta = ACTIVITY_META[event.kind];
        const Icon = meta.icon;
        const href =
          event.href ??
          (event.kind === "announcement"
            ? `/learn/${event.courseId}/announcements`
            : `/learn/${event.courseId}`);

        return (
          <StaggerItem key={event.id}>
            <Link
              href={href}
              className="flex items-start gap-[0.85rem] rounded-field border border-line-soft bg-[var(--sunk-2)] px-[1.05rem] py-[0.9rem] transition-colors hover:border-accent-deep"
            >
                <span
                  className={cn(
                    "grid size-[30px] shrink-0 place-items-center rounded-[9px] border border-line bg-[var(--sunk)]",
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
                      {/* الأرقام تُعرَّب في درجةٍ ولّدها التطبيق («٤ من ٤»)، ولا
                          تُمسّ في إعلانٍ أو رسالةٍ كتبها إنسان: تعريب رقمٍ
                          داخل نصّ المستخدم يغيّر ما كتبه. */}
                      {event.kind === "grade" ? ar(event.detail) : event.detail}
                    </p>
                  )}
                </div>
            </Link>
          </StaggerItem>
        );
      })}
    </StaggerList>
  );
}
