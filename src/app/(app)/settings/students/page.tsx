import type { Metadata } from "next";
import Link from "next/link";
import { Users } from "lucide-react";

import { AppPage } from "@/components/shell/AppPage";
import { AdminTabs } from "@/components/admin/AdminTabs";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { countedPhrase, STUDENT_FORMS, ORDER_FORMS, PRODUCT_FORMS } from "@/lib/numerals";
import { listStudentsForAdmin, requireAdmin } from "@/lib/data/admin";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "الطلاب" };

type Params = { searchParams: Promise<{ q?: string }> };

export default async function StudentsPage({ searchParams }: Params) {
  await requireAdmin();
  const { q } = await searchParams;
  const students = await listStudentsForAdmin(q);

  return (
    <AppPage title="الإدارة" hidePageHeader>
      <AdminTabs />

      {/* بحثٌ بنموذج GET لا حالة عميل: الرابط يصير قابلًا للمشاركة
          والعودة إليه، ولا يحتاج جافاسكربت ليعمل. */}
      <form method="get" className="mb-5 flex flex-wrap items-center gap-2">
        <label htmlFor="q" className="sr-only">
          ابحث عن طالب
        </label>
        <input
          id="q"
          name="q"
          defaultValue={q ?? ""}
          placeholder="ابحث بالاسم أو البريد…"
          className="input-field max-w-[22rem] flex-1 text-[13px]"
        />
        <button
          type="submit"
          className="press inline-flex min-h-touch items-center rounded-field bg-action px-5 text-sm font-semibold text-ink"
        >
          بحث
        </button>
        {q && (
          <Link
            href="/settings/students"
            className="press inline-flex min-h-touch items-center rounded-field border border-line px-4 text-[13px] text-muted hover:border-accent-deep hover:text-paper"
          >
            إلغاء
          </Link>
        )}
      </form>

      <p className="mb-3 text-[12px] text-subtle">
        {countedPhrase(students.length, STUDENT_FORMS)}
        {q && <> — نتائج البحث عن «{q}»</>}
      </p>

      {students.length === 0 ? (
        <EmptyState
          icon={Users}
          title={q ? "لا نتائج" : "لا طلاب بعد"}
          description={
            q
              ? "جرّب اسمًا أو بريدًا آخر."
              : "سيظهر هنا كل من سجّل في المنصة."
          }
        />
      ) : (
        <ul className="space-y-2">
          {students.map((s) => (
            <li key={s.id}>
              <Link href={`/settings/students/${s.id}`} className="block">
                <Card className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 transition-colors hover:border-accent-deep">
                  <div className="min-w-0">
                    <p className="truncate text-[13px] text-paper">
                      {s.name}
                      {!s.isActive && (
                        <span className="ms-2 rounded-full border border-line px-2 py-0.5 text-[10px] text-subtle">
                          معطّل
                        </span>
                      )}
                    </p>
                    <p className="mt-0.5 text-[11px] text-subtle">
                      <span className="code">{s.email}</span> · انضمّ{" "}
                      {formatDate(s.createdAt)}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-4 text-[11px] text-subtle">
                    <span>{countedPhrase(s.enrollments.length, PRODUCT_FORMS)} سارية</span>
                    <span>{countedPhrase(s._count.orders, ORDER_FORMS)}</span>
                  </div>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </AppPage>
  );
}
