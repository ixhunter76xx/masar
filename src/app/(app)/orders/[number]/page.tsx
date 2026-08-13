import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MessageCircle, ShieldCheck } from "lucide-react";

import { auth } from "@/auth";
import { AppPage } from "@/components/shell/AppPage";
import { Card } from "@/components/ui/Card";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";
import { CancelOrderButton } from "@/components/orders/CancelOrderButton";
import { getMyOrder } from "@/lib/data/orders";
import { studentPaymentLink } from "@/lib/whatsapp";
import { formatFils } from "@/lib/price";
import { formatDate } from "@/lib/format";
import { OrderStatus } from "@/generated/prisma/enums";

type Params = { params: Promise<{ number: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { number } = await params;
  return { title: `الطلب ${number}` };
}

export default async function OrderPage({ params }: Params) {
  const { number } = await params;
  const session = await auth();

  /* الاستعلام مقيّد بصاحب الطلب داخل `getMyOrder`. رقم الطلب متسلسل
     ويمكن تخمينه، فالتحقق من الملكية شرطُ استعلام لا فحصٌ بعده. */
  const order = await getMyOrder(number, session!.user.id);
  if (!order) notFound();

  const item = order.items[0];
  const isPending = order.status === OrderStatus.PENDING;
  const isPaid = order.status === OrderStatus.PAID;

  const waLink = studentPaymentLink({
    orderNumber: order.number,
    title: item?.titleSnapshot ?? "",
    totalFils: order.totalFils,
  });

  return (
    <AppPage title={`الطلب ${order.number}`} hidePageHeader>
      <Link
        href="/orders"
        className="mb-5 inline-flex min-h-touch items-center gap-1.5 text-[13px] text-subtle
          transition-colors hover:text-paper"
      >
        كل الطلبات
        <ArrowLeft size={14} strokeWidth={1.75} aria-hidden="true" />
      </Link>

      <Card className="px-6 py-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="numeric text-[11px] text-subtle">{order.number}</p>
            <h1 className="mt-1 text-lg font-semibold text-paper">
              {item?.titleSnapshot ?? "—"}
            </h1>
            <p className="mt-1 text-[11px] text-subtle">
              {formatDate(order.createdAt)}
            </p>
          </div>
          <OrderStatusBadge status={order.status} />
        </div>

        <div className="mt-5 flex items-baseline gap-2 border-t border-line pt-5">
          <span className="text-[13px] text-muted">المبلغ</span>
          <span className="ms-auto text-2xl font-semibold text-paper">
            <span className="numeric">{formatFils(order.totalFils)}</span>
          </span>
          <span className="text-xs text-subtle">د.ب</span>
        </div>
      </Card>

      {/* ── بانتظار الدفع: الخطوة التالية واضحة وواحدة ───────────────── */}
      {isPending && (
        <Card className="mt-4 px-6 py-6">
          <h2 className="text-sm font-semibold text-paper">لإتمام الدفع</h2>
          <p className="mt-2 text-[13px] leading-relaxed text-muted">
            راسلنا على واتساب وسنرسل لك تفاصيل التحويل. رقم طلبك مكتوب في
            الرسالة، فلا حاجة لكتابة شيء.
          </p>

          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="press mt-4 flex min-h-touch w-full items-center justify-center gap-2
              rounded-[10px] text-sm font-medium text-ink
              shadow-[inset_0_1px_0_rgba(255,255,255,0.075),0_1px_2px_rgba(0,0,0,0.35)]
              [background:linear-gradient(180deg,var(--color-accent-bright),var(--color-action))]
              hover:[background:linear-gradient(180deg,var(--color-accent-lift),var(--color-accent-bright))]"
          >
            <MessageCircle size={16} strokeWidth={1.75} aria-hidden="true" />
            متابعة الدفع على واتساب
          </a>

          <p className="mt-3.5 flex gap-2.5 text-xs leading-[1.85] text-subtle">
            <ShieldCheck
              size={15}
              strokeWidth={1.75}
              aria-hidden="true"
              className="mt-0.5 shrink-0 text-accent-deep"
            />
            بعد تأكيد تحويلك يُفتح وصولك للدورة تلقائيًا وتجدها في «مقرراتي».
            الطلب يبقى محفوظًا بسعره حتى تُتمّه.
          </p>

          <div className="mt-5 border-t border-line pt-4">
            <CancelOrderButton number={order.number} />
          </div>
        </Card>
      )}

      {/* ── مدفوع: الوجهة التالية هي المحتوى نفسه ────────────────────── */}
      {isPaid && item?.product.course && (
        <Card className="mt-4 px-6 py-6">
          <h2 className="text-sm font-semibold text-paper">وصولك مفتوح</h2>
          <p className="mt-2 text-[13px] leading-relaxed text-muted">
            أُكِّد الدفع
            {order.paidAt ? ` في ${formatDate(order.paidAt)}` : ""}. الدورة
            متاحة لك الآن بلا انتهاء صلاحية.
          </p>

          <Link
            href="/learn"
            className="press mt-4 flex min-h-touch w-full items-center justify-center gap-2
              rounded-[10px] border border-line bg-panel text-sm font-medium text-paper
              transition-colors hover:border-accent-deep hover:bg-panel-lift"
          >
            ابدأ الدراسة
            <ArrowLeft size={15} strokeWidth={2} aria-hidden="true" />
          </Link>
        </Card>
      )}
    </AppPage>
  );
}
