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

/** رأس المقرر: عنوانٌ داخل الصفحة ثم شريط التبويبات، كما في المرجع. */
export function CourseHeaderCard({
  course,
  counts,
}: {
  course: CourseHeader;
  counts: CourseTabCounts;
}) {

  return (
    <section className="mb-6">
      <div className="mb-[1.4rem] flex flex-wrap items-center gap-4">
        <div className="min-w-[14rem] flex-1">
          <p className="text-eyebrow">تدرس الآن</p>
          <h1 className="mt-1 text-title-lg">{course.title}</h1>
          {(course.description || course.summary) && (
            <p className="mt-2 max-w-[62ch] text-[13px] leading-[1.8] text-muted">
              {course.description ?? course.summary}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 text-[12px] text-subtle">
          {course.presenter?.name && <span>{course.presenter.name}</span>}
          {course.presenter?.name && <span aria-hidden="true">·</span>}
          <span className="code rounded-full border border-line bg-[var(--sunk)] px-2.5 py-1 text-accent">
            {course.code}
          </span>
        </div>
      </div>

      <div className="border-b border-line-soft">
        <CourseTabs courseId={course.id} counts={counts} />
      </div>
    </section>
  );
}
