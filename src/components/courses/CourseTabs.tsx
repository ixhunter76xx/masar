"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";

import { LinkPending } from "@/components/motion/LinkPending";
import { CountBadge } from "@/components/ui/Badge";
import { SPRING } from "@/lib/motion";
import {
  COURSE_TABS,
  tabHref,
  type CourseTabCounts,
} from "@/lib/course-tabs";
import { cn } from "@/lib/utils";

/**
 * شريط تبويبات المقرر.
 * التبويب النشط: نص فاتح + خط سفلي — بلا خلفية.
 *
 * الخط السفلي عنصر واحد يحمل `layoutId`، فينزلق motion به من موضع
 * التبويب السابق إلى الجديد بدل أن يختفي هنا ويظهر هناك. الانزلاق
 * يعرض العلاقة بين التبويبين — أنهما جاران في نفس الشريط. المسافة
 * تُحسب من التخطيط الفعلي، فتصحّ في RTL دون أي حساب اتجاه يدوي.
 *
 * ── الحالة المتفائلة ────────────────────────────────────────────────
 * `pathname` لا يتبدّل قبل أن تصل حمولة التبويب من الخادم. وربطُ
 * الخطّ به وحده كان يعني نصف ثانية بلا أي أثرٍ للنقرة ثم قفزةً —
 * وهي أسوأ حالات المؤشّر المنزلق: تتأخّر الحركة حتى تفقد معناها.
 * فينطلق الخطّ مع النقرة، ويصدّقه المسار حين يصل.
 */
export function CourseTabs({
  courseId,
  counts,
}: {
  courseId: string;
  counts: CourseTabCounts;
}) {
  const pathname = usePathname();
  const base = `/learn/${courseId}`;
  const [claimed, setClaimed] = React.useState<string | null>(null);

  React.useEffect(() => setClaimed(null), [pathname]);

  const matched = COURSE_TABS.map(({ segment }) => tabHref(courseId, segment))
    .find((href) =>
      href === base
        ? pathname === base
        : pathname === href || pathname.startsWith(`${href}/`),
    );
  const current = claimed ?? matched;

  return (
    <nav aria-label="أقسام المقرر" className="-mb-px">
      <ul className="flex items-center gap-[0.2rem] overflow-x-auto overflow-y-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {COURSE_TABS.map(({ segment, label, countKey }) => {
          const href = tabHref(courseId, segment);
          const isActive = current === href;
          const isHere = matched === href;
          const count = countKey ? counts[countKey] : 0;

          return (
            <li key={segment || "content"} className="relative">
              <Link
                href={href}
                onClick={() => setClaimed(href)}
                aria-current={isHere ? "page" : undefined}
                className={cn(
                  "inline-flex items-center gap-2 whitespace-nowrap px-4 py-3",
                  "border-b-2 border-transparent text-[0.87rem] font-medium",
                  "transition-colors duration-200",
                  isActive ? "text-paper font-medium" : "text-muted hover:text-paper",
                )}
              >
                <LinkPending label={`جارٍ فتح ${label}…`} />
                {label}
                {countKey && <CountBadge count={count} />}
              </Link>

              {isActive && (
                <motion.span
                  layoutId="course-tab-indicator"
                  transition={SPRING.indicator}
                  aria-hidden="true"
                  /* الذهبيّ: «أين أنت» في المقرر هو موضعك على المسار —
                     وهو اللون نفسه الذي يمتلئ به شريط التقدّم تحته. */
                  className="absolute inset-x-[0.55rem] bottom-0 h-0.5 rounded-full bg-spark"
                />
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
