import { ar } from "@/lib/numerals";

/**
 * ⚠ `"ar"` وحدها لا تكفي.
 *
 * `Intl.DateTimeFormat("ar")` تُرجع في ICU الحاليّ
 * `numberingSystem: "latn"` — أي «11 أغسطس» بأرقام لاتينية، لا
 * «١١ أغسطس» كما يَعِد تعليق `formatDate` أدناه. فالتعليق كان يصف
 * نيّةً لا سلوكًا، والفرق لا يظهر إلا على الشاشة.
 *
 * و`-u-nu-arab` يطلب منظومة الأرقام صراحةً بدل الاتّكال على
 * افتراضٍ يملكه ICU ويغيّره متى شاء.
 */
const AR_LOCALE = "ar-u-nu-arab";

/** صياغة الوقت النسبي بالعربية */
export function relativeTime(date: Date, now: Date = new Date()): string {
  const diffMs = now.getTime() - date.getTime();
  const minutes = Math.round(diffMs / 60_000);

  if (minutes < 1) return "الآن";
  if (minutes < 60) return `قبل ${ar(minutes)} دقيقة`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `قبل ${ar(hours)} ساعة`;

  const days = Math.round(hours / 24);
  if (days === 1) return "أمس";
  if (days < 7) return `قبل ${ar(days)} أيام`;

  return new Intl.DateTimeFormat(AR_LOCALE, {
    day: "numeric",
    month: "long",
  }).format(date);
}

/** تاريخ كامل: "٤ أغسطس ٢٠٢٦" — للسجلات المالية حيث "قبل ٣ أيام" لا يكفي */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat(AR_LOCALE, {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

/** مدى تاريخي مختصر: "١ فبراير – ١٥ يونيو ٢٠٢٦" */
export function formatDateRange(from: Date, to: Date): string {
  const day = new Intl.DateTimeFormat(AR_LOCALE, { day: "numeric", month: "long" });
  const full = new Intl.DateTimeFormat(AR_LOCALE, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return `${day.format(from)} – ${full.format(to)}`;
}
