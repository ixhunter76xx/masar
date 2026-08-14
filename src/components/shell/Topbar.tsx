import { MobileNav } from "@/components/shell/MobileNav";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { Logo } from "@/components/ui/Logo";
import type { NavCounts } from "@/lib/navigation";
import type { Role } from "@/generated/prisma/enums";

export function Topbar({
  title,
  user,
  counts,
}: {
  title: string;
  user: { name: string; role: Role };
  counts?: NavCounts;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-ink/90 backdrop-blur">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
        <MobileNav user={user} counts={counts} />

        {/* الشعار يظهر في الرأسية على الشاشات الصغيرة فقط،
            لأن الشريط الجانبي يحمله على الشاشات الكبيرة */}
        <Logo size={36} className="lg:hidden" />

        {/* ⚠ يختفي تحت ٦٤٠px.
            المبدّل ثابتٌ في منتصف النافذة، فالمساحة المتاحة للعنوان
            محدودة بحافّته لا بحافّة الشاشة — وفي العروض الضيّقة يزحف
            تحته. والصفحة تحمل عنوانها في متنها مباشرةً (`PageHeader`)،
            أما الباب فلا بديل عنه. */}
        <h1 className="hidden flex-1 truncate text-base font-medium text-paper sm:block">
          {title}
        </h1>
        {/* حاجزٌ يدفع الخروج إلى الحافّة حين يختفي العنوان — كان
            العنوان حاملَ `flex-1`، فبدونه يتجمّع الزرّ قرب القائمة
            ويقع تحت المبدّل. */}
        <span className="flex-1 sm:hidden" aria-hidden="true" />

        {/* ⚠ زال من هنا مدخل الكتالوج المختصر — `AreaSwitch` يحمله
            الآن في كل عرض، لا دون ١٠٢٤px وحدها. */}
        <SignOutButton />
      </div>
    </header>
  );
}
