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
      courseId: true,
      title: true,
      priceFils: true,
      currency: true,
      isPublished: true,
      items: { select: { lessonId: true } },
      course: { select: { isPublished: true, title: true, code: true } },
    },
  });

  if (!product || !product.isPublished || !product.course.isPublished) {
    return { ok: false, error: "هذه الدورة غير متاحة للطلب." };
  }

  /*
   * ما يملكه المشتري في هذا المقرر — بالدروس لا بالمنتجات.
   *
   * كان الفحص هنا تطابقًا تامًّا على `productId` وحده، فيمرّ مالكُ
   * «الدورة الكاملة» ليشتري «دورة المنتصف» — وهي مجموعة جزئية ممّا
   * يملك. الحزم متداخلة عمدًا، فالسؤال الصحيح عن الدروس لا عن أسماء
   * المنتجات: **هل بقي في هذه الحزمة درسٌ لا يملكه؟**
   */
  const held = await db.enrollment.findMany({
    where: {
      userId,
      product: { courseId: product.courseId },
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    select: {
      product: {
        select: { id: true, priceFils: true, items: { select: { lessonId: true } } },
      },
    },
  });

  const ownedLessons = new Set<string>();
  for (const grant of held) {
    for (const item of grant.product.items) {
      if (item.lessonId) ownedLessons.add(item.lessonId);
    }
  }

  const targetLessons = product.items
    .map((item) => item.lessonId)
    .filter((id): id is string => id !== null);

  const missing = targetLessons.filter((id) => !ownedLessons.has(id));
  if (targetLessons.length > 0 && missing.length === 0) {
    return { ok: false, error: "تملك كل دروس هذه الدورة بالفعل." };
  }

  /*
   * الترقية بفرق السعر.
   *
   * من يملك «المنتصف» ويطلب «الكاملة» دفع ثمن نصفها مرّة، فتحميله
   * السعر كاملًا يبيعه ما اشتراه. نخصم ثمن كل حزمة يملكها **تحتويها
   * الحزمة المطلوبة بالكامل** — أي حزمة تلغيها الترقية. حزمة متقاطعة
   * جزئيًا لا تُخصم، فخصمها يعطي محتوى بلا مقابل.
   */
  const targetSet = new Set(targetLessons);
  const credit = held
    .filter((grant) => {
      const lessons = grant.product.items
        .map((item) => item.lessonId)
        .filter((id): id is string => id !== null);
      return lessons.length > 0 && lessons.every((id) => targetSet.has(id));
    })
    .reduce((sum, grant) => sum + grant.product.priceFils, 0);

  const dueFils = Math.max(0, product.priceFils - credit);
  const isUpgrade = credit > 0;

  const label = `${product.course.code} — ${product.title}`;
  const titleSnapshot = isUpgrade ? `${label} (ترقية)` : label;

  /*
   * قفل استشاري على (المشتري، المنتج) داخل المعاملة.
   *
   * فحصُ «هل له طلب معلّق؟» ثم الإنشاء عمليتان، وبينهما نافذة تتسع
   * لنقرة ثانية فتُنشئ طلبين لنفس المنتج. القفل يسلسل الطلبات
   * المتزامنة لنفس الزوج ويُحرَّر بانتهاء المعاملة، فلا يحتاج جدولًا
   * ولا عمودًا جديدًا — والقيد الفريد غير ممكن هنا لأن الحالة على
   * `orders` والمنتج على `order_items`.
   */
  return db.$transaction(async (tx) => {
    await tx.$executeRaw`
      SELECT pg_advisory_xact_lock(hashtext(${`order:${userId}:${productId}`}))
    `;

    const pending = await tx.order.findFirst({
      where: {
        userId,
        status: OrderStatus.PENDING,
        items: { some: { productId } },
      },
      select: { number: true },
    });
    if (pending) return { ok: true as const, number: pending.number, reused: true };

    /* رقم الطلب من تسلسل قاعدة البيانات لا من عدّ الصفوف: العدّ يتسابق
       تحت طلبين متزامنين فيولّد الرقم نفسه مرتين. */
    const [row] = await tx.$queryRaw<{ nextval: bigint }[]>`
      SELECT nextval('order_number_seq')
    `;
    const number = formatOrderNumber(
      new Date().getFullYear(),
      Number(row.nextval),
    );

    await tx.order.create({
      data: {
        number,
        userId,
        status: OrderStatus.PENDING,
        totalFils: dueFils,
        currency: product.currency,
        items: {
          create: {
            productId: product.id,
            /* لقطة السعر والعنوان: الطلب اليدوي يعيش أيامًا، وتغيير
               السعر أثناءها يجب ألّا يغيّر ما اتُّفق عليه. وفي الترقية
               تُلقَّط القيمة **بعد** الخصم، فيبقى مجموع البنود مساويًا
               لإجمالي الطلب ولا يحتاج المخطط عمود خصم. */
            unitPriceFils: dueFils,
            titleSnapshot,
          },
        },
      },
    });

    return { ok: true as const, number, reused: false };
  });
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
  } catch (error) {
    /*
     * كان هذا `catch` فارغًا يبتلع الخطأ ويعيد رسالة واحدة.
     *
     * على مسار المال وبلا بوابة، فشلُ تأكيدٍ بلا أثر يعني أن سجلّك
     * الوحيد محادثة واتساب. نسجّل الخطأ كاملًا قبل أي شيء — هذا ما
     * يلتقطه لاحقًا أي مرصد أخطاء دون تعديل هنا.
     */
    console.error("[markOrderPaid] فشل تأكيد الدفع", {
      orderId,
      provider,
      paymentRef,
      reviewedById,
      error,
    });

    /*
     * التكرار ليس فشلًا. قيد UNIQUE(provider, providerPaymentId) يعني
     * أن نداءً متزامنًا سجّل الدفعة نفسها، والنتيجة النهائية صحيحة.
     * كانت الدالة تعيد `ok: false` فيقرأ المراجع نجاحًا كأنه فشل
     * فيضغط «تأكيد» ثانية. نتحقق من الحالة الفعلية ونصدُق عنها.
     */
    const settled = await db.order
      .findUnique({ where: { id: orderId }, select: { status: true } })
      .catch(() => null);

    if (settled?.status === OrderStatus.PAID) {
      return { ok: true as const, alreadyPaid: true, grantedProductIds: [] };
    }

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

/* -------------------------------------------------------------------------- */
/*  الاسترجاع                                                                  */
/* -------------------------------------------------------------------------- */

export type RefundResult =
  | { ok: true; revokedProductIds: string[] }
  | { ok: false; error: string };

/**
 * استرجاع طلب مدفوع: يُعيد الحالة ويسحب الوصول الذي منحه.
 *
 * ── لماذا الاثنان معًا لا الحالة وحدها ──────────────────────────────
 * `REFUNDED` كانت في المخطط بلا أي مسار كود يبلغها. ولو بلغتها الحالة
 * وحدها لبقي الطالب يدرس ما استُرجع ثمنه — وهو ليس نصف علاج بل خطأ
 * محاسبي: المال عاد والمحتوى لم يعد.
 *
 * ── لماذا انتهاء لا حذف ─────────────────────────────────────────────
 * `Enrollment` يحمل `expiresAt`، وكل فحص وصول في المنصة يمرّ على
 * `notExpired()` أصلًا. فضبطه الآن يسحب الوصول فورًا **ويُبقي السجل**:
 * من اشترى ومتى وبأي طلب. الحذف يمحو ذلك، وهو أول ما تحتاجه في نزاع.
 *
 * ── لماذا الاسترجاع صفّ `Payment` ───────────────────────────────────
 * دفتر المال واحد. الصفّ يحمل `reviewedById` و`reviewedAt` و`reviewNote`
 * الموجودة سلفًا، فيُعرف من استرجع ومتى وبأي مرجع بلا عمود جديد. وقيد
 * `UNIQUE(provider, providerPaymentId)` يمنع تسجيل الاسترجاع نفسه مرتين.
 *
 * الاسترجاع الفعلي للمال يجري خارج المنصة كما يجري التحصيل — هذه
 * الدالة تسجّله وتُنفّذ أثره، ولا تحوّل مالًا.
 */
export async function refundOrder(input: {
  orderId: string;
  refundRef: string;
  reviewedById: string;
  reviewNote?: string | null;
}): Promise<RefundResult> {
  const { orderId, refundRef, reviewedById, reviewNote = null } = input;

  try {
    return await db.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        select: { id: true, status: true, totalFils: true },
      });

      if (!order) return { ok: false as const, error: "الطلب غير موجود." };

      if (order.status === OrderStatus.REFUNDED) {
        return { ok: true as const, revokedProductIds: [] };
      }

      if (order.status !== OrderStatus.PAID) {
        return {
          ok: false as const,
          error: "لا يُسترجَع إلا طلب مدفوع.",
        };
      }

      const now = new Date();

      await tx.order.update({
        where: { id: order.id },
        data: { status: OrderStatus.REFUNDED },
      });

      await tx.payment.create({
        data: {
          orderId: order.id,
          provider: MANUAL_PROVIDER,
          providerPaymentId: refundRef,
          status: "refunded",
          amountFils: order.totalFils,
          reviewedById,
          reviewedAt: now,
          reviewNote,
        },
      });

      /* الوصول الذي منحه هذا الطلب وحده — لا ما مُنح بطلب آخر أو يدويًا */
      const granted = await tx.enrollment.findMany({
        where: { orderId: order.id },
        select: { id: true, productId: true },
      });

      await tx.enrollment.updateMany({
        where: { orderId: order.id },
        data: { expiresAt: now },
      });

      return {
        ok: true as const,
        revokedProductIds: granted.map((grant) => grant.productId),
      };
    });
  } catch (error) {
    console.error("[refundOrder] فشل الاسترجاع", {
      orderId,
      refundRef,
      reviewedById,
      error,
    });
    return {
      ok: false as const,
      error: "تعذّر تسجيل الاسترجاع. حدّث الصفحة وتحقّق من حالة الطلب.",
    };
  }
}
