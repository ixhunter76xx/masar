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
