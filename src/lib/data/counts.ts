import "server-only";

import type { NavCounts } from "@/lib/navigation";
import { countUnreadForUser } from "@/lib/data/announcements";
import { countPendingGrading } from "@/lib/data/grades";
import { countUnreadForUser as countUnreadMessages } from "@/lib/data/messages";
import type { Role } from "@/generated/prisma/enums";

/**
 * عدّادات القائمة الجانبية.
 *
 * قاعدة التصميم: العدّاد يظهر فقط عند وجود ما يتطلب إجراءً من المستخدم،
 * ومكوّن CountBadge لا يعرض شيئًا عند الصفر.
 *
 * عدّاد "الدرجات" للمدرب = التسليمات المنتظرة للتصحيح — وهو العنصر
 * الوحيد القابل للإجراء لديه. أما درجة الطالب فمعلومة لا إجراء، فلا
 * عدّاد لها.
 *
 * عدّاد "الرسائل" = الرسائل الواردة غير المقروءة، للطالب والمدرب معًا:
 * كلاهما يستقبل ويردّ. الاستعلامات الثلاثة على التوازي لأنها مستقلة.
 */
export async function getNavCounts(
  userId: string,
  role: Role,
): Promise<NavCounts> {
  const [unreadAnnouncements, pendingGrading, unreadMessages] =
    await Promise.all([
      countUnreadForUser(userId, role),
      countPendingGrading(userId, role),
      countUnreadMessages(userId, role),
    ]);

  return {
    "/courses": unreadAnnouncements,
    "/grades": pendingGrading,
    "/messages": unreadMessages,
  };
}
