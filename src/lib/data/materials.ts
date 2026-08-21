import "server-only";

import { cache } from "react";

import { db } from "@/server/db";
import { accessibleLessonIds } from "@/lib/data/access";
import { getLiveUser } from "@/lib/data/session";
import { Role, MaterialStatus } from "@/generated/prisma/enums";

/**
 * يتحقق أن المستخدم يملك حق **الإدارة** في هذا المقرر:
 * مدرب المقرر نفسه، أو الإدارة. الطالب لا يدير شيئًا.
 *
 * ── ⚠ لماذا لا تأخذ الدور معطًى — وهذا إصلاحُ ثغرة ──────────────────
 * كانت تأخذ `userId` و`role` من المستدعي، والمستدعي يأخذهما من
 * `auth()` — أي من **ادّعاءات الرمز** لا من القاعدة. و`jwt()` في
 * `auth.config.ts` لا يكتب إلا عند تسجيل الدخول، فالرمز يبقى صادقًا
 * على حاله حتى ثلاثين يومًا مهما تغيّر الحساب بعده.
 *
 * والأثر مقيسٌ لا مُستنتَج. برمزٍ صدر لحسابٍ مديرٍ فعّال، ثم غُيّرت
 * القاعدة تحته:
 *
 *   | الحالة في القاعدة        | مسار API | الصفحة |
 *   |--------------------------|----------|--------|
 *   | مدير فعّال (ضابط)        | مرّ      | مرّت   |
 *   | عُطِّل الحساب             | **مرّ**  | رُفضت  |
 *   | رُفعت نسخة الجلسة        | **مرّ**  | رُفضت  |
 *
 * أي أن تعطيل حساب وتصفير كلمة مرور كانا يُنهيان الجلسة على الصفحات
 * وحدها، بينما تبقى مسارات API وإجراءات إدارة المقرر مفتوحة. وهو
 * بالضبط ما تعد `getLiveUser` بمنعه — لكنها لم تكن في هذا الطريق.
 *
 * فصارت الدالّة تقرأ المستخدم الحيّ بنفسها. و`getLiveUser` تُرجع
 * `null` للحساب المعطَّل ولنسخة الجلسة القديمة، فتسقط الصلاحية معها.
 * ولا تُعاد إليها معطياتٌ من المستدعي: ما لا يُمرَّر لا يُزوَّر.
 *
 * و`cache()` يمنع تكرار الاستعلام: الطلب الواحد يقرأ مرّة.
 */
export const canManageCourse = cache(async function canManageCourse(
  courseId: string,
): Promise<boolean> {
  const user = await getLiveUser();
  if (!user) return false;

  if (user.role === Role.ADMIN) {
    return (await db.course.count({ where: { id: courseId } })) > 0;
  }
  if (user.role === Role.INSTRUCTOR) {
    return (
      (await db.course.count({
        where: { id: courseId, presenterId: user.id },
      })) > 0
    );
  }
  return false;
});

export type MaterialListItem = {
  id: string;
  title: string;
  description: string | null;
  status: MaterialStatus;
  sizeBytes: number | null;
  durationSec: number | null;
  isPublished: boolean;
  createdAt: Date;
};

/**
 * كل دروس المقرر بترتيبها — لشاشة التخطيط، للمدير وحده.
 *
 * تختلف عن `getCourseMaterials` عمدًا: تلك تصفّي بالحزمة وبحالة النشر
 * لأنها تجيب «ما الذي يراه هذا المستخدم؟». والتخطيط سؤال آخر: «ما
 * الذي في المقرر؟» — بما فيه المخطَّط الذي لا ملف له وغير المنشور.
 * خلطهما كان سيجعل السكّة تُخفي عن المدير ما جاء ليرتّبه.
 */
export async function listLessonsForPlanner(courseId: string) {
  const rows = await db.courseMaterial.findMany({
    where: { courseId },
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      title: true,
      isFreePreview: true,
      status: true,
      objectKey: true,
      publishedAt: true,
    },
  });

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    isFreePreview: row.isFreePreview,
    isReady: row.status === MaterialStatus.READY,
    /* وجود مفتاح لا حالةٌ: الدرس قد يكون قيد الرفع — له مفتاح ولم
       يكتمل. التمييز هو ما يفرّق «بانتظار الرفع» عن «قيد الرفع». */
    hasFile: row.objectKey !== null,
    isPublished: row.publishedAt !== null,
  }));
}

