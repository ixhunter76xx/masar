import { SITE } from "@/lib/site";
import { formatFils } from "@/lib/price";

/**
 * روابط محادثة واتساب.
 *
 * ── لماذا رابط لا تكامل ──────────────────────────────────────────────
 * واجهة واتساب للأعمال (WhatsApp Business API) تحتاج حساب تاجر ومراجعة
 * قوالب رسائل — وهو الحاجز نفسه الذي دفعنا إلى الدفع اليدوي. ورابط
 * `wa.me` يفتح المحادثة برسالة معبّأة مسبقًا، وهو كل ما تحتاجه العملية:
 * أن يصلك الطلب معرّفًا بلا أن يكتب الطالب شيئًا أو يخطئ في نسخه.
 * ─────────────────────────────────────────────────────────────────────
 */

/** رقم المنصة بصيغة `wa.me` — محلي في site.ts ومفتاح البحرين ٩٧٣ */
export const SUPPORT_WA = `973${SITE.supportPhone}`;

function waLink(phone: string, text: string): string {
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

/** الطالب ← المنصة: يفتح المحادثة معك ورقم الطلب مكتوب */
export function studentPaymentLink(input: {
  orderNumber: string;
  title: string;
  totalFils: number;
}): string {
  return waLink(
    SUPPORT_WA,
    `السلام عليكم، أريد إتمام دفع طلبي في مسار.\n` +
      `رقم الطلب: ${input.orderNumber}\n` +
      `الدورة: ${input.title}\n` +
      `المبلغ: ${formatFils(input.totalFils)} د.ب`,
  );
}

/** المنصة ← الطالب: من لوحة الإدارة، لمتابعة طلب لم يُدفع */
export function adminFollowUpLink(input: {
  phone: string | null;
  studentName: string;
  orderNumber: string;
  title: string;
  totalFils: number;
}): string | null {
  if (!input.phone) return null;

  return waLink(
    input.phone,
    `مرحبًا ${input.studentName}، بخصوص طلبك في مسار.\n` +
      `رقم الطلب: ${input.orderNumber}\n` +
      `الدورة: ${input.title}\n` +
      `المبلغ: ${formatFils(input.totalFils)} د.ب`,
  );
}

/** صيغة عرض الرقم للقراءة: 973 3306 0460 */
export function displayPhone(phone: string | null): string | null {
  if (!phone) return null;
  const local = phone.startsWith("973") ? phone.slice(3) : phone;
  return `+973 ${local.slice(0, 4)} ${local.slice(4)}`;
}
