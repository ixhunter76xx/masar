"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { NAV_ITEMS, type NavCounts } from "@/lib/navigation";
import { CountBadge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

/**
 * قائمة التنقّل.
 *
 * العنصر النشط: خط رأسي + خلفية خفيفة — بلا لون نص صاخب.
 *
 * ملاحظة على موضع الخط: نص القاعدة في ملف التصميم يقول "الحافة اليمنى"،
 * لكن المخطط البصري نفسه يضع الخط على الحافة المقابلة (يسار البطاقة في
 * RTL)، أي عند الحدّ الفاصل بين القائمة والمحتوى. اتّبعنا المخطط.
 * لعكسه إلى اليمين: بدّل `before:end-0` بـ `before:start-0`.
 */
export function SidebarNav({
  counts = {},
  onNavigate,
}: {
  counts?: NavCounts;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <nav aria-label="التنقّل الرئيسي">
      <ul className="space-y-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon, badgeTone }) => {
          const isActive = pathname === href || pathname.startsWith(`${href}/`);
          const count = counts[href] ?? 0;

          return (
            <li key={href}>
              <Link
                href={href}
                onClick={onNavigate}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "relative flex items-center gap-3 h-11 ps-3 pe-4 rounded-[10px]",
                  "text-sm transition-colors duration-150",
                  // الخط الرأسي عند الحدّ الفاصل بين القائمة والمحتوى
                  "before:absolute before:inset-y-2 before:end-0 before:w-[3px]",
                  "before:rounded-full before:origin-center",
                  "before:transition-[background-color,transform] before:duration-200",
                  isActive
                    ? "bg-[#18222e] text-paper font-medium before:bg-accent-bright before:scale-y-100"
                    : "text-muted hover:text-paper hover:bg-panel before:bg-transparent before:scale-y-0",
                )}
              >
                <Icon
                  size={18}
                  strokeWidth={1.75}
                  aria-hidden="true"
                  className={cn(
                    "shrink-0",
                    isActive ? "text-accent-bright" : "text-subtle",
                  )}
                />
                <span className="flex-1 text-start">{label}</span>
                {badgeTone && <CountBadge count={count} tone={badgeTone} />}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
