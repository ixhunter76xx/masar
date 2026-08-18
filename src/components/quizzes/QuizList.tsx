import Link from "next/link";
import { ar } from "@/lib/numerals";
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
    /* نفس سكّة المحاضرات — الاختبارات محطّات على الطريق نفسه لا قائمة
       منفصلة. تكرار الشكل هو ما يجعله لغةً بدل أن يكون زخرفة في مكان
       واحد. */
    <div className="relative ps-[2.375rem]">
      <span
        aria-hidden="true"
        className="absolute inset-y-4 start-[15px] w-0.5 rounded-full bg-line/70"
      />
      <span
        aria-hidden="true"
        className="track-draw absolute inset-y-4 start-[15px] w-0.5 origin-top rounded-full
          [background:linear-gradient(180deg,var(--color-spark)_0%,var(--color-accent-deep)_45%,transparent_100%)]"
      />

      <StaggerList className="space-y-3">
        {quizzes.map((q) => {
          const status = STATUS_LABEL[q.status];
          const live = q.status === QuizStatus.PUBLISHED;
          // الطالب يفتح صفحة الأداء (المرحلة القادمة)؛ المدرب يفتح التحرير
          const href = `/learn/${courseId}/quizzes/${q.id}`;

          return (
            <StaggerItem key={q.id} className="group relative">
              <span
                className={
                  "absolute -start-[2.375rem] top-[18px] z-10 grid size-8 place-items-center " +
                  "rounded-full border bg-ink shadow-[0_0_0_5px_var(--color-ink)] " +
                  "transition-[transform,border-color,color] duration-[320ms] ease-out " +
                  "group-hover:scale-110 " +
                  (live
                    ? "node-live border-spark/55 text-spark"
                    : "border-line text-subtle")
                }
              >
                <FileQuestion size={15} strokeWidth={1.75} aria-hidden="true" />
                <span className="sr-only">اختبار</span>
              </span>

              <Card className="lift glow-edge hover:border-spark/40">
                <Link href={href} className="flex gap-4 px-5 py-4">
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
                      <span className="numeric">{ar(q.questionCount)}</span> أسئلة ·{" "}
                      <span className="numeric">{ar(q.totalPoints)}</span> درجة
                    </span>
                    {q.timeLimitMin !== null && (
                      <span className="inline-flex items-center gap-1">
                        <Timer size={12} strokeWidth={1.75} aria-hidden="true" />
                        <span className="numeric">{ar(q.timeLimitMin)}</span> دقيقة
                      </span>
                    )}
                    {q.maxAttempts > 1 && (
                      <span className="inline-flex items-center gap-1">
                        <Repeat size={12} strokeWidth={1.75} aria-hidden="true" />
                        <span className="numeric">{ar(q.maxAttempts)}</span> محاولات
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
    </div>
  );
}
