"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, MessageCircle, Loader2 } from "lucide-react";

import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";
import {
  confirmManualPayment,
  cancelOrderAsAdmin,
} from "@/app/(app)/settings/orders/actions";
import { OrderStatus } from "@/generated/prisma/enums";

export type AdminOrderView = {
  id: string;
  number: string;
  status: OrderStatus;
  title: string;
  priceLabel: string;
  createdLabel: string;
  student: { name: string; email: string; phoneLabel: string | null };
  waLink: string | null;
  review: { by: string | null; at: string | null; note: string | null } | null;
};

/**
 * بطاقة طلب في شاشة الإدارة.
 *
 * ── ترتيب العناصر يتبع ترتيب العمل لا ترتيب البيانات ────────────────
 * تفتح المحادثة، تتأكد من التحويل، ثم تؤكّد. فالزرّ الأول واتساب،
 * وحقل المرجع بجانب زرّ التأكيد لأنه يُكتب منه مباشرةً — نسخًا من
 * إشعار البنك في الشاشة نفسها.
 */
export function OrderReviewCard({ order }: { order: AdminOrderView }) {
  const [note, setNote] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();
  const router = useRouter();

  const isPending = order.status === OrderStatus.PENDING;

  function run(fn: () => Promise<{ ok: boolean; error?: string }>) {
    setError(null);
    startTransition(async () => {
      const result = await fn();
      if (result.ok) router.refresh();
      else setError(result.error ?? "تعذّر إتمام العملية.");
    });
  }

  return (
    <li className="rounded-[14px] border border-line bg-panel px-5 py-4">
      <div className="flex flex-wrap items-start justify-between gap-2.5">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="numeric text-[11px] text-subtle">
              {order.number}
            </span>
            <OrderStatusBadge status={order.status} />
          </div>
          <p className="mt-1.5 text-sm font-medium text-paper">{order.title}</p>
          <p className="mt-0.5 text-[11px] text-subtle">
            {order.student.name} · {order.student.email}
            {order.student.phoneLabel && (
              <>
                {" · "}
                <span className="numeric">{order.student.phoneLabel}</span>
              </>
            )}
          </p>
          <p className="mt-0.5 text-[11px] text-subtle">{order.createdLabel}</p>
        </div>

        <span className="shrink-0 text-sm font-medium text-paper">
          <span className="numeric">{order.priceLabel}</span>{" "}
          <span className="text-[11px] text-subtle">د.ب</span>
        </span>
      </div>

      {order.review && (
        <p className="mt-3 rounded-[10px] border border-line/70 bg-ink px-3.5 py-2.5 text-[11px] leading-relaxed text-subtle">
          أكّده {order.review.by ?? "—"}
          {order.review.at ? ` · ${order.review.at}` : ""}
          {order.review.note ? ` · ${order.review.note}` : ""}
        </p>
      )}

      {isPending && (
        <div className="mt-4 space-y-2.5 border-t border-line pt-4">
          <div className="flex flex-wrap gap-2">
            {order.waLink ? (
              <a
                href={order.waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="press inline-flex min-h-touch items-center gap-2 rounded-[10px]
                  border border-line bg-ink px-3.5 text-xs text-paper
                  transition-colors hover:border-accent-deep"
              >
                <MessageCircle size={14} strokeWidth={1.75} aria-hidden="true" />
                فتح المحادثة
              </a>
            ) : (
              <span className="inline-flex min-h-touch items-center text-[11px] text-subtle">
                لا رقم واتساب لهذا الحساب
              </span>
            )}

            <button
              type="button"
              onClick={() => run(() => cancelOrderAsAdmin(order.id))}
              disabled={pending}
              className="press ms-auto inline-flex min-h-touch items-center rounded-[10px]
                px-3 text-xs text-subtle transition-colors hover:text-danger
                disabled:cursor-not-allowed"
            >
              إلغاء الطلب
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            <label htmlFor={`note-${order.id}`} className="sr-only">
              مرجع التحويل لطلب {order.number}
            </label>
            <input
              id={`note-${order.id}`}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              disabled={pending}
              placeholder="مرجع التحويل (اختياري)"
              className="field-motion min-h-touch flex-1 rounded-[10px] border border-line
                bg-ink px-3.5 text-xs text-paper placeholder:text-disabled
                hover:border-accent-deep focus:border-accent focus:outline-none"
            />

            <button
              type="button"
              onClick={() => run(() => confirmManualPayment(order.id, note))}
              disabled={pending}
              className="press inline-flex min-h-touch items-center gap-2 rounded-[10px]
                px-4 text-xs font-medium text-ink
                shadow-[inset_0_1px_0_rgba(255,255,255,0.075),0_1px_2px_rgba(0,0,0,0.35)]
                [background:linear-gradient(180deg,var(--color-accent-bright),var(--color-action))]
                hover:[background:linear-gradient(180deg,#bcd4e3,var(--color-accent-bright))]
                disabled:cursor-not-allowed disabled:opacity-70"
            >
              {pending ? (
                <Loader2 size={14} className="animate-spin" aria-hidden="true" />
              ) : (
                <Check size={14} strokeWidth={2.25} aria-hidden="true" />
              )}
              تأكيد الدفع
            </button>
          </div>
        </div>
      )}

      {error && (
        <p role="alert" className="mt-2 text-[11px] text-danger">
          {error}
        </p>
      )}
    </li>
  );
}
