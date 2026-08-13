/**
 * الأرقام العربية-الهندية وتمييز العدد.
 *
 * ── لماذا طبقةُ عرضٍ منفصلة عن `formatFils` ─────────────────────────
 * `formatFils` تُنتج سلسلةً **تُقرأ آليًّا**: تُمرَّر إلى `Number()` في
 * محرّر الباقات (`ProductManager`)، وتُكتب في رسالة واتساب التي ينسخ
 * منها صاحب المنصّة المبلغ إلى تطبيق المصرف. لو أرجعت «٨٫٠٠٠» لعادت
 * `Number()` بـ`NaN` ولانكسر إنشاء الباقة، ولصار المبلغ في واتساب غير
 * قابل للّصق. فتبقى تلك آليةً، وتُعرَّب هنا عند العرض وحده.
 *
 * ── وتمييز العدد ليس تجميلًا ────────────────────────────────────────
 * العربية تميّز من ٣ إلى ١٠ بجمعٍ مجرور («٥ دروس»)، ومن ١١ فصاعدًا
 * بمفردٍ منصوب («١٢ درسًا»). و«١٢ دروس» خطأ نحويّ صريح — وفي الكتالوج
 * مقررات من ١١ و١٢ و١٤ درسًا، أي أن الخطأ كان سيظهر فعلًا. ومنصّةٌ
 * منتجُها شرحُ النحو لا تحتمل خطأً نحويًّا في أثاثها.
 */

const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";

/** يحوّل الأرقام اللاتينية في نصّ إلى عربية-هندية، ويترك ما عداها */
export function ar(value: string | number): string {
  return String(value).replace(/\d/g, (d) => AR_DIGITS[Number(d)]);
}

/**
 * سعرٌ معرَّب للعرض: أرقام عربية وفاصلة عشرية عربية (U+066B).
 * المُدخل ناتج `formatFils` — أي «8.000».
 */
export function arPrice(formatted: string): string {
  return ar(formatted).replace(".", "٫");
}

/** ٣–١٠ جمعٌ، وما عداها مفردٌ منصوب */
export function countWord(n: number, few: string, many: string): string {
  return n >= 3 && n <= 10 ? few : many;
}

export const lessonsWord = (n: number) => countWord(n, "دروس", "درسًا");
export const coursesWord = (n: number) => countWord(n, "مقررات", "مقررًا");
export const questionsWord = (n: number) => countWord(n, "أسئلة", "سؤالًا");
export const minutesWord = (n: number) => countWord(n, "دقائق", "دقيقة");

/** «٥ دروس» / «١٢ درسًا» — العدد معرَّبًا مع تمييزه الصحيح */
export function arCount(n: number, few: string, many: string): string {
  return `${ar(n)} ${countWord(n, few, many)}`;
}
