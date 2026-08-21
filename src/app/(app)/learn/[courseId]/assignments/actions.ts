"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { auth } from "@/auth";
import { db } from "@/server/db";
import { canManageCourse } from "@/lib/data/materials";
import { applyLatePenalty } from "@/lib/data/assignments";
import {
  AssignmentStatus,
  SubmissionStatus,
} from "@/generated/prisma/enums";

export type ActionResult =
  | { ok: true; id?: string }
  | { ok: false; message: string };

const fail = (message: string): ActionResult => ({ ok: false, message });

async function requireManager(courseId: string) {
  const session = await auth();
  if (!session?.user) return null;
  const allowed = await canManageCourse(courseId);
  return allowed ? session.user : null;
}

function bump(courseId: string, assignmentId?: string) {
  revalidatePath(`/learn/${courseId}`);
  if (assignmentId) {
    revalidatePath(`/learn/${courseId}/assignments/${assignmentId}`);
  }
  revalidatePath("/dashboard");
}

/* -------------------------------------------------------------------------- */
/*  الواجب                                                                     */
/* -------------------------------------------------------------------------- */

const assignmentSchema = z.object({
  title: z.string().trim().min(3, "عنوان الواجب قصير جدًا.").max(200),
  description: z.string().trim().max(5000).optional(),
  totalPoints: z.coerce
    .number()
    .int()
    .min(1, "الدرجة الكاملة لا تقل عن ١.")
    .max(1000),
  dueAt: z.string().optional(),
  allowLate: z.union([z.literal("on"), z.literal("")]).optional(),
  latePenaltyPercent: z.coerce
    .number()
    .int()
    .min(0, "الخصم لا يقل عن ٠.")
    .max(100, "الخصم لا يزيد على ١٠٠٪.")
    .default(0),
  allowedExtensions: z.string().trim().max(200).optional(),
  maxFileMb: z.coerce
    .number()
    .int()
    .min(1, "الحد الأدنى ١ ميجابايت.")
    .max(200, "الحد الأقصى ٢٠٠ ميجابايت.")
    .default(20),
});

/** "pdf, docx" → ["pdf","docx"] */
function parseExtensions(raw: string | undefined): string[] {
  if (!raw) return ["pdf", "docx", "zip", "png", "jpg"];
  return [
    ...new Set(
      raw
        .split(/[,\s]+/)
        .map((x) => x.trim().replace(/^\./, "").toLowerCase())
        .filter((x) => /^[a-z0-9]{1,10}$/.test(x)),
    ),
  ];
}

export async function createAssignment(
  courseId: string,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireManager(courseId);
  if (!user) return fail("ليس لديك صلاحية إنشاء واجب في هذا المقرر.");

  const parsed = assignmentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "البيانات غير صالحة.");
  }

  const d = parsed.data;
  const extensions = parseExtensions(d.allowedExtensions);
  if (extensions.length === 0) {
    return fail("حدّد صيغة ملف واحدة على الأقل.");
  }

  const created = await db.assignment.create({
    data: {
      courseId,
      title: d.title,
      description: d.description || null,
      totalPoints: d.totalPoints,
      dueAt: d.dueAt ? new Date(d.dueAt) : null,
      allowLate: d.allowLate === "on",
      latePenaltyPercent: d.allowLate === "on" ? d.latePenaltyPercent : 0,
      allowedExtensions: extensions,
      maxFileMb: d.maxFileMb,
      authorId: user.id,
    },
    select: { id: true },
  });

  bump(courseId);
  return { ok: true, id: created.id };
}

