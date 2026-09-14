import { CourseTabs } from "@/components/courses/CourseTabs";
import { NavLink as Link } from "@/components/ui/NavLink";
import type { CourseTabCounts } from "@/lib/course-tabs";

/** يُمرَّر من `requireCourseAccess` — لا فصل دراسي في مسار */
type CourseHeader = {
  id: string;
  code: string;
  title: string;
  summary: string | null;
  description: string | null;
  presenter: { name: string } | null;
};

/**
 * رأس المقرر في بيئة الدراسة — إعادة التصميم 2026-09-14.
 *
 * الفتات «مقرراتي › الرمز» بدل التسمية الفوقية «تدرس الآن»: يقول أين
 * أنت ويعيدك بنقرة. والعنوان أكبر، والأستاذ في طرف السطر نفسه.
 */
export function CourseHeaderCard({
  course,
  counts,
}: {
  course: CourseHeader;
  counts: CourseTabCounts;
}) {
  return (
    <section className="mb-6">
      <nav aria-label="مسار التنقّل" className="flex items-center gap-2 text-xs text-subtle sm:text-[13px]">
        <Link href="/learn" className="press inline-flex min-h-touch items-center hover:text-paper">
          مقرراتي
        </Link>
        <span aria-hidden="true">›</span>
        <span aria-current="page" className="code text-muted">
          {course.code}
        </span>
      </nav>

      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <h1 className="min-w-0 text-[1.375rem] font-bold leading-[1.35] tracking-[-0.03em] sm:text-[1.875rem] sm:tracking-[-0.032em]">
          {course.title}
        </h1>
        {course.presenter?.name && (
          <p className="text-xs text-subtle sm:text-[12.5px]">{course.presenter.name}</p>
        )}
      </div>

      {(course.description || course.summary) && (
        <p className="mt-2 max-w-[62ch] text-[13px] leading-[1.8] text-muted">
          {course.description ?? course.summary}
        </p>
      )}

      <div className="mt-5 border-b border-line-soft sm:mt-6">
        <CourseTabs courseId={course.id} counts={counts} />
      </div>
    </section>
  );
}
