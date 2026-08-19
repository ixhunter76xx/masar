import type { Metadata, Viewport } from "next";

import { MotionRoot } from "@/components/motion/MotionRoot";
import { ServiceWorker } from "@/components/pwa/ServiceWorker";
import { plexArabic, plexMono } from "@/lib/fonts";
import { SITE } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: SITE.tagline,
    template: `%s — ${SITE.name}`,
  },
  description: SITE.shortDescription,

  /**
   * أيقونة الشاشة الرئيسية على iOS.
   *
   * سفاري لا يقرأ `icons` من البيان — يقرأ `apple-touch-icon` وحدها.
   * فبلا هذا السطر يضع آيفون لقطة مصغّرة من الصفحة مكان الأيقونة.
   */
  appleWebApp: {
    capable: true,
    title: SITE.name,
    // شريط الحالة يذوب في خلفية الصفحة الداكنة بدل شريط أبيض فوقها
    statusBarStyle: "black-translucent",
  },
  icons: {
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },

  /**
   * Next يُصدر الوسم القياسي `mobile-web-app-capable` وحده، وهو ما
   * يقرؤه سفاري من iOS 15.4 فصاعدًا. الأجهزة الأقدم لا تعرف إلا
   * الوسم المسبوق بـ apple، وبدونه يفتح الاختصار في تبويب سفاري
   * كامل الأشرطة بدل نافذة مستقلة. الوسمان معًا لا يتعارضان.
   */
  other: {
    "apple-mobile-web-app-capable": "yes",
  },
};

/**
 * تصيير عند الطلب على مستوى التطبيق كلّه.
 *
 * سياسة أمان المحتوى تعتمد nonce يُولَّد لكل طلب، وأي صفحة تُولَّد مسبقًا
 * تُحفَظ بنصوص بلا nonce فتُحجب كاملةً. علّمنا `/login` و`/forgot-password`
 * يدويًا من قبل، لكن `/_not-found` بقيت ثابتة وظهر الحجب على صفحة ٤٠٤.
 *
 * الوضع هنا يغطّي كل صفحة حالية ومستقبلية، ولا يكلّف شيئًا: كل صفحات
 * المنصة تقرأ الجلسة أو قاعدة البيانات فهي ديناميكية أصلًا.
 */
export const dynamic = "force-dynamic";

export const viewport: Viewport = {
  /* يطابق `--color-ink` في globals.css — عند تغيير القاعدة غيّره هنا،
     وإلا ظهر شريط المتصفّح بلون لا يطابق أعلى الصفحة. */
  themeColor: "#1a1817",
  colorScheme: "dark",
  /* عند التثبيت على آيفون تمتدّ الصفحة تحت النتوء وشريط الإيماءة،
     و`viewport-fit: cover` مع حشو المنطقة الآمنة في globals.css يمنع
     اختفاء المحتوى تحتهما. */
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${plexArabic.variable} ${plexMono.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-dvh bg-ink text-paper antialiased">
        <MotionRoot>{children}</MotionRoot>
        <ServiceWorker />
      </body>
    </html>
  );
}
