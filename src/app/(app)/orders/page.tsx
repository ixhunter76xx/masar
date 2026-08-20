import type { Metadata } from "next";
import { NavLink as Link } from "@/components/ui/NavLink";
import { Receipt, ArrowLeft } from "lucide-react";

import { auth } from "@/auth";
import { AppPage } from "@/components/shell/AppPage";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";
import { StaggerList, StaggerItem } from "@/components/motion/Stagger";
import { listMyOrders } from "@/lib/data/orders";
import { formatFils } from "@/lib/price";
import { arPrice } from "@/lib/numerals";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "طلباتي" };

export default async function OrdersPage() {
  const session = await auth();
  const orders = await listMyOrders(session!.user.id);

  return (
    <AppPage title="طلباتي" description="كل ما طلبته وحالته.">
      {orders.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="لا طلبات بعد"
          description="اختر دورة من الكتالوج وستظهر هنا."
          action={{ href: "/courses", label: "تصفّح المقررات" }}
        />
      ) : (
        <StaggerList as="ul" className="space-y-2.5">
          {orders.map((order) => (
            <StaggerItem key={order.id}>
              <Card className="lift hover:border-accent-deep">
                <Link
                  href={`/orders/${order.number}`}
                  className="flex items-center gap-4 px-5 py-4"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="numeric text-[11px] text-subtle">
                        {order.number}
                      </span>
                      <OrderStatusBadge status={order.status} />
                    </div>

                    <p className="mt-1.5 truncate text-sm font-medium text-paper">
                      {order.items[0]?.titleSnapshot ?? "—"}
                    </p>

                    <p className="mt-0.5 text-[11px] text-subtle">
                      {formatDate(order.createdAt)}
                    </p>
                  </div>

                  <span className="shrink-0 text-sm font-medium text-paper">
                    <span className="numeric">{arPrice(formatFils(order.totalFils))}</span>{" "}
                    <span className="text-[11px] text-subtle">د.ب</span>
                  </span>

                  <ArrowLeft
                    size={15}
                    strokeWidth={1.75}
                    aria-hidden="true"
                    className="shrink-0 text-subtle"
                  />
                </Link>
              </Card>
            </StaggerItem>
          ))}
        </StaggerList>
      )}
    </AppPage>
  );
}
