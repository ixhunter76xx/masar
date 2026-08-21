"use server";

import { hash } from "bcryptjs";
import { AuthError } from "next-auth";
import { unstable_rethrow } from "next/navigation";

import { signIn } from "@/auth";
import { db } from "@/server/db";
import { Role } from "@/generated/prisma/enums";
import { signupSchema, type SignupValues } from "@/lib/validation";
import { AFTER_LOGIN } from "@/lib/routes";
import { safeNextPath } from "@/lib/safe-next";

export type SignupResult = { ok: false; message: string };

/**
 * إنشاء حساب طالب ثم تسجيل دخوله مباشرة.
 *
 * ── لماذا بلا تأكيد بريد ────────────────────────────────────────────
 * تأكيد البريد يحتاج مزوّد إرسال ويضيف خطوة بين الطالب وبين الشراء.
 * وهو هنا لا يحمي شيئًا: الحساب وحده لا يفتح محتوى، والوصول لا يُمنح
 * إلا بعد تأكيد دفعٍ يجري في محادثة واتساب حقيقية. البريد الخاطئ يضرّ
 * صاحبه وحده — لا المنصة.
 *
 * الدور مثبّت `STUDENT` في الشفرة لا في المدخلات: لو قُرئ من النموذج
 * لصار إنشاءُ حساب إدارة أمرَ تعديلِ حقلٍ في المتصفّح.
 */
export async function signup(
  raw: SignupValues,
  callbackUrl?: string,
): Promise<SignupResult> {
  const parsed = signupSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, message: "البيانات المُدخلة غير صالحة." };
  }

  const { name, email, phone, password } = parsed.data;

  const taken = await db.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (taken) {
    return {
      ok: false,
      message: "هذا البريد مسجَّل بالفعل. سجّل الدخول أو استخدم بريدًا آخر.",
    };
  }

  try {
    await db.user.create({
      data: {
        name,
        email,
        phone,
        passwordHash: await hash(password, 12),
        role: Role.STUDENT,
        /* من يسجّل بنفسه اختار كلمته — لا معنى لإجباره على تغييرها */
        mustChangePassword: false,
      },
    });
  } catch {
    /* السباق الوحيد المتوقّع: تسجيلان بنفس البريد في اللحظة نفسها،
       يمسكه قيد UNIQUE على البريد. */
    return {
      ok: false,
      message: "تعذّر إنشاء الحساب. تحقّق من البريد وحاول مرة أخرى.",
    };
  }

  try {
    await signIn("credentials", {
      email,
      password,
      /* الوجهة تُطهَّر هنا لا في النموذج: `?next=` مدخلٌ يتحكّم فيه
         من صنع الرابط، و`//evil.com` كان يمرّ لأنه يبدأ بشرطة. */
      redirectTo: safeNextPath(callbackUrl) ?? AFTER_LOGIN,
    });
  } catch (error) {
    // خطأ التحويل بعد النجاح — أعِد رميه ليكمل Next.js عمله
    unstable_rethrow(error);

    /* أُنشئ الحساب لكن تعذّر الدخول التلقائي — لا نحذف الحساب ولا نعيد
       المحاولة، بل نوجّهه إلى الدخول اليدوي بكلمته التي يعرفها. */
    if (error instanceof AuthError) {
      return {
        ok: false,
        message: "أُنشئ حسابك. سجّل الدخول ببريدك وكلمة المرور.",
      };
    }

    console.error("[signup] فشل غير متوقع:", error);
    return { ok: false, message: "تعذّر إتمام التسجيل. حاول مرة أخرى." };
  }

  return { ok: false, message: "تعذّر إتمام التسجيل." };
}