/**
 * مواد المقرر.
 * الطالب يرى المنشورة الجاهزة فقط؛ المدرب والإدارة يريان كل شيء
 * بما فيه المسودات والرفعات الفاشلة.
 *
 * ⚠ **النطاق حزمة لا مقرر.** الطالب يرى دروس ما اشتراه فقط: مشتري
 * «دورة المنتصف» لا يرى درسَي النهائي. كانت هذه الدالة تصفّي بالمقرر
 * وحده ولا تستقبل `userId` أصلًا، فكانت أي حزمة تفتح المقرر كلّه —
 * ولم يظهر ذلك لأن كل الدروس `PENDING` فيحجبها مرشّح `READY` قبل أن
 * يهمّ المنتج. التصفية تتم في الذاكرة بعد استعلام واحد لمعرّفات
 * الدروس المتاحة، لا باستعلام لكل صف.
 */
/* `userId`/`role` لم يعودا معاملين: `accessibleLessonIds` تقرأ الجلسة
   بنفسها وتعيد `isStaff`. معامل باسم دور لا يؤثّر في شيء يوهم القارئ
   التالي بأن الدالة واعية بالأدوار — وهي ليست كذلك. */
export async function getCourseMaterials(
  courseId: string,
): Promise<MaterialListItem[]> {
  /* ══ الرؤية بالملكية، والتشغيل بالجاهزية ══════════════════════════
   *
   * كان الطالب لا يرى إلا الدروس `READY` المرفوعة، فمقرر اشتراه كاملًا
   * ولم تُرفع محاضراته بعد يظهر له **فارغًا تمامًا** — يُقرأ معطوبًا أو
   * مهجورًا، لا منظَّمًا في انتظار الرفع.
   *
   * الفصل الصحيح: **الملكية تقرّر ما يُرى، والجاهزية تقرّر ما يُشغَّل.**
   * الدرس المخطَّط عنوانٌ وترتيبٌ في منهج يملكه الطالب فعلًا، وهذه
   * معلومة له لا عنه.
   *
   * ── لماذا سقط شرط `publishedAt` بلا خطر ────────────────────────────
   * `CourseMaterial.publishedAt` لا تُكتب إلا في موضعين، كلاهما في
   * مسار الفيديو: تُضبط عند اكتمال الرفع وتُمسح عند حذفه. **لا يوجد
   * زرّ نشر/إخفاء لدرس**، فالحقل مرادف لـ«له ملف» لا قرار تحريري —
   * ولا مسودة هنا تُحمى. (الشرط الآخر `status = READY` يقول الشيء
   * نفسه، فكانا شرطًا واحدًا مكرّرًا.)
   *
   * ── ما لم يتغيّر ───────────────────────────────────────────────────
   * ترشيح `viewable` باقٍ كما هو: من لا يملك الدرس لا يراه، مخطَّطًا
   * كان أو مرفوعًا. والتشغيل يمرّ من `getPlaybackUrl` التي ترفض
   * `publishedAt === null` مستقلّةً عن هذا الاستعلام، و`MaterialList`
   * لا تُركّب المشغّل إلا عند `READY`. الحدّ المدفوع لم يُمسّ.
   * ═══════════════════════════════════════════════════════════════════ */
  // المحاضرات تستخدم `viewable` — وهي وحدها ما تشمله المعاينة المجانية
  const [{ isStaff, viewable }, rows] = await Promise.all([
    accessibleLessonIds(courseId),
    db.courseMaterial.findMany({
      where: { courseId },
      orderBy: [{ position: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        sizeBytes: true,
        durationSec: true,
        publishedAt: true,
        createdAt: true,
      },
    }),
  ]);

  const visible = isStaff ? rows : rows.filter((r) => viewable.has(r.id));

  return visible.map((r) => ({
    id: r.id,
    title: r.title,
    description: r.description,
    status: r.status,
    // BigInt لا يُسلسَل إلى JSON — نحوّله عند حدود طبقة البيانات
    sizeBytes: r.sizeBytes === null ? null : Number(r.sizeBytes),
    durationSec: r.durationSec,
    isPublished: r.publishedAt !== null,
    createdAt: r.createdAt,
  }));
}
