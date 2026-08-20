import type { Metadata } from "next";
import { Receipt } from "lucide-react";

import { EmptyState } from "@/components/ui/EmptyState";
import {
  OrderReviewCard,
  type AdminOrderView,
} from "@/components/admin/OrderReviewCard";
import { StaggerList, StaggerItem } from "@/components/motion/Stagger";
import { requireAdmin } from "@/lib/data/admin";
import { listOrdersForAdmin } from "@/lib/data/orders";
import { adminFollowUpLink, displayPhone } from "@/lib/whatsapp";
import { formatFils } from "@/lib/price";
import { ar, arPrice } from "@/lib/numerals";
import { formatDate } from "@/lib/format";
import { OrderStatus } from "@/generated/prisma/enums";

export const metadata: Metadata = { title: "الطلبات" };

export default async function AdminOrdersPage() {
  await requireAdmin();
  const orders = await listOrdersForAdmin();

  /* التحويل إلى شكل العرض يحدث هنا على الخادم لا في المكوّن العميل:
     روابط واتساب وصيغ التاريخ والسعر منطقُ عرضٍ خالص، وإرساله جاهزًا
     يُبقي حزمة المتصفّح أصغر ويمنع اختلاف التنسيق بين الخادم والعميل. */
  const views: AdminOrderView[] = orders.map((order) => {
    const title = order.items[0]?.titleSnapshot ?? "—";
    const review = order.payments[0];

    return {
      id: order.id,
      number: order.number,
      status: order.status,
      title,
      priceLabel: arPrice(formatFils(order.totalFils)),
      createdLabel: formatDate(order.createdAt),
      student: {
        name: order.user.name,
        email: order.user.email,
        phoneLabel: displayPhone(order.user.phone),
      },
      waLink: adminFollowUpLink({
        phone: order.user.phone,
        studentName: order.user.name,
        orderNumber: order.number,
        title,
        totalFils: order.totalFils,
      }),
      review: review
        ? {
            by: review.reviewedBy?.name ?? null,
            at: review.reviewedAt ? formatDate(review.reviewedAt) : null,
            note: review.reviewNote,
          }
        : null,
    };
  });

  const pending = views.filter((v) => v.status === OrderStatus.PENDING);
  const settled = views.filter((v) => v.status !== OrderStatus.PENDING);

  return (
    <>
      {views.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="لا طلبات بعد"
          description="سيظهر هنا كل طلب شراء فور إنشائه."
        />
      ) : (
        <div className="space-y-8">
          <section>
            <h2 className="mb-3 text-[13px] font-semibold text-muted">
              بانتظار التأكيد
              {pending.length > 0 && (
                <span className="numeric ms-2 text-subtle">
                  ({ar(pending.length)})
                </span>
              )}
            </h2>

            {pending.length === 0 ? (
              <p className="rounded-card border border-line bg-panel px-5 py-8 text-center text-[13px] text-subtle">
                لا شيء ينتظرك.
              </p>
            ) : (
              /* الطابور كان الشاشة الوحيدة في المنصة بلا أي حركة —
                 وهي شاشة تُفتح يوميًا. الظهور التسلسلي يعطي العين
                 ترتيبًا تقرأ به الطلبات بدل أن تهبط دفعة واحدة. */
              <StaggerList as="ul" className="space-y-2.5">
                {pending.map((order) => (
                  <StaggerItem key={order.id}>
                    <OrderReviewCard order={order} />
                  </StaggerItem>
                ))}
              </StaggerList>
            )}
          </section>

          {settled.length > 0 && (
            <section>
              <h2 className="mb-3 text-[13px] font-semibold text-muted">
                السجل
              </h2>
              <StaggerList as="ul" className="space-y-2.5">
                {settled.map((order) => (
                  <StaggerItem key={order.id}>
                    <OrderReviewCard order={order} />
                  </StaggerItem>
                ))}
              </StaggerList>
            </section>
          )}
        </div>
      )}
    </>
  );
}
