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

/*
 * حُذف من هنا `removeEnrollment` — إجراء يسحب وصولًا مدفوعًا.
 *
 * لم يكن له مستدعٍ واحد في المستودع، وكان يستقبل `courseId` ولا
 * يستعمله فيحذف التسجيل بالمعرّف وحده. و«بلا مستدعٍ» لا تعني «بلا
 * أثر»: كل دالة مُصدَّرة في ملف `"use server"` نقطةُ نداء قائمة.
 *
 * سحب الوصول سيعود حين يُبنى الاسترجاع (`REFUNDED`)، وحينها يكون
 * جزءًا من معاملة تُغيّر حالة الطلب وتسحب التسجيل معًا — لا دالة
 * عارية تحذف صفًّا.
 */

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
      /*
       * الإجبار على التغيير عند أول دخول.
       *
       * كان هذا السطر غائبًا، فيبقى كل حساب تنشئه الإدارة بكلمة مرور
       * **كتبها الأدمن ويعرفها** إلى الأبد، ولا تظهر لصاحبه لافتة
       * التغيير أبدًا — بينما تسمّيها الواجهة «كلمة المرور المبدئية»
       * وتطلب تسليمها له ليغيّرها. وتعليق `mustChangePassword` في
       * المخطط ينصّ على أنها «تُرفع يدويًا للحسابات التي تنشئها
       * الإدارة»، فكان الكود يخالف نيّته الموثّقة.
       *
       * `resetUserPassword` كانت ترفعها أصلًا، فالسلوكان اتّفقا الآن.
       */
      mustChangePassword: true,
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
      /* يطرد كل جلسة مفتوحة لهذا الحساب. بدونه تبقى الجلسة المسروقة —
         وهي غالبًا سبب إعادة التعيين — تعمل بعد تغيير الكلمة. */
      sessionVersion: { increment: 1 },
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

/**
 * تغيير دور مستخدم.
 *
 * لم يكن للدور سبيل تغيير إطلاقًا: يُحدَّد عند الإنشاء ثم يحتاج تعديلُه
 * وصولًا إلى قاعدة البيانات — فترقية طالب إلى مدرّب كانت عملية يدوية
 * خارج المنصة.
 *
 * ولم يكن يصحّ شحنُه قبل إصلاح الجلسة: الدور كان يُقرأ من رمز مختوم عند
 * الدخول، فتغييره من هنا ما كان ليمسّ جلسةً مفتوحة — زرٌّ يبدو أنه يعمل
 * ولا يعمل. صار `getLiveUser` يقرأ الدور من الجدول كل طلب، فالتغيير
 * يسري في الطلب التالي مباشرة.
 */
export async function setUserRole(
  userId: string,
  role: Role,
): Promise<ActionResult> {
  const admin = await requireAdmin();

  /* لا يُنزل المدير دوره بنفسه: النتيجة فقدانُ لوحة الإدارة فورًا —
     وربما بلا أدمن آخر يعيدها. */
  if (userId === admin.id) {
    return fail("لا يمكنك تغيير دور حسابك أنت.");
  }

  const target = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });
  if (!target) return fail("الحساب غير موجود.");
  if (target.role === role) return ok;

  /* المدرّب الذي يُقدّم مقررًا لا يُنزَع دوره بصمت: المقرر يبقى مشيرًا
     إليه عبر `presenterId`، فيصير مقرر بلا مدرّب فعلي. */
  if (target.role === Role.INSTRUCTOR && role !== Role.INSTRUCTOR) {
    const presenting = await db.course.count({ where: { presenterId: userId } });
    if (presenting > 0) {
      return fail(
        "هذا المدرّب يُقدّم مقررًا. أسنِد المقرر إلى غيره قبل تغيير دوره.",
      );
    }
  }

  await db.user.update({ where: { id: userId }, data: { role } });

  revalidatePath("/settings/users");
  revalidatePath("/learn");
  return ok;
}
