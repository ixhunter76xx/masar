import Link from "next/link";

import { Card } from "@/components/ui/Card";
import type { Gradebook } from "@/lib/data/grades";

export function GradebookTable({ gradebook }: { gradebook: Gradebook }) {
  const { columns, rows } = gradebook;

  return (
    <Card className="overflow-hidden">
      {/* الجدول قد يتجاوز عرض الشاشة عند كثرة العناصر */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[13px]">
          <caption className="sr-only">
            درجات الطلاب في كل عنصر تقييم بالمقرر
          </caption>

          <thead>
            <tr className="border-b border-line">
              <th
                scope="col"
                className="sticky start-0 z-10 bg-panel px-5 py-3 text-start font-medium text-muted"
              >
                الطالب
              </th>

              {columns.map((c) => (
                <th
                  key={c.id}
                  scope="col"
                  className="whitespace-nowrap px-4 py-3 text-center font-medium"
                >
                  <Link
                    href={c.href}
                    className="text-muted transition-colors hover:text-paper"
                  >
                    {c.title}
                  </Link>
                  <span className="numeric mt-0.5 block text-[10px] font-normal text-subtle">
                    من {c.totalPoints} · {c.kind === "quiz" ? "اختبار" : "واجب"}
                  </span>
                </th>
              ))}

              <th
                scope="col"
                className="whitespace-nowrap px-4 py-3 text-center font-medium text-paper"
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
                  className="border-b border-line last:border-0"
                >
                  <th
                    scope="row"
                    className="sticky start-0 z-10 bg-panel px-5 py-3 text-start font-normal"
                  >
                    <span className="block truncate text-paper">{r.name}</span>
                    <span className="numeric block text-[11px] text-subtle">
                      {r.email}
                    </span>
                  </th>

                  {columns.map((c) => {
                    const v = r.cells[c.id];
                    return (
                      <td key={c.id} className="px-4 py-3 text-center">
                        {v === null ? (
                          <span
                            className="text-subtle"
                            title="لم يُصحَّح بعد"
                            aria-label="لم يُصحَّح بعد"
                          >
                            —
                          </span>
                        ) : (
                          <span className="numeric text-paper">{v}</span>
                        )}
                      </td>
                    );
                  })}

                  <td className="px-4 py-3 text-center">
                    {r.total === 0 ? (
                      <span className="text-subtle">—</span>
                    ) : (
                      <>
                        <span className="numeric text-paper">{r.earned}</span>
                        <span className="text-subtle"> / </span>
                        <span className="numeric text-muted">{r.total}</span>
                        <span className="numeric block text-[10px] text-subtle">
                          {pct}%
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
    </Card>
  );
}
