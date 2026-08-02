"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { db } from "@/server/db";
import { requireAdmin } from "@/lib/data/admin";
import { Role, TermStatus, EnrollmentStatus } from "@/generated/prisma/enums";

export type ActionResult = { ok: true } | { ok: false; message: string };

const ok: ActionResult = { ok: true };
const fail = (message: string): ActionResult => ({ ok: false, message });

/** يستخرج أول رسالة عربية من أخطاء Zod */
function firstIssue(error: z.ZodError): string {
  return error.issues[0]?.message ?? "البيانات المُدخلة غير صالحة.";
}

/* -------------------------------------------------------------------------- */
/*  الفصول الدراسية                                                            */
/* -------------------------------------------------------------------------- */

const termSchema = z
  .object({
    name: z.string().trim().min(3, "اسم الفصل قصير جدًا.").max(120),
    startsOn: z.string().min(1, "تاريخ البداية مطلوب."),
    endsOn: z.string().min(1, "تاريخ النهاية مطلوب."),
  })
  .refine((v) => new Date(v.endsOn) > new Date(v.startsOn), {
    message: "تاريخ النهاية يجب أن يكون بعد تاريخ البداية.",
    path: ["endsOn"],
  });

export async function createTerm(formData: FormData): Promise<ActionResult> {
  await requireAdmin();

  const parsed = termSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail(firstIssue(parsed.error));

  const { name, startsOn, endsOn } = parsed.data;

  const exists = await db.term.findUnique({ where: { name } });
  if (exists) return fail("يوجد فصل دراسي بهذا الاسم.");

  await db.term.create({
    data: { name, startsOn: new Date(startsOn), endsOn: new Date(endsOn) },
  });

  revalidatePath("/settings/terms");
  return ok;
}

export async function setTermStatus(
  termId: string,
  status: TermStatus,
): Promise<ActionResult> {
  await requireAdmin();

  await db.term.update({ where: { id: termId }, data: { status } });

  revalidatePath("/settings/terms");
  revalidatePath("/courses");
  return ok;
}

/* -------------------------------------------------------------------------- */
/*  المقررات                                                                   */
/* -------------------------------------------------------------------------- */

const courseSchema = z.object({
  code: z
    .string()
    .trim()
    .min(2, "رمز المقرر قصير جدًا.")
    .max(20)
    .regex(/^[A-Za-z0-9-]+$/, "رمز المقرر: حروف لاتينية وأرقام وشرطة فقط."),
  title: z.string().trim().min(3, "اسم المقرر قصير جدًا.").max(200),
  description: z.string().trim().max(2000).optional(),
  termId: z.string().min(1, "اختر الفصل الدراسي."),
  instructorId: z.string().min(1, "اختر المدرب."),
});

export async function createCourse(formData: FormData): Promise<ActionResult> {
  await requireAdmin();

  const parsed = courseSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail(firstIssue(parsed.error));

  const { code, title, description, termId, instructorId } = parsed.data;

  // نتحقق أن المدرب فعلًا مدرب — لا نثق بقيمة قائمة منسدلة
  const instructor = await db.user.findFirst({
    where: { id: instructorId, role: Role.INSTRUCTOR, isActive: true },
    select: { id: true },
  });
  if (!instructor) return fail("المدرب المختار غير صالح.");

  const term = await db.term.findUnique({
    where: { id: termId },
    select: { id: true },
  });
  if (!term) return fail("الفصل الدراسي المختار غير موجود.");

  const duplicate = await db.course.findUnique({
    where: { termId_code: { termId, code: code.toUpperCase() } },
  });
  if (duplicate) return fail("يوجد مقرر بهذا الرمز في الفصل نفسه.");

  await db.course.create({
    data: {
      code: code.toUpperCase(),
      title,
      description: description || null,
      termId,
      instructorId,
    },
  });

  revalidatePath("/settings/courses");
  revalidatePath("/courses");
  return ok;
}

/* -------------------------------------------------------------------------- */
/*  التسجيل                                                                    */
/* -------------------------------------------------------------------------- */

export async function enrollStudent(
  courseId: string,
  studentId: string,
): Promise<ActionResult> {
  await requireAdmin();

  const student = await db.user.findFirst({
    where: { id: studentId, role: Role.STUDENT, isActive: true },
    select: { id: true },
  });
  if (!student) return fail("الطالب المختار غير صالح.");

  const existing = await db.enrollment.findUnique({
    where: { studentId_courseId: { studentId, courseId } },
    select: { id: true },
  });

  if (existing) {
    // كان منسحبًا سابقًا — نعيد تفعيله بدل رفض العملية
    await db.enrollment.update({
      where: { id: existing.id },
      data: { status: EnrollmentStatus.ACTIVE },
    });
  } else {
    await db.enrollment.create({ data: { courseId, studentId } });
  }

  revalidatePath(`/settings/courses/${courseId}`);
  revalidatePath("/courses");
  return ok;
}

export async function removeEnrollment(
  enrollmentId: string,
  courseId: string,
): Promise<ActionResult> {
  await requireAdmin();

  await db.enrollment.delete({ where: { id: enrollmentId } });

  revalidatePath(`/settings/courses/${courseId}`);
  revalidatePath("/courses");
  return ok;
}

/* -------------------------------------------------------------------------- */
/*  المستخدمون                                                                 */
/* -------------------------------------------------------------------------- */

const userSchema = z.object({
  name: z.string().trim().min(3, "الاسم قصير جدًا.").max(120),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(4, "اسم المستخدم قصير جدًا.")
    .max(64)
    .regex(/^[a-z0-9._@-]+$/, "اسم المستخدم: حروف لاتينية وأرقام و . _ - @ فقط."),
  email: z.union([z.email("البريد غير صالح."), z.literal("")]).optional(),
  role: z.enum(Role, { message: "الدور غير صالح." }),
  password: z.string().min(8, "كلمة المرور المبدئية: ٨ خانات على الأقل."),
});

export async function createUser(formData: FormData): Promise<ActionResult> {
  await requireAdmin();

  const parsed = userSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail(firstIssue(parsed.error));

  const { name, username, email, role, password } = parsed.data;

  const taken = await db.user.findUnique({ where: { username } });
  if (taken) return fail("اسم المستخدم مستخدَم بالفعل.");

  if (email) {
    const emailTaken = await db.user.findUnique({ where: { email } });
    if (emailTaken) return fail("البريد الإلكتروني مستخدَم بالفعل.");
  }

  await db.user.create({
    data: {
      name,
      username,
      email: email || null,
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
