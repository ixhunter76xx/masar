"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useTransform,
} from "motion/react";
import { Menu, X } from "lucide-react";

import { SidebarContent } from "@/components/shell/Sidebar";
import { useLogicalAxis } from "@/lib/use-direction";
import {
  DRAG_DISTANCE_THRESHOLD,
  DRAG_VELOCITY_THRESHOLD,
  DUR,
  EASE,
  SPRING,
} from "@/lib/motion";
import type { NavCounts } from "@/lib/navigation";
import type { Role } from "@/generated/prisma/enums";

const PANEL_WIDTH = 300;

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

/**
 * لوحة التنقّل المنسحبة للشاشات الصغيرة.
 *
 * ── لماذا Portal، وهو إصلاح لا تحسين ────────────────────────────────
 * هذا المكوّن يعيش داخل الرأسية، والرأسية عليها `backdrop-blur`.
 * و`backdrop-filter` — مثل `transform` — **يُنشئ كتلة احتواء** لكل
 * عنصر `position: fixed` بداخلها. فكان `inset-0` يُحسب على صندوق
 * الرأسية (٣٧٥×٦٤) لا على النافذة (٣٧٥×٧٢٠).
 *
 * `createPortal` إلى `document.body` يُخرج اللوحة من كتلة الاحتواء
 * ومن سياق تكديس الرأسية معًا.
 *
 * ── الإيماءة واتجاهها ────────────────────────────────────────────────
 * اللوحة تجلس عند بداية السطر (يمين في RTL)، فإخراجها من الشاشة يعني
 * تحريكها للخلف عن بداية السطر. لا تُكتب هنا كلمة يمين ولا يسار: كل
 * المنطق بإشارة `toLogical` من `useLogicalAxis`، والقاعدة الثابتة أن
 * المنطقي السالب هو اتجاه الإغلاق أيًا كان اتجاه القراءة.
 * ─────────────────────────────────────────────────────────────────────
 */
export function MobileNav({
  user,
  counts,
}: {
  user: { name: string; role: Role };
  counts?: NavCounts;
}) {
  const [open, setOpen] = React.useState(false);
  /** البوابة لا تُصيَّر على الخادم — لا يوجد document هناك */
  const [mounted, setMounted] = React.useState(false);

  const pathname = usePathname();
  const panelRef = React.useRef<HTMLDivElement>(null);
  const openerRef = React.useRef<HTMLButtonElement>(null);

  const { toLogical, toPhysical } = useLogicalAxis();

  /** موضع اللوحة أفقيًا — يقوده الإصبع أثناء السحب والنابض بعده */
  const x = useMotionValue(0);
  /** الموضع الفيزيائي الذي تكون عنده اللوحة خارج الشاشة تمامًا */
  const closedX = toPhysical(-PANEL_WIDTH);
  /** الحجاب يخفت مع سحب اللوحة — يربط الإيماءة بنتيجتها بصريًا */
  const overlayOpacity = useTransform(x, [0, closedX], [1, 0], {
    clamp: true,
  });

  React.useEffect(() => setMounted(true), []);

  // أغلق اللوحة عند تغيّر المسار
  React.useEffect(() => setOpen(false), [pathname]);

  /* منع تمرير الصفحة خلف اللوحة */
  React.useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  /* حبس التركيز داخل اللوحة، وإعادته إلى الزر عند الإغلاق */
  React.useEffect(() => {
    if (!open) return;

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
  }, [open]);

  const panel = (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] min-[1060px]:hidden">
          <motion.button
            type="button"
            aria-label="إغلاق القائمة"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
            style={{ opacity: overlayOpacity }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{
              opacity: 0,
              transition: { duration: DUR.base, ease: EASE.in },
            }}
          />

          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="التنقّل"
            className="absolute inset-y-0 start-0 flex w-[300px] max-w-[86vw]
              flex-col border-e border-line bg-panel touch-pan-y"
            style={{ x }}
            initial={{ x: closedX }}
            animate={{ x: 0 }}
            exit={{
              x: closedX,
              transition: { duration: DUR.base, ease: EASE.in },
            }}
            transition={SPRING.panel}
            /* السحب حرّ باتجاه الإغلاق فقط ومشدود كالمطاط في عكسه.
               القيد {left:0,right:0} يجعل موضع الاستقرار صفرًا، فترتدّ
               اللوحة وحدها إن لم تبلغ الإيماءة عتبتها. */
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={
              closedX < 0 ? { left: 1, right: 0 } : { left: 0, right: 1 }
            }
            dragMomentum={false}
            onDragEnd={(_, info) => {
              const distance = toLogical(info.offset.x);
              const speed = toLogical(info.velocity.x);
              // سالب = باتجاه بداية السطر = باتجاه الخروج من الشاشة
              if (
                distance < -DRAG_DISTANCE_THRESHOLD ||
                speed < -DRAG_VELOCITY_THRESHOLD
              ) {
                setOpen(false);
              }
            }}
          >
            {/* مقبض — دلالة بصرية أن اللوحة تُسحب، على الحافة الداخلية */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 end-1 grid place-items-center"
            >
              <span className="h-10 w-1 rounded-full bg-line" />
            </span>

            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="إغلاق القائمة"
              className="absolute top-4 end-4 z-10 grid size-9 place-items-center
                rounded-[10px] text-muted transition-colors hover:bg-ink hover:text-paper press"
            >
              <X size={18} strokeWidth={1.75} aria-hidden="true" />
            </button>

            <SidebarContent
              user={user}
              counts={counts}
              onNavigate={() => setOpen(false)}
            />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return (
    <>
      <button
        ref={openerRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-label="فتح القائمة"
        aria-expanded={open}
        className="grid size-11 place-items-center rounded-[11px] border border-line min-[1060px]:hidden
          bg-[var(--sunk)] text-paper transition-colors hover:border-accent-deep press"
      >
        <Menu size={20} strokeWidth={1.75} aria-hidden="true" />
      </button>

      {mounted && createPortal(panel, document.body)}
    </>
  );
}
