"use client";

import * as React from "react";
import { ChevronDown, CircleUserRound } from "lucide-react";

import { NavLink as Link } from "@/components/ui/NavLink";
import { ROLE_LABELS } from "@/lib/roles";
import { cn } from "@/lib/utils";
import type { Role } from "@/generated/prisma/enums";

/**
 * ══ هوية المستخدم في الرأسية، والخروج تحتها ═════════════════════════
 *
 * ── ما كان، ولماذا تغيّر ────────────────────────────────────────────
 * كانت الرأسية تحمل زرّ «تسجيل الخروج» عاريًا. وهو أبرز عنصرٍ فيها
 * بينما هو **أندر** فعلٍ يقوم به المستخدم: يدخل مرّةً ويدرس مرارًا،
 * فلا يخرج إلا نادرًا. فكان أكبر ما في الشريط أقلَّ ما يُستعمل — وعلى
 * الهاتف كان يزاحم المبدّل وزرّ القائمة على عرضٍ لا يتّسع للثلاثة.
 *
 * والاسم يقول ما لا يقوله الزرّ: **بأيّ حسابٍ أنت داخل**. وهو سؤالٌ
 * حقيقيّ في منصّةٍ لها إدارةٌ ومدرّبون وطلاب، ويُختبر فيها الحسابان.
 *
 * ── لماذا ينقسم خادمًا وعميلًا ──────────────────────────────────────
 * `signOut` يعمل على الخادم وحده. فالنافذة عميلٌ يفتح ويغلق، ونموذج
 * الخروج يُمرَّر إليها **من الخادم** عبر `children`. أي أن الحدود
 * محفوظة: لا `signOut` يعبر إلى المتصفّح، ولا حالةَ فتحٍ تُدار خادمًا.
 *
 * ── الإغلاق ─────────────────────────────────────────────────────────
 * بالنقر خارجها، وبـ`Escape`، وبفقدان التركيز إلى خارج الشجرة. ويعود
 * التركيز إلى الزرّ عند الإغلاق بـ`Escape` — وإلّا ضاع مكانُ من يتنقّل
 * بلوحة المفاتيح.
 * ═══════════════════════════════════════════════════════════════════
 */
export function UserMenu({
  name,
  role,
  children,
}: {
  name: string;
  role: Role;
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    if (!open) return;

    const onPointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      triggerRef.current?.focus();
    };

    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const first = name.trim().charAt(0) || "؟";

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className={cn(
          "press flex min-h-touch items-center gap-2 rounded-full border py-1 pe-2 ps-1",
          "transition-colors duration-200",
          open
            ? "border-accent-deep bg-panel-lift"
            : "border-line bg-panel/60 hover:border-accent-deep/70 hover:bg-panel-lift",
        )}
      >
        <span
          aria-hidden="true"
          className="grid size-8 shrink-0 place-items-center rounded-full text-[13px] font-semibold text-ink
            [background:linear-gradient(180deg,var(--color-accent-bright),var(--color-action))]"
        >
          {first}
        </span>
        {/* الاسم يختفي على الضيّق وتبقى الحبّة: الأفاتار وحده يكفي
            للتعريف، ولا يزاحم المبدّل الثابت في منتصف النافذة. */}
        <span className="hidden max-w-[9rem] truncate text-[13px] font-medium text-paper min-[420px]:block">
          {name}
        </span>
        <ChevronDown
          size={14}
          strokeWidth={2}
          aria-hidden="true"
          className={cn(
            "shrink-0 text-subtle transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div
          role="menu"
          aria-label="حساب المستخدم"
          className="anim-rise absolute end-0 top-[calc(100%+0.5rem)] z-50 w-[13.5rem] overflow-hidden
            rounded-[14px] border border-line bg-panel-lift
            shadow-[0_20px_50px_-16px_var(--shadow-lift)]"
        >
          <div className="border-b border-line-soft px-3.5 py-3">
            <p className="truncate text-[13px] font-semibold text-paper">{name}</p>
            <p className="mt-0.5 truncate text-[11px] text-subtle">{ROLE_LABELS[role]}</p>
          </div>
          {/* الملف الشخصي هنا لا في الشريط السفليّ: خمس خاناتٍ أقصى ما
              يتّسع على الهاتف، وهو أندرُ ما يُفتح — فمكانه تحت الاسم. */}
          <div className="p-1.5 pb-0">
            <Link
              href="/profile"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="press flex min-h-touch items-center gap-2.5 rounded-[10px] px-2.5 text-[13px] text-muted hover:bg-panel hover:text-paper"
            >
              <CircleUserRound size={16} strokeWidth={1.75} aria-hidden="true" />
              الملف الشخصي
            </Link>
          </div>
          {/* نموذج الخروج — يأتي من الخادم كما هو */}
          <div className="p-1.5">{children}</div>
        </div>
      )}
    </div>
  );
}
