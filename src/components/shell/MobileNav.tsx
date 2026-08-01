"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

import { SidebarContent } from "@/components/shell/Sidebar";
import type { NavCounts } from "@/lib/navigation";
import type { Role } from "@/generated/prisma/enums";

/**
 * لوحة التنقّل المنسحبة للشاشات الصغيرة.
 * قاعدة التصميم: تنسحب من اليمين (الحافة الابتدائية في RTL).
 */
export function MobileNav({
  user,
  counts,
}: {
  user: { name: string; role: Role };
  counts?: NavCounts;
}) {
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();

  // أغلق اللوحة عند تغيّر المسار
  React.useEffect(() => setOpen(false), [pathname]);

  // أغلق بمفتاح Escape، وامنع تمرير الصفحة خلف اللوحة
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="فتح القائمة"
        aria-expanded={open}
        className="lg:hidden grid size-11 place-items-center rounded-[10px] text-muted hover:text-paper hover:bg-panel transition-colors"
      >
        <Menu size={20} strokeWidth={1.75} aria-hidden="true" />
      </button>

      {open && (
        <div className="lg:hidden fixed inset-0 z-50">
          <button
            type="button"
            aria-label="إغلاق القائمة"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-ink/80"
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-label="التنقّل"
            className="absolute inset-y-0 start-0 w-[280px] max-w-[85vw] border-e border-line bg-panel"
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="إغلاق القائمة"
              className="absolute top-4 end-4 grid size-9 place-items-center rounded-[10px] text-muted hover:text-paper transition-colors"
            >
              <X size={18} strokeWidth={1.75} aria-hidden="true" />
            </button>

            <SidebarContent
              user={user}
              counts={counts}
              onNavigate={() => setOpen(false)}
            />
          </div>
        </div>
      )}
    </>
  );
}
