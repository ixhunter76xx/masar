import Link from "next/link";
import { UserRound, Layers } from "lucide-react";

import { Card } from "@/components/ui/Card";

/**
 * بطاقة مقرر داخل بيئة التعلم.
 *
 * تعرض عدد المنتجات التي يملكها المستخدم في هذا المقرر لا عدد الطلاب:
 * في مسار ما يهمّ الطالب هو ما اشتراه، لا حجم الصف.
 */
export function CourseCard({
  course,
}: {
  course: {
    id: string;
    code: string;
    title: string;
    summary: string | null;
    presenter: { name: string } | null;
    products: { id: string; title: string }[];
  };
}) {
  return (
    <Card className="lift hover:border-accent-deep">
      <Link href={`/courses/${course.id}`} className="block px-5 py-4">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="truncate text-sm font-medium text-paper">
            {course.title}
          </h3>
          <span className="numeric shrink-0 text-[11px] text-subtle">
            {course.code}
          </span>
        </div>

        {course.summary && (
          <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-muted">
            {course.summary}
          </p>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-4 text-[11px] text-subtle">
          {course.presenter && (
            <span className="inline-flex items-center gap-1.5">
              <UserRound size={13} strokeWidth={1.75} aria-hidden="true" />
              {course.presenter.name}
            </span>
          )}
          <span className="inline-flex items-center gap-1.5">
            <Layers size={13} strokeWidth={1.75} aria-hidden="true" />
            <span className="numeric">{course.products.length}</span>
            {course.products.length === 1 ? "دورة" : "دورات"}
          </span>
        </div>
      </Link>
    </Card>
  );
}
