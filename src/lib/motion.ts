/**
 * رموز الحركة — المصدر الوحيد للغة الحركية في المنصة.
 *
 * القيم هنا مطابقة عمدًا لمتغيّرات CSS في `globals.css`
 * (`--dur-*` و`--ease-*`)، فالحركة المكتوبة بـ CSS والحركة المكتوبة
 * بـ motion تتحرّكان بنفس الإحساس. عند تغيير قيمة هنا غيّرها هناك.
 *
 * لماذا لا حركة خطية: العين تقرأ الحركة الخطية كحركة آلية. كل المنحنيات
 * أدناه تبدأ سريعة وتهدأ (ease-out) أو تتسارع ثم تهدأ (ease-in-out).
 */

/** المدد بالثواني — motion يقيس بالثواني، وCSS يقيس بالمللي ثانية */
export const DUR = {
  /** تغيّر لون أو ظل — يجب ألّا يُلاحَظ كحركة */
  fast: 0.15,
  /** الافتراضي: تبويبات، حالات تفاعل */
  base: 0.24,
  /** دخول الأقسام وعناصر القوائم */
  slow: 0.32,
} as const;

/** منحنيات التسارع */
export const EASE = {
  /** دخول: انطلاقة سريعة ثم هدوء طويل — الأكثر استعمالًا */
  out: [0.22, 1, 0.36, 1],
  /** خروج: بداية هادئة ثم تسارع للخارج */
  in: [0.55, 0, 1, 0.45],
  /** حركة تبدأ وتنتهي في مكان مرئي */
  inOut: [0.65, 0, 0.35, 1],
} as const satisfies Record<string, [number, number, number, number]>;

/**
 * نوابض — تُستخدم حيث تتبع الحركة إصبع المستخدم أو تُكمل حركته،
 * لأن النابض يحمل سرعة الإصبع (velocity) فيبدو استمرارًا لها لا حدثًا جديدًا.
 */
export const SPRING = {
  /** اللوحة الجانبية: صارم بلا ارتداد مزعج */
  panel: { type: "spring", stiffness: 420, damping: 42, mass: 0.9 },
  /** مؤشّر التبويب المنزلق */
  indicator: { type: "spring", stiffness: 520, damping: 42, mass: 0.7 },
  /** ارتداد لطيف للعناصر الصغيرة */
  soft: { type: "spring", stiffness: 300, damping: 26 },
} as const;

/**
 * انتقال الصفحة: دخول وخروج.
 *
 * الخروج بـ`EASE.out` لا `EASE.in`: المنحنى الداخل يبدأ بطيئًا، فيؤخّر
 * اللحظة التي ينظر إليها المستخدم بالضبط. لا `ease-in` على عنصر واجهة.
 */
export const PAGE = {
  initial: { opacity: 0.72, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -3 },
  enterTransition: { duration: DUR.base, ease: EASE.out },
  exitTransition: { duration: 0.1, ease: EASE.out },
} as const;

/**
 * انتقال المنطقة المحمية: تلاشي في المكان بلا أي إزاحة هندسية.
 *
 * رأس الصفحة والشريط الجانبي مرساة اتجاه للمستخدم. تحريك غلاف الصفحة
 * كاملًا كان يحرّك الرأس معه ٦px ويجعل تبديل الشاشات يُقرأ كاهتزاز،
 * خصوصًا حين تظهر شاشة التحميل بينهما. يبقى انتقال الصفحات العامة
 * على `PAGE` كما هو؛ هذا الملف الشخصي خاص بمنطقة الدراسة والإدارة.
 */
export const APP_PAGE = {
  initial: { opacity: 0.72 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  /* دخول خاطف: هذا تلاشي محتوىً جديد فوق رأسية وشريط جانبي ثابتين،
     لا انتقال صفحة كاملة. `fast` يجعل الاستجابة تُقرأ فورية. */
  enterTransition: { duration: DUR.fast, ease: EASE.out },
  /**
   * ⚠ خروجٌ بلا زمن — وهذا إصلاح عطلٍ لا اختيار ذوق.
   *
   * كان الخروج يستغرق 100ms، و`AnimatePresence` بوضع `popLayout` يُبقي
   * النسخة الخارجة **مركّبة** طوال ذلك الزمن. وفي أثنائه يكون Next قد
   * صيّر `loading.tsx` للمسار الجديد — فيجتمع على الشاشة محتوى الصفحة
   * القديمة (يتلاشى من ١) مع هيكل التحميل (يدخل من ٠٫٧٢). النتيجة
   * ازدواج تعرّضٍ يُقرأ تجمّدًا للمحتوى القديم خلف الهيكل.
   *
   * بصفرٍ تُفكَّك النسخة القديمة في الإطار نفسه الذي يبدأ فيه التنقّل،
   * فيظهر الهيكل نظيفًا وحده. ولا يخسر المستخدم إحساس الانتقال: الدخول
   * أعلاه هو ما يحمله.
   */
  exitTransition: { duration: 0 },
} as const;

/**
 * مفتاح الغلاف الخارجي في المنطقة المحمية.
 *
 * تبويبات المقرر الأربعة تشترك في CourseLayout واحد؛ لذلك يجب أن تشترك
 * في المفتاح نفسه أيضًا. إبقاء pathname كاملًا كان يعيد تركيب الرأس
 * والتبويبات ويخلق مؤشري `layoutId` في موضعين رأسيين مختلفين.
 * المسارات الأخرى، ومنها الاختبارات والواجبات، تبقى صفحات مستقلة.
 */
export function appPageTransitionKey(pathname: string): string {
  const courseTabs = pathname.match(
    /^\/learn\/([^/]+)(?:\/(?:announcements|grades|messages)(?:\/.*)?)?\/?$/,
  );

  return courseTabs ? `/learn/${courseTabs[1]}/(tabs)` : pathname;
}

/** ظهور تسلسلي: الحاوية توزّع التأخير، والعنصر يحمل الحركة */
export const STAGGER = {
  container: {
    hidden: {},
    show: { transition: { staggerChildren: 0.035, delayChildren: 0.01 } },
  },
  item: {
    hidden: { opacity: 0, y: 8 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: DUR.slow, ease: EASE.out },
    },
  },
} as const;

/**
 * ارتداد السحب — نوع مختلف عن SPRING عمدًا.
 * motion يمرّر `dragTransition` إلى محرّك القصور الذاتي (inertia) لا إلى
 * محرّك النوابض، فمفاتيحه `bounce*` لا `stiffness/damping`.
 */
export const DRAG_BOUNCE = { bounceStiffness: 400, bounceDamping: 34 } as const;

/** المسافة التي يكفي سحبها لتأكيد الإيماءة (بكسل) */
export const DRAG_DISTANCE_THRESHOLD = 70;
/** سرعة السحب التي تؤكّد الإيماءة ولو كانت المسافة قصيرة (بكسل/ثانية) */
export const DRAG_VELOCITY_THRESHOLD = 400;
