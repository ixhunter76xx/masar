import Link from "next/link";
import { ClipboardList, CalendarClock, CheckCircle2 } from "lucide-react";

import { Card } from "@/components/ui/Card";
import { AssignmentStatus } from "@/generated/prisma/enums";
import { relativeTime } from "@/lib/format";
import type { AssignmentSummary } from "@/lib/data/assignments";

const STATUS: Record<AssignmentStatus, { text: string; className: string }> = {
  DRAFT: { text: "مسودة", className: "border-line text-warning" },
  PUBLISHED: { text: "متاح", className: "border-success/40 text-success" },
  CLOSED: { text: "مغلق", className: "border-line text-disabled" },
};

export function AssignmentList({
  assignments,
  courseId,
  canManage,
}: {
  assignments: AssignmentSummary[];
  courseId: string;
  canManage: boolean;
}) {
  return (
    <ol className="space-y-3">
      {assignments.map((a) => (
        <li key={a.id}>
          <Card className="transition-colors hover:border-accent-deep">
            <Link
              href={`/courses/${courseId}/assignments/${a.id}`}
              className="flex gap-4 px-5 py-4"
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-full border border-line bg-ink text-accent">
                <ClipboardList size={17} strokeWidth={1.75} aria-hidden="true" />
                <span className="sr-only">واجب</span>
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium leading-snug text-paper">
                    {a.title}
                  </p>
                  {canManage && (
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] ${STATUS[a.status].className}`}>
                      {STATUS[a.status].text}
                    </span>
                  )}
                  {a.mySubmission && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-success/40 px-2 py-0.5 text-[10px] text-success">
                      <CheckCircle2 size={10} strokeWidth={2} aria-hidden="true" />
                      {a.mySubmission.earnedPoints !== null ? "مُصحَّح" : "سُلِّم"}
                    </span>
                  )}
                </div>

                {a.description && (
                  <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-muted">
                    {a.description}
                  </p>
                )}

                <p className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-disabled">
                  <span>
                    <span className="numeric">{a.totalPoints}</span> درجة
                  </span>
                  {a.dueAt && (
                    <span className="inline-flex items-center gap-1">
                      <CalendarClock size={12} strokeWidth={1.75} aria-hidden="true" />
                      التسليم {relativeTime(a.dueAt)}
                    </span>
                  )}
                  {canManage && (
                    <span>
                      <span className="numeric">{a.submissionCount}</span> تسليم
                    </span>
                  )}
                  {a.mySubmission?.earnedPoints !== null &&
                    a.mySubmission !== null && (
                      <span className="numeric text-success">
                        {a.mySubmission.earnedPoints} / {a.totalPoints}
                      </span>
                    )}
                </p>
              </div>
            </Link>
          </Card>
        </li>
      ))}
    </ol>
  );
}
