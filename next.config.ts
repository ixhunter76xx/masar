import type { NextConfig } from "next";

/**
 * ترويسات أمنية تُطبَّق على كل الاستجابات.
 * لا تحلّ محل التحققات في الخادم، لكنها تغلق فئات هجمات شائعة.
 */
const securityHeaders = [
  // منع تضمين المنصة داخل إطار في موقع آخر (clickjacking)
  { key: "X-Frame-Options", value: "DENY" },
  // منع المتصفح من تخمين نوع المحتوى
  { key: "X-Content-Type-Options", value: "nosniff" },
  // لا تُسرّب مسارات المنصة إلى مواقع خارجية
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // لا نستخدم هذه الواجهات — نُغلقها صراحةً
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  // إلزام HTTPS بعد أول زيارة
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains",
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // لا تكشف إطار العمل في الترويسات
  poweredByHeader: false,

  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
