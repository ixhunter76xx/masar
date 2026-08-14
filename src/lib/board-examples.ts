/**
 * أمثلة اللوح — ما يعرضه أبطل الكتالوج.
 *
 * ── لماذا هنا لا في قاعدة البيانات ──────────────────────────────────
 * هذه مادّة تحريرية لا بيانات منتج: تعرض **أسلوب الشرح** لمن لم يشترِ
 * بعد. لا يوجد في المخطط نموذجٌ لـ«مثال محلول»، وإضافته لأجل الأبطل
 * تعني هجرةً وشاشةَ إدارة لأجل ثلاث فقرات تتغيّر مرّة في السنة.
 * نفس منطق `lib/faculties.ts`: ما لا يشير إليه صفٌّ في القاعدة يبقى
 * في طبقة العرض.
 *
 * ── ⚠ ثلاث كليات لا أربع ────────────────────────────────────────────
 * المعروض هنا يجب أن يطابق المُضاء في «اختر كليتك» أسفل الصفحة. مثالٌ
 * من كلية تقول عنها المحطّات «لم تُطرح بعد» يجعل الصفحة تناقض نفسها.
 *
 * ── والصيغتان مقصودتان ──────────────────────────────────────────────
 * الإعراب لا يُقرأ قائمةَ خطوات، والاشتقاق لا يُقرأ كلماتٍ معلَّقًا
 * تحتها حكمها. شكل العرض يتبع شكل المعرفة، لا العكس.
 */

export type ParseWord = { word: string; ruling: string };

export type BoardExample = {
  code: string;
  faculty: string;
  topic: string;
  lead: string;
} & (
  | { kind: "parse"; words: ParseWord[]; tail: string }
  | { kind: "steps"; expr: string; steps: string[]; resultLabel: string; result: string }
);

export const BOARD_EXAMPLES: readonly BoardExample[] = [
  {
    kind: "parse",
    code: "ARAB110",
    faculty: "كلية الآداب",
    topic: "أسلوب التعجّب",
    lead: "ما إعراب كلّ كلمة؟",
    words: [
      { word: "ما", ruling: "تعجّبية، مبتدأ" },
      { word: "أجملَ", ruling: "فعل ماضٍ جامد" },
      { word: "العلمَ", ruling: "مفعول به منصوب" },
    ],
    tail: "وجملة «أجملَ العلمَ» في محلّ رفع خبر المبتدأ.",
  },
  {
    kind: "steps",
    code: "ITCS106",
    faculty: "كلية تقنية المعلومات",
    topic: "حلقة for",
    lead: "ماذا يطبع هذا؟",
    expr: "for (i = 0; i < 3; i++)",
    steps: [
      "العدّاد يبدأ من الصفر، لا من واحد",
      "والشرط <code>i &lt; 3</code> يتوقّف قبلها لا عندها",
      "فالدورات ثلاث: صفر، ثم واحد، ثم اثنان",
    ],
    resultLabel: "المخرج",
    result: "0 1 2",
  },
  {
    kind: "steps",
    code: "MATHS101",
    faculty: "كلية العلوم",
    topic: "قاعدة الضرب",
    lead: "اشتقّ بالنسبة إلى x:",
    expr: "d/dx ( x² · sin x )",
    steps: [
      "الدالّة حاصل ضرب دالّتين، فالقاعدة <code>u′v + uv′</code>",
      "<code>u = x²</code> ومنه <code>u′ = 2x</code>",
      "<code>v = sin x</code> ومنه <code>v′ = cos x</code>",
    ],
    resultLabel: "الناتج",
    result: "2x·sin x + x²·cos x",
  },
] as const;
