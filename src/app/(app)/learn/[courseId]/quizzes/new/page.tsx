import type { Metadata } from "next";
import { NavLink as Link } from "@/components/ui/NavLink";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";

import { AppPage } from "@/components/shell/AppPage";
import { QuizSettingsForm } from "@/components/quizzes/QuizSettingsForm";
import { requireCourseAccess } from "@/lib/data/courses";
import { canManageCourse } from "@/lib/data/materials";

type Params = { params: Promise<{ courseId: string }> };

export const metadata: Metadata = { title: "اختبار جديد" };

export default async function NewQuizPage({ params }: Params) {
  const { courseId } = await params;
  const { user } = await requireCourseAccess(courseId);

  const canManage = await canManageCourse(courseId);
  if (!canManage) notFound();

  return (
    <AppPage title="اختبار جديد" hidePageHeader>
      <Link
        href={`/learn/${courseId}`}
        className="mb-4 inline-flex items-center gap-1.5 text-[12px] text-muted transition-colors hover:text-paper"
      >
        <ArrowRight size={14} strokeWidth={1.75} aria-hidden="true" />
        العودة إلى محتوى المقرر
      </Link>

      <QuizSettingsForm courseId={courseId} />

      <p className="text-[12px] leading-relaxed text-subtle">
        بعد الإنشاء ستنتقل إلى صفحة إضافة الأسئلة. الاختبار يبقى مسودة لا
        يراها الطلاب حتى تنشره.
      </p>
    </AppPage>
  );
}
