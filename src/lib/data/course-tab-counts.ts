import "server-only";

import type { CourseTabCounts } from "@/lib/course-tabs";
import { countUnreadInCourse } from "@/lib/data/announcements";
import { countUnreadInCourse as countUnreadMessagesInCourse } from "@/lib/data/messages";
import type { Role } from "@/generated/prisma/enums";

/**
 * عدّادات تبويبات المقرر — إعلانات ورسائل غير مقروءة.
 * الشارة لا تظهر عند الصفر، والاستعلامان مستقلان فيمضيان معًا.
 */
export async function getCourseTabCounts(
  courseId: string,
  userId: string,
  role: Role,
): Promise<CourseTabCounts> {
  const [announcements, messages] = await Promise.all([
    countUnreadInCourse(courseId, userId, role),
    countUnreadMessagesInCourse(courseId, userId, role),
  ]);

  return { announcements, messages };
}
