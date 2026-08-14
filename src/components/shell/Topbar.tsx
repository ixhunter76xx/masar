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

        {/* ⚠ يختفي تحت ٥٦٠px — العتبة من المعاينة المعتمدة حرفيًّا
            (كنت نفّذتُها عند ٦٤٠ من الذاكرة، وهو خطأ).
            المبدّل ثابتٌ في منتصف النافذة، فالمساحة المتاحة للعنوان
            محدودة بحافّته لا بحافّة الشاشة. والصفحة تحمل عنوانها في
            متنها (`PageHeader`)، أما الباب فلا بديل عنه. */}
        <h1 className="hidden flex-1 truncate text-base font-medium text-paper min-[560px]:block">
          {title}
        </h1>
        {/* حاجزٌ يدفع الخروج إلى الحافّة حين يختفي العنوان — نظير
            `.apptop > .btn{margin-inline-start:auto}` في المعاينة. */}
        <span className="flex-1 min-[560px]:hidden" aria-hidden="true" />

        {/* ⚠ زال من هنا مدخل الكتالوج المختصر — `AreaSwitch` يحمله
            الآن في كل عرض، لا دون ١٠٢٤px وحدها. */}
        <SignOutButton />
      </div>
    </header>
  );
}
