import Link from "next/link";
import { MessageSquare } from "lucide-react";

import { Card } from "@/components/ui/Card";
import { CountBadge } from "@/components/ui/Badge";
import { StaggerList, StaggerItem } from "@/components/motion/Stagger";
import { relativeTime } from "@/lib/format";
import type { ConversationSummary } from "@/lib/messages";

/**
 * قائمة محادثات — تخدم صندوق الوارد وقائمة طلاب المقرر معًا.
 *
 * `showCourse` يفرّق بينهما: في صندوق الوارد يحتاج القارئ اسم المقرر
 * ليعرف السياق، وداخل المقرر يكون تكرارًا في كل سطر.
 */
export function ConversationList({
  conversations,
  showCourse = false,
}: {
  conversations: ConversationSummary[];
  showCourse?: boolean;
}) {
  return (
    <StaggerList className="space-y-3">
      {conversations.map((conversation) => (
        <StaggerItem key={`${conversation.courseId}:${conversation.studentId}`}>
          <Card className="lift hover:border-accent-deep">
            <Link
              href={`/courses/${conversation.courseId}/messages/${conversation.studentId}`}
              className="flex gap-4 px-5 py-4"
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-full border border-line bg-ink text-accent">
                <MessageSquare size={17} strokeWidth={1.75} aria-hidden="true" />
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium text-paper">
                    {conversation.peerName}
                  </span>
                  <CountBadge count={conversation.unread} />
                </div>

                {showCourse && (
                  <p className="mt-0.5 text-xs text-subtle">
                    <span className="numeric">{conversation.courseCode}</span>
                    {" — "}
                    {conversation.courseTitle}
                  </p>
                )}

                <p className="mt-1.5 truncate text-[13px] text-muted">
                  {conversation.lastBody ?? "لا رسائل بعد"}
                </p>
              </div>

              {conversation.lastAt && (
                <time
                  dateTime={conversation.lastAt.toISOString()}
                  className="shrink-0 self-start text-[11px] text-subtle"
                >
                  {relativeTime(conversation.lastAt)}
                </time>
              )}
            </Link>
          </Card>
        </StaggerItem>
      ))}
    </StaggerList>
  );
}
