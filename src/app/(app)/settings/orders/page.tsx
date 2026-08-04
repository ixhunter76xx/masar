import type { Metadata } from "next";
import { Receipt } from "lucide-react";

import { AppPage } from "@/components/shell/AppPage";
import { AdminTabs } from "@/components/admin/AdminTabs";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  OrderReviewCard,
  type AdminOrderView,
} from "@/components/admin/OrderReviewCard";
import { requireAdmin } from "@/lib/data/admin";
import { listOrdersForAdmin } from "@/lib/data/orders";
import { adminFollowUpLink, displayPhone } from "@/lib/whatsapp";
import { formatFils } from "@/lib/price";
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
      priceLabel: formatFils(order.totalFils),
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
    <AppPage title="الإدارة" hidePageHeader>
      <AdminTabs />

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
                  ({pending.length})
                </span>
              )}
            </h2>

            {pending.length === 0 ? (
              <p className="rounded-[14px] border border-line bg-panel px-5 py-8 text-center text-[13px] text-subtle">
                لا شيء ينتظرك.
              </p>
            ) : (
              <ul className="space-y-2.5">
                {pending.map((order) => (
                  <OrderReviewCard key={order.id} order={order} />
                ))}
              </ul>
            )}
          </section>

          {settled.length > 0 && (
            <section>
              <h2 className="mb-3 text-[13px] font-semibold text-muted">
                السجل
              </h2>
              <ul className="space-y-2.5">
                {settled.map((order) => (
                  <OrderReviewCard key={order.id} order={order} />
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </AppPage>
  );
}
