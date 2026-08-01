import type { CourseTabCounts } from "@/lib/course-tabs";

/**
 * عدّادات تبويبات المقرر.
 *
 * ⚠️ ترجع أصفارًا حاليًا لأن جدولَي الإعلانات والرسائل غير موجودين بعد.
 * الشارات لا تُعرض عند الصفر (قاعدة التصميم: العدّاد يظهر فقط عند وجود
 * ما يتطلب إجراءً)، فبمجرد إضافة الجداول واستبدال جسم هذه الدالة
 * ستظهر الشارات تلقائيًا دون تعديل الواجهة.
 */
export async function getCourseTabCounts(
  _courseId: string,
  _userId: string,
): Promise<CourseTabCounts> {
  return { announcements: 0, messages: 0 };
}
