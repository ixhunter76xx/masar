"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";

import { NavLink as Link } from "@/components/ui/NavLink";
import { NAV_ITEMS, type NavCounts } from "@/lib/navigation";
import { SPRING } from "@/lib/motion";
import type { Role } from "@/generated/prisma/enums";
import { cn } from "@/lib/utils";

/**
 * ══ شريط التنقّل السفليّ — الهاتف وحده (إعادة التصميم 2026-09-14) ═══
 *
 * حلّ محلّ القائمة المنسحبة بقرار المالك. القائمة كانت تُخفي الأبواب
 * الخمسة خلف زرٍّ وفتحٍ وإغلاق؛ والشريط يُبقيها تحت الإبهام في كل
 * شاشة، وهو ما يتوقّعه طالبٌ يعيش على هاتفه.
 *
 * ── خمسة لا ستة ─────────────────────────────────────────────────────
 * خمس خانات هي أقصى ما يُقرأ على ٣٧٥px. و«الملف الشخصي» هو ما خرج:
 * بابه تحت الاسم في الرأسية (`UserMenu`) مع الخروج، وهو أندرُ ما يُفتح.
 *
 * ── الحالة المتفائلة ومعرّف الانزلاق ────────────────────────────────
 * كما في `SidebarNav`: العلامة تنتقل مع النقرة لا بعد وصول الصفحة،
 * و`aria-current` يتبع المسار الحقيقي. والمعرّف `bottom-nav-active`
 * فريدٌ في المستودع — يحرسه `nav-feedback-regression`.
 * ═══════════════════════════════════════════════════════════════════
 */
export function BottomNav({
  role,
  counts = {},
}: {
  role: Role;
  counts?: NavCounts;
}) {
  const pathname = usePathname();
  const [claimed, setClaimed] = React.useState<string | null>(null);

  React.useEffect(() => setClaimed(null), [pathname]);

  const items = NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(role))
    .filter((item) => item.href !== "/profile")
    .slice(0, 5);

  const matched = items.find(
    ({ href }) => pathname === href || pathname.startsWith(`${href}/`),
  )?.href;
  const current = claimed ?? matched;

  return (
    <nav
      aria-label="التنقّل الرئيسي"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line-soft bg-ink/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md min-[1060px]:hidden"
    >
      <ul className="mx-auto flex max-w-[560px] gap-0.5 px-2 py-2">
        {items.map(({ href, label, short, icon: Icon, badgeTone }) => {
          const on = current === href;
          const here = matched === href;
          const count = counts[href] ?? 0;

          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                onClick={() => setClaimed(href)}
                aria-current={here ? "page" : undefined}
                aria-label={count > 0 ? `${label} — ${count} جديد` : label}
                className={cn(
                  "relative flex min-h-[52px] flex-col items-center justify-center gap-1 rounded-[11px] text-[10.5px] transition-colors duration-200",
                  on ? "bg-panel font-semibold text-paper" : "text-subtle hover:text-paper",
                )}
              >
                {on && (
                  <motion.span
                    layoutId="bottom-nav-active"
                    transition={SPRING.indicator}
                    aria-hidden="true"
                    className="absolute top-0 h-0.5 w-5 rounded-full bg-spark"
                  />
                )}
                <span className="relative" aria-hidden="true">
                  <Icon
                    size={19}
                    strokeWidth={1.75}
                    className={cn("transition-colors duration-200", on && "text-spark")}
                  />
                  {count > 0 && (
                    <span
                      className={cn(
                        "absolute -end-1 -top-0.5 size-2 rounded-full ring-2 ring-ink",
                        badgeTone === "danger" ? "bg-danger" : "bg-accent",
                      )}
                    />
                  )}
                </span>
                <span aria-hidden="true">{short ?? label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
