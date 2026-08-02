/**
 * تقدير قوة كلمة المرور — **للعرض فقط**.
 *
 * ── حدود هذه الدالة، بصراحة ─────────────────────────────────────────
 * هذا ليس قياسًا لمقاومة كلمة المرور للكسر. القياس الحقيقي يحتاج مكتبة
 * كـ zxcvbn تعرف كلمات القاموس وأنماط لوحة المفاتيح والتواريخ الشائعة —
 * وحجمها مئات الكيلوبايتات لأجل مؤشّر إرشادي.
 *
 * ما تفعله هذه الدالة: تكافئ الطول وتنوّع المحارف، وتعاقب الأنماط
 * الواضحة. تكفي لتقول للمستخدم "هذه قصيرة" أو "كلها أرقام"، ولا تدّعي
 * أكثر. لذلك نصّها إرشاد لا حكم.
 *
 * ── ولماذا لا تمنع الإرسال ──────────────────────────────────────────
 * لا تُستدعى في أي مسار تحقّق، ولا تُمرَّر إلى أي `disabled`. المستخدم
 * يرى التقدير ويقرّر. حدّ الطول الأدنى الفعلي يفرضه الخادم وحده.
 * ────────────────────────────────────────────────────────────────────
 */

export type StrengthLevel = 0 | 1 | 2 | 3;

export type Strength = {
  level: StrengthLevel;
  label: string;
  /** ملاحظة إرشادية واحدة — أكثرها فائدة في هذه الحالة */
  hint: string | null;
};

const LABELS: Record<StrengthLevel, string> = {
  0: "ضعيفة",
  1: "مقبولة",
  2: "جيدة",
  3: "قوية",
};

export function estimateStrength(password: string): Strength | null {
  // لا مؤشّر قبل أن يكتب المستخدم شيئًا — لا نستقبله بتقييم سلبي
  if (!password) return null;

  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasDigit = /\d/.test(password);
  const hasSymbol = /[^\w\s]/.test(password);
  const variety = [hasLower, hasUpper, hasDigit, hasSymbol].filter(
    Boolean,
  ).length;

  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;
  if (variety >= 2) score += 1;
  if (variety >= 3) score += 1;

  /* عقوبات الأنماط الواضحة: محرف واحد مكرّر، أو تسلسل لوحة مفاتيح،
     أو أرقام وحدها. هذه تبدو طويلة لكنها تُخمَّن أولًا. */
  const singleCharacter = /^(.)\1+$/.test(password);
  const digitsOnly = /^\d+$/.test(password);
  const isCommonWord = /^(password|admin|welcome|qwerty|hisab)\d*$/i.test(
    password,
  );
  const hasSequence =
    /(0123|1234|2345|3456|4567|5678|6789|abcd|qwer|asdf|password|admin)/i.test(
      password,
    );

  /* التمييز مقصود: كلمة **هي** نمط شائع تسقط إلى الصفر، أما كلمة طويلة
     متنوّعة **تحتوي** تسلسلًا فتُخصم درجتين لا أكثر. الصفر لكل ما يحتوي
     "1234" كان يصنّف `Hisab12345` أضعف من `hisab123` — وهو حكم خاطئ
     يفقد المؤشّر مصداقيته عند المستخدم فيتجاهله كله. */
  if (singleCharacter || isCommonWord) score = 0;
  else {
    if (hasSequence) score = Math.max(0, score - 2);
    if (digitsOnly) score = Math.min(score, 1);
  }

  const level: StrengthLevel =
    score <= 1 ? 0 : score === 2 ? 1 : score === 3 ? 2 : 3;

  let hint: string | null = null;
  if (singleCharacter) hint = "محرف واحد مكرّر يُخمَّن فورًا.";
  else if (isCommonWord) hint = "كلمة شائعة تُجرَّب في أول محاولة.";
  else if (hasSequence) hint = "تحتوي تسلسلًا شائعًا يُجرَّب مبكرًا.";
  else if (password.length < 8) hint = "الطول أهم عامل — جرّب ٨ محارف فأكثر.";
  else if (digitsOnly) hint = "أرقام فقط — إضافة حروف تضاعف الاحتمالات.";
  else if (variety < 2) hint = "خلط الحروف والأرقام يرفعها درجة.";

  return { level, label: LABELS[level], hint };
}
