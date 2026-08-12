/**
 * كليات المنصة — خارطة طريق، لا جدول قاعدة بيانات ولا دليل جامعة.
 *
 * ── لماذا هنا لا في `Faculty` ────────────────────────────────────────
 * جدول `Faculty` يحمل الكليات التي **للمنصة فيها محتوى**: له `slug`
 * مستقر تُبنى عليه الروابط، وتتعلّق به المقررات. أما هذه القائمة فهي
 * ما تنوي المنصة تغطيته، وأكثره لم يُطرح بعد. إدخاله في الجدول يعني
 * صفوفًا لا يشير إليها شيء، وهجرة تغيّر البيانات لأجل عرض. فالطبقة
 * الصحيحة هي العرض.
 *
 * الوصل بين الاثنين هو `slug` وحده: كل كلية هنا يقابلها صفّ في
 * الجدول متى صار لها محتوى. الموجودان اليوم `arts` و`it`.
 *
 * ── ليست دليلًا للجامعة ──────────────────────────────────────────────
 * جامعة البحرين تسع كليات (uob.edu.bh/colleges-2)، لكن المعروض هنا
 * أربع بقرار المالك — وهي ما تستهدفه المنصة فعلًا. سرد التسع كان
 * يجعل الصفحة تَعِد باتّساع غير منويّ.
 *
 * ── صياغة الحالة الفارغة ─────────────────────────────────────────────
 * «لم تُطرح بعد» لا «قريبًا». الثانية تَعِد بجدول زمني لا يملكه
 * المالك، والوعد الذي لا يُوفى أسوأ من الصمت. الأولى تقول الحقيقة:
 * احتمال مفتوح بلا التزام بتوقيت.
 */

/**
 * مفتاح الأيقونة — نصّ لا مكوّن، فالبيانات تعبر حدّ الخادم/العميل.
 * `other` للكليات التي تأتي من قاعدة البيانات خارج القائمة أدناه.
 */
export type FacultyIconKey =
  | "arts"
  | "it"
  | "engineering"
  | "science"
  | "other";

export type UobFaculty = {
  /** يطابق `Faculty.slug` في قاعدة البيانات متى وُجد الصفّ */
  slug: FacultyIconKey;
  name: string;
  icon: FacultyIconKey;
};

/**
 * الكليات الأربع التي تستهدفها المنصة — لا كليات الجامعة التسع.
 *
 * ── لماذا أربع لا تسع ────────────────────────────────────────────────
 * المحطّة غير المضاءة ليست زينة: هي إقرار بأن الكلية على خارطة الطريق.
 * فعرض تسع كليات يَعِد باتّساع لا ينوي المالك قطعه، وأربعٌ يقولها
 * بصدق. تضييق القائمة هنا **يقوّي** الادعاء ولا يضعفه.
 *
 * إضافة كلية لاحقًا سطرٌ واحد هنا؛ وحتى بلا ذلك، أي كلية تظهر في
 * قاعدة البيانات خارج هذه القائمة تُلحق تلقائيًا في `buildStations`
 * فلا يختفي مقرر منشور.
 */
export const UOB_FACULTIES: readonly UobFaculty[] = [
  { slug: "arts", name: "كلية الآداب", icon: "arts" },
  { slug: "it", name: "كلية تقنية المعلومات", icon: "it" },
  { slug: "science", name: "كلية العلوم", icon: "science" },
  { slug: "engineering", name: "كلية الهندسة", icon: "engineering" },
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
      icon: "other" as FacultyIconKey,
      courses: g.courses,
      isExtra: true,
    }));

  const all = [...known, ...extras];
  const filled = all.filter((s) => s.courses.length > 0);
  const empty = all.filter((s) => s.courses.length === 0);
  return [...filled, ...empty];
}
