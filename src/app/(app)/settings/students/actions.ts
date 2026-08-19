"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/server/db";
import { requireAdmin } from "@/lib/data/admin";
import { formatOrderNumber, markOrderPaid } from "@/lib/data/orders";
import { OrderStatus } from "@/generated/prisma/enums";

export type ActionResult = { ok: true } | { ok: false; message: string };

const ok: ActionResult = { ok: true };
const fail = (message: string): ActionResult => ({ ok: false, message });

/**
 * مزوّد المنح الإداري — يميّزه في دفتر المدفوعات عن الدفع الحقيقي.
 *
 * ثابتٌ محليّ لا مُصدَّر: ملفّات `"use server"` لا تُصدّر إلا دوالّ
 * غير متزامنة، وتصديره يكسر البناء.
 */
const ADMIN_GRANT_PROVIDER = "admin_grant";

/**
 * منح طالب وصولًا إلى باقة يدويًا — منحة أو تعويض.
 *
 * ── لماذا يمرّ بطلبٍ كامل بدل كتابة `Enrollment` مباشرة ─────────────
 * `markOrderPaid` هو **الكاتب الوحيد** لكل ما يمنح وصولًا مبنيًّا على
 * شراء. وقاعدة الكاتب الوحيد هي ما يجعل سؤال «كيف حصل هذا الحساب على
 * هذه الباقة؟» له جوابٌ واحد يُقرأ من مكان واحد. وإدخال صفّ في
 * `Enrollment` من شاشة جديدة يفتح مسارًا ثانيًا صامتًا — وهو بالضبط
 * صنف الخطأ الذي لا يُكتشف إلا بعد أسابيع عند مراجعة الطلبات.
 *
 * فالمنح هنا يبني **طلبًا حقيقيًّا** ثم يستدعي الدالة القائمة كما هي:
 * لم يُغيَّر في `orders.ts` حرفٌ واحد. والنتيجة سلسلة كاملة يمكن
 * تدقيقها — طلب، وبند بلقطة اسمه، ودفعة تحمل من منح ولماذا، وتسجيل.
 *
 * ── والمبلغ صفر عمدًا ───────────────────────────────────────────────
 * لم يدفع الطالب شيئًا، فتسجيل سعر الباقة يُفسد أي تقرير دخل لاحق.
 * الصفر يقول الحقيقة: وصولٌ مُنح، لا مالٌ قُبض. والسبب يُحفظ في
 * `reviewNote` فيبقى مقروءًا بجانب الطلب.
 *
 * ⚠ **ملاحظة على `Enrollment.source`:** يبقى `PURCHASE` لأن الدالة
 * القائمة تكتبه هكذا ولم أعدّلها. مصدرُ الحقيقة هو
 * `Payment.provider = "admin_grant"` مع `reviewedById` و`reviewNote`.
 * وقيمة `GrantSource.ADMIN_GRANT` تبقى غير مستعملة — تغييرها يتطلّب
 * المساس بالكاتب الوحيد، وهو قرار المالك لا قراري.
 */
export async function grantProductToStudent(input: {
  userId: string;
  productId: string;
  reason: string;
}): Promise<ActionResult> {
  const admin = await requireAdmin();

  const parsed = z
    .object({
      userId: z.string().trim().min(1, "اختر الطالب."),
      productId: z.string().trim().min(1, "اختر الباقة."),
      reason: z
        .string()
        .trim()
        .min(3, "اذكر سبب المنح — يبقى في سجلّ الطلب.")
        .max(300),
    })
    .safeParse(input);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "البيانات غير صالحة.");
  }

  const { userId, productId, reason } = parsed.data;

  const [student, product] = await Promise.all([
    db.user.findUnique({ where: { id: userId }, select: { id: true } }),
    db.product.findUnique({
      where: { id: productId },
      select: { id: true, title: true, currency: true, course: { select: { code: true } } },
    }),
  ]);
  if (!student) return fail("الطالب غير موجود.");
  if (!product) return fail("الباقة غير موجودة.");

  /* منحٌ لما يملكه أصلًا لا معنى له، ويُنشئ طلبًا صفريًّا زائدًا */
  const held = await db.enrollment.findFirst({
    where: { userId, productId, OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
    select: { id: true },
  });
  if (held) return fail("الطالب يملك هذه الباقة بالفعل.");

  const orderId = await db.$transaction(async (tx) => {
    const [row] = await tx.$queryRaw<{ nextval: bigint }[]>`
      SELECT nextval('order_number_seq')
    `;
    const number = formatOrderNumber(new Date().getFullYear(), Number(row.nextval));

    const order = await tx.order.create({
      data: {
        number,
        userId,
        status: OrderStatus.PENDING,
        totalFils: 0,
        currency: product.currency,
        items: {
          create: {
            productId: product.id,
            unitPriceFils: 0,
            titleSnapshot: `${product.course.code} — ${product.title}`,
          },
        },
      },
      select: { id: true },
    });

    return order.id;
  });

  const result = await markOrderPaid({
    orderId,
    provider: ADMIN_GRANT_PROVIDER,
    /* مرجعٌ فريد لكل منح — قيد UNIQUE(provider, providerPaymentId) */
    paymentRef: `grant:${orderId}`,
    reviewedById: admin.id,
    reviewNote: reason,
  });

  if (!result.ok) return fail(result.error);

  revalidatePath("/settings/students");
  revalidatePath(`/settings/students/${userId}`);
  return ok;
}

/**
 * سحب وصول — **بانتهاء صلاحية لا بحذف**.
 *
 * كل فحوص الوصول تمرّ بـ`notExpired()`، فضبط `expiresAt` يسري في كل
 * مكان دفعةً واحدة. والصفّ يبقى: من اشترى، ومتى، وتحت أي طلب — وهو
 * بالضبط ما يحتاجه نزاعٌ لاحق. الحذف يُتلف ذلك بلا مقابل.
 */
export async function revokeEnrollment(input: {
  enrollmentId: string;
  reason: string;
}): Promise<ActionResult> {
  await requireAdmin();

  const parsed = z
    .object({
      enrollmentId: z.string().trim().min(1),
      reason: z.string().trim().min(3, "اذكر سبب السحب.").max(300),
    })
    .safeParse(input);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "البيانات غير صالحة.");
  }

  const grant = await db.enrollment.findUnique({
    where: { id: parsed.data.enrollmentId },
    select: { id: true, userId: true, expiresAt: true },
  });
  if (!grant) return fail("التسجيل غير موجود.");
  if (grant.expiresAt && grant.expiresAt <= new Date()) {
    return fail("هذا التسجيل منتهٍ بالفعل.");
  }

  await db.enrollment.update({
    where: { id: grant.id },
    data: { expiresAt: new Date() },
  });

  revalidatePath("/settings/students");
  revalidatePath(`/settings/students/${grant.userId}`);
  return ok;
}
