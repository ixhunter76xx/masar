"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { CountBadge } from "@/components/ui/Badge";
import {
  COURSE_TABS,
  tabHref,
  type CourseTabCounts,
} from "@/lib/course-tabs";
import { cn } from "@/lib/utils";

/**
 * شريط تبويبات المقرر.
 * التبويب النشط: نص فاتح + خط سفلي — بلا خلفية.
 */
export function CourseTabs({
  courseId,
  counts,
}: {
  courseId: string;
  counts: CourseTabCounts;
}) {
  const pathname = usePathname();
  const base = `/courses/${courseId}`;

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
            <li key={segment || "content"}>
              <Link
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "inline-flex items-center gap-2 whitespace-nowrap px-4 py-3",
                  "border-b-2 text-[13px] transition-[color,border-color] duration-200",
                  isActive
                    ? "border-accent-bright text-paper font-medium"
                    : "border-transparent text-muted hover:text-paper",
                )}
              >
                {label}
                {countKey && <CountBadge count={count} />}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
