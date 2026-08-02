import Link from "next/link";
import { FileQuestion, Timer, Repeat } from "lucide-react";

import { Card } from "@/components/ui/Card";
import { QuizStatus } from "@/generated/prisma/enums";
import type { QuizSummary } from "@/lib/data/quizzes";
import { StaggerList, StaggerItem } from "@/components/motion/Stagger";

const STATUS_LABEL: Record<QuizStatus, { text: string; className: string }> = {
  DRAFT: { text: "مسودة", className: "border-line text-warning" },
  PUBLISHED: { text: "متاح", className: "border-success/40 text-success" },
  CLOSED: { text: "مغلق", className: "border-line text-subtle" },
};

export function QuizList({
  quizzes,
  courseId,
  canManage,
}: {
  quizzes: QuizSummary[];
  courseId: string;
  canManage: boolean;
}) {
  return (
    <StaggerList className="space-y-3">
      {quizzes.map((q) => {
        const status = STATUS_LABEL[q.status];
        // الطالب يفتح صفحة الأداء (المرحلة القادمة)؛ المدرب يفتح التحرير
        const href = `/courses/${courseId}/quizzes/${q.id}`;

        return (
          <StaggerItem key={q.id}>
            <Card className="lift hover:border-accent-deep">
              <Link href={href} className="flex gap-4 px-5 py-4">
                <span className="grid size-9 shrink-0 place-items-center rounded-full border border-line bg-ink text-accent">
                  <FileQuestion size={17} strokeWidth={1.75} aria-hidden="true" />
                  <span className="sr-only">اختبار</span>
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium leading-snug text-paper">
                      {q.title}
                    </p>
                    {canManage && (
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[10px] ${status.className}`}
                      >
                        {status.text}
                      </span>
                    )}
                  </div>

                  {q.description && (
                    <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-muted">
                      {q.description}
                    </p>
                  )}

                  <p className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-subtle">
                    <span>
                      <span className="numeric">{q.questionCount}</span> أسئلة ·{" "}
                      <span className="numeric">{q.totalPoints}</span> درجة
                    </span>
                    {q.timeLimitMin !== null && (
                      <span className="inline-flex items-center gap-1">
                        <Timer size={12} strokeWidth={1.75} aria-hidden="true" />
                        <span className="numeric">{q.timeLimitMin}</span> دقيقة
                      </span>
                    )}
                    {q.maxAttempts > 1 && (
                      <span className="inline-flex items-center gap-1">
                        <Repeat size={12} strokeWidth={1.75} aria-hidden="true" />
                        <span className="numeric">{q.maxAttempts}</span> محاولات
                      </span>
                    )}
                  </p>
                </div>
              </Link>
            </Card>
          </StaggerItem>
        );
      })}
    </StaggerList>
  );
}
