import { IBM_Plex_Sans_Arabic, IBM_Plex_Mono, Amiri } from "next/font/google";

/** الخط الأساسي لكل النصوص العربية والإنجليزية */
export const plexArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-plex-arabic",
  display: "swap",
});

/** خط الأرقام والدرجات والمعرّفات */
export const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-mono",
  display: "swap",
});

/**
 * خطّ نسخيّ — لكلمات الإعراب في لوح الأبطل وحدها، لا للواجهة.
 *
 * ── لماذا يستحقّ خطًّا ثالثًا ────────────────────────────────────────
 * الإعراب منضودًا بخطّ نسخيّ هو أثمن ما تعرضه الصفحة العامّة: الشيء
 * الذي لا يملكه منافسٌ يشرح بالإنجليزية، والدليلُ على أن المنصّة
 * عربيةُ المنشأ لا مترجَمة. عرضُه بخطّ الواجهة يهدر الورقة الرابحة.
 *
 * ── وثمنه محسوب ────────────────────────────────────────────────────
 * وزنٌ واحد (٤٠٠) وقطاعٌ عربيّ واحد، و`display:swap` فلا يحجب الرسم،
 * وصفحةٌ واحدة تستعمله. أي أن الكلفة سطرٌ في الشبكة على الصفحة
 * العامّة وحدها، لا على بيئة الدراسة.
 */
export const amiri = Amiri({
  subsets: ["arabic"],
  weight: ["400"],
  variable: "--font-amiri",
  display: "swap",
});
