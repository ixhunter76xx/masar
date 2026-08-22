import type { MetadataRoute } from "next";

import { SITE } from "@/lib/site";

/**
 * بيان التطبيق — يجعل المنصة قابلة للتثبيت على الشاشة الرئيسية.
 *
 * ── لماذا نسختان من كل أيقونة ───────────────────────────────────────
 * `purpose: "any"` تُعرض كما هي. أما `"maskable"` فأندرويد يقتطعها
 * بالشكل الذي يفرضه الجهاز — دائرة أو مربع مستدير أو معيّن — ويضمن فقط
 * سلامة **٨٠٪ الوسطى**. لذلك أيقونة maskable هنا محتواها أصغر بهامش
 * واسع: يُقتطع الهامش لا الشعار.
 *
 * بلا نسخة maskable يضع أندرويد الأيقونة داخل مربع أبيض ثم يقتطعه،
 * فتظهر حافة بيضاء حول شعار داكن — وهو الخطأ الأشهر في هذه الميزة.
 *
 * `start_url: "/dashboard"` لا `/`: من ثبّت التطبيق يريد لوحته مباشرة،
 * و middleware يحوّله إلى الدخول إن لم تكن جلسته قائمة.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE.tagline,
    short_name: SITE.name,
    description: SITE.shortDescription,
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#1a1817",
    theme_color: "#1a1817",
    lang: "ar",
    dir: "rtl",
    categories: ["education"],
    /* النسخة ملحقةٌ بكل أيقونة: النظام يحمل أيقونات التطبيق المثبَّت
       بعناوينها ولا يعيد جلبها ما لم تتغيّر، فيبقى شعارٌ متقاعدٌ على
       شاشة الهاتف بعد تحديث الموقع كلّه. */
    icons: [
      { src: `/icon-192.png?v=${SITE.brandVersion}`, sizes: "192x192", type: "image/png", purpose: "any" },
      { src: `/icon-512.png?v=${SITE.brandVersion}`, sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: `/icon-maskable-192.png?v=${SITE.brandVersion}`,
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: `/icon-maskable-512.png?v=${SITE.brandVersion}`,
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
