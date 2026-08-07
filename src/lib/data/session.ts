import "server-only";

import { cache } from "react";

import { auth } from "@/auth";
import { db } from "@/server/db";
import type { Role } from "@/generated/prisma/enums";

export type LiveUser = {
  id: string;
  name: string;
  email: string;
  username: string | null;
  role: Role;
  mustChangePassword: boolean;
};

/**
 * ═══ المستخدم كما هو الآن، لا كما كان عند تسجيل الدخول ═══════════════
 *
 * ── ما الذي كان معطّلًا ─────────────────────────────────────────────
 * الجلسة رمز JWT يُختم مرة واحدة عند الدخول: `jwt()` في `auth.config.ts`
 * لا تكتب إلا حين يوجد `user`، أي عند المصادقة وحدها. وبعدها لا شيء
 * يعود إلى الجدول. و`isActive` كانت تُقرأ في موضع يتيم واحد هو
 * `authorize()`. فكانت النتيجة أن أزرار الإدارة تَعِد بما لا تفعل:
 *
 *   • «تعطيل» حسابًا مفتوحة جلسته  → لا يحدث شيء حتى ينتهي الرمز
 *   • إعادة تعيين كلمة مرور مسرَّبة → الجلسة المسروقة تبقى تعمل
 *   • إنزال أدمن إلى طالب          → يحتفظ بتأكيد المدفوعات وإدارة الحسابات
 *
 * ── لماذا هنا لا في `jwt()` ─────────────────────────────────────────
 * `jwt()` يعمل داخل `middleware` على بيئة Edge، ولا يعمل عميل Prisma
 * هناك. فالتحقق يقع في طبقة Node التي تمرّ منها كل المسارات المحمية:
 * تخطيط `(app)` عبر `getShellData`، وطبقة الوصول عبر `staffAccess`،
 * وإجراءات الإدارة عبر `requireAdmin`.
 *
 * ── الكلفة ──────────────────────────────────────────────────────────
 * استعلام واحد لكل طلب، و`cache()` يمنع تكراره بين المستدعين. وهو ثمن
 * الصحّة: بدونه تبقى كل صلاحية في المنصة مجمَّدة على لحظة الدخول.
 * ═══════════════════════════════════════════════════════════════════
 */
export const getLiveUser = cache(async function getLiveUser(): Promise<LiveUser | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  const row = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      username: true,
      role: true,
      isActive: true,
      mustChangePassword: true,
      sessionVersion: true,
    },
  });

  /* حساب محذوف أو معطَّل = لا جلسة. الرمز قد يبقى صالحًا توقيعًا،
     لكنه لم يعد يمثّل حسابًا يُسمح له بالدخول. */
  if (!row || !row.isActive) return null;

  /*
   * إبطال الجلسات بعد تغيير كلمة المرور.
   *
   * الرمز يحمل الرقم وقت الدخول. رفعُه في الجدول يجعل كل رمز أُصدر
   * قبله لا يطابق، فتنتهي الجلسة — وهذا ما يجعل إعادة تعيين كلمة
   * المرور تطرد فعلًا بدل أن تغيّر تجزئةً لا يقرؤها أحد بعد الدخول.
   *
   * الرموز التي أُصدرت قبل وجود الحقل لا تحمله، فتُعامَل معاملة 0
   * كقيمة العمود الافتراضية ولا تنتهي جلسة أحد بمجرّد النشر.
   */
  const tokenVersion = session.user.sessionVersion ?? 0;
  if (tokenVersion !== row.sessionVersion) return null;

  return {
    id: row.id,
    name: row.name,
    email: row.email,
    username: row.username,
    role: row.role,
    mustChangePassword: row.mustChangePassword,
  };
});
