"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/data/admin";
import {
  markOrderPaid,
  cancelPendingOrder,
  MANUAL_PROVIDER,
} from "@/lib/data/orders";
import { db } from "@/server/db";

export type AdminOrderResult = { ok: boolean; error?: string };

/**
 * تأكيد استلام تحويل يدوي.
 *
 * ── الحارس هنا لا في الصفحة وحدها ───────────────────────────────────
 * `requireAdmin()` أول سطر في الإجراء نفسه. إجراءات الخادم نقاط دخول
 * مستقلة تُستدعى بحمولة مُلفّقة من أي متصفّح، فحماية الصفحة التي تعرض
 * الزرّ لا تحمي الإجراء الذي خلفه.
 *
 * المنطق كله في `markOrderPaid` — نفس الدالة التي سيستدعيها `webhook`
 * البوابة لاحقًا. هذا الملف قناة إدخال لا مكان قرار.
 */
export async function confirmManualPayment(
  orderId: string,
  note: string,
): Promise<AdminOrderResult> {
  const admin = await requireAdmin();

  const order = await db.order.findUnique({
    where: { id: orderId },
    select: { number: true },
  });
  if (!order) return { ok: false, error: "الطلب غير موجود." };

  const result = await markOrderPaid({
    orderId,
    provider: MANUAL_PROVIDER,
    /* رقم الطلب معرّفًا للعملية: فريد، ومطبوع في محادثة واتساب،
       ويجعل قيد UNIQUE يمنع تسجيل التحويل نفسه مرتين. */
    paymentRef: order.number,
    reviewedById: admin.id,
    reviewNote: note.trim() || null,
  });

  if (!result.ok) return { ok: false, error: result.error };

  revalidatePath("/settings/orders");
  revalidatePath(`/orders/${order.number}`);
  revalidatePath("/orders");
  revalidatePath("/learn");
  return { ok: true };
}

/** إلغاء طلب معلّق من الإدارة — لتنظيف ما لم يُتمّه أحد */
export async function cancelOrderAsAdmin(
  orderId: string,
): Promise<AdminOrderResult> {
  await requireAdmin();

  const done = await cancelPendingOrder(orderId);
  if (!done) return { ok: false, error: "لا يمكن إلغاء طلب مؤكَّد." };

  revalidatePath("/settings/orders");
  revalidatePath("/orders");
  return { ok: true };
}
