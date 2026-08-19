"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/server/db";
import { requireAdmin } from "@/lib/data/admin";
import { revalidatePublicCourses } from "@/lib/public-course-cache";

export type ActionResult = { ok: true } | { ok: false; message: string };

/**
 * إظهار محطّة كلية في مسار الكتالوج أو إخفاؤها.
 *
 * ── لماذا إخفاء لا حذف ──────────────────────────────────────────────
 * الكلية قد تحمل مقررات مؤرشفة أو قيد الإعداد، وحذفها يقطع
 * `Course.facultyId` عن صفوف قائمة. والإخفاء يمنع رسم المحطة ولا يمسّ
 * شيئًا تحتها.
 *
 * ⚠ **حارسٌ يمنع إخفاء كلية تحمل مقررًا منشورًا:** إخفاء المحطة يجعل
 * المقرر غير قابل للوصول من الكتالوج بينما هو معروضٌ للبيع — أي منتج
 * منشور لا طريق إليه. أَخفِ بعد الأرشفة أو إلغاء النشر، لا قبلهما.
 */
export async function setFacultyVisible(
  facultyId: string,
  isVisible: boolean,
): Promise<ActionResult> {
  await requireAdmin();

  if (!isVisible) {
    const published = await db.course.count({
      where: { facultyId, isPublished: true, archivedAt: null },
    });
    if (published > 0) {
      return {
        ok: false,
        message:
          "لا يمكن إخفاء كلية تحمل مقررًا منشورًا — ألغِ نشره أو أرشفه أولًا.",
      };
    }
  }

  await db.faculty.update({
    where: { id: facultyId },
    data: { isVisible },
  });

  revalidatePath("/settings/faculties");
  revalidatePublicCourses();
  return { ok: true };
}

/**
 * إنشاء كلية جديدة.
 *
 * السَّلَك (`slug`) يُشتقّ من الاسم إن لم يُكتب، ويبقى قابلًا للكتابة
 * لأنه يظهر في الرابط ‏`/courses?faculty=arts`‏ وقد يريده المالك
 * لاتينيًّا مختصرًا لا منقولًا عن العربية.
 *
 * ⚠ الكلية الجديدة تظهر في مسار الكتالوج **آخرًا** — قائمة المحطات
 * الأربع في `lib/faculties.ts` تحريرية ومرتّبة، وما خرج عنها يُلحق بعدها
 * كي لا يختفي مقرر منشور تحت كلية غير مُدرجة.
 */
export async function createFaculty(input: {
  name: string;
  slug?: string;
}): Promise<ActionResult> {
  await requireAdmin();

  const name = input.name.trim();
  if (name.length < 2) return { ok: false, message: "اسم الكلية قصير جدًا." };

  const slug =
    (input.slug?.trim() || name)
      .toLowerCase()
      .replace(/[^a-z0-9؀-ۿ]+/g, "-")
      .replace(/^-|-$/g, "") || `faculty-${Date.now()}`;

  const clash = await db.faculty.findUnique({
    where: { slug },
    select: { id: true },
  });
  if (clash) return { ok: false, message: "سَلَك الكلية مستخدَم بالفعل." };

  const last = await db.faculty.findFirst({
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });

  await db.faculty.create({
    data: { name, slug, sortOrder: (last?.sortOrder ?? 0) + 1 },
  });

  revalidatePath("/settings/faculties");
  revalidatePath("/settings/courses");
  revalidatePublicCourses();
  return { ok: true };
}

/** تغيير اسم كلية — السَّلَك يبقى، فهو ما تشير إليه الروابط. */
export async function renameFaculty(
  facultyId: string,
  name: string,
): Promise<ActionResult> {
  await requireAdmin();

  const trimmed = name.trim();
  if (trimmed.length < 2) return { ok: false, message: "اسم الكلية قصير جدًا." };

  await db.faculty.update({
    where: { id: facultyId },
    data: { name: trimmed },
  });

  revalidatePath("/settings/faculties");
  revalidatePublicCourses();
  return { ok: true };
}
