"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { ADMIN_TABS } from "@/lib/admin-tabs";
import { cn } from "@/lib/utils";

export function AdminTabs() {
  const pathname = usePathname();

  return (
    <nav aria-label="أقسام الإدارة" className="mb-6 border-b border-line">
      {/* `scroll-x-clean` بدل `overflow-x-auto`: يبقي التمرير ويُخفي
          المِزلاج الرماديّ الذي كان يُرسم تحت الألسنة فيُقرأ عنصر واجهة،
          ويستبدله بتلاشٍ عند الحافّتين يظهر حين يوجد ما يُمرَّر إليه. */}
      <ul className="scroll-x-clean flex items-center gap-1">
        {ADMIN_TABS.map(({ segment, label }) => {
          const href = `/settings/${segment}`;
          const isActive = pathname.startsWith(href);

          return (
            <li key={segment}>
              <Link
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "inline-block whitespace-nowrap px-4 py-3",
                  "border-b-2 text-[13px] transition-[color,border-color] duration-200",
                  isActive
                    ? "border-accent-bright text-paper font-medium"
                    : "border-transparent text-muted hover:text-paper",
                )}
              >
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
