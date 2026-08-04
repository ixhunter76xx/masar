"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { getCurrentUser } from "@/lib/data/shell";
import { requestProductOrder, cancelPendingOrder } from "@/lib/data/orders";
import { db } from "@/server/db";

/**
 * طلب شراء دورة.
 *
 * ── الصلاحية تُقرأ من الجلسة لا من المدخلات ─────────────────────────
 * `userId` لا يُمرَّر من المتصفّح إطلاقًا. لو مُرِّر لأمكن لأي مستخدم
 * إنشاء طلب باسم غيره بتعديل حمولة الإجراء — وهو ما اختُبر سابقًا في
 * ميزة الرسائل ووجب تكراره هنا.
 */
export async function requestPurchase(
  courseSlug: string,
  productSlug: string,
): Promise<{ ok: false; error: string }> {
  const user = await getCurrentUser();

  /* غير مسجّل → إلى التسجيل مع حفظ الوجهة، فيعود إلى صفحة المقرر
     بعد إنشاء حسابه بدل أن يتوه في لوحة التحكم. */
  if (!user) {
    redirect(`/signup?next=${encodeURIComponent(`/courses/${courseSlug}`)}`);
  }

  const product = await db.product.findFirst({
    where: { slug: productSlug, course: { slug: courseSlug } },
    select: { id: true },
  });

  if (!product) return { ok: false, error: "هذه الدورة غير موجودة." };

  const result = await requestProductOrder({
    userId: user.id,
    productId: product.id,
  });

  if (!result.ok) return result;

  revalidatePath("/orders");
  redirect(`/orders/${result.number}`);
}

/** إلغاء الطالب لطلبه المعلّق */
export async function cancelMyOrder(
  number: string,
): Promise<{ ok: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "انتهت الجلسة. سجّل الدخول مجددًا." };

  /* المطابقة بالرقم **وصاحب الطلب** معًا: الرقم متسلسل ويمكن تخمينه،
     فبلا شرط المالك يُلغي أيٌّ كان طلب غيره. */
  const order = await db.order.findFirst({
    where: { number, userId: user.id },
    select: { id: true },
  });
  if (!order) return { ok: false, error: "الطلب غير موجود." };

  const done = await cancelPendingOrder(order.id);
  if (!done) return { ok: false, error: "لا يمكن إلغاء طلب مؤكَّد." };

  revalidatePath("/orders");
  revalidatePath(`/orders/${number}`);
  return { ok: true };
}
