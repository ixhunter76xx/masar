import { LogOut } from "lucide-react";

import { signOut } from "@/auth";
import { Button } from "@/components/ui/Button";

/**
 * الخروج — نموذجٌ خادميّ، لا زرٌّ عميل.
 *
 * ⚠ `signOut` يُستورد من `@/auth` فلا يعبر إلى المتصفّح أبدًا. ولهذا
 * يُمرَّر هذا المكوّن إلى `UserMenu` عبر `children` بدل أن تستدعيه
 * القائمةُ العميلة بنفسها.
 *
 * ── الشكلان ─────────────────────────────────────────────────────────
 * `menuItem` هو الشكل الحيّ اليوم: بندٌ داخل نافذة الحساب. والشكل
 * القياسيّ باقٍ لأي موضعٍ يحتاج زرًّا قائمًا بذاته (صفحة عطل مثلًا)،
 * ولا يُحذف لئلّا يُعاد اختراعه.
 */
export function SignOutButton({ menuItem = false }: { menuItem?: boolean }) {
  const action = async () => {
    "use server";
    await signOut({ redirectTo: "/login" });
  };

  if (menuItem) {
    return (
      <form action={action}>
        <button
          type="submit"
          role="menuitem"
          className="press flex min-h-touch w-full items-center gap-2.5 rounded-[10px] px-2.5 text-start
            text-[13px] font-medium text-muted transition-colors duration-150
            hover:bg-panel hover:text-paper focus-visible:bg-panel focus-visible:text-paper"
        >
          <LogOut size={15} strokeWidth={1.75} aria-hidden="true" className="shrink-0" />
          تسجيل الخروج
        </button>
      </form>
    );
  }

  return (
    <form action={action}>
      {/* size الافتراضي لا "sm": ٤٤ بكسل هو الحد الأدنى لمساحة اللمس */}
      <Button type="submit" variant="secondary">
        تسجيل الخروج
      </Button>
    </form>
  );
}
