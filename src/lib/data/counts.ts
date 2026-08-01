import type { NavCounts } from "@/lib/navigation";

/**
 * عدّادات القائمة الجانبية.
 *
 * ⚠️ بيانات مؤقتة — لا توجد جداول للدرجات والرسائل بعد. عند إضافتها
 * استبدل جسم الدالة باستعلامات حقيقية مع إبقاء نفس التوقيع؛ الواجهة
 * لن تتغيّر.
 */
export async function getNavCounts(_userId: string): Promise<NavCounts> {
  return {
    "/grades": 3,
    "/messages": 5,
  };
}
