/**
 * سياسة أمان المحتوى (Content-Security-Policy).
 *
 * ── لماذا nonce وليس 'unsafe-inline' ────────────────────────────────
 * Next يحقن نصوصًا برمجية مضمّنة (inline) لبثّ الصفحة وترطيبها. الطريق
 * السهل أن نكتب `script-src 'self' 'unsafe-inline'` — لكنها تُبطل الفائدة
 * الأساسية من السياسة: تصبح أي شفرة يحقنها مهاجم مسموحة أيضًا.
 *
 * البديل: توليد nonce عشوائي لكل طلب، وتمريره إلى Next عبر ترويسة الطلب
 * فيضعه على نصوصه، بينما يُرفض أي نص لا يحمله. و`strict-dynamic` يسمح
 * للنصوص الموثوقة بتحميل ما تحتاجه (حزم Next المقسّمة) دون سرد نطاقات.
 *
 * ── الثمن ────────────────────────────────────────────────────────────
 * قيمة الـ nonce تختلف كل طلب، فلا يمكن توليد الصفحات مسبقًا. هنا الثمن
 * صفر عمليًا: كل صفحة في المنصة تقرأ الجلسة أصلًا فهي ديناميكية بالفعل.
 * ─────────────────────────────────────────────────────────────────────
 */

/** يبني الأصل (origin) من رابط كامل، ويتجاهل الروابط غير الصالحة */
function originOf(url: string | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

/**
 * نطاقات R2: الفيديو يُشغَّل من رابط مؤقّت موقّع، والرفع يذهب مباشرة من
 * المتصفح إلى نفس النطاق. بدونهما يُحجب التشغيل والرفع معًا.
 */
function r2Origins(): string[] {
  const values = [
    originOf(process.env.R2_ENDPOINT),
    originOf(process.env.R2_PUBLIC_BASE_URL),
  ].filter((value): value is string => Boolean(value));

  return [...new Set(values)];
}

export function buildCsp(nonce: string): string {
  const r2 = r2Origins();
  const isDev = process.env.NODE_ENV !== "production";

  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],

    /* 'strict-dynamic' يجعل المتصفحات الحديثة تتجاهل قائمة النطاقات
       وتثق بما تُحمّله النصوص الحاملة للـ nonce. و'self' يبقى احتياطًا
       للمتصفحات التي لا تدعمه. */
    "script-src": [
      "'self'",
      `'nonce-${nonce}'`,
      "'strict-dynamic'",
      // في التطوير فقط: eval يستخدمه Next لإعادة التحميل السريع
      ...(isDev ? ["'unsafe-eval'"] : []),
    ],

    /* الأنماط تُحقن مضمّنة من Tailwind ومن motion أثناء الحركة.
       'unsafe-inline' هنا لا يفتح تنفيذ شفرة — أسوأ ما يتيحه تشويه
       المظهر، وهو خطر مقبول مقابل تعقيد nonce على كل نمط محسوب. */
    "style-src": ["'self'", "'unsafe-inline'"],

    "img-src": ["'self'", "data:", "blob:", ...r2],
    "font-src": ["'self'", "data:"],
    "media-src": ["'self'", "blob:", ...r2],
    "connect-src": ["'self'", ...r2],

    /* لا مكوّنات إضافية ولا إطارات: المنصة لا تستخدم أيًّا منها */
    "object-src": ["'none'"],
    "frame-src": ["'none'"],
    /* يمنع وضع المنصة داخل إطار في موقع آخر — حماية من clickjacking،
       وهي النسخة الحديثة من X-Frame-Options */
    "frame-ancestors": ["'none'"],
    /* يمنع مهاجمًا حقن <base> ليعيد توجيه كل الروابط النسبية */
    "base-uri": ["'self'"],
    /* النماذج لا تُرسل إلا إلى المنصة نفسها */
    "form-action": ["'self'"],
  };

  const parts = Object.entries(directives).map(
    ([key, values]) => `${key} ${values.join(" ")}`,
  );

  // ترقية أي رابط http متبقٍ إلى https — في الإنتاج فقط، وإلا كُسر localhost
  if (!isDev) parts.push("upgrade-insecure-requests");

  return parts.join("; ");
}

/** nonce عشوائي بـ 128 بت — متاح في بيئة Edge عبر Web Crypto */
export function generateNonce(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return btoa(String.fromCharCode(...bytes));
}