export async function updateAssignment(
  courseId: string,
  assignmentId: string,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireManager(courseId);
  if (!user) return fail("ليس لديك صلاحية التعديل في هذا المقرر.");

  const parsed = assignmentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "البيانات غير صالحة.");
  }

  const exists = await db.assignment.findFirst({
    where: { id: assignmentId, courseId },
    select: { id: true },
  });
  if (!exists) return fail("الواجب غير موجود.");

  const d = parsed.data;
  const extensions = parseExtensions(d.allowedExtensions);
  if (extensions.length === 0) return fail("حدّد صيغة ملف واحدة على الأقل.");

  await db.assignment.update({
    where: { id: assignmentId },
    data: {
      title: d.title,
      description: d.description || null,
      totalPoints: d.totalPoints,
      dueAt: d.dueAt ? new Date(d.dueAt) : null,
      allowLate: d.allowLate === "on",
      latePenaltyPercent: d.allowLate === "on" ? d.latePenaltyPercent : 0,
      allowedExtensions: extensions,
      maxFileMb: d.maxFileMb,
    },
  });

  bump(courseId, assignmentId);
  return { ok: true };
}

export async function setAssignmentStatus(
  courseId: string,
  assignmentId: string,
  status: AssignmentStatus,
): Promise<ActionResult> {
  const user = await requireManager(courseId);
  if (!user) return fail("غير مصرّح.");

  const exists = await db.assignment.findFirst({
    where: { id: assignmentId, courseId },
    select: { id: true },
  });
  if (!exists) return fail("الواجب غير موجود.");

  await db.assignment.update({ where: { id: assignmentId }, data: { status } });

  bump(courseId, assignmentId);
  return { ok: true };
}

export async function deleteAssignment(
  courseId: string,
  assignmentId: string,
): Promise<ActionResult> {
  const user = await requireManager(courseId);
  if (!user) return fail("غير مصرّح.");

  const assignment = await db.assignment.findFirst({
    where: { id: assignmentId, courseId },
    select: { id: true, _count: { select: { submissions: true } } },
  });
  if (!assignment) return fail("الواجب غير موجود.");

  // حذف واجب له تسليمات يمحو درجات الطلاب وملفاتهم معه
  if (assignment._count.submissions > 0) {
    return fail("لا يمكن حذف واجب له تسليمات. أغلقه بدلًا من ذلك.");
  }

  await db.assignment.delete({ where: { id: assignmentId } });

  bump(courseId);
  return { ok: true };
}

/* -------------------------------------------------------------------------- */
/*  التصحيح                                                                    */
/* -------------------------------------------------------------------------- */

const gradeSchema = z.object({
  rawPoints: z.coerce.number().int().min(0, "الدرجة لا تقل عن ٠."),
  feedback: z.string().trim().max(2000).optional(),
});

export async function gradeSubmission(
  courseId: string,
  assignmentId: string,
  submissionId: string,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireManager(courseId);
  if (!user) return fail("ليس لديك صلاحية التصحيح في هذا المقرر.");

  const parsed = gradeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "البيانات غير صالحة.");
  }

  // التسليم يجب أن يخصّ هذا الواجب في هذا المقرر — لا نثق بالمعرّف وحده
  const submission = await db.submission.findFirst({
    where: {
      id: submissionId,
      assignmentId,
      assignment: { courseId },
    },
    select: {
      id: true,
      isLate: true,
      assignment: { select: { totalPoints: true, latePenaltyPercent: true } },
    },
  });
  if (!submission) return fail("التسليم غير موجود.");

  const { rawPoints, feedback } = parsed.data;

  if (rawPoints > submission.assignment.totalPoints) {
    return fail(
      `الدرجة تتجاوز الدرجة الكاملة (${submission.assignment.totalPoints}).`,
    );
  }

  // الخصم يُطبَّق على الخادم لا في الواجهة
  const earned = applyLatePenalty(
    rawPoints,
    submission.isLate,
    submission.assignment.latePenaltyPercent,
  );

  await db.submission.update({
    where: { id: submission.id },
    data: {
      rawPoints,
      earnedPoints: earned,
      feedback: feedback || null,
      status: SubmissionStatus.GRADED,
      gradedAt: new Date(),
      gradedById: user.id,
    },
  });

  bump(courseId, assignmentId);
  return { ok: true };
}
