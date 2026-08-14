import Link from "next/link";

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

      {/* ⚠ زال من هنا رابط «تصفّح المقررات».
          كان علاج غياب أي طريق من داخل المنصّة إلى الكتالوج — وهي
          ثغرة حقيقية — لكن `AreaSwitch` صار يحملها في الرأسية، ظاهرًا
          في المنطقتين معًا وفي موضع واحد لا يتبدّل. وبابان إلى الوجهة
          نفسها يجعلان أحدهما ضجيجًا. */}
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
