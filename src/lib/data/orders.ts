import "server-only";

import { db } from "@/server/db";
import { GrantSource, OrderStatus } from "@/generated/prisma/enums";

/**
 * ═══ الطلبات ومنح الوصول ═════════════════════════════════════════════
 *
 * ── لماذا لا يوجد "نظام موافقة يدوية" منفصل ─────────────────────────
 * القناة اليدوية ليست نوعًا آخر من الطلبات، بل **مزوّد دفع آخر**. دورة
 * حياة الطلب واحدة في الحالتين، وما يختلف هو من يؤكّد الدفع: إنسانٌ
 * اليوم، و`webhook` من البوابة غدًا. الطرفان ينتهيان هنا:
 *
 *     markOrderPaid()  ← الكاتب الوحيد لأي Enrollment مصدره شراء
 *
 * لو كُتب منطق المنح مرتين — مرة للموافقة اليدوية ومرة للبوابة —
 * لكانت النسخة الثانية موضع الخطأ، لأنها ستُكتب بعد أشهر على عجل.
 * التبديل إلى بوابة حقيقية = ملف مسار `webhook` واحد يستدعي هذه
 * الدالة، بلا لمس المخطط ولا بقية الشفرة.
 * ═════════════════════════════════════════════════════════════════════
 */

/** مزوّد القناة اليدوية — تحويل خارج المنصة يؤكّده إنسان */
export const MANUAL_PROVIDER = "manual_benefit";

/** رقم الطلب: MSR-2026-0001 — مقروء للطالب وللدعم في المحادثة */
export function formatOrderNumber(year: number, sequence: number): string {
  return `MSR-${year}-${String(sequence).padStart(4, "0")}`;
}

/* -------------------------------------------------------------------------- */
/*  إنشاء الطلب                                                                */
/* -------------------------------------------------------------------------- */

export type RequestResult =
  | { ok: true; number: string; reused: boolean }
  | { ok: false; error: string };

/**
 * ينشئ طلب شراء معلّقًا لمنتج واحد.
 *
 * ── لماذا يعيد طلبًا قائمًا بدل إنشاء آخر ───────────────────────────
 * الطالب يضغط الزر، تبطئ الشبكة، فيضغط ثانية. طلبان معلّقان لنفس
 * المنتج يربكانك عند المراجعة ويربكانه في صفحة طلباته. فإن وُجد طلب
 * معلّق للمنتج نفسه نعيده كما هو — بسعره الأول.
 */
export async function requestProductOrder(input: {
  userId: string;
  productId: string;
}): Promise<RequestResult> {
  const { userId, productId } = input;

  const product = await db.product.findUnique({
    where: { id: productId },
    select: {
      id: true,
      title: true,
      priceFils: true,
      currency: true,
      isPublished: true,
      course: { select: { isPublished: true, title: true, code: true } },
    },
  });

  if (!product || !product.isPublished || !product.course.isPublished) {
    return { ok: false, error: "هذه الدورة غير متاحة للطلب." };
  }

  const owned = await db.enrollment.findUnique({
    where: { userId_productId: { userId, productId } },
    select: { id: true },
  });
  if (owned) {
    return { ok: false, error: "تملك هذه الدورة بالفعل." };
  }

  const pending = await db.order.findFirst({
    where: {
      userId,
      status: OrderStatus.PENDING,
      items: { some: { productId } },
    },
    select: { number: true },
  });
  if (pending) return { ok: true, number: pending.number, reused: true };

  /* رقم الطلب من تسلسل قاعدة البيانات لا من عدّ الصفوف: العدّ يتسابق
     تحت طلبين متزامنين فيولّد الرقم نفسه مرتين. */
  const [row] = await db.$queryRaw<{ nextval: bigint }[]>`
    SELECT nextval('order_number_seq')
  `;
  const number = formatOrderNumber(new Date().getFullYear(), Number(row.nextval));

  await db.order.create({
    data: {
      number,
      userId,
      status: OrderStatus.PENDING,
      totalFils: product.priceFils,
      currency: product.currency,
      items: {
        create: {
          productId: product.id,
          /* لقطة السعر والعنوان: الطلب اليدوي يعيش أيامًا، وتغيير
             السعر أثناءها يجب ألّا يغيّر ما اتُّفق عليه. */
          unitPriceFils: product.priceFils,
          titleSnapshot: `${product.course.code} — ${product.title}`,
        },
      },
    },
  });

  return { ok: true, number, reused: false };
}

/* -------------------------------------------------------------------------- */
/*  القراءة                                                                    */
/* -------------------------------------------------------------------------- */

const ORDER_VIEW = {
  id: true,
  number: true,
  status: true,
  totalFils: true,
  paidAt: true,
  createdAt: true,
  items: {
    select: {
      id: true,
      unitPriceFils: true,
      titleSnapshot: true,
      product: {
        select: { slug: true, course: { select: { slug: true, title: true } } },
      },
    },
  },
} as const;

/** طلب واحد يملكه هذا المستخدم — يعود null لطلب غيره */
export async function getMyOrder(number: string, userId: string) {
  return db.order.findFirst({ where: { number, userId }, select: ORDER_VIEW });
}

