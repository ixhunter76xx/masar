"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";

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

  return (
    <nav aria-label="أقسام المقرر" className="-mb-px">
      <ul className="flex items-center gap-1 overflow-x-auto">
        {COURSE_TABS.map(({ segment, label, countKey }) => {
          const href = tabHref(courseId, segment);
          const isActive = segment
            ? pathname === href || pathname.startsWith(`${href}/`)
            : pathname === base;
          const count = countKey ? counts[countKey] : 0;

          return (
            <li key={segment || "content"} className="relative">
              <Link
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "inline-flex items-center gap-2 whitespace-nowrap px-4 py-3",
                  "border-b-2 border-transparent text-[13px]",
                  "transition-colors duration-200",
                  isActive ? "text-paper font-medium" : "text-muted hover:text-paper",
                )}
              >
                {label}
                {countKey && <CountBadge count={count} />}
              </Link>

              {isActive && (
                <motion.span
                  layoutId="course-tab-indicator"
                  transition={SPRING.indicator}
                  aria-hidden="true"
                  className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-accent-bright"
                />
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
