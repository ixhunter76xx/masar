import Link from "next/link";
import { UserRound, Layers, Play, ArrowLeft } from "lucide-react";

import { Card } from "@/components/ui/Card";
import type { CourseResume } from "@/lib/data/courses";

/**
 * بطاقة مقرر داخل بيئة التعلم.
 *
 * تعرض عدد المنتجات التي يملكها المستخدم في هذا المقرر لا عدد الطلاب:
 * في مسار ما يهمّ الطالب هو ما اشتراه، لا حجم الصف.
 *
 * ── الاستئناف ───────────────────────────────────────────────────────
 * الصفحة كانت تقول ما تملك ولا تقول أين وقفت، فيدخل العائد إلى صفحة
 * المقرر ثم يبحث عن درسه بنفسه. الشريط السفلي يعطيه المدخل مباشرة.
 *
 * الصياغة تتبع الحقيقة: «تابع» حين يوجد تقدّم محفوظ، و«ابدأ» حين لا
 * يوجد — ولا يوجد اليوم لأن لا مشغّل يسجّل الموضع بعد. الكذب هنا
 * («تابع» دائمًا) يجعل الطالب يظنّ أنه فقد مكانه.
 */
export function CourseCard({
  course,
  resume,
}: {
  course: {
    id: string;
    code: string;
    title: string;
    summary: string | null;
    presenter: { name: string } | null;
    products: { id: string; title: string }[];
  };
  resume?: CourseResume;
}) {
  const pct =
    resume && resume.ownedReady > 0
      ? Math.round((resume.completed / resume.ownedReady) * 100)
      : 0;

  return (
    <Card className="lift overflow-hidden hover:border-accent-deep">
      <Link href={`/learn/${course.id}`} className="block px-5 py-4">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="truncate text-sm font-medium text-paper">
            {course.title}
          </h3>
          <span className="numeric shrink-0 text-[11px] text-subtle">
            {course.code}
          </span>
        </div>

        {course.summary && (
          <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-muted">
            {course.summary}
          </p>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-4 text-[11px] text-subtle">
          {course.presenter && (
            <span className="inline-flex items-center gap-1.5">
              <UserRound size={13} strokeWidth={1.75} aria-hidden="true" />
              {course.presenter.name}
            </span>
          )}
          <span className="inline-flex items-center gap-1.5">
            <Layers size={13} strokeWidth={1.75} aria-hidden="true" />
            <span className="numeric">{course.products.length}</span>
            {course.products.length === 1 ? "دورة" : "دورات"}
          </span>
          {resume && resume.ownedReady > 0 && (
            <span className="inline-flex items-center gap-1.5">
              <Play size={12} fill="currentColor" strokeWidth={0} aria-hidden="true" />
              <span className="numeric">{resume.ownedReady}</span>
              {resume.ownedReady === 1 ? "درس جاهز" : "دروس جاهزة"}
            </span>
          )}
        </div>
      </Link>

      {resume?.lesson && (
        <div className="border-t border-line-soft bg-ink/45 px-5 py-3">
          {/* شريط الإنجاز يظهر فقط حين يوجد إنجاز فعلي. صفر بالمئة
              دائمًا يقول «لم تتقدّم» في كل زيارة، وهو غير صحيح: لا
              أحد يقيس التقدّم بعد. */}
          {resume.completed > 0 && (
            <div className="mb-2.5">
              <div
                className="h-1 overflow-hidden rounded-full bg-line-soft"
                role="progressbar"
                aria-valuenow={pct}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="نسبة الإنجاز"
              >
                {/* العرض لا `transform`: الشريط ثابت لا يتحرّك في كل
                    إطار، وقيمته تُقرأ مرة عند التصيير. */}
                <span
                  className="block h-full rounded-full [background:linear-gradient(90deg,var(--color-spark-deep),var(--color-spark))]"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="mt-1.5 text-[11px] text-subtle">
                أنهيت <span className="numeric">{resume.completed}</span> من{" "}
                <span className="numeric">{resume.ownedReady}</span>
              </p>
            </div>
          )}

          <Link
            href={`/learn/${course.id}`}
            className="press group flex min-h-touch items-center justify-between gap-3 rounded-field
              border border-line bg-panel px-3.5 text-[13px] font-medium text-paper
              transition-colors hover:border-accent-deep hover:bg-panel-lift"
          >
            <span className="flex min-w-0 items-center gap-2">
              <Play
                size={13}
                fill="currentColor"
                strokeWidth={0}
                aria-hidden="true"
                className="shrink-0 text-accent-bright"
              />
              <span className="shrink-0">
                {resume.kind === "resume" ? "تابع من" : "ابدأ من"}
              </span>
              <span className="truncate text-muted">{resume.lesson.title}</span>
            </span>
            <ArrowLeft
              size={14}
              strokeWidth={2}
              aria-hidden="true"
              className="shrink-0 text-subtle transition-transform duration-200 ease-out group-hover:-translate-x-1"
            />
          </Link>
        </div>
      )}
    </Card>
  );
}
