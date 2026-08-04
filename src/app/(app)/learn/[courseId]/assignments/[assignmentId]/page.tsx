import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  Paperclip,
  Download,
  CalendarClock,
  CheckCircle2,
} from "lucide-react";

import { AppPage } from "@/components/shell/AppPage";
import { Card } from "@/components/ui/Card";
import { AssignmentForm } from "@/components/assignments/AssignmentForm";
import { AssignmentToolbar } from "@/components/assignments/AssignmentToolbar";
import { GradeForm } from "@/components/assignments/GradeForm";
import { SubmissionForm } from "@/components/assignments/SubmissionForm";
import { requireCourseAccess } from "@/lib/data/courses";
import { canManageCourse } from "@/lib/data/materials";
import {
  getAssignmentForManaging,
  getAssignmentForStudent,
  submissionBlocker,
} from "@/lib/data/assignments";
import { formatBytes } from "@/lib/uploads";
import { relativeTime } from "@/lib/format";

type Params = { params: Promise<{ courseId: string; assignmentId: string }> };

export const metadata: Metadata = { title: "الواجب" };

export default async function AssignmentPage({ params }: Params) {
  const { courseId, assignmentId } = await params;
  const { user } = await requireCourseAccess(courseId);

  const canManage = await canManageCourse(courseId, user.id, user.role);

  const back = (
    <Link
      href={`/learn/${courseId}`}
      className="mb-4 inline-flex items-center gap-1.5 text-[12px] text-muted transition-colors hover:text-paper"
    >
      <ArrowRight size={14} strokeWidth={1.75} aria-hidden="true" />
      العودة إلى محتوى المقرر
    </Link>
  );

  /* ================================================================ */
  /*  المدرب: الإعدادات + التصحيح                                      */
  /* ================================================================ */
  if (canManage) {
    const a = await getAssignmentForManaging(assignmentId, courseId);
    if (!a) notFound();

    return (
      <AppPage title={a.title} hidePageHeader>
        {back}

        <AssignmentToolbar
          courseId={courseId}
          assignmentId={a.id}
          status={a.status}
          submissionCount={a.submissions.length}
        />

        <AssignmentForm
          courseId={courseId}
          assignment={{
            id: a.id,
            title: a.title,
            description: a.description,
            totalPoints: a.totalPoints,
            dueAt: a.dueAt,
            allowLate: a.allowLate,
            latePenaltyPercent: a.latePenaltyPercent,
            allowedExtensions: a.allowedExtensions,
            maxFileMb: a.maxFileMb,
          }}
        />

        <h3 className="mb-3 text-sm font-medium text-paper">
          التسليمات{" "}
          <span className="numeric text-[11px] text-subtle">
            {a.submissions.length}
          </span>
        </h3>

        {a.submissions.length === 0 ? (
          <Card className="px-5 py-6 text-center text-[13px] text-muted">
            لا توجد تسليمات بعد.
          </Card>
        ) : (
          <ol className="space-y-3">
            {a.submissions.map((s) => (
              <li key={s.id}>
                <Card className="px-5 py-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-paper">
                        {s.student.name}
                        {s.isLate && (
                          <span className="ms-2 rounded-full border border-warning/40 px-2 py-0.5 text-[10px] text-warning">
                            متأخر
                          </span>
                        )}
                        {s.earnedPoints !== null && (
                          <span className="ms-2 rounded-full border border-success/40 px-2 py-0.5 text-[10px] text-success">
                            مُصحَّح
                          </span>
                        )}
                      </p>
                      <p className="numeric mt-0.5 text-[11px] text-subtle">
                        {s.student.username} · {relativeTime(s.submittedAt)}
                      </p>
                    </div>

                    {s.earnedPoints !== null && (
                      <p className="numeric text-sm text-paper">
                        {s.earnedPoints}
                        <span className="text-subtle"> / </span>
                        <span className="text-muted">{a.totalPoints}</span>
                        {s.rawPoints !== null &&
                          s.rawPoints !== s.earnedPoints && (
                            <span className="ms-2 text-[11px] text-warning">
                              (قبل الخصم {s.rawPoints})
                            </span>
                          )}
                      </p>
                    )}
                  </div>

                  {s.note && (
                    <p className="mt-3 whitespace-pre-line rounded-[10px] border border-line bg-ink px-4 py-3 text-[13px] leading-relaxed text-muted">
                      {s.note}
                    </p>
                  )}

                  {s.objectKey && (
                    <a
                      href={`/api/courses/${courseId}/assignments/${a.id}/submission/${s.id}/download`}
                      className="mt-3 inline-flex items-center gap-2 rounded-[10px] border border-line px-3 py-2 text-[12px] text-muted press hover:border-accent-deep hover:text-paper"
                    >
                      <Download size={14} strokeWidth={1.75} aria-hidden="true" />
                      {s.fileName}
                      {s.fileSizeBytes !== null && (
                        <span className="numeric text-subtle">
                          {formatBytes(Number(s.fileSizeBytes))}
                        </span>
                      )}
                    </a>
                  )}

                  <GradeForm
                    courseId={courseId}
                    assignmentId={a.id}
                    submissionId={s.id}
                    totalPoints={a.totalPoints}
                    rawPoints={s.rawPoints}
                    feedback={s.feedback}
                    isLate={s.isLate}
                    penaltyPercent={a.latePenaltyPercent}
                  />
                </Card>
              </li>
            ))}
          </ol>
        )}
      </AppPage>
    );
  }

  /* ================================================================ */
  /*  الطالب: التفاصيل + التسليم + درجته هو                            */
  /* ================================================================ */
  const a = await getAssignmentForStudent(
    assignmentId,
    courseId,
    user.id,
    user.role,
  );
  if (!a) notFound();

  const mine = a.submissions[0] ?? null;
  const blocker = submissionBlocker(a);
  const willBeLate = a.dueAt !== null && new Date() > a.dueAt;

  return (
    <AppPage title={a.title} hidePageHeader>
      {back}

      <Card className="mb-6 px-5 py-5">
        <h2 className="text-lg font-bold text-paper">{a.title}</h2>

        {a.description && (
          <p className="mt-3 whitespace-pre-line text-[13px] leading-relaxed text-muted">
            {a.description}
          </p>
        )}

        <dl className="mt-5 grid gap-4 border-t border-line pt-4 text-[13px] sm:grid-cols-2">
          <div>
            <dt className="text-[11px] text-subtle">الدرجة الكاملة</dt>
            <dd className="numeric mt-1 text-paper">{a.totalPoints}</dd>
          </div>
          <div>
            <dt className="flex items-center gap-1.5 text-[11px] text-subtle">
              <CalendarClock size={12} strokeWidth={1.75} aria-hidden="true" />
              موعد التسليم
            </dt>
            <dd className="mt-1 text-paper">
              {a.dueAt ? relativeTime(a.dueAt) : "بلا موعد محدد"}
            </dd>
          </div>
        </dl>

        {a.allowLate && a.latePenaltyPercent > 0 && (
          <p className="mt-3 text-[11px] text-warning">
            التسليم المتأخر مقبول مع خصم{" "}
            <span className="numeric">{a.latePenaltyPercent}</span>٪.
          </p>
        )}
      </Card>

      {mine && (
        <Card className="mb-6 px-5 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="inline-flex items-center gap-2 text-sm text-paper">
              <CheckCircle2
                size={16}
                strokeWidth={1.75}
                aria-hidden="true"
                className="text-success"
              />
              سُلِّم {relativeTime(mine.submittedAt)}
              {mine.isLate && (
                <span className="rounded-full border border-warning/40 px-2 py-0.5 text-[10px] text-warning">
                  متأخر
                </span>
              )}
            </p>

            {mine.earnedPoints !== null ? (
              <p className="numeric text-sm text-paper">
                {mine.earnedPoints}
                <span className="text-subtle"> / </span>
                <span className="text-muted">{a.totalPoints}</span>
              </p>
            ) : (
              <span className="text-[11px] text-subtle">بانتظار التصحيح</span>
            )}
          </div>

          {mine.fileName && (
            <a
              href={`/api/courses/${courseId}/assignments/${a.id}/submission/${mine.id}/download`}
              className="mt-3 inline-flex items-center gap-2 text-[12px] text-accent-bright hover:text-paper"
            >
              <Paperclip size={13} strokeWidth={1.75} aria-hidden="true" />
              {mine.fileName}
            </a>
          )}

          {mine.feedback && (
            <div className="mt-3 rounded-[10px] border border-line bg-ink px-4 py-3">
              <p className="text-[11px] text-subtle">تعليق المدرب</p>
              <p className="mt-1 whitespace-pre-line text-[13px] leading-relaxed text-muted">
                {mine.feedback}
              </p>
            </div>
          )}
        </Card>
      )}

      {blocker ? (
        <Card className="px-5 py-4 text-[13px] text-warning">{blocker}</Card>
      ) : (
        <SubmissionForm
          courseId={courseId}
          assignmentId={a.id}
          allowedExtensions={a.allowedExtensions}
          maxFileMb={a.maxFileMb}
          existingNote={mine?.note ?? null}
          existingFileName={mine?.fileName ?? null}
          isLate={willBeLate}
        />
      )}
    </AppPage>
  );
}
