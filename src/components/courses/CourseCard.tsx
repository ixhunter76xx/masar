import Link from "next/link";
import { UserRound, Users } from "lucide-react";

import { Card } from "@/components/ui/Card";
import type { CourseSummary } from "@/lib/data/courses";

export function CourseCard({
  course,
  archived = false,
}: {
  course: CourseSummary;
  archived?: boolean;
}) {
  return (
    <Card
      className={
        archived
          ? "transition-colors hover:border-accent-deep/60 opacity-75 hover:opacity-100"
          : "transition-colors hover:border-accent-deep"
      }
    >
      <Link href={`/courses/${course.id}`} className="block px-5 py-4">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="truncate text-sm font-medium text-paper">
            {course.title}
          </h3>
          <span className="numeric shrink-0 text-[11px] text-subtle">
            {course.code}
          </span>
        </div>

        {course.description && (
          <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-muted">
            {course.description}
          </p>
        )}

        <div className="mt-3.5 flex items-center gap-4 border-t border-line pt-3 text-[11px] text-subtle">
          <span className="inline-flex items-center gap-1.5">
            <UserRound size={13} strokeWidth={1.75} aria-hidden="true" />
            {course.instructorName}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Users size={13} strokeWidth={1.75} aria-hidden="true" />
            <span className="numeric">{course.studentCount}</span>
            <span>طالب</span>
          </span>
        </div>
      </Link>
    </Card>
  );
}
