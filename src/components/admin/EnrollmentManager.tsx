"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { UserPlus, UserMinus } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { SelectField } from "@/components/admin/Select";
import { enrollStudent, removeEnrollment } from "@/app/(app)/settings/actions";
import { EnrollmentStatus } from "@/generated/prisma/enums";

type Enrollment = {
  id: string;
  status: EnrollmentStatus;
  studentName: string;
  studentUsername: string;
};

export function EnrollmentManager({
  courseId,
  enrollments,
  candidates,
}: {
  courseId: string;
  enrollments: Enrollment[];
  candidates: { id: string; name: string; username: string }[];
}) {
  const router = useRouter();
  const [selected, setSelected] = React.useState("");
  const [busy, setBusy] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  async function add() {
    if (!selected) return;
    setBusy("add");
    setError(null);

    const result = await enrollStudent(courseId, selected);
    if (!result.ok) setError(result.message);
    else {
      setSelected("");
      router.refresh();
    }
    setBusy(null);
  }

  async function remove(enrollmentId: string) {
    setBusy(enrollmentId);
    setError(null);

    const result = await removeEnrollment(enrollmentId, courseId);
    if (!result.ok) setError(result.message);
    else router.refresh();
    setBusy(null);
  }

  return (
    <>
      <Card className="mb-6 px-5 py-5">
        <h2 className="mb-4 text-sm font-medium text-paper">تسجيل طالب</h2>

        {candidates.length === 0 ? (
          <p className="text-[13px] text-muted">
            جميع الطلاب النشطين مسجَّلون في هذا المقرر.
          </p>
        ) : (
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[220px] flex-1">
              <SelectField
                id="enroll-student"
                label="الطالب"
                placeholder="اختر الطالب"
                value={selected}
                onChange={(e) => setSelected(e.target.value)}
                options={candidates.map((c) => ({
                  value: c.id,
                  label: `${c.name} — ${c.username}`,
                }))}
              />
            </div>
            <Button
              size="md"
              loading={busy === "add"}
              disabled={!selected}
              onClick={add}
            >
              <UserPlus size={15} strokeWidth={1.75} aria-hidden="true" />
              تسجيل
            </Button>
          </div>
        )}

        {error && (
          <p role="alert" className="mt-3 text-xs text-danger">
            {error}
          </p>
        )}
      </Card>

      <h3 className="mb-3 text-sm font-medium text-paper">
        الطلاب المسجَّلون{" "}
        <span className="numeric text-[11px] text-subtle">
          {enrollments.length}
        </span>
      </h3>

      {enrollments.length === 0 ? (
        <Card className="px-5 py-6 text-center text-[13px] text-muted">
          لا يوجد طلاب مسجَّلون بعد.
        </Card>
      ) : (
        <ul className="space-y-2">
          {enrollments.map((e) => (
            <li key={e.id}>
              <Card className="flex items-center justify-between gap-3 px-5 py-3">
                <div className="min-w-0">
                  <p className="truncate text-[13px] text-paper">
                    {e.studentName}
                  </p>
                  <p className="numeric mt-0.5 text-[11px] text-subtle">
                    {e.studentUsername}
                  </p>
                </div>
                <Button
                  variant="quiet"
                  size="sm"
                  loading={busy === e.id}
                  onClick={() => remove(e.id)}
                  aria-label={`إزالة ${e.studentName}`}
                  className="hover:text-danger"
                >
                  <UserMinus size={15} strokeWidth={1.75} aria-hidden="true" />
                </Button>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
