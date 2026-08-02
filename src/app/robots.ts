import type { MetadataRoute } from "next";

/**
 * منع الفهرسة كاملةً.
 *
 * منصة تعليمية خاصة: كل صفحاتها خلف تسجيل دخول، ولا يوجد محتوى عام
 * يُفترض ظهوره في نتائج البحث. حتى صفحة الدخول لا فائدة من فهرستها،
 * وظهورها يكشف وجود المنصة وتقنيتها لمن يبحث.
 *
 * ملاحظة: robots.txt توجيه لا حماية — يحترمه الزاحف المهذّب فقط.
 * الحماية الفعلية هي middleware والتحقق من الجلسة على الخادم.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", disallow: "/" }],
  };
}
