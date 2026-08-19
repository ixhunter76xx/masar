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

/**
 * صيغة المعدود كاملةً — بالمفرد والمثنّى والجمع.
 *
 * ── ما كان ناقصًا ───────────────────────────────────────────────────
 * `countWord` يعرف حالتين: ٣–١٠ جمعٌ، وما عداه مفردٌ منصوب. وذلك يكفي
 * لِما فوق العشرة ويُخطئ فيما تحت الثلاثة: كان يُعرض **«١ مقررًا»**
 * و**«٢ مقررًا»**، وكلاهما لحنٌ صريح.
 *
 * والعربية تعدّ على خمس حالات لا اثنتين:
 *
 *   ٠        جمع            «لا مقررات»
 *   ١        مفردٌ بلا عدد   «مقرر واحد»
 *   ٢        مثنّى بلا عدد   «مقرران»
 *   ٣–١٠     جمعٌ مجرور      «٥ مقررات»
 *   ١١ فأكثر مفردٌ منصوب     «١٢ مقررًا»
 *
 * ولاحظ أن الواحد والاثنين **لا يُسبقان بالرقم**: «مقرر واحد» لا
 * «١ مقرر واحد». فالدالة تُرجع العبارة كاملة، لا الكلمة وحدها، لأن
 * إظهار الرقم من عدمه جزءٌ من القاعدة لا من التنسيق.
 *
 * ⚠ ومنصّةٌ منتجُها شرحُ النحو لا تحتمل لحنًا في أثاثها — وهذا هو
 * السبب الذي يجعل هذا إصلاح صحّة لا تحسين ذوق.
 */
export type CountedForms = {
  /** «مقرر واحد» — بلا رقم */
  one: string;
  /** «مقرران» — بلا رقم */
  two: string;
  /** جمعٌ لـ٣–١٠ ولِلصفر: «مقررات» */
  few: string;
  /** مفردٌ منصوب لـ١١ فأكثر: «مقررًا» */
  many: string;
};

export function countedPhrase(n: number, forms: CountedForms): string {
  if (n === 1) return forms.one;
  if (n === 2) return forms.two;
  /* الصفر يأخذ الجمع كما تأخذه الثلاثة: «٠ باقات» لا «٠ باقة» */
  if (n === 0 || (n >= 3 && n <= 10)) return `${ar(n)} ${forms.few}`;
  return `${ar(n)} ${forms.many}`;
}

/** صيغ المعدودات المتكرّرة — موضعٌ واحد فلا تتفرّق الصياغة. */
export const COURSE_FORMS: CountedForms = {
  one: "مقرر واحد",
  two: "مقرران",
  few: "مقررات",
  many: "مقررًا",
};

export const LESSON_FORMS: CountedForms = {
  one: "درس واحد",
  two: "درسان",
  few: "دروس",
  many: "درسًا",
};

export const PRODUCT_FORMS: CountedForms = {
  one: "باقة واحدة",
  two: "باقتان",
  few: "باقات",
  many: "باقة",
};

export const STUDENT_FORMS: CountedForms = {
  one: "طالب واحد",
  two: "طالبان",
  few: "طلاب",
  many: "طالبًا",
};

export const ORDER_FORMS: CountedForms = {
  one: "طلب واحد",
  two: "طلبان",
  few: "طلبات",
  many: "طلبًا",
};

export const lessonsWord = (n: number) => countWord(n, "دروس", "درسًا");
export const coursesWord = (n: number) => countWord(n, "مقررات", "مقررًا");
export const questionsWord = (n: number) => countWord(n, "أسئلة", "سؤالًا");
export const minutesWord = (n: number) => countWord(n, "دقائق", "دقيقة");

/** «٥ دروس» / «١٢ درسًا» — العدد معرَّبًا مع تمييزه الصحيح */
export function arCount(n: number, few: string, many: string): string {
  return `${ar(n)} ${countWord(n, few, many)}`;
}
