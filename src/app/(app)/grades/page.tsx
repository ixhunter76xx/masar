import type { Metadata } from "next";
import Link from "next/link";
import { ClipboardList, Inbox } from "lucide-react";

import { auth } from "@/auth";
import { AppPage } from "@/components/shell/AppPage";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { GradeItemRow } from "@/components/grades/GradeItemRow";
import { getStudentGrades } from "@/lib/data/grades";
import { getMyCourses } from "@/lib/data/courses";
import { Role } from "@/generated/prisma/enums";

export const metadata: Metadata = { title: "الدرجات" };

export default async function GradesPage() {
  const session = await auth();
  const { id, role } = session!.user;

  /* ---------------------------------------------------------------- */
  /*  المدرب والإدارة: مدخل إلى دفاتر درجات مقرراتهم                   */
  /* ---------------------------------------------------------------- */
  if (role !== Role.STUDENT) {
    // قائمة مسطّحة: لا فصول دراسية في مسار
    const courses = await getMyCourses();

    return (
      <AppPage
        title="الدرجات"
        description="دفتر درجات كل مقرر من مقرراتك."
      >
        {courses.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="لا توجد مقررات"
            description="ستظهر هنا دفاتر الدرجات فور إسناد مقررات إليك."
          />
        ) : (
          <ul className="space-y-2">
            {courses.map((c) => (
              <li key={c.id}>
                <Card className="lift hover:border-accent-deep">
                  <Link
                    href={`/courses/${c.id}/grades`}
                    className="flex items-center justify-between gap-3 px-5 py-4"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm text-paper">
                        {c.title}
                      </span>
                      <span className="mt-0.5 block text-[11px] text-subtle">
                        <span className="numeric">{c.code}</span>
                      </span>
                    </span>
                    <span className="shrink-0 text-[11px] text-subtle">
                      <span className="numeric">{c.products.length}</span> دورات
                    </span>
                  </Link>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </AppPage>
    );
  }

  /* ---------------------------------------------------------------- */
  /*  الطالب: درجاته عبر كل المقررات                                   */
  /* ---------------------------------------------------------------- */
  const courses = await getStudentGrades(id);

  return (
    <AppPage
      title="الدرجات"
      description="درجاتك في كل عناصر التقييم المصحّحة."
    >
      {courses.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="لا توجد درجات بعد"
          description="ستظهر هنا درجات اختباراتك وواجباتك فور اعتمادها."
        />
      ) : (
        courses.map((c) => {
          const pct =
            c.total > 0 ? Math.round((c.earned / c.total) * 100) : null;

          return (
            <section key={c.courseId} className="mb-8 last:mb-0">
              <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-sm font-medium text-paper">
                  {c.courseTitle}{" "}
                  <span className="numeric text-[11px] text-subtle">
                    {c.courseCode}
                  </span>
                </h2>
                <p className="text-[12px]">
                  <span className="numeric text-paper">{c.earned}</span>
                  <span className="text-subtle"> / </span>
                  <span className="numeric text-muted">{c.total}</span>
                  {pct !== null && (
                    <span className="numeric ms-2 text-accent">{pct}%</span>
                  )}
                </p>
              </div>

              <ul className="space-y-2">
                {c.items.map((item) => (
                  <li key={item.id}>
                    <GradeItemRow item={item} />
                  </li>
                ))}
              </ul>
            </section>
          );
        })
      )}

      {courses.length > 0 && (
        <p className="mt-6 text-[11px] leading-relaxed text-subtle">
          المجموع محسوب على العناصر المصحّحة فقط. درجة الاختبار المعتمدة هي
          أعلى محاولة.
        </p>
      )}
    </AppPage>
  );
}
