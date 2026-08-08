import "server-only";

import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { db } from "@/server/db";
import { r2, r2Bucket } from "@/server/r2";
import { canViewLesson } from "@/lib/data/access";
import { Role, MaterialStatus } from "@/generated/prisma/enums";

/** مدة صلاحية رابط المشاهدة */
const PLAYBACK_TTL = 2 * 60 * 60; // ساعتان

/**
 * رابط مشاهدة مؤقّت لمادة فيديو.
 *
 * الدلو خاص بالكامل؛ لا يوجد رابط دائم. نتحقق أولًا من أن المستخدم
 * مسجَّل في المقرر (أو مدرّبه أو إدارة)، ثم نوقّع رابطًا صالحًا ساعتين.
 *
 * الرابط الموقّع **حامل للصلاحية** — من يحصل عليه خلال مدته يشاهد.
 * لذلك مدته قصيرة ولا يُخزَّن.
 */
export async function getPlaybackUrl(
  materialId: string,
  userId: string,
  role: Role,
): Promise<string | null> {
  const material = await db.courseMaterial.findFirst({
    /* `objectKey: { not: null }` مع `READY` ليسا تكرارًا: الحالة تصف
       اكتمال الرفع، والمفتاح يصف وجود ملف. الدرس المخطَّط يفتقد
       الاثنين، والتحقّق من المفتاح هو ما يجعل النوع غير فارغ أدناه. */
    where: {
      id: materialId,
      status: MaterialStatus.READY,
      objectKey: { not: null },
    },
    select: { objectKey: true, contentType: true, publishedAt: true },
  });

  if (!material?.objectKey) return null;

  /*
   * الحارس الوحيد هو `canViewLesson`.
   *
   * كان هنا منطق وصول موازٍ يسأل: «هل مقرر هذا الدرس فيه منتج يملكه
   * المستخدم؟» — وهو سؤال أوسع من الصحيح بدرجة تُسقط نموذج البيع كلّه:
   * مشتري «دورة المنتصف» مسجَّل في منتج داخل المقرر، فكان يمرّ إلى أي
   * درس فيه بما فيه دروس «دورة النهائي» التي لم يشترها. السؤال الصحيح
   * هو «هل يحوي منتجٌ يملكه هذا الدرسَ بعينه؟» وهو ما تسأله
   * `canViewLesson` عبر `ProductItem`.
   *
   * حذفنا الفرع الموازي ولم نُصلحه في مكانه عمدًا: منطقا وصول لنفس
   * السؤال ينحرفان عند أول تعديل يمسّ أحدهما — وهو ما حدث فعلًا مع
   * المعاينة المجانية، فهي مطبَّقة في `canViewLesson` وغائبة هنا.
   */
  if (!(await canViewLesson(materialId))) return null;

  /*
   * المسودة لا تُبثّ للطلاب. `canViewLesson` لا تعرف حالة النشر — هي
   * تجيب عن الملكية لا عن الجاهزية — فيبقى هذا الشرط هنا، ويُستثنى منه
   * الطاقم لأنه يعاين قبل النشر.
   */
  const isStaff = role === Role.ADMIN || role === Role.INSTRUCTOR;
  if (!isStaff && material.publishedAt === null) return null;

  return getSignedUrl(
    r2(),
    new GetObjectCommand({
      Bucket: r2Bucket(),
      Key: material.objectKey,
      ResponseContentType: material.contentType,
    }),
    { expiresIn: PLAYBACK_TTL },
  );
}
