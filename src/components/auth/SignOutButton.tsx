import { signOut } from "@/auth";
import { Button } from "@/components/ui/Button";

/**
 * ⚠ النصّ كاملًا في كل العروض — مطابقةً للمعاينة المعتمدة.
 *
 * كنت اختصرتُه إلى أيقونة تحت ٦٤٠px لحلّ تقاطعٍ قِسْتُه مع المبدّل
 * عند ٣٧٥px. والمعاينة تحلّ الضيق نفسه بطريقة أخرى: **يتقلّص
 * المبدّل** تحت ٦٢٠px، ولا يُختصر ما حوله. فأُعيد النصّ واعتُمد علاج
 * المصدر — الاختصار كان اجتهادًا منّي لا قرارًا من التصميم.
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
      <Button type="submit" variant="secondary">
        تسجيل الخروج
      </Button>
    </form>
  );
}
