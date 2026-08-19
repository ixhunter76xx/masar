import type { Metadata } from "next";

import { AppPage } from "@/components/shell/AppPage";
import { AdminTabs } from "@/components/admin/AdminTabs";
import { FacultyVisibilityToggle } from "@/components/admin/FacultyVisibilityToggle";
import { Card } from "@/components/ui/Card";
import { Num } from "@/components/ui/Num";
import { listFacultiesForAdmin, requireAdmin } from "@/lib/data/admin";
import { UOB_FACULTIES, NOT_OFFERED_LABEL } from "@/lib/faculties";

export const metadata: Metadata = { title: "الكليات" };

export default async function FacultiesPage() {
  await requireAdmin();
  const faculties = await listFacultiesForAdmin();

  /* المحطات المعروضة في الكتالوج قائمةٌ تحريرية في `lib/faculties.ts`،
     والكليات صفوفٌ في القاعدة. نعرض الاثنين معًا كي يرى المالك أيّ
     محطة تقابل كلية فعلية وأيّها ما زالت وعدًا. */
  const bySlug = new Map(faculties.map((f) => [f.slug, f]));

  return (
    <AppPage title="الإدارة" hidePageHeader>
      <AdminTabs />

      <p className="mb-5 rounded-field border border-line-soft bg-[var(--sunk)] px-4 py-3 text-[12px] leading-[1.85] text-subtle">
        محطات الكتالوج قائمةٌ تحريرية — المحطة بلا مقررات تُعرض
        «{NOT_OFFERED_LABEL}» ولا تُخفى، لأن إخفاءها يجعل المسار يبدو أقصر مما
        تنوي. والإخفاء هنا للحالات الاستثنائية وحدها.
      </p>

      <ul className="space-y-2">
        {UOB_FACULTIES.map((station) => {
          const row = bySlug.get(station.slug);
          const courseCount = row?._count.courses ?? 0;

          return (
            <li key={station.slug}>
              <Card className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                <div className="min-w-0">
                  <p className="text-[13px] text-paper">
                    {station.name}
                    {!row && (
                      <span className="ms-2 rounded-full border border-line px-2 py-0.5 text-[10px] text-subtle">
                        محطة تحريرية — لا صفّ في القاعدة
                      </span>
                    )}
                    {row && !row.isVisible && (
                      <span className="ms-2 rounded-full border border-warning/50 px-2 py-0.5 text-[10px] text-warning">
                        مخفيّة
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 text-[11px] text-subtle">
                    <span className="code">{station.slug}</span>
                    {" · "}
                    {courseCount > 0 ? (
                      <>
                        <Num>{courseCount}</Num>{" "}
                        {courseCount >= 3 && courseCount <= 10
                          ? "مقررات"
                          : "مقررًا"}
                      </>
                    ) : (
                      NOT_OFFERED_LABEL
                    )}
                  </p>
                </div>

                {row ? (
                  <FacultyVisibilityToggle
                    facultyId={row.id}
                    isVisible={row.isVisible}
                    name={station.name}
                  />
                ) : (
                  <span className="text-[11px] text-subtle">
                    تُنشأ تلقائيًا عند إسناد أول مقرر إليها
                  </span>
                )}
              </Card>
            </li>
          );
        })}
      </ul>
    </AppPage>
  );
}
