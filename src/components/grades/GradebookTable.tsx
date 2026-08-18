import Link from "next/link";
import { ar } from "@/lib/numerals";

import type { Gradebook } from "@/lib/data/grades";

export function GradebookTable({ gradebook }: { gradebook: Gradebook }) {
  const { columns, rows } = gradebook;

  return (
    <div className="overflow-x-auto overflow-y-hidden rounded-card border border-line bg-panel [scrollbar-width:thin]">
      {/* الجدول قد يتجاوز عرض الشاشة عند كثرة العناصر */}
      <div>
        <table className="min-w-[32rem] w-full border-collapse text-[0.86rem]">
          <caption className="px-[1.15rem] pb-[0.2rem] pt-4 text-start text-[0.74rem] text-subtle">
            درجات الطلاب في كل عنصر تقييم بالمقرر
          </caption>

          <thead>
            <tr className="border-b border-line">
              <th
                scope="col"
                className="sticky start-0 z-10 bg-panel px-[1.15rem] py-[0.85rem] text-start text-[0.73rem] font-semibold text-subtle"
              >
                الطالب
              </th>

              {columns.map((c) => (
                <th
                  key={c.id}
                  scope="col"
                  className="whitespace-nowrap px-[1.15rem] py-[0.85rem] text-center text-[0.73rem] font-semibold text-subtle"
                >
                  <Link
                    href={c.href}
                    className="text-muted transition-colors hover:text-paper"
                  >
                    {c.title}
                  </Link>
                  <span className="numeric mt-0.5 block text-[10px] font-normal text-subtle">
                    من {ar(c.totalPoints)} · {c.kind === "quiz" ? "اختبار" : "واجب"}
                  </span>
                </th>
              ))}

              <th
                scope="col"
                className="whitespace-nowrap px-[1.15rem] py-[0.85rem] text-center text-[0.73rem] font-semibold text-subtle"
              >
                المجموع
              </th>
            </tr>
          </thead>

          <tbody>
            {rows.map((r) => {
              const pct =
                r.total > 0 ? Math.round((r.earned / r.total) * 100) : null;

              return (
                <tr
                  key={r.studentId}
                  className="border-b border-line-soft transition-colors last:border-0 hover:bg-panel-lift"
                >
                  <th
                    scope="row"
                    className="sticky start-0 z-10 bg-inherit px-[1.15rem] py-[0.9rem] text-start font-normal"
                  >
                    <span className="block truncate text-paper">{r.name}</span>
                    <span className="numeric block text-[11px] text-subtle">
                      {r.email}
                    </span>
                  </th>

                  {columns.map((c) => {
                    const v = r.cells[c.id];
                    return (
                      <td key={c.id} className="px-[1.15rem] py-[0.9rem] text-center">
                        {v === null ? (
                          <span
                            className="text-subtle"
                            title="لم يُصحَّح بعد"
                            aria-label="لم يُصحَّح بعد"
                          >
                            —
                          </span>
                        ) : (
                          <span className="numeric text-paper">{ar(v)}</span>
                        )}
                      </td>
                    );
                  })}

                  <td className="px-[1.15rem] py-[0.9rem] text-center">
                    {pct === null ? (
                      <span className="text-subtle">—</span>
                    ) : (
                      <>
                        <span className="numeric text-paper">{ar(r.earned)}</span>
                        <span className="text-subtle"> / </span>
                        <span className="numeric text-muted">{ar(r.total)}</span>
                        <span className="numeric block text-[10px] text-subtle">
                          {ar(pct)}٪
                        </span>
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
