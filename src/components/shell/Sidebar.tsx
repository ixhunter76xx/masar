import Link from "next/link";
import { ArrowLeft, Compass } from "lucide-react";

import { Logo } from "@/components/ui/Logo";
import { cn } from "@/lib/utils";
import { SidebarNav } from "@/components/shell/SidebarNav";
import { UserChip } from "@/components/shell/UserChip";
import { SITE } from "@/lib/site";
import type { NavCounts } from "@/lib/navigation";
import type { Role } from "@/generated/prisma/enums";

/** محتوى الشريط الجانبي — يُستخدم في نسخة سطح المكتب واللوحة المنسحبة معًا */
export function SidebarContent({
  user,
  counts,
  onNavigate,
}: {
  user: { name: string; role: Role };
  counts?: NavCounts;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      {/* الهوية — قابلة للنقر: الشعار مدخلٌ متوقَّع للعودة، وتركه
          صامتًا يهدر أكثر موضع يجرّب المستخدم النقر عليه. */}
      <Link
        href="/dashboard"
        onClick={onNavigate}
        className="press flex items-center gap-3 px-5 py-5 transition-colors hover:bg-panel-lift/60"
      >
        <Logo size={44} />
        <div className="min-w-0">
          <p className="text-sm font-bold text-paper truncate">{SITE.name}</p>
          <p className="text-[11px] text-muted truncate">{SITE.shortTagline}</p>
        </div>
      </Link>

      <div className="mx-5 border-t border-line" />

      {/* التنقّل */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <SidebarNav counts={counts} role={user.role} onNavigate={onNavigate} />
      </div>

      {/* ══ العودة إلى الكتالوج العام ══════════════════════════════════
          لم يكن للكتالوج `/courses` أيّ رابط من داخل المنصة: من سجّل
          دخوله لا يجد طريقًا ليتصفّح مقرَّرًا آخر أو يشتريه — وهو أهمّ
          مسار تجاري في المنتج.

          ولماذا ليس عنصرًا سابعًا في `NAV_ITEMS`: نظام التصميم يحدّد
          ستة عناصر جذرية كحدّ أقصى، والطالب عنده ستة بالفعل. فهذا
          إجراء من فئة أخرى — استكشاف لا تنقّل داخلي — ويأخذ موضعًا
          ونبرة مختلفين ليُقرأ كذلك.

          موضعه في `SidebarContent` يعني أنه يظهر في الشريط الجانبي
          وفي اللوحة المنسحبة على الهاتف معًا — أي في كل صفحة. */}
      <div className="px-3 pb-1">
        <Link
          href="/courses"
          onClick={onNavigate}
          className="press group flex min-h-touch items-center gap-3 rounded-field border
            border-line/80 bg-ink/45 px-3 text-[13px] transition-colors
            hover:border-accent-deep hover:bg-panel-lift"
        >
          <Compass
            size={16}
            strokeWidth={1.75}
            aria-hidden="true"
            className="shrink-0 text-accent transition-colors group-hover:text-accent-bright"
          />
          <span className="min-w-0 flex-1">
            <span className="block font-medium text-paper">تصفّح المقررات</span>
            <span className="block text-[10.5px] text-subtle">الكتالوج العام</span>
          </span>
          <ArrowLeft
            size={14}
            strokeWidth={2}
            aria-hidden="true"
            className="shrink-0 text-disabled transition-transform duration-200 ease-out group-hover:-translate-x-1"
          />
        </Link>
      </div>

      <div className="mx-5 mt-3 border-t border-line" />

      {/* المستخدم */}
      <div className="px-5 py-4">
        <UserChip name={user.name} role={user.role} />
      </div>
    </div>
  );
}

/** الشريط الجانبي المثبّت — يظهر من مقاس lg فأعلى */
export function Sidebar({
  user,
  counts,
}: {
  user: { name: string; role: Role };
  counts?: NavCounts;
}) {
  return (
    <aside
      className={cn(
        "hidden lg:block fixed inset-y-0 w-[260px] bg-panel",
        // start = يمين في RTL، ويسار تلقائيًا في LTR
        "start-0",
        // الحدّ على الوجه المقابل للمحتوى
        "border-e border-line",
      )}
    >
      <SidebarContent user={user} counts={counts} />
    </aside>
  );
}
