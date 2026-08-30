import { MobileNav } from "@/components/shell/MobileNav";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { UserMenu } from "@/components/shell/UserMenu";
import { TopbarTitleText } from "@/components/shell/TopbarTitle";
import type { NavCounts } from "@/lib/navigation";
import type { Role } from "@/generated/prisma/enums";

/**
 * ⚠ تُصيَّر في **التخطيط** لا في الصفحة.
 *
 * كانت في `AppPage`، فكانت تختفي مع كل `loading.tsx` ويغيب معها زرّ
 * الخروج ثم يعودان. رفعُها إلى التخطيط يجعلها لا تُفكَّك أصلًا،
 * ويُخرجها من `PageTransition` فلا تتلاشى مع المحتوى.
 *
 * وتبقى **مكوّن خادم**: `SignOutButton` يستورد `signOut` من `@/auth`.
 * العنوان وحده عميل — انظر `TopbarTitle.tsx`.
 */
export function Topbar({
  user,
  counts,
}: {
  user: { name: string; role: Role };
  counts?: NavCounts;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-ink/90 backdrop-blur">
      <div className="flex h-16 items-center gap-3 px-4">
        <MobileNav user={user} counts={counts} />

        {/* ⚠ يختفي تحت ٥٦٠px — العتبة من المعاينة المعتمدة حرفيًّا
            (كنت نفّذتُها عند ٦٤٠ من الذاكرة، وهو خطأ).
            المبدّل ثابتٌ في منتصف النافذة، فالمساحة المتاحة للعنوان
            محدودة بحافّته لا بحافّة الشاشة. والصفحة تحمل عنوانها في
            متنها (`PageHeader`)، أما الباب فلا بديل عنه. */}
        <TopbarTitleText className="hidden flex-1 truncate text-base font-medium text-paper min-[560px]:block" />
        {/* حاجزٌ يدفع الخروج إلى الحافّة حين يختفي العنوان — نظير
            `.apptop > .btn{margin-inline-start:auto}` في المعاينة. */}
        <span className="flex-1 min-[560px]:hidden" aria-hidden="true" />

        {/* ⚠ زال من هنا مدخل الكتالوج المختصر — `AreaSwitch` يحمله
            الآن في كل عرض، لا دون ١٠٢٤px وحدها.

            والخروج لم يعد زرًّا عاريًا: صار بندًا تحت اسم المستخدم.
            الاسم يجيب «بأيّ حسابٍ أنا داخل؟» وهو سؤالٌ يتكرّر، والخروج
            فعلٌ نادر — فلا يأخذ أبرز موضعٍ في الشريط. */}
        <UserMenu name={user.name} role={user.role}>
          <SignOutButton menuItem />
        </UserMenu>
      </div>
    </header>
  );
}
