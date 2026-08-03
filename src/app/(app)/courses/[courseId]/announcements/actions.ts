"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { auth } from "@/auth";
import { db } from "@/server/db";
import { canManageCourse } from "@/lib/data/materials";
import { Role } from "@/generated/prisma/enums";

export type ActionResult = { ok: true } | { ok: false; message: string };

const fail = (message: string): ActionResult => ({ ok: false, message });

/** يتحقق أن المستخدم مدرب هذا المقرر أو إدارة */
async function requireManager(courseId: string) {
  const session = await auth();
  if (!session?.user) return null;

  const allowed = await canManageCourse(
    courseId,
    session.user.id,
    session.user.role,
  );
  return allowed ? session.user : null;
}

const schema = z.object({
  title: z.string().trim().min(3, "عنوان الإعلان قصير جدًا.").max(200),
  body: z.string().trim().min(3, "نص الإعلان قصير جدًا.").max(5000),
  publish: z.union([z.literal("on"), z.literal("")]).optional(),
  isPinned: z.union([z.literal("on"), z.literal("")]).optional(),
});

export async function createAnnouncement(
  courseId: string,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireManager(courseId);
  if (!user) return fail("ليس لديك صلاحية النشر في هذا المقرر.");

  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "البيانات غير صالحة.");
  }

  const { title, body, publish, isPinned } = parsed.data;

  await db.announcement.create({
    data: {
      courseId,
      title,
      body,
      authorId: user.id,
      isPinned: isPinned === "on",
      publishedAt: publish === "on" ? new Date() : null,
    },
  });

  revalidatePath(`/courses/${courseId}/announcements`);
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function updateAnnouncement(
  courseId: string,
  announcementId: string,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireManager(courseId);
  if (!user) return fail("ليس لديك صلاحية التعديل في هذا المقرر.");

  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "البيانات غير صالحة.");
  }

  const existing = await db.announcement.findFirst({
    where: { id: announcementId, courseId },
    select: { id: true, publishedAt: true },
  });
  if (!existing) return fail("الإعلان غير موجود.");

  const { title, body, publish, isPinned } = parsed.data;
  const shouldPublish = publish === "on";

  await db.announcement.update({
    where: { id: existing.id },
    data: {
      title,
      body,
      isPinned: isPinned === "on",
      // نحفظ تاريخ النشر الأصلي إن كان منشورًا أصلًا
      publishedAt: shouldPublish ? existing.publishedAt ?? new Date() : null,
    },
  });

  revalidatePath(`/courses/${courseId}/announcements`);
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function deleteAnnouncement(
  courseId: string,
  announcementId: string,
): Promise<ActionResult> {
  const user = await requireManager(courseId);
  if (!user) return fail("ليس لديك صلاحية الحذف في هذا المقرر.");

  const existing = await db.announcement.findFirst({
    where: { id: announcementId, courseId },
    select: { id: true },
  });
  if (!existing) return fail("الإعلان غير موجود.");

  await db.announcement.delete({ where: { id: existing.id } });

  revalidatePath(`/courses/${courseId}/announcements`);
  revalidatePath("/dashboard");
  return { ok: true };
}

/**
 * تعليم إعلانات كمقروءة.
 *
 * يُستدعى من المتصفح بعد العرض لا داخل الـ render، لأن الكتابة أثناء
 * التصيير تُفسد التخزين المؤقت وتُنفَّذ مرتين في وضع التطوير.
 */
export async function markAnnouncementsRead(
  courseId: string,
  announcementIds: string[],
): Promise<void> {
  const session = await auth();
  if (!session?.user || session.user.role !== Role.STUDENT) return;
  if (announcementIds.length === 0) return;

  const userId = session.user.id;

  // لا نثق بالمعرّفات الواردة: نقصرها على إعلانات منشورة في مقرر
  // الطالب مسجَّل فيه فعلًا
  const valid = await db.announcement.findMany({
    where: {
      id: { in: announcementIds },
      courseId,
      publishedAt: { not: null },
      course: {
        products: { some: { enrollments: { some: { userId: userId } } } },
      },
    },
    select: { id: true },
  });

  if (valid.length === 0) return;

  await db.announcementRead.createMany({
    data: valid.map((a) => ({ announcementId: a.id, userId })),
    skipDuplicates: true,
  });

  revalidatePath(`/courses/${courseId}/announcements`);
  revalidatePath("/courses");
  revalidatePath("/dashboard");
}
