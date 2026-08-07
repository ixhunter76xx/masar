import Link from "next/link";
import { ArrowRight } from "lucide-react";

/**
 * إطار الصفحات النصّية (الشروط والخصوصية).
 *
 * عرض القراءة محدود بـ`65ch`: السطر الطويل يجعل العين تفقد بدايته عند
 * الالتفاف، وهو ما يجعل نصًّا قانونيًا لا يُقرأ أصلًا.
 */
export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  /** تاريخ آخر تحديث — نصّ قانوني بلا تاريخ لا يُعرف أيّ نسخة وافقتَ عليها */
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-[1120px] px-4 sm:px-8">
      <Link
        href="/courses"
        className="press group mt-2 inline-flex min-h-touch items-center gap-2 text-[13px] text-subtle hover:text-paper"
      >
        <ArrowRight size={15} strokeWidth={1.75} aria-hidden="true" />
        كل المقررات
      </Link>

      <article className="mx-auto max-w-[65ch] py-10">
        <h1 className="text-[1.75rem] font-semibold tracking-[-0.02em]">
          {title}
        </h1>
        <p className="mt-2 text-xs text-subtle">آخر تحديث: {updated}</p>

        <div className="mt-10 space-y-9">{children}</div>
      </article>
    </div>
  );
}

export function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-3 text-[15px] font-medium text-paper">{title}</h2>
      <div className="space-y-3 text-[13.5px] leading-[1.95] text-muted">
        {children}
      </div>
    </section>
  );
}
