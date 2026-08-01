"use server";

import { AuthError } from "next-auth";
import { unstable_rethrow } from "next/navigation";

import { signIn } from "@/auth";
import { loginSchema, type LoginValues } from "@/lib/validation";

export type AuthResult = { ok: false; message: string };

const INVALID = "اسم المستخدم أو كلمة المرور غير صحيحة.";
const DISABLED = "هذا الحساب معطّل. تواصل مع إدارة المركز لإعادة تفعيله.";

/** يستخرج كود الخطأ المخصّص من طبقات AuthError المختلفة */
function codeOf(error: AuthError): string | undefined {
  const cause = error.cause as { err?: { code?: string } } | undefined;
  return cause?.err?.code ?? (error as unknown as { code?: string }).code;
}

/**
 * تسجيل الدخول.
 *
 * عند النجاح يرمي Next.js خطأ تحويل داخلي فلا تعود الدالة بقيمة إطلاقًا؛
 * لذلك نوع الإرجاع يغطي حالة الفشل فقط.
 */
export async function authenticate(
  raw: LoginValues,
  callbackUrl?: string,
): Promise<AuthResult> {
  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, message: "البيانات المُدخلة غير صالحة." };
  }

  try {
    await signIn("credentials", {
      username: parsed.data.username,
      password: parsed.data.password,
      redirectTo: callbackUrl || "/dashboard",
    });
  } catch (error) {
    // خطأ التحويل بعد النجاح — أعِد رميه ليكمل Next.js عمله
    unstable_rethrow(error);

    if (error instanceof AuthError) {
      return {
        ok: false,
        message: codeOf(error) === "AccountDisabled" ? DISABLED : INVALID,
      };
    }

    console.error("[auth] فشل غير متوقع:", error);
    return { ok: false, message: "تعذّر إتمام تسجيل الدخول. حاول مرة أخرى." };
  }

  return { ok: false, message: "تعذّر إتمام تسجيل الدخول." };
}
