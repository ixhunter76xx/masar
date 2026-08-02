import type { Metadata } from "next";
import Link from "next/link";
import { Users } from "lucide-react";

import { AppPage } from "@/components/shell/AppPage";
import { AdminTabs } from "@/components/admin/AdminTabs";
import { AdminForm } from "@/components/admin/AdminForm";
import { SelectField } from "@/components/admin/Select";
import { FormField } from "@/components/ui/Field";
import { Card } from "@/components/ui/Card";
import {
  requireAdmin,
  listCoursesForAdmin,
  listActiveTerms,
  listInstructors,
} from "@/lib/data/admin";
import { createCourse } from "@/app/(app)/settings/actions";
import { TermStatus } from "@/generated/prisma/enums";

export const metadata: Metadata = { title: "إدارة المقررات" };

export default async function AdminCoursesPage() {
  await requireAdmin();

  const [courses, terms, instructors] = await Promise.all([
    listCoursesForAdmin(),
    listActiveTerms(),
    listInstructors(),
  ]);

  const blocked =
    terms.length === 0
      ? "أنشئ فصلًا دراسيًا نشطًا أولًا."
      : instructors.length === 0
        ? "أنشئ حساب مدرب أولًا من تبويب المستخدمين."
        : null;

  return (
    <AppPage title="الإدارة" hidePageHeader>
      <AdminTabs />

      {blocked ? (
        <Card className="mb-6 px-5 py-4 text-[13px] text-warning">{blocked}</Card>
      ) : (
        <AdminForm
          title="إنشاء مقرر"
          submitLabel="إنشاء المقرر"
          action={createCourse}
        >
          <div className="grid gap-3 sm:grid-cols-3">
            <FormField id="c-code" name="code" label="الرمز" placeholder="MATH201" required />
            <div className="sm:col-span-2">
              <FormField id="c-title" name="title" label="اسم المقرر" placeholder="التفاضل والتكامل ٢" required />
            </div>
          </div>
          <FormField id="c-desc" name="description" label="وصف مختصر (اختياري)" />
          <div className="grid gap-3 sm:grid-cols-2">
            <SelectField
              id="c-term"
              name="termId"
              label="الفصل الدراسي"
              placeholder="اختر الفصل"
              required
              options={terms.map((t) => ({ value: t.id, label: t.name }))}
            />
            <SelectField
              id="c-inst"
              name="instructorId"
              label="المدرب"
              placeholder="اختر المدرب"
              required
              options={instructors.map((i) => ({ value: i.id, label: i.name }))}
            />
          </div>
        </AdminForm>
      )}

      <ul className="space-y-3">
        {courses.map((c) => (
          <li key={c.id}>
            <Card className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-paper">
                  {c.title}{" "}
                  <span className="numeric text-[11px] text-subtle">{c.code}</span>
                </p>
                <p className="mt-1 text-[11px] text-subtle">
                  {c.term.name}
                  {c.term.status === TermStatus.ARCHIVED && " · مؤرشف"} · {c.instructor.name}
                </p>
              </div>

              <Link
                href={`/settings/courses/${c.id}`}
                className="inline-flex items-center gap-1.5 rounded-[10px] border border-line px-3 py-2 text-[12px] text-muted press hover:border-accent-deep hover:text-paper"
              >
                <Users size={14} strokeWidth={1.75} aria-hidden="true" />
                <span className="numeric">{c._count.enrollments}</span> طالب
              </Link>
            </Card>
          </li>
        ))}
      </ul>
    </AppPage>
  );
}
