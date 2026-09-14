import type { Metadata, Viewport } from "next";

import { PwaLaunch } from "@/components/brand/PwaLaunch";
import { MotionRoot } from "@/components/motion/MotionRoot";
import { NavProgress } from "@/components/motion/NavProgress";
import { ServiceWorker } from "@/components/pwa/ServiceWorker";
import { plexArabic, plexMono } from "@/lib/fonts";
import { SITE } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  /**
   * الأصل الذي تُبنى عليه كل الروابط النسبية في الوصف.
   *
   * بدونه يترك Next روابط Open Graph نسبيةً، و**قارئ الروابط لا يقبل
   * النسبيّ**: واتساب وتويتر ولوحات المعاينة تطلب رابطًا مطلقًا أو
   * تتجاهل الصورة. وهذا يخصّ هذا المنتج بعينه أكثر من غيره — رابط
   * المقرر يُشارَك عبر واتساب، وهي قناة البيع الأولى فيه.
   */
  metadataBase: new URL(SITE.url),
  title: {
    default: SITE.tagline,
    template: `%s — ${SITE.name}`,
  },
  description: SITE.shortDescription,

  /**
   * بطاقة المشاركة الافتراضية.
   *
   * كانت الروابط تُشارَك عاريةً: عنوانٌ نصّيّ بلا اسمٍ ولا وصفٍ ولا
   * صورة. والصورة هنا شعارُ المنصّة ٥١٢×٥١٢ — ليست بطاقةً مصمَّمة
   * (١٢٠٠×٦٣٠) لكنها تُظهر الهوية بدل الفراغ. وتصميم بطاقةٍ لائقة
   * عملٌ قائمٌ بذاته، يُضاف حين يُطلب.
   */
  openGraph: {
    type: "website",
    siteName: SITE.name,
    locale: "ar_BH",
    url: SITE.url,
    title: SITE.tagline,
    description: SITE.shortDescription,
    images: [
      {
        /* النسخة تُجبر واتساب على إعادة جلب بطاقة المشاركة — وهو
           يخزّنها لكل رابطٍ شورك ولا يعيد الجلب إلا بتغيّر العنوان. */
        url: `/icon-512.png?v=${SITE.brandVersion}`,
        width: 512,
        height: 512,
        alt: SITE.name,
      },
    ],
  },
  twitter: {
    card: "summary",
    title: SITE.tagline,
    description: SITE.shortDescription,
    images: [`/icon-512.png?v=${SITE.brandVersion}`],
  },

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
    apple: [{ url: `/apple-touch-icon.png?v=${SITE.brandVersion}`, sizes: "180x180" }],
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
  themeColor: "#131110",
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
        {/* في الجذر لا في تخطيطَي المنطقتين: التنقّلة قد تعبر بينهما
            (الكتالوج ← الدراسة) وهي أطول ما في المنصّة. ونسخةٌ واحدة
            تعني عدّادًا واحدًا لا اثنين يتنازعان الخيط نفسه. والجذر
            بلا تحويل ولا مرشِّح، فالتثبيت فيه يقيس النافذة فعلًا. */}
        <NavProgress />
        <MotionRoot>{children}</MotionRoot>
        {/* شاشة إقلاع التطبيق المثبَّت. آخر عنصرٍ في الجسم عمدًا: هي
            طبقةٌ فوق كل شيء، وترتيب المصدر يجعلها كذلك حتى لو تساوت
            طبقات z. ولا تُصيَّر إلا في وضع التطبيق — شرطُها في CSS
            فتُقيَّم مع أوّل رسم، بلا وميضٍ ينتظر ترطيب جافاسكربت. */}
        <PwaLaunch />
        <ServiceWorker />
      </body>
    </html>
  );
}
