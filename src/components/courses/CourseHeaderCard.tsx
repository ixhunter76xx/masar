import { UserRound, Users, CalendarRange } from "lucide-react";

import { Card } from "@/components/ui/Card";
import { CourseTabs } from "@/components/courses/CourseTabs";
import { TermStatus } from "@/generated/prisma/enums";
import type { CourseDetail } from "@/lib/data/courses";
import type { CourseTabCounts } from "@/lib/course-tabs";

/** رأس المقرر: الرمز، العنوان، الوصف، البيانات، ثم شريط التبويبات */
export function CourseHeaderCard({
  course,
  counts,
}: {
  course: CourseDetail;
  counts: CourseTabCounts;
}) {
  const archived = course.term.status === TermStatus.ARCHIVED;

  return (
    <Card className="mb-6 overflow-hidden">
      <div className="px-5 pt-5">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-lg font-bold text-paper">{course.title}</h2>
          <span className="numeric shrink-0 text-xs text-accent">
            {course.code}
          </span>
        </div>

        {archived && (
          <span className="mt-2 inline-block rounded-full border border-line px-2 py-0.5 text-[10px] text-subtle">
            فصل مؤرشف
          </span>
        )}

        {course.description && (
          <p className="mt-3 text-[13px] leading-relaxed text-muted">
            {course.description}
          </p>
        )}

        <dl className="mt-5 grid gap-4 text-[13px] sm:grid-cols-3">
          <Meta icon={CalendarRange} label="الفصل" value={course.term.name} />
          <Meta icon={UserRound} label="المدرب" value={course.instructor.name} />
          <Meta
            icon={Users}
            label="عدد الطلاب"
            value={String(course._count.enrollments)}
            numeric
          />
        </dl>
      </div>

      <div className="mt-5 border-t border-line px-2">
        <CourseTabs courseId={course.id} counts={counts} />
      </div>
    </Card>
  );
}

function Meta({
  icon: Icon,
  label,
  value,
  numeric = false,
}: {
  icon: typeof UserRound;
  label: string;
  value: string;
  numeric?: boolean;
}) {
  return (
    <div>
      <dt className="flex items-center gap-1.5 text-[11px] text-subtle">
        <Icon size={13} strokeWidth={1.75} aria-hidden="true" />
        {label}
      </dt>
      <dd className={`mt-1 text-paper ${numeric ? "numeric" : ""}`}>{value}</dd>
    </div>
  );
}
