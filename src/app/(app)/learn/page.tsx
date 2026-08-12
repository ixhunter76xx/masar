import type { Metadata } from "next";
import { LibraryBig } from "lucide-react";

import { auth } from "@/auth";
import { AppPage } from "@/components/shell/AppPage";
import { EmptyState } from "@/components/ui/EmptyState";
import { CourseCard } from "@/components/courses/CourseCard";
import { StaggerList, StaggerItem } from "@/components/motion/Stagger";
import { getMyCourses, getCourseResume } from "@/lib/data/courses";
import { Role } from "@/generated/prisma/enums";

export const metadata: Metadata = { title: "مقرراتي" };

/**
 * نصّ الصفحة حسب الدور.
 *
 * «مقرراتي» تعني ثلاثة أشياء مختلفة: ما اشتراه الطالب، وما يُقدّمه
 * المدرب، وكل شيء للإدارة كي تعاينه — وهو التفريع نفسه الذي يجريه
 * `getMyCourses()` على الاستعلام. كان النصّ واحدًا بصيغة الشراء
 * («ما تملك وصولًا إليه») فيُقرأ خطأً في وجه المدرب: هو لا يملك
 * المقرر بل يُدرّسه. والحالة الفارغة كانت تدعوه لتصفّح الكتالوج،
 * وهو ليس مشتريًا. لذا يتبع النصّ الدور كما يتبعه الاستعلام.
 */
const COPY = {
  [Role.STUDENT]: {
    description: "ما تملك وصولًا إليه.",
    empty: {
      title: "لا مقررات بعد",
      description: "تصفّح الكتالوج واختر ما يناسبك من الدورات.",
      action: { href: "/courses", label: "تصفّح المقررات" },
    },
  },
  [Role.INSTRUCTOR]: {
    description: "المقررات التي تُقدّمها.",
    empty: {
      title: "لا مقررات مُسنَدة إليك",
      description: "لم يُسنَد إليك أي مقرر بعد. تواصل مع الإدارة لإسناد مقرر.",
      action: undefined,
    },
  },
  [Role.ADMIN]: {
    description: "كل مقررات المنصة — للمعاينة.",
    empty: {
      title: "لا مقررات في المنصة",
      description: "لم يُنشأ أي مقرر بعد.",
      action: undefined,
    },
  },
} as const;

/**
 * مقررات المستخدم — قائمة مسطّحة.
 *
 * كانت مجمَّعة حسب الفصل الدراسي في مركز حساب. مسار لا فصول فيه:
 * المقرر متاح دائمًا، وما يحدّد الترتيب هو `sortOrder` الذي تضبطه
 * الإدارة لا تقويم الجامعة.
 */
export default async function Page() {
  const [session, courses] = await Promise.all([auth(), getMyCourses()]);

  /* الاستئناف لكل مقرر — استعلامات متوازية لا متسلسلة، وكلها
     مُغلَّفة بـ`cache()` فلا تتكرّر داخل الطلب الواحد. */
  const resumes = await Promise.all(
    courses.map((course) => getCourseResume(course.id)),
  );

  // الجلسة مضمونة هنا: تخطيط (app) يحرس المنطقة قبل تصيير الصفحة
  const copy = COPY[session!.user.role] ?? COPY[Role.STUDENT];

  return (
    <AppPage title="مقرراتي" description={copy.description}>
      {courses.length === 0 ? (
        <EmptyState
          icon={LibraryBig}
          title={copy.empty.title}
          description={copy.empty.description}
          action={copy.empty.action}
        />
      ) : (
        <StaggerList as="ul" className="space-y-3">
          {courses.map((course, i) => (
            <StaggerItem key={course.id}>
              <CourseCard course={course} resume={resumes[i]} />
            </StaggerItem>
          ))}
        </StaggerList>
      )}
    </AppPage>
  );
}
