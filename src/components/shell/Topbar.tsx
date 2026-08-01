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

        <h1 className="flex-1 truncate text-base font-medium text-paper">
          {title}
        </h1>

        <SignOutButton />
      </div>
    </header>
  );
}
