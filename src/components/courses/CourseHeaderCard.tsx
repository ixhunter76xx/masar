import { UserRound, Hash } from "lucide-react";

import { Card } from "@/components/ui/Card";
import { CourseTabs } from "@/components/courses/CourseTabs";
/** يُمرَّر من `requireCourseAccess` — لا فصل دراسي في مسار */
type CourseHeader = {
  id: string;
  code: string;
  title: string;
  summary: string | null;
  description: string | null;
  presenter: { name: string } | null;
};
import type { CourseTabCounts } from "@/lib/course-tabs";

/** رأس المقرر: الرمز، العنوان، الوصف، البيانات، ثم شريط التبويبات */
export function CourseHeaderCard({
  course,
  counts,
}: {
  course: CourseHeader;
  counts: CourseTabCounts;
}) {

  return (
    <Card className="mb-6 overflow-hidden">
      <div className="px-5 pt-5">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-lg font-bold text-paper">{course.title}</h2>
          <span className="numeric shrink-0 text-xs text-accent">
            {course.code}
          </span>
        </div>

        {course.description && (
          <p className="mt-3 text-[13px] leading-relaxed text-muted">
            {course.description}
          </p>
        )}

        <dl className="mt-5 grid gap-4 text-[13px] sm:grid-cols-3">
          <Meta icon={UserRound} label="المقدّم" value={course.presenter?.name ?? ""} />
          {/* عدد الطلاب أُزيل: في مسار المقرر ليس صفًّا دراسيًا بل
              مجموعة دورات تُباع، وحجم "الصف" ليس معلومة يحتاجها أحد. */}
          <Meta icon={Hash} label="رمز المقرر" value={course.code} numeric />
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
