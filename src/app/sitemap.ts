import type { MetadataRoute } from "next";

import { getCachedCatalogue } from "@/lib/public-course-cache";
import { SITE } from "@/lib/site";

/**
 * خريطة الموقع — الصفحات العامّة وحدها.
 *
 * ── لماذا وُجدت الآن ────────────────────────────────────────────────
 * صفحة المقرر لا يصل إليها زاحفٌ إلا من الكتالوج، والكتالوج يعرضها
 * داخل مكوّن عميلٍ يتبدّل بالنقر على محطّة الكلية. فبلا خريطة قد لا
 * تُكتشف المقررات غير المعروضة في المحطّة الافتراضية.
 *
 * ── المصدر هو المخزون العام نفسه ────────────────────────────────────
 * `getCachedCatalogue` هو ما يقرؤه الكتالوج، ووسمه يُبطَل فور أي
 * كتابةٍ إدارية. فالخريطة تتبع المنشور تلقائيًا: نشرُ مقرر يُدخله،
 * وأرشفتُه تُخرجه — بلا قائمةٍ ثانية تُنسى.
 *
 * ولا يُدرَج إلا ما له `slug`: هو ما تُبنى عليه الروابط العامّة،
 * ومقرَّرٌ بلا slug لا صفحة عامّة له أصلًا.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const fixed: MetadataRoute.Sitemap = [
    { url: `${SITE.url}/courses`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${SITE.url}/legal/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE.url}/legal/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];

  try {
    const groups = await getCachedCatalogue();
    const courses = groups
      .flatMap((group) => group.courses)
      .filter((course): course is typeof course & { slug: string } => Boolean(course.slug));

    return [
      ...fixed,
      ...courses.map((course) => ({
        url: `${SITE.url}/courses/${course.slug}`,
        lastModified: now,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })),
    ];
  } catch {
    /* تعذّر الوصول إلى القاعدة: تُقدَّم الصفحات الثابتة بدل خريطةٍ
       فاشلة. خريطةٌ ناقصة خيرٌ من ٥٠٠ يتعلّمها الزاحف. */
    return fixed;
  }
}
