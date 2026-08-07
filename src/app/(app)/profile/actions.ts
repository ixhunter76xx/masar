"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";

import { auth, signOut } from "@/auth";
import { db } from "@/server/db";

export type ActionResult = { ok: true } | { ok: false; message: string };

const schema = z
  .object({
    currentPassword: z.string().min(1, "أدخل كلمة المرور الحالية."),
    newPassword: z
      .string()
      .min(8, "كلمة المرور الجديدة: ٨ خانات على الأقل.")
      .max(128),
    confirmPassword: z.string().min(1, "أعد كتابة كلمة المرور الجديدة."),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    message: "كلمتا المرور غير متطابقتين.",
    path: ["confirmPassword"],
  })
  .refine((v) => v.newPassword !== v.currentPassword, {
    message: "كلمة المرور الجديدة مطابقة للحالية.",
    path: ["newPassword"],
  });

/**
 * تغيير كلمة مرور المستخدم نفسه.
 *
 * لا يُمرَّر معرّف المستخدم من المتصفح — يُؤخذ من الجلسة، فلا يستطيع
 * أحد تغيير كلمة مرور غيره مهما عبث بالطلب.
 */
export async function changePassword(
  formData: FormData,
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, message: "غير مصرّح." };

  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "البيانات غير صالحة.",
    };
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, passwordHash: true },
  });
  if (!user) return { ok: false, message: "الحساب غير موجود." };

  const matches = await bcrypt.compare(
    parsed.data.currentPassword,
    user.passwordHash,
  );
  if (!matches) {
    return { ok: false, message: "كلمة المرور الحالية غير صحيحة." };
  }

  await db.user.update({
    where: { id: user.id },
    data: {
      passwordHash: await bcrypt.hash(parsed.data.newPassword, 12),
      mustChangePassword: false,
      /* الجلسة الحالية تُنهى بعد هذا الإجراء على أي حال، لكن الرفع
         يطرد **بقية الأجهزة** أيضًا — وهو المتوقّع ممّن يغيّر كلمته
         لأنه يشكّ في تسريبها. */
      sessionVersion: { increment: 1 },
    },
  });

  return { ok: true };
}

/**
 * إنهاء الجلسة بعد تغيير كلمة المرور.
 *
 * إجباري لا تجميلي: رمز الجلسة يحمل `mustChangePassword` القديم، وإبطاله
 * يضمن أيضًا ألا تبقى جلسة قائمة بكلمة مرور تغيّرت.
 */
export async function signOutAfterChange(): Promise<void> {
  await signOut({ redirectTo: "/login?passwordChanged=1" });
}
