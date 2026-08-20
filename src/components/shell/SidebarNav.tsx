"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";

import { LinkPending } from "@/components/motion/LinkPending";
import { NAV_ITEMS, type NavCounts } from "@/lib/navigation";
import { CountBadge } from "@/components/ui/Badge";
import { SPRING } from "@/lib/motion";
import type { Role } from "@/generated/prisma/enums";
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
 *
 * ── ⚠ الخطّ ينزلق، ولذلك يحتاج نطاقًا ───────────────────────────────
 * الخطّ عنصرٌ واحد يحمل `layoutId`، فينتقل من عنصرٍ إلى آخر انزلاقًا
 * لا ظهورًا واختفاءً — وهو اللسان نفسه الذي تتكلّمه تبويبات المقرر.
 *
 * لكن `SidebarContent` يُصيَّر **مرّتين**: في الشريط الجانبي المثبّت
 * وفي اللوحة المنسحبة. والمثبّت مخفيٌّ بـ`hidden` تحت ١٠٦٠px لكنه
 * **باقٍ في الشجرة**. فمعرّفٌ واحد مشترك يعني عنصرين يتنازعانه،
 * ويقفز الخطّ بين نسختين — وهو العيب نفسه الذي أُصلح في تبويبات
 * المقرر ويحرسه `course-transition-regression.mts`. فلكل نسخةٍ نطاقُها.
 *
 * ── ولماذا حالةٌ متفائلة ────────────────────────────────────────────
 * `pathname` لا يتبدّل إلا بعد أن تصل الصفحة من الخادم — ‏١٠٠٠–١٤٥٠ms
 * مقيسة. فربطُ «أين أنا» به وحده يعني أن القائمة تبقى ساكنة طوال ذلك
 * ثم تقفز فجأةً. النقرة تحرّك الخطّ في الإطار التالي لها، والمسار
 * الحقيقيّ يصدّق ذلك أو ينقضه حين يصل.
 */
export function SidebarNav({
  counts = {},
  role,
  onNavigate,
  scope = "sidebar",
}: {
  counts?: NavCounts;
  role?: Role;
  onNavigate?: () => void;
  /** يفصل معرّف الانزلاق بين النسخة المثبّتة والنسخة المنسحبة */
  scope?: string;
}) {
  const pathname = usePathname();
  const [claimed, setClaimed] = React.useState<string | null>(null);

  /* الحالة المتفائلة تسقط فور وصول المسار الحقيقي — سواء صدّقها أو
     ذهب المستخدم إلى غيرها أو رجع للخلف. */
  React.useEffect(() => setClaimed(null), [pathname]);

  /* الترشيح بالدور إخفاءٌ بصري لا حماية — الصفحات نفسها تتحقّق من
     الجلسة. الغرض هنا ألّا يرى المستخدم بابًا لا يخصّه. */
  const items = NAV_ITEMS.filter(
    (item) => !item.roles || (role && item.roles.includes(role)),
  );

  const matched = items.find(
    ({ href }) => pathname === href || pathname.startsWith(`${href}/`),
  )?.href;
  const current = claimed ?? matched;

  return (
    <nav aria-label="التنقّل الرئيسي">
      <ul className="space-y-1">
        {items.map(({ href, label, icon: Icon, badgeTone }) => {
          const isActive = current === href;
          /* `aria-current` يتبع المسار الحقيقي لا التفاؤل: إعلان
             القارئ الصوتي «الصفحة الحالية» قبل أن تُفتح كذبٌ عليه. */
          const isHere = matched === href;
          const count = counts[href] ?? 0;

          return (
            <li key={href}>
              <Link
                href={href}
                onClick={() => {
                  setClaimed(href);
                  onNavigate?.();
                }}
                aria-current={isHere ? "page" : undefined}
                className={cn(
                  "relative flex items-center gap-3 h-11 ps-3 pe-4 rounded-[10px]",
                  "text-sm transition-colors duration-150",
                  isActive
                    ? "bg-panel-lift text-paper font-medium"
                    : "text-muted hover:text-paper hover:bg-panel-lift",
                )}
              >
                <LinkPending label={`جارٍ فتح ${label}…`} />

                {isActive && (
                  <motion.span
                    layoutId={`nav-active-${scope}`}
                    transition={SPRING.indicator}
                    aria-hidden="true"
                    className="absolute inset-y-2 end-0 w-[3px] rounded-full bg-accent-bright"
                  />
                )}

                <Icon
                  size={18}
                  strokeWidth={1.75}
                  aria-hidden="true"
                  className={cn(
                    "shrink-0 transition-colors duration-150",
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
