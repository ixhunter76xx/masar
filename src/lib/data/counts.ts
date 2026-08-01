import "server-only";

import type { NavCounts } from "@/lib/navigation";
import { countUnreadForUser } from "@/lib/data/announcements";
import type { Role } from "@/generated/prisma/enums";

/**
 * عدّادات القائمة الجانبية.
 *
 * قاعدة التصميم: العدّاد يظهر فقط عند وجود ما يتطلب إجراءً من المستخدم،
 * ومكوّن CountBadge لا يعرض شيئًا عند الصفر.
 *
 * "الدرجات" و"الرسائل" ليس لهما جداول بعد فيبقيان صفرًا — بلا شارات
 * وهمية. تُضاف قيمهما هنا فور بناء النظامين.
 */
export async function getNavCounts(
  userId: string,
  role: Role,
): Promise<NavCounts> {
  const unreadAnnouncements = await countUnreadForUser(userId, role);

  return {
    "/courses": unreadAnnouncements,
    "/grades": 0,
    "/messages": 0,
  };
}
