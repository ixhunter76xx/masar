import { CourseCard } from "@/components/courses/CourseCard";
import { TermStatus } from "@/generated/prisma/enums";
import type { TermGroup } from "@/lib/data/courses";
import { formatDateRange } from "@/lib/format";

export function TermSection({ group }: { group: TermGroup }) {
  const archived = group.status === TermStatus.ARCHIVED;

  return (
    <section className="mb-8 last:mb-0">
      <div className="mb-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 className="text-sm font-medium text-paper">{group.termName}</h2>

        <span className="text-[11px] text-disabled">
          {formatDateRange(group.startsOn, group.endsOn)}
        </span>

        {archived && (
          <span className="rounded-full border border-line px-2 py-0.5 text-[10px] text-disabled">
            مؤرشف
          </span>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {group.courses.map((course) => (
          <CourseCard key={course.id} course={course} archived={archived} />
        ))}
      </div>
    </section>
  );
}
