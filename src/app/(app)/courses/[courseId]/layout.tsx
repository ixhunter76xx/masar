import type { Metadata } from "next";

import { AppPage } from "@/components/shell/AppPage";
import { CourseHeaderCard } from "@/components/courses/CourseHeaderCard";
import { CourseSwipeArea } from "@/components/courses/CourseSwipeArea";
import { requireCourseAccess } from "@/lib/data/courses";
import { getCourseTabCounts } from "@/lib/data/course-tab-counts";

type Params = { params: Promise<{ courseId: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { courseId } = await params;
  const { course } = await requireCourseAccess(courseId);
  return { title: course.title };
}

/**
 * تخطيط المقرر: رأس ثابت بالتبويبات، ومحتوى التبويب يتغيّر تحته.
 * التخطيط لا يُعاد بناؤه عند التنقّل بين التبويبات.
 */
export default async function CourseLayout({
  children,
  params,
}: Params & { children: React.ReactNode }) {
  const { courseId } = await params;
  const { course, user } = await requireCourseAccess(courseId);
  const counts = await getCourseTabCounts(course.id, user.id, user.role);

  return (
    <AppPage title={course.title} hidePageHeader>
      <CourseHeaderCard course={course} counts={counts} />
      <CourseSwipeArea courseId={course.id}>{children}</CourseSwipeArea>
    </AppPage>
  );
}
