"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { setLessonCompleted } from "@/lib/data/progress";

const input = z.object({
  lessonId: z.string().min(1).max(64),
  done: z.boolean(),
});

/**
 * تعليم درسٍ مكتملًا أو إلغاؤه — من مسار المقرر.
 *
 * رقيقٌ عمدًا: التحقّق من الهوية والملكية كلّه في `setLessonCompleted`،
 * وهذا الملفّ يفحص شكل المدخلات ويُبطل الصفحات التي تعرض التقدّم.
 */
export async function toggleLessonComplete(
  lessonId: string,
  done: boolean,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = input.safeParse({ lessonId, done });
  if (!parsed.success) return { ok: false, error: "طلب غير صالح." };

  const result = await setLessonCompleted(parsed.data.lessonId, parsed.data.done);
  if (!result.ok) return result;

  revalidatePath(`/learn/${result.courseId}`);
  /* «مقرراتي» ولوحة النشاط تعرضان «تابع من» ونسبة الإتمام */
  revalidatePath("/learn");
  revalidatePath("/dashboard");
  return { ok: true };
}
