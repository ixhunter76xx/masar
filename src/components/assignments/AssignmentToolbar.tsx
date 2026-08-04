"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Send, Lock, RotateCcw, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  setAssignmentStatus,
  deleteAssignment,
} from "@/app/(app)/learn/[courseId]/assignments/actions";
import { AssignmentStatus } from "@/generated/prisma/enums";

export function AssignmentToolbar({
  courseId,
  assignmentId,
  status,
  submissionCount,
}: {
  courseId: string;
  assignmentId: string;
  status: AssignmentStatus;
  submissionCount: number;
}) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function change(next: AssignmentStatus) {
    setBusy(true);
    setError(null);
    const r = await setAssignmentStatus(courseId, assignmentId, next);
    if (r.ok) router.refresh();
    else setError(r.message);
    setBusy(false);
  }

  async function remove() {
    setBusy(true);
    setError(null);
    const r = await deleteAssignment(courseId, assignmentId);
    if (r.ok) router.push(`/learn/${courseId}`);
    else {
      setError(r.message);
      setBusy(false);
    }
  }

  return (
    <Card className="mb-6 px-5 py-4">
      <div className="flex flex-wrap items-center gap-2">
        {status === AssignmentStatus.DRAFT && (
          <Button size="sm" loading={busy} onClick={() => change(AssignmentStatus.PUBLISHED)}>
            <Send size={15} strokeWidth={1.75} aria-hidden="true" />
            نشر الواجب
          </Button>
        )}
        {status === AssignmentStatus.PUBLISHED && (
          <Button variant="secondary" size="sm" loading={busy} onClick={() => change(AssignmentStatus.CLOSED)}>
            <Lock size={15} strokeWidth={1.75} aria-hidden="true" />
            إغلاق التسليم
          </Button>
        )}
        {status === AssignmentStatus.CLOSED && (
          <Button variant="secondary" size="sm" loading={busy} onClick={() => change(AssignmentStatus.PUBLISHED)}>
            <RotateCcw size={15} strokeWidth={1.75} aria-hidden="true" />
            إعادة الفتح
          </Button>
        )}
        {submissionCount === 0 ? (
          <Button variant="danger" size="sm" loading={busy} onClick={remove}>
            <Trash2 size={15} strokeWidth={1.75} aria-hidden="true" />
            حذف
          </Button>
        ) : (
          <span className="text-[11px] text-subtle">
            <span className="numeric">{submissionCount}</span> تسليم مسجَّل
          </span>
        )}
      </div>

      {error && (
        <p role="alert" className="mt-3 text-xs text-danger">
          {error}
        </p>
      )}
    </Card>
  );
}
