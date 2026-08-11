import Link from "next/link";
import { Compass } from "lucide-react";

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

        {/* ── مدخل مختصر للكتالوج، دون 1024px وحدها ────────────────────
            رابط الكتالوج يعيش في `SidebarContent`، وهو خلف زرّ ☰ على
            الشاشات الضيّقة — أي أن أهمّ مسار تجاري في المنتج يحتاج
            فتح قائمة أولًا. هذا مدخل مباشر بلا خطوة.

            نفس أيقونة `Compass` المستعملة في الشريط الجانبي عمدًا:
            الوجهة واحدة فتُقرأ واحدة. (بيتٌ يعني لوحة التحكّم، وسهم
            رجوع يعني تاريخ المتصفّح — كلاهما يقول شيئًا آخر.)

            `lg:hidden` لأن الشريط الجانبي يحمل الرابط كاملًا فوق ذلك،
            وتكراره هناك ازدواج بلا فائدة. وبلا نصّ: الرأسية تحمل
            العنوان وزرّ الخروج، والمساحة لا تتّسع لثالث. */}
        <Link
          href="/courses"
          aria-label="تصفّح المقررات — الكتالوج العام"
          title="تصفّح المقررات"
          className="press grid size-touch shrink-0 place-items-center rounded-field
            border border-line text-muted transition-colors
            hover:border-accent-deep hover:bg-panel hover:text-accent-bright
            lg:hidden"
        >
          <Compass size={18} strokeWidth={1.75} aria-hidden="true" />
        </Link>

        <SignOutButton />
      </div>
    </header>
  );
}
