import type { Metadata } from "next";

import { AppPage } from "@/components/shell/AppPage";
import { AdminTabs } from "@/components/admin/AdminTabs";
import { AdminForm } from "@/components/admin/AdminForm";
import { FormField } from "@/components/ui/Field";
import { Card } from "@/components/ui/Card";
import { TermStatusToggle } from "@/components/admin/TermStatusToggle";
import { requireAdmin, listTerms } from "@/lib/data/admin";
import { createTerm } from "@/app/(app)/settings/actions";
import { TermStatus } from "@/generated/prisma/enums";
import { formatDateRange } from "@/lib/format";

export const metadata: Metadata = { title: "الفصول الدراسية" };

export default async function TermsPage() {
  await requireAdmin();
  const terms = await listTerms();

  return (
    <AppPage title="الإدارة" hidePageHeader>
      <AdminTabs />

      <AdminForm
        title="إنشاء فصل دراسي"
        submitLabel="إنشاء الفصل"
        action={createTerm}
      >
        <FormField
          id="term-name"
          name="name"
          label="اسم الفصل"
          placeholder="2026/2027 — الفصل الأول"
          required
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField id="term-start" name="startsOn" label="تاريخ البداية" type="date" required />
          <FormField id="term-end" name="endsOn" label="تاريخ النهاية" type="date" required />
        </div>
      </AdminForm>

      <ul className="space-y-3">
        {terms.map((t) => (
          <li key={t.id}>
            <Card className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-paper">{t.name}</p>
                <p className="mt-1 text-[11px] text-disabled">
                  {formatDateRange(t.startsOn, t.endsOn)} ·{" "}
                  <span className="numeric">{t._count.courses}</span> مقررات
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span
                  className={
                    "rounded-full border px-2 py-0.5 text-[10px] " +
                    (t.status === TermStatus.ACTIVE
                      ? "border-success/40 text-success"
                      : "border-line text-disabled")
                  }
                >
                  {t.status === TermStatus.ACTIVE ? "نشط" : "مؤرشف"}
                </span>
                <TermStatusToggle termId={t.id} status={t.status} />
              </div>
            </Card>
          </li>
        ))}
      </ul>
    </AppPage>
  );
}
