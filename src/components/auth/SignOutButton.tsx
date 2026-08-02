import { signOut } from "@/auth";
import { Button } from "@/components/ui/Button";

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
