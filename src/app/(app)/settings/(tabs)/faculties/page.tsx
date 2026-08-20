import type { Metadata } from "next";

import { CreateFacultyForm } from "@/components/admin/CreateFacultyForm";
import { FacultyRow } from "@/components/admin/FacultyRow";
import { Card } from "@/components/ui/Card";
import { listFacultiesForAdmin, requireAdmin } from "@/lib/data/admin";
import { UOB_FACULTIES, NOT_OFFERED_LABEL } from "@/lib/faculties";

export const metadata: Metadata = { title: "الكليات" };

export default async function FacultiesPage() {
  await requireAdmin();
  const faculties = await listFacultiesForAdmin();

  const editorial = new Set<string>(UOB_FACULTIES.map((f) => f.slug));

  return (
    <>
      <p className="mb-5 rounded-field border border-line-soft bg-[var(--sunk)] px-4 py-3 text-[12px] leading-[1.85] text-subtle">
        الكلية تجمع المقررات في الكتالوج. المحطة بلا مقررات تُعرض
        «{NOT_OFFERED_LABEL}» ولا تُخفى — لأنها وعدٌ بالتوسّع لا نقص. والإخفاء
        للحالات الاستثنائية، ولا يُسمح به لكلية تحمل مقررًا منشورًا.
      </p>

      <h3 className="mb-3 text-sm font-medium text-paper">الكليات القائمة</h3>

      {faculties.length === 0 ? (
        <Card className="mb-6 px-5 py-6 text-center text-[13px] text-subtle">
          لا كليات بعد — أضِف واحدة أدناه.
        </Card>
      ) : (
        <ul className="mb-6 space-y-2">
          {faculties.map((f) => (
            <li key={f.id}>
              <Card className="px-5 py-4">
                <FacultyRow
                  id={f.id}
                  name={f.name}
                  slug={f.slug}
                  isVisible={f.isVisible}
                  courseCount={f._count.courses}
                  notOfferedLabel={NOT_OFFERED_LABEL}
                />
              </Card>
            </li>
          ))}
        </ul>
      )}

      {/* محطات تحريرية لم تُنشأ بعد كصفوف — تُعرض في الكتالوج بوصفها
          وعدًا، وتصير صفًّا حقيقيًّا فور إسناد أول مقرر إليها. */}
      {UOB_FACULTIES.some((s) => !faculties.some((f) => f.slug === s.slug)) && (
        <>
          <h3 className="mb-2 text-sm font-medium text-paper">
            محطات معروضة في الكتالوج، بلا صفّ بعد
          </h3>
          <Card className="mb-6 px-5 py-4">
            <ul className="flex flex-wrap gap-2">
              {UOB_FACULTIES.filter(
                (s) => !faculties.some((f) => f.slug === s.slug),
              ).map((s) => (
                <li
                  key={s.slug}
                  className="rounded-full border border-line px-3 py-1 text-[11px] text-subtle"
                >
                  {s.name} · <span className="code">{s.slug}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[11px] leading-[1.8] text-subtle">
              تظهر في المسار بـ«{NOT_OFFERED_LABEL}». لتصير قابلة للإدارة، أضِفها
              أدناه بالسَّلَك نفسه.
            </p>
          </Card>
        </>
      )}

      <h3 className="mb-3 text-sm font-medium text-paper">إضافة كلية</h3>
      <Card className="px-5 py-4">
        <CreateFacultyForm />
      </Card>

      {faculties.some((f) => !editorial.has(f.slug)) && (
        <p className="mt-4 text-[11px] leading-[1.8] text-subtle">
          الكليات خارج القائمة التحريرية الأربع تظهر في نهاية مسار الكتالوج —
          فلا يختفي مقرر منشور تحت كلية غير مُدرجة.
        </p>
      )}
    </>
  );
}
