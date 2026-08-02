import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";

import { AppPage } from "@/components/shell/AppPage";
import { AssignmentForm } from "@/components/assignments/AssignmentForm";
import { requireCourseAccess } from "@/lib/data/courses";
import { canManageCourse } from "@/lib/data/materials";

type Params = { params: Promise<{ courseId: string }> };

export const metadata: Metadata = { title: "واجب جديد" };

export default async function NewAssignmentPage({ params }: Params) {
  const { courseId } = await params;
  const { user } = await requireCourseAccess(courseId);

  const canManage = await canManageCourse(courseId, user.id, user.role);
  if (!canManage) notFound();

  return (
    <AppPage title="واجب جديد" hidePageHeader>
      <Link
        href={`/courses/${courseId}`}
        className="mb-4 inline-flex items-center gap-1.5 text-[12px] text-muted transition-colors hover:text-paper"
      >
        <ArrowRight size={14} strokeWidth={1.75} aria-hidden="true" />
        العودة إلى محتوى المقرر
      </Link>

      <AssignmentForm courseId={courseId} />

      <p className="text-[12px] leading-relaxed text-subtle">
        الواجب يبقى مسودة لا يراها الطلاب حتى تنشره.
      </p>
    </AppPage>
  );
}
