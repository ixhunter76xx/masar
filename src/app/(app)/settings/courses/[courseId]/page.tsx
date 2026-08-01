import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";

import { AppPage } from "@/components/shell/AppPage";
import { AdminTabs } from "@/components/admin/AdminTabs";
import { Card } from "@/components/ui/Card";
import { EnrollmentManager } from "@/components/admin/EnrollmentManager";
import {
  requireAdmin,
  getCourseForAdmin,
  listEnrollableStudents,
} from "@/lib/data/admin";

type Params = { params: Promise<{ courseId: string }> };

export const metadata: Metadata = { title: "تسجيل الطلاب" };

export default async function CourseEnrollmentPage({ params }: Params) {
  await requireAdmin();
  const { courseId } = await params;

  const course = await getCourseForAdmin(courseId);
  if (!course) notFound();

  const candidates = await listEnrollableStudents(courseId);

  return (
    <AppPage title="الإدارة" hidePageHeader>
      <AdminTabs />

      <Link
        href="/settings/courses"
        className="mb-4 inline-flex items-center gap-1.5 text-[12px] text-muted transition-colors hover:text-paper"
      >
        <ArrowRight size={14} strokeWidth={1.75} aria-hidden="true" />
        العودة إلى المقررات
      </Link>

      <Card className="mb-6 px-5 py-4">
        <p className="text-sm font-medium text-paper">
          {course.title}{" "}
          <span className="numeric text-[11px] text-disabled">{course.code}</span>
        </p>
        <p className="mt-1 text-[11px] text-disabled">
          {course.term.name} · {course.instructor.name}
        </p>
      </Card>

      <EnrollmentManager
        courseId={course.id}
        enrollments={course.enrollments.map((e) => ({
          id: e.id,
          status: e.status,
          studentName: e.student.name,
          studentUsername: e.student.username,
        }))}
        candidates={candidates}
      />
    </AppPage>
  );
}
