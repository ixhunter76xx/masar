import { LogOut } from "lucide-react";

import { signOut } from "@/auth";
import { Button } from "@/components/ui/Button";

/**
 * ⚠ أيقونةٌ وحدها تحت ٦٤٠px.
 *
 * مبدّل المنطقتين ثابتٌ في منتصف النافذة، و«تسجيل الخروج» بنصّه يشغل
 * ١٢١px — فيتقاطع الاثنان عند ٣٧٥px (قِسْتُه: الزرّ ١٦–١٣٧ والمبدّل
 * يبدأ عند ١١٧). والاختصار إلى الأيقونة يحرّر ٨٥px ويوافق زرّ القائمة
 * المختصر أصلًا في الجهة المقابلة.
 *
 * والاسم لا يضيع: `aria-label` يحمله، و`sr-only` تُبقيه في الشجرة.
 * وحجم اللمس ٤٤px محفوظ في `Button` نفسه.
 */
export function SignOutButton() {
  return (
    <form
      action={async () => {
        "use server";
        await signOut({ redirectTo: "/login" });
      }}
    >
      {/* size="md" لا "sm": ٤٤ بكسل هو الحد الأدنى لمساحة اللمس */}
      <Button
        type="submit"
        variant="secondary"
        aria-label="تسجيل الخروج"
        className="max-sm:aspect-square max-sm:px-0"
      >
        <LogOut size={17} strokeWidth={1.75} aria-hidden="true" className="sm:hidden" />
        <span className="max-sm:sr-only">تسجيل الخروج</span>
      </Button>
    </form>
  );
}
