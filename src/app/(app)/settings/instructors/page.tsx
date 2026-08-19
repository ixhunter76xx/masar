import type { Metadata } from "next";
import Link from "next/link";
import { GraduationCap } from "lucide-react";

import { AppPage } from "@/components/shell/AppPage";
import { AdminTabs } from "@/components/admin/AdminTabs";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { countedPhrase, COURSE_FORMS } from "@/lib/numerals";
import { listInstructorsForAdmin, requireAdmin } from "@/lib/data/admin";

export const metadata: Metadata = { title: "المدرّسون" };

export default async function InstructorsPage() {
  await requireAdmin();
  const instructors = await listInstructorsForAdmin();

  return (
    <AppPage title="الإدارة" hidePageHeader>
      <AdminTabs />

      {/* ⚠ القاعدة التي تحكم هذه الشاشة، وتُقال هنا لأنها تُنسى:
          القيد أحاديّ **من جهة المقرر** — كل مقرر يحمل مقدّمًا واحدًا.
          أمّا المدرّس فيُسنَد إلى أي عدد من المقررات. ولذلك لا يوجد هنا
          «إضافة مدرّس مساعد»، والإسناد يتمّ من شاشة المقرر نفسه. */}
      <p className="mb-5 rounded-field border border-line-soft bg-[var(--sunk)] px-4 py-3 text-[12px] leading-[1.85] text-subtle">
        كل مقرر يحمل <span className="text-paper">مقدّمًا واحدًا</span>، والمدرّس
        الواحد يقدّم أي عدد من المقررات. الإسناد يتمّ من صفحة المقرر — افتح
        المقرر من تبويب «المقررات» واختر مقدّمه.
      </p>

      {instructors.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="لا مدرّسين بعد"
          description="أنشئ حساب مدرّس من تبويب «المستخدمون» بدور «مدرب»."
          action={{ href: "/settings/users", label: "إنشاء حساب" }}
        />
      ) : (
        <ul className="space-y-2">
          {instructors.map((t) => (
            <li key={t.id}>
              <Card className="px-5 py-4">
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-[13px] text-paper">
                      {t.name}
                      {!t.isActive && (
                        <span className="ms-2 rounded-full border border-line px-2 py-0.5 text-[10px] text-subtle">
                          معطّل
                        </span>
                      )}
                    </p>
                    <p className="mt-0.5 text-[11px] text-subtle">
                      <span className="code">{t.email}</span>
                    </p>
                  </div>
                  <p className="shrink-0 text-[11px] text-subtle">
                    {countedPhrase(t.coursesPresented.length, COURSE_FORMS)}
                  </p>
                </div>

                {t.coursesPresented.length > 0 && (
                  <ul className="mt-3 flex flex-wrap gap-2 border-t border-line-soft pt-3">
                    {t.coursesPresented.map((c) => (
                      <li key={c.id}>
                        <Link
                          href={`/settings/courses/${c.id}`}
                          className="press inline-flex items-center gap-2 rounded-full border border-line bg-[var(--sunk)] px-3 py-1 text-[11px] text-muted hover:border-accent-deep hover:text-paper"
                        >
                          <span className="code">{c.code}</span>
                          {!c.isPublished && (
                            <span className="text-warning">مسودة</span>
                          )}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </li>
          ))}
        </ul>
      )}
    </AppPage>
  );
}
