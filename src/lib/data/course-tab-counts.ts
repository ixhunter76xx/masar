import "server-only";

import type { CourseTabCounts } from "@/lib/course-tabs";
import { countUnreadInCourse } from "@/lib/data/announcements";
import type { Role } from "@/generated/prisma/enums";

/**
 * عدّادات تبويبات المقرر.
 * "الرسائل" بلا جدول بعد فيبقى صفرًا — والشارة لا تظهر عند الصفر.
 */
export async function getCourseTabCounts(
  courseId: string,
  userId: string,
  role: Role,
): Promise<CourseTabCounts> {
  return {
    announcements: await countUnreadInCourse(courseId, userId, role),
    messages: 0,
  };
}
