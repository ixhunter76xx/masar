/**
 * كليات جامعة البحرين — خارطة المنصة، لا جدول قاعدة بيانات.
 *
 * ── لماذا هنا لا في `Faculty` ────────────────────────────────────────
 * جدول `Faculty` يحمل الكليات التي **للمنصة فيها محتوى**: له `slug`
 * مستقر تُبنى عليه الروابط، وتتعلّق به المقررات. أما هذه القائمة فهي
 * الجامعة كما هي في الواقع — تسع كليات، أكثرها لم يُطرح على المنصة
 * بعد. إدخالها في الجدول يعني صفوفًا لا يشير إليها شيء، وهجرة تغيّر
 * البيانات لأجل عرض. فالطبقة الصحيحة هي العرض.
 *
 * الوصل بين الاثنين هو `slug` وحده: كل كلية هنا يقابلها صفّ في
 * الجدول متى صار لها محتوى. الموجودان اليوم `arts` و`it`.
 *
 * ── المصدر ───────────────────────────────────────────────────────────
 * الموقع الرسمي (uob.edu.bh/colleges-2) يذكر تسع كليات. ويكيبيديا
 * العربية تسرد عشرًا لأنها تفصل «التربية الرياضية والعلاج الطبيعي»
 * عن «العلوم الصحية»، وهما مدمجتان اليوم في «العلوم الصحية
 * والرياضية». اعتمدنا التسع الحالية.
 *
 * ── صياغة الحالة الفارغة ─────────────────────────────────────────────
 * «لم تُطرح بعد» لا «قريبًا». الثانية تَعِد بجدول زمني لا يملكه
 * المالك، والوعد الذي لا يُوفى أسوأ من الصمت. الأولى تقول الحقيقة:
 * احتمال مفتوح بلا التزام بتوقيت.
 */

/** مفتاح الأيقونة — نصّ لا مكوّن، فالبيانات تعبر حدّ الخادم/العميل. */
export type FacultyIconKey =
  | "arts"
  | "it"
  | "engineering"
  | "science"
  | "business"
  | "law"
  | "health"
  | "applied"
  | "teachers";

export type UobFaculty = {
  /** يطابق `Faculty.slug` في قاعدة البيانات متى وُجد الصفّ */
  slug: FacultyIconKey;
  name: string;
  icon: FacultyIconKey;
};

/** الترتيب الرسمي للجامعة — يُعاد ترتيبه للعرض حسب ما فيه محتوى. */
export const UOB_FACULTIES: readonly UobFaculty[] = [
  { slug: "arts", name: "كلية الآداب", icon: "arts" },
  { slug: "it", name: "كلية تقنية المعلومات", icon: "it" },
  { slug: "engineering", name: "كلية الهندسة", icon: "engineering" },
  { slug: "science", name: "كلية العلوم", icon: "science" },
  { slug: "business", name: "كلية إدارة الأعمال", icon: "business" },
  { slug: "law", name: "كلية الحقوق", icon: "law" },
  { slug: "health", name: "كلية العلوم الصحية والرياضية", icon: "health" },
  { slug: "applied", name: "كلية التعليم التطبيقي", icon: "applied" },
  { slug: "teachers", name: "كلية البحرين للمعلمين", icon: "teachers" },
] as const;

/** نصّ الكلية التي لا محتوى لها — موضع واحد، فلا تتفرّق الصياغة. */
export const NOT_OFFERED_LABEL = "لم تُطرح بعد";

export type Station<TCourse> = {
  slug: string;
  name: string;
  icon: FacultyIconKey;
  courses: TCourse[];
  /** كلية خارج قائمة الجامعة — تُعرض ولا تُخفى، فلا يختفي مقرر منشور */
  isExtra: boolean;
};

/**
 * يدمج مجموعات قاعدة البيانات مع قائمة الجامعة.
 *
 * المحطّات التي فيها مقررات تتقدّم، ثم يتبعها ما لم يُطرح بالترتيب
 * الرسمي. السبب أن المحطّة الأولى هي المختارة افتراضيًا، ومحطّة
 * فارغة في الصدارة تجعل أول ما يراه الزائر لا شيء.
 */
export function buildStations<TCourse>(
  groups: readonly { slug: string | null; name: string; courses: TCourse[] }[],
): Station<TCourse>[] {
  const bySlug = new Map(groups.filter((g) => g.slug).map((g) => [g.slug!, g]));

  const known: Station<TCourse>[] = UOB_FACULTIES.map((f) => ({
    slug: f.slug,
    name: f.name,
    icon: f.icon,
    courses: bySlug.get(f.slug)?.courses ?? [],
    isExtra: false,
  }));

  /* كلية في القاعدة خارج قائمة الجامعة (أو مقررات بلا كلية): تُلحق
     آخرًا بدل أن تُسقَط — إسقاطها يخفي مقررًا منشورًا عن الكتالوج. */
  const extras: Station<TCourse>[] = groups
    .filter((g) => !g.slug || !UOB_FACULTIES.some((f) => f.slug === g.slug))
    .map((g) => ({
      slug: g.slug ?? "other",
      name: g.name,
      icon: "applied" as FacultyIconKey,
      courses: g.courses,
      isExtra: true,
    }));

  const all = [...known, ...extras];
  const filled = all.filter((s) => s.courses.length > 0);
  const empty = all.filter((s) => s.courses.length === 0);
  return [...filled, ...empty];
}
