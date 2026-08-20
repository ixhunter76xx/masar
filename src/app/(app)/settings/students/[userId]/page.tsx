import type { Metadata } from "next";
import { NavLink as Link } from "@/components/ui/NavLink";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";

import { AppPage } from "@/components/shell/AppPage";
import { AdminTabs } from "@/components/admin/AdminTabs";
import { GrantProductForm } from "@/components/admin/GrantProductForm";
import { RevokeEnrollmentButton } from "@/components/admin/RevokeEnrollmentButton";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";
import { Card } from "@/components/ui/Card";
import { Num } from "@/components/ui/Num";
import {
  getStudentForAdmin,
  listAllProductsForGrant,
  requireAdmin,
} from "@/lib/data/admin";
import { formatDate } from "@/lib/format";
import { formatFils } from "@/lib/price";
import { arPrice } from "@/lib/numerals";

export const metadata: Metadata = { title: "بيانات طالب" };

type Params = { params: Promise<{ userId: string }> };

export default async function StudentDetailPage({ params }: Params) {
  await requireAdmin();
  const { userId } = await params;

  const [student, products] = await Promise.all([
    getStudentForAdmin(userId),
    listAllProductsForGrant(),
  ]);
  if (!student) notFound();

  const now = new Date();
  const active = student.enrollments.filter(
    (e) => !e.expiresAt || e.expiresAt > now,
  );
  const ended = student.enrollments.filter(
    (e) => e.expiresAt && e.expiresAt <= now,
  );

  /* لا تعرض في قائمة المنح ما يملكه ساريًا — منحُ المملوك لا معنى له */
  const heldIds = new Set(active.map((e) => e.product.id));
  const grantable = products.filter((p) => !heldIds.has(p.id));

  return (
    <AppPage title="الإدارة" hidePageHeader>
      <AdminTabs />

      <Link
        href="/settings/students"
        className="press tap-44 mb-4 inline-flex items-center gap-1.5 text-[12px] text-muted hover:text-paper"
      >
        <ArrowRight size={14} strokeWidth={2} aria-hidden="true" />
        كل الطلاب
      </Link>

      <Card className="mb-6 px-5 py-4">
        <h2 className="text-title-sm">{student.name}</h2>
        <p className="mt-1 text-[12px] text-subtle">
          <span className="code">{student.email}</span>
          {student.phone && (
            <>
              {" · "}
              <span className="code">{student.phone}</span>
            </>
          )}
          {" · انضمّ "}
          {formatDate(student.createdAt)}
          {!student.isActive && (
            <span className="ms-2 rounded-full border border-line px-2 py-0.5 text-[10px]">
              حساب معطّل
            </span>
          )}
        </p>
      </Card>

      {/* ── الوصول السارِي ────────────────────────────────────────── */}
      <h3 className="mb-3 text-sm font-medium text-paper">
        الوصول السارِي <Num className="text-[11px] text-subtle">{active.length}</Num>
      </h3>

      {active.length === 0 ? (
        <Card className="mb-6 px-5 py-6 text-center text-[13px] text-subtle">
          لا يملك هذا الطالب أي باقة سارية.
        </Card>
      ) : (
        <ul className="mb-6 space-y-2">
          {active.map((e) => (
            <li key={e.id}>
              <Card className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                <div className="min-w-0">
                  <p className="text-[13px] text-paper">
                    <span className="code">{e.product.course.code}</span> —{" "}
                    {e.product.title}
                  </p>
                  <p className="mt-0.5 text-[11px] text-subtle">
                    مُنح {formatDate(e.grantedAt)}
                  </p>
                </div>
                <RevokeEnrollmentButton
                  enrollmentId={e.id}
                  label={`${e.product.course.code} — ${e.product.title}`}
                />
              </Card>
            </li>
          ))}
        </ul>
      )}

      {/* ── منح يدوي ─────────────────────────────────────────────── */}
      <h3 className="mb-3 text-sm font-medium text-paper">منح وصول يدويًا</h3>
      <Card className="mb-6 px-5 py-4">
        {grantable.length === 0 ? (
          <p className="text-[13px] text-subtle">
            يملك هذا الطالب كل الباقات المتاحة.
          </p>
        ) : (
          <GrantProductForm userId={student.id} products={grantable} />
        )}
      </Card>

      {/* ── وصولٌ منتهٍ ───────────────────────────────────────────── */}
      {ended.length > 0 && (
        <>
          <h3 className="mb-3 text-sm font-medium text-paper">
            وصولٌ منتهٍ <Num className="text-[11px] text-subtle">{ended.length}</Num>
          </h3>
          <ul className="mb-6 space-y-2">
            {ended.map((e) => (
              <li key={e.id}>
                <Card className="px-5 py-3 opacity-70">
                  <p className="text-[13px] text-muted">
                    <span className="code">{e.product.course.code}</span> —{" "}
                    {e.product.title}
                  </p>
                  <p className="mt-0.5 text-[11px] text-subtle">
                    انتهى {e.expiresAt ? formatDate(e.expiresAt) : "—"}
                  </p>
                </Card>
              </li>
            ))}
          </ul>
        </>
      )}

      {/* ── الطلبات ──────────────────────────────────────────────── */}
      <h3 className="mb-3 text-sm font-medium text-paper">
        الطلبات <Num className="text-[11px] text-subtle">{student.orders.length}</Num>
      </h3>

      {student.orders.length === 0 ? (
        <Card className="px-5 py-6 text-center text-[13px] text-subtle">
          لا طلبات لهذا الطالب.
        </Card>
      ) : (
        <ul className="space-y-2">
          {student.orders.map((o) => (
            <li key={o.id}>
              <Card className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2 text-[12px]">
                    <span className="code text-subtle">{o.number}</span>
                    <OrderStatusBadge status={o.status} />
                  </p>
                  <p className="mt-1 truncate text-[13px] text-paper">
                    {o.items[0]?.titleSnapshot ?? "—"}
                  </p>
                </div>
                <p className="shrink-0 text-[12px] text-subtle">
                  <span className="numeric text-paper">
                    {arPrice(formatFils(o.totalFils))}
                  </span>{" "}
                  د.ب · {formatDate(o.createdAt)}
                </p>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </AppPage>
  );
}
