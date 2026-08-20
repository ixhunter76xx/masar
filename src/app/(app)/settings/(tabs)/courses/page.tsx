import { Num, Counted } from "@/components/ui/Num";
import type { Metadata } from "next";
import { NavLink as Link } from "@/components/ui/NavLink";
import { ChevronLeft } from "lucide-react";

import { AdminForm } from "@/components/admin/AdminForm";
import { SelectField } from "@/components/admin/Select";
import { FormField } from "@/components/ui/Field";
import { Card } from "@/components/ui/Card";
import { CoursePublishToggle } from "@/components/admin/CoursePublishToggle";
import { CoursePresenterSelect } from "@/components/admin/CoursePresenterSelect";
import { ArchiveCourseButton } from "@/components/admin/ArchiveCourseButton";
import { requireAdmin } from "@/lib/data/admin";
import { db } from "@/server/db";
import { createCourse } from "@/app/(app)/settings/courses/actions";
import { Role } from "@/generated/prisma/enums";

export const metadata: Metadata = { title: "المقررات" };

export default async function AdminCoursesPage() {
  await requireAdmin();

  const [courses, faculties, instructors] = await Promise.all([
    db.course.findMany({
      /* المؤرشف مخفيّ: موجودٌ للتاريخ لا للعمل اليومي */
      where: { archivedAt: null },
      orderBy: [{ code: "asc" }],
      select: {
        id: true,
        code: true,
        title: true,
        isPublished: true,
        presenterId: true,
        faculty: { select: { name: true } },
        _count: { select: { materials: true, products: true } },
      },
    }),
    db.faculty.findMany({
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true },
    }),
    db.user.findMany({
      where: { role: Role.INSTRUCTOR, isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <>
      <AdminForm
        title="مقرر جديد"
        submitLabel="إنشاء المقرر"
        action={createCourse}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField
            id="code"
            name="code"
            label="رمز المقرر"
            placeholder="ARAB110"
            hint="يُشتقّ منه رابط المقرر العام."
            required
          />
          <FormField
            id="title"
            name="title"
            label="عنوان المقرر"
            placeholder="مهارات الاتصال باللغة العربية"
            required
          />
          <SelectField
            id="facultyId"
            name="facultyId"
            label="الكلية"
            options={faculties.map((f) => ({ value: f.id, label: f.name }))}
            required
          />
          <SelectField
            id="presenterId"
            name="presenterId"
            label="المقدّم (اختياري)"
            options={[
              { value: "", label: "— بلا مقدّم —" },
              ...instructors.map((i) => ({ value: i.id, label: i.name })),
            ]}
          />
        </div>

        <FormField
          id="summary"
          name="summary"
          label="نبذة (اختياري)"
          placeholder="شرح مركّز لمقرر ARAB110 كما يُدرَّس في جامعة البحرين."
          hint="تظهر في بطاقة الكتالوج."
        />

        <FormField
          id="description"
          name="description"
          label="الوصف (اختياري)"
          placeholder="يغطّي المقرر…"
        />

        <p className="text-[11px] leading-relaxed text-subtle">
          يُنشأ المقرر غير منشور. ارفع دروسه، ثم أنشئ باقاته وأسعارها،
          ثم انشره — بهذا الترتيب، لأن الباقة تشير إلى دروس موجودة.
        </p>
      </AdminForm>

      <ul className="space-y-2">
        {courses.map((course) => (
          <li key={course.id}>
            <Card className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
              <div className="min-w-0">
                <p className="truncate text-[13px] text-paper">
                  {course.title}
                  <span className="numeric ms-2 rounded-[6px] border border-line px-1.5 py-0.5 text-[10px] text-accent">
                    {course.code}
                  </span>
                  {!course.isPublished && (
                    <span className="ms-2 rounded-full border border-warning/40 px-2 py-0.5 text-[10px] text-warning">
                      غير منشور
                    </span>
                  )}
                </p>
                <p className="mt-0.5 text-[11px] text-subtle">
                  {course.faculty?.name ?? "بلا كلية"} ·{" "}
                  <Counted n={course._count.materials} few="دروس" many="درسًا" /> ·{" "}
                  <Counted n={course._count.products} few="باقات" many="باقة" />
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <CoursePresenterSelect
                  courseId={course.id}
                  presenterId={course.presenterId}
                  courseTitle={course.title}
                  instructors={instructors}
                />
                <CoursePublishToggle
                  courseId={course.id}
                  isPublished={course.isPublished}
                />
                <ArchiveCourseButton
                  courseId={course.id}
                  title={course.title}
                  archived={false}
                />
                <Link
                  href={`/settings/courses/${course.id}`}
                  className="press inline-flex min-h-touch items-center gap-1 rounded-[10px]
                    border border-line bg-ink px-3 text-xs text-paper
                    transition-colors hover:border-accent-deep"
                >
                  إدارة المقرر
                  <ChevronLeft size={13} strokeWidth={1.75} aria-hidden="true" />
                </Link>
              </div>
            </Card>
          </li>
        ))}
      </ul>
    </>
  );
}