export async function listMyOrders(userId: string) {
  return db.order.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: ORDER_VIEW,
  });
}

/** قائمة الإدارة — تحمل بيانات التواصل لأن الدفع يتم في واتساب */
export async function listOrdersForAdmin() {
  return db.order.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    select: {
      ...ORDER_VIEW,
      user: { select: { id: true, name: true, email: true, phone: true } },
      payments: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          provider: true,
          reviewNote: true,
          reviewedAt: true,
          reviewedBy: { select: { name: true } },
        },
      },
    },
  });
}

/** عدد الطلبات المنتظرة — عدّاد اللوحة */
export async function countPendingOrders() {
  return db.order.count({ where: { status: OrderStatus.PENDING } });
}

export type MarkPaidResult =
  | { ok: true; alreadyPaid: boolean; grantedProductIds: string[] }
  | { ok: false; error: string };

/**
 * ينقل الطلب إلى `PAID` ويمنح الوصول لكل بند فيه — داخل معاملة واحدة.
 *
 * ── ثلاث حمايات مقصودة ──────────────────────────────────────────────
 * ١. الحالة تُقرأ **داخل** المعاملة ويُشترط أن تكون `PENDING`. نقرتان
 *    سريعتان على «تأكيد الدفع» أو إعادة إرسال `webhook` لا تمنحان
 *    وصولين ولا تكتبان دفعتين.
 * ٢. `Enrollment` يُكتب بـ`upsert` على `@@unique([userId, productId])`
 *    فحتى لو سبق أن مُنح المنتج (هدية إدارية مثلًا) لا يتضاعف.
 * ٣. السعر يُقرأ من `OrderItem.unitPriceFils` لا من `Product` الحالي:
 *    الطلب اليدوي يعيش أيامًا، وقد يتغيّر السعر أثناءها.
 *
 * @param paymentRef معرّف العملية عند المزوّد. في القناة اليدوية رقم
 *   الطلب نفسه — فيصير قيد `UNIQUE(provider, providerPaymentId)`
 *   حارسًا ضد تسجيل التحويل مرتين.
 */
export async function markOrderPaid(input: {
  orderId: string;
  provider: string;
  paymentRef: string;
  /** من أكّد الدفع — فارغ في الدفع الآلي */
  reviewedById?: string | null;
  reviewNote?: string | null;
  /** الحمولة الخام من البوابة — مرجع النزاعات */
  rawPayload?: unknown;
}): Promise<MarkPaidResult> {
  const {
    orderId,
    provider,
    paymentRef,
    reviewedById = null,
    reviewNote = null,
    rawPayload,
  } = input;

  try {
    return await db.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        select: {
          id: true,
          userId: true,
          status: true,
          totalFils: true,
          items: { select: { productId: true } },
        },
      });

      if (!order) return { ok: false as const, error: "الطلب غير موجود." };

      /* مدفوع سلفًا ليس خطأً — بل الحالة المتوقّعة عند التكرار.
         نعود بنجاح ولا نكتب شيئًا، فيبقى الإجراء آمن الإعادة. */
      if (order.status === OrderStatus.PAID) {
        return {
          ok: true as const,
          alreadyPaid: true,
          grantedProductIds: [],
        };
      }

      if (order.status !== OrderStatus.PENDING) {
        return {
          ok: false as const,
          error: "لا يمكن تأكيد دفع طلب ملغى أو مسترجَع.",
        };
      }

      const paidAt = new Date();

      await tx.order.update({
        where: { id: order.id },
        data: { status: OrderStatus.PAID, paidAt },
      });

      await tx.payment.create({
        data: {
          orderId: order.id,
          provider,
          providerPaymentId: paymentRef,
          status: "captured",
          amountFils: order.totalFils,
          reviewedById,
          reviewedAt: reviewedById ? paidAt : null,
          reviewNote,
          ...(rawPayload === undefined
            ? {}
            : { rawPayload: rawPayload as never }),
        },
      });

      for (const item of order.items) {
        await tx.enrollment.upsert({
          where: {
            userId_productId: { userId: order.userId, productId: item.productId },
          },
          create: {
            userId: order.userId,
            productId: item.productId,
            source: GrantSource.PURCHASE,
            orderId: order.id,
          },
          /* منح سابق يبقى كما هو — لا نطمس مصدره ولا تاريخه */
          update: {},
        });
      }

      return {
        ok: true as const,
        alreadyPaid: false,
        grantedProductIds: order.items.map((item) => item.productId),
      };
    });
  } catch {
    /* أشهر سبب: قيد UNIQUE(provider, providerPaymentId) — أي أن هذه
       الدفعة سُجّلت في نداء متزامن آخر. النتيجة النهائية صحيحة. */
    return {
      ok: false as const,
      error: "تعذّر تأكيد الدفع. حدّث الصفحة وتحقّق من حالة الطلب.",
    };
  }
}

/** إلغاء طلب معلّق — لا يمسّ المدفوع */
export async function cancelPendingOrder(orderId: string) {
  const { count } = await db.order.updateMany({
    where: { id: orderId, status: OrderStatus.PENDING },
    data: { status: OrderStatus.CANCELLED },
  });
  return count === 1;
}
