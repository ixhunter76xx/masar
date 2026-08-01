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
      <Button type="submit" variant="secondary" size="sm">
        تسجيل الخروج
      </Button>
    </form>
  );
}
