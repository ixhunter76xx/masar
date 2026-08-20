"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";

import { LinkPending } from "@/components/motion/LinkPending";
import { ADMIN_TABS } from "@/lib/admin-tabs";
import { SPRING } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * تبويبات الإدارة.
 *
 * ── لماذا صار الخطّ ينزلق ───────────────────────────────────────────
 * كان الخطّ حدًّا سفليًّا يُلوَّن على المقصود ويُشفَّف على غيره: يختفي
 * هنا ويظهر هناك. وتبويبات المقرر — الشريط الآخر الوحيد في المنصّة —
 * تنزلق بمؤشّر واحد منذ نقلها. فشريطان متجاوران في المنتج نفسه كانا
 * يقولان الشيء نفسه بلسانين.
 *
 * المعرّف مختلف عن معرّف تبويبات المقرر عمدًا: لا يجتمعان في شاشةٍ
 * واحدة اليوم، ومعرّفٌ مشترك يجعل ذلك عيبًا صامتًا يوم يجتمعان.
 *
 * ── والحالة المتفائلة ───────────────────────────────────────────────
 * شاشات الإدارة تقرأ القاعدة، فبين النقرة وتبدّل `pathname` مئات
 * المللي ثانية. ينطلق الخطّ مع النقرة ويصدّقه المسار حين يصل.
 */
export function AdminTabs() {
  const pathname = usePathname();
  const [claimed, setClaimed] = React.useState<string | null>(null);

  React.useEffect(() => setClaimed(null), [pathname]);

  const matched = ADMIN_TABS.map(({ segment }) => `/settings/${segment}`).find(
    (href) => pathname.startsWith(href),
  );
  const current = claimed ?? matched;

  return (
    <nav aria-label="أقسام الإدارة" className="mb-6 border-b border-line">
      {/* `scroll-x-clean` بدل `overflow-x-auto`: يبقي التمرير ويُخفي
          المِزلاج الرماديّ الذي كان يُرسم تحت الألسنة فيُقرأ عنصر واجهة،
          ويستبدله بتلاشٍ عند الحافّتين يظهر حين يوجد ما يُمرَّر إليه. */}
      <ul className="scroll-x-clean flex items-center gap-1">
        {ADMIN_TABS.map(({ segment, label }) => {
          const href = `/settings/${segment}`;
          const isActive = current === href;
          const isHere = matched === href;

          return (
            <li key={segment} className="relative">
              <Link
                href={href}
                onClick={() => setClaimed(href)}
                aria-current={isHere ? "page" : undefined}
                className={cn(
                  "inline-block whitespace-nowrap px-4 py-3",
                  "text-[13px] transition-colors duration-200",
                  isActive ? "text-paper font-medium" : "text-muted hover:text-paper",
                )}
              >
                <LinkPending label={`جارٍ فتح ${label}…`} />
                {label}
              </Link>

              {isActive && (
                <motion.span
                  layoutId="admin-tab-indicator"
                  transition={SPRING.indicator}
                  aria-hidden="true"
                  className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-gradient-to-l from-accent-bright to-accent-deep"
                />
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
