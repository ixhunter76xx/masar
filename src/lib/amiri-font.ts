import { Amiri } from "next/font/google";

/** خطّ نسخيّ خاص بلوح الإعراب؛ يُحمَّل مع الكتالوج فقط لا مع كل المنصة. */
export const amiri = Amiri({
  subsets: ["arabic"],
  weight: ["400"],
  variable: "--font-amiri",
  display: "swap",
});
