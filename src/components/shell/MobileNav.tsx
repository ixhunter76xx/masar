"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

import { SidebarContent } from "@/components/shell/Sidebar";
import type { NavCounts } from "@/lib/navigation";
import type { Role } from "@/generated/prisma/enums";

/** مدة الانتقال — تطابق قيم duration في الأصناف أدناه */
const ANIM_MS = 220;

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

/**
 * لوحة التنقّل المنسحبة للشاشات الصغيرة.
 * تنسحب من الحافة الابتدائية (اليمين في RTL).
 *
 * ── لماذا Portal، وهو إصلاح لا تحسين ────────────────────────────────
 * هذا المكوّن يعيش داخل الرأسية، والرأسية عليها `backdrop-blur`.
 * و`backdrop-filter` — مثل `transform` — **يُنشئ كتلة احتواء** لكل
 * عنصر `position: fixed` بداخلها. فكان `inset-0` يُحسب على صندوق
 * الرأسية (٣٧٥×٦٤) لا على النافذة (٣٧٥×٧٢٠): ينهار ارتفاع اللوحة إلى
 * ٦٤ بكسل ويظهر محتوى الصفحة تحتها.
 *
 * `createPortal` إلى `document.body` يُخرج اللوحة من كتلة الاحتواء
 * ومن سياق تكديس الرأسية معًا، فتغطي النافذة كاملة مهما تغيّرت أنماط
 * الرأسية لاحقًا.
 * ────────────────────────────────────────────────────────────────────
 */
export function MobileNav({
  user,
  counts,
}: {
  user: { name: string; role: Role };
  counts?: NavCounts;
}) {
  const [open, setOpen] = React.useState(false);
  /** يبقى مركّبًا أثناء انتقال الخروج فلا تختفي اللوحة فجأة */
  const [mounted, setMounted] = React.useState(false);
  const [entered, setEntered] = React.useState(false);

  const pathname = usePathname();
  const panelRef = React.useRef<HTMLDivElement>(null);
  const openerRef = React.useRef<HTMLButtonElement>(null);

  // أغلق اللوحة عند تغيّر المسار
  React.useEffect(() => setOpen(false), [pathname]);

  /* التركيب والتفكيك مع مهلة تسمح بانتقال الخروج */
  React.useEffect(() => {
    if (open) {
      setMounted(true);
      // إطار واحد قبل تفعيل حالة الدخول، وإلا لن يعمل الانتقال
      const id = requestAnimationFrame(() => setEntered(true));
      return () => cancelAnimationFrame(id);
    }
    setEntered(false);
    const id = setTimeout(() => setMounted(false), ANIM_MS);
    return () => clearTimeout(id);
  }, [open]);

  /* منع تمرير الصفحة خلف اللوحة */
  React.useEffect(() => {
    if (!mounted) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [mounted]);

  /* حبس التركيز داخل اللوحة، وإعادته إلى الزر عند الإغلاق */
  React.useEffect(() => {
    if (!open || !mounted) return;

    const panel = panelRef.current;
    if (!panel) return;

    panel.querySelector<HTMLElement>(FOCUSABLE)?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        return;
      }
      if (event.key !== "Tab" || !panel) return;

      const items = [...panel.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
        (el) => el.offsetParent !== null,
      );
      if (items.length === 0) return;

      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;

      // الالتفاف عند الطرفين — فلا يخرج التركيز إلى الصفحة خلف اللوحة
      if (active && !panel.contains(active)) {
        event.preventDefault();
        first.focus();
      } else if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      openerRef.current?.focus();
    };
  }, [open, mounted]);

  return (
    <>
      <button
        ref={openerRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-label="فتح القائمة"
        aria-expanded={open}
        className="lg:hidden grid size-11 place-items-center rounded-[10px] text-muted transition-colors hover:bg-panel hover:text-paper"
      >
        <Menu size={20} strokeWidth={1.75} aria-hidden="true" />
      </button>

      {mounted &&
        createPortal(
          <div className="lg:hidden fixed inset-0 z-[100]">
            <button
              type="button"
              aria-label="إغلاق القائمة"
              onClick={() => setOpen(false)}
              className={`absolute inset-0 bg-ink/80 transition-opacity duration-200 ${
                entered ? "opacity-100" : "opacity-0"
              }`}
            />

            <div
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-label="التنقّل"
              className={`absolute inset-y-0 start-0 w-[280px] max-w-[85vw]
                border-e border-line bg-panel
                transition-transform duration-200 ease-out
                ${entered ? "translate-x-0" : "ltr:-translate-x-full rtl:translate-x-full"}`}
            >
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="إغلاق القائمة"
                className="absolute top-4 end-4 z-10 grid size-9 place-items-center rounded-[10px] text-muted transition-colors hover:bg-ink hover:text-paper"
              >
                <X size={18} strokeWidth={1.75} aria-hidden="true" />
              </button>

              <SidebarContent
                user={user}
                counts={counts}
                onNavigate={() => setOpen(false)}
              />
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
