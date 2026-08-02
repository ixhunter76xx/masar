import { ClipboardList } from "lucide-react";

import { EmptyState } from "@/components/ui/EmptyState";
import { GradebookTable } from "@/components/grades/GradebookTable";
import { GradeItemRow } from "@/components/grades/GradeItemRow";
import { requireCourseAccess } from "@/lib/data/courses";
import { canManageCourse } from "@/lib/data/materials";
import { getCourseGradebook, getStudentGrades } from "@/lib/data/grades";

type Params = { params: Promise<{ courseId: string }> };

export default async function CourseGradesPage({ params }: Params) {
  const { courseId } = await params;
  // تحقّق مستقل عن التخطيط — Next.js ينفّذهما على التوازي
  const { user } = await requireCourseAccess(courseId);

  const canManage = await canManageCourse(courseId, user.id, user.role);

  /* ---------------------------------------------------------------- */
  /*  المدرب: مصفوفة كل الطلاب                                         */
  /* ---------------------------------------------------------------- */
  if (canManage) {
    const gradebook = await getCourseGradebook(courseId);

    if (gradebook.columns.length === 0) {
      return (
        <EmptyState
          icon={ClipboardList}
          title="لا توجد عناصر تقييم"
          description="أنشئ اختبارًا أو واجبًا وانشره، ثم ستظهر درجات الطلاب هنا."
        />
      );
    }

    if (gradebook.rows.length === 0) {
      return (
        <EmptyState
          icon={ClipboardList}
          title="لا يوجد طلاب مسجَّلون"
          description="سجّل الطلاب في المقرر من الإدارة لتظهر صفوفهم هنا."
        />
      );
    }

    return (
      <>
        <GradebookTable gradebook={gradebook} />
        <p className="mt-4 text-[11px] leading-relaxed text-subtle">
          الشرطة (—) تعني أن العنصر لم يُصحَّح لهذا الطالب بعد، ولا يدخل في
          مجموعه. درجة الاختبار المعتمدة هي أعلى محاولة.
        </p>
      </>
    );
  }

  /* ---------------------------------------------------------------- */
  /*  الطالب: درجاته في هذا المقرر فقط                                 */
  /* ---------------------------------------------------------------- */
  const all = await getStudentGrades(user.id);
  const mine = all.find((c) => c.courseId === courseId);

  if (!mine || mine.items.length === 0) {
    return (
      <EmptyState
        icon={ClipboardList}
        title="لا توجد درجات منشورة"
        description="ستظهر هنا درجاتك في اختبارات المقرر وواجباته فور اعتمادها."
      />
    );
  }

  const pct =
    mine.total > 0 ? Math.round((mine.earned / mine.total) * 100) : null;

  return (
    <>
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-sm font-medium text-paper">درجاتي في هذا المقرر</h3>
        <p className="text-[13px]">
          <span className="numeric text-paper">{mine.earned}</span>
          <span className="text-subtle"> / </span>
          <span className="numeric text-muted">{mine.total}</span>
          {pct !== null && (
            <span className="numeric ms-2 text-accent">{pct}%</span>
          )}
        </p>
      </div>

      <ul className="space-y-2">
        {mine.items.map((item) => (
          <li key={item.id}>
            <GradeItemRow item={item} />
          </li>
        ))}
      </ul>

      <p className="mt-4 text-[11px] leading-relaxed text-subtle">
        المجموع محسوب على العناصر المصحّحة فقط.
      </p>
    </>
  );
}
