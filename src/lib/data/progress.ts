import "server-only";

import { cache } from "react";

import { db } from "@/server/db";
import { canViewLesson } from "@/lib/data/access";
import { getLiveUser } from "@/lib/data/session";

/**
 * ══ تقدّم الطالب في المسار — أوّل كاتبٍ لـ`LessonProgress` ════════════
 *
 * الجدول موجودٌ منذ البداية ولا يكتب فيه شيء؛ فكانت «تابع من» تسقط
 * دائمًا إلى «ابدأ من». إعادة التصميم (2026-09-14، بموافقة المالك)
 * تضيف أبسط كاتبٍ صادق: **الطالب يعلّم الدرس مكتملًا بنفسه.** لا
 * يُستنتج من مشاهدة، ولا يُفترض من فتح صفحة.
 *
 * ── الحارس ───────────────────────────────────────────────────────────
 * الهوية من `getLiveUser` لا من المعاملات، والدرس يمرّ من
 * `canViewLesson` — البوّابة نفسها التي تقرّر ما يُرى ويُشغَّل. فلا
 * يُعلَّم درسٌ لا يُرى، ولا يُكتب تقدّمٌ لحسابٍ عُطّل أو أُعيد تعيين
 * كلمة مروره. وما لا يُمرَّر لا يُزوَّر.
 *
 * ── ولماذا الإلغاء تحديثٌ لا إنشاء ──────────────────────────────────
 * `getCourseResume` تقرأ الصفّ الذي `completedAt = null` بوصفه «درسًا
 * بدأه ولم يُتمّه». فإنشاء صفٍّ فارغ عند إلغاء إتمامٍ لم يوجد يصنع
 * «تابع من» كاذبة. الإلغاء يمسح التاريخ عن صفٍّ قائم فقط.
 * ═══════════════════════════════════════════════════════════════════
 */

/** معرّفات الدروس التي أتمّها المستخدم الحاليّ في هذا المقرر */
export const getCompletedLessonIds = cache(async function getCompletedLessonIds(
  courseId: string,
): Promise<string[]> {
  const user = await getLiveUser();
  if (!user) return [];

  const rows = await db.lessonProgress.findMany({
    where: { userId: user.id, completedAt: { not: null }, lesson: { courseId } },
    select: { lessonId: true },
  });
  return rows.map((row) => row.lessonId);
});

export async function setLessonCompleted(
  lessonId: string,
  done: boolean,
): Promise<{ ok: true; courseId: string } | { ok: false; error: string }> {
  const user = await getLiveUser();
  if (!user) return { ok: false, error: "انتهت الجلسة. سجّل الدخول مجددًا." };

  const lesson = await db.courseMaterial.findUnique({
    where: { id: lessonId },
    select: { courseId: true, status: true },
  });
  if (!lesson || !(await canViewLesson(lessonId))) {
    return { ok: false, error: "الدرس غير متاح لك." };
  }
  /* الدرس المخطَّط بلا ملفّ لا يُتمّ: لا شيء فيه يُدرس بعد */
  if (lesson.status !== "READY") {
    return { ok: false, error: "هذا الدرس لم يُرفع بعد." };
  }

  if (done) {
    await db.lessonProgress.upsert({
      where: { userId_lessonId: { userId: user.id, lessonId } },
      create: { userId: user.id, lessonId, completedAt: new Date() },
      update: { completedAt: new Date() },
    });
  } else {
    await db.lessonProgress.updateMany({
      where: { userId: user.id, lessonId },
      data: { completedAt: null },
    });
  }

  return { ok: true, courseId: lesson.courseId };
}
