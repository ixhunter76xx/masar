import type { Metadata } from "next";
import { LibraryBig } from "lucide-react";

import { AppPage } from "@/components/shell/AppPage";
import { EmptyState } from "@/components/ui/EmptyState";
import { CourseCard } from "@/components/courses/CourseCard";
import { StaggerList, StaggerItem } from "@/components/motion/Stagger";
import { getMyCourses } from "@/lib/data/courses";

export const metadata: Metadata = { title: "مقرراتي" };

/**
 * مقررات المستخدم — قائمة مسطّحة.
 *
 * كانت مجمَّعة حسب الفصل الدراسي في مركز حساب. مسار لا فصول فيه:
 * المقرر متاح دائمًا، وما يحدّد الترتيب هو `sortOrder` الذي تضبطه
 * الإدارة لا تقويم الجامعة.
 */
export default async function Page() {
  const courses = await getMyCourses();

  return (
    <AppPage title="مقرراتي" description="ما تملك وصولًا إليه.">
      {courses.length === 0 ? (
        <EmptyState
          icon={LibraryBig}
          title="لا مقررات بعد"
          description="تصفّح الكتالوج واختر ما يناسبك من الدورات."
          action={{ href: "/courses", label: "تصفّح المقررات" }}
        />
      ) : (
        <StaggerList as="ul" className="space-y-3">
          {courses.map((course) => (
            <StaggerItem key={course.id}>
              <CourseCard course={course} />
            </StaggerItem>
          ))}
        </StaggerList>
      )}
    </AppPage>
  );
}
