"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { db } from "@/server/db";
import { requireAdmin } from "@/lib/data/admin";
import { Role } from "@/generated/prisma/enums";

export type ActionResult = { ok: true } | { ok: false; message: string };

const ok: ActionResult = { ok: true };
const fail = (message: string): ActionResult => ({ ok: false, message });

/** يستخرج أول رسالة عربية من أخطاء Zod */
function firstIssue(error: z.ZodError): string {
  return error.issues[0]?.message ?? "البيانات المُدخلة غير صالحة.";
}

/* -------------------------------------------------------------------------- */
/*  التسجيل                                                                    */
/* -------------------------------------------------------------------------- */

export async function removeEnrollment(
  enrollmentId: string,
  courseId: string,
): Promise<ActionResult> {
  await requireAdmin();

  await db.enrollment.delete({ where: { id: enrollmentId } });

  revalidatePath("/courses");
  return ok;
}

/* -------------------------------------------------------------------------- */
/*  المستخدمون                                                                 */
/* -------------------------------------------------------------------------- */

const userSchema = z.object({
  name: z.string().trim().min(3, "الاسم قصير جدًا.").max(120),
  /* انقلب الإلزام: البريد صار معرّف الدخول فهو مطلوب، واسم المستخدم
     صار تسمية داخلية اختيارية للإدارة والأساتذة. */
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "البريد مطلوب — هو معرّف الدخول.")
    .email("البريد غير صالح.")
    .max(120),
  username: z
    .union([
      z
        .string()
        .trim()
        .toLowerCase()
        .min(4, "اسم المستخدم قصير جدًا.")
        .max(64)
        .regex(/^[a-z0-9._-]+$/, "اسم المستخدم: حروف لاتينية وأرقام و . _ - فقط."),
      z.literal(""),
    ])
    .optional(),
  role: z.enum(Role, { message: "الدور غير صالح." }),
  password: z.string().min(8, "كلمة المرور المبدئية: ٨ خانات على الأقل."),
});

export async function createUser(formData: FormData): Promise<ActionResult> {
  await requireAdmin();

  const parsed = userSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail(firstIssue(parsed.error));

  const { name, username, email, role, password } = parsed.data;

  /* التكرار يُفحص على البريد: هو الحقل الإلزامي الفريد. فحصه على اسم
     مستخدم اختياري كان سيمرّ دائمًا حين يُترك فارغًا. */
  const taken = await db.user.findUnique({ where: { email } });
  if (taken) return fail("البريد مستخدَم بالفعل.");

  /* واسم المستخدم — إن أُدخل — يبقى فريدًا أيضًا */
  if (username) {
    const usernameTaken = await db.user.findUnique({ where: { username } });
    if (usernameTaken) return fail("اسم المستخدم مستخدَم بالفعل.");
  }

  await db.user.create({
    data: {
      name,
      username: username || null,
      email,
      role,
      passwordHash: await bcrypt.hash(password, 12),
    },
  });

  revalidatePath("/settings/users");
  return ok;
}

const resetSchema = z.object({
  password: z.string().min(8, "كلمة المرور المبدئية: ٨ خانات على الأقل."),
});

/**
 * إعادة تعيين كلمة مرور مستخدم.
 * تُفعّل الإجبار، فيُحصر المستخدم في صفحة الملف الشخصي حتى يغيّرها.
 */
export async function resetUserPassword(
  userId: string,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();

  const parsed = resetSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail(firstIssue(parsed.error));

  await db.user.update({
    where: { id: userId },
    data: {
      passwordHash: await bcrypt.hash(parsed.data.password, 12),
      mustChangePassword: true,
    },
  });

  revalidatePath("/settings/users");
  return ok;
}

export async function setUserActive(
  userId: string,
  isActive: boolean,
): Promise<ActionResult> {
  const admin = await requireAdmin();

  // لا يعطّل المدير حسابه فيفقد الوصول إلى المنصة
  if (userId === admin.id && !isActive) {
    return fail("لا يمكنك تعطيل حسابك أنت.");
  }

  await db.user.update({ where: { id: userId }, data: { isActive } });

  revalidatePath("/settings/users");
  return ok;
}
