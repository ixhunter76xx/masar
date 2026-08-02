import type { Metadata } from "next";
import { TriangleAlert } from "lucide-react";

import { auth } from "@/auth";
import { db } from "@/server/db";
import { AppPage } from "@/components/shell/AppPage";
import { Card } from "@/components/ui/Card";
import { ChangePasswordForm } from "@/components/auth/ChangePasswordForm";
import { ROLE_LABELS } from "@/lib/roles";
import { relativeTime } from "@/lib/format";
import { Role } from "@/generated/prisma/enums";

export const metadata: Metadata = { title: "الملف الشخصي" };

export default async function ProfilePage() {
  const session = await auth();
  const { id, role } = session!.user;

  const user = await db.user.findUnique({
    where: { id },
    select: {
      name: true,
      username: true,
      email: true,
      role: true,
      createdAt: true,
      lastLoginAt: true,
      mustChangePassword: true,
      _count: { select: { enrollments: true, coursesTaught: true } },
    },
  });

  if (!user) return null;

  const forced = user.mustChangePassword;

  return (
    <AppPage
      title="الملف الشخصي"
      description="بياناتك في المنصة وكلمة المرور."
    >
      {forced && (
        <Card className="mb-6 border-warning/40 bg-warning/5 px-5 py-4">
          <p className="flex items-center gap-2 text-sm font-medium text-warning">
            <TriangleAlert size={16} strokeWidth={1.75} aria-hidden="true" />
            غيّر كلمة المرور المبدئية
          </p>
          <p className="mt-2 text-[13px] leading-relaxed text-muted">
            حسابك أُنشئ بكلمة مرور مؤقتة يعرفها من أنشأه. لن تتمكن من استخدام
            بقية المنصة قبل تغييرها.
          </p>
        </Card>
      )}

      <Card className="mb-6 px-5 py-5">
        <h3 className="mb-4 text-sm font-medium text-paper">بيانات الحساب</h3>

        <dl className="grid gap-4 text-[13px] sm:grid-cols-2">
          <Row label="الاسم" value={user.name} />
          <Row label="اسم المستخدم" value={user.username} numeric />
          <Row label="البريد الإلكتروني" value={user.email ?? "غير مسجَّل"} />
          <Row label="الدور" value={ROLE_LABELS[user.role]} />
          <Row
            label={role === Role.INSTRUCTOR ? "مقررات أُدرّسها" : "مقررات مسجَّلة"}
            value={String(
              role === Role.INSTRUCTOR
                ? user._count.coursesTaught
                : user._count.enrollments,
            )}
            numeric
          />
          <Row
            label="آخر دخول"
            value={user.lastLoginAt ? relativeTime(user.lastLoginAt) : "—"}
          />
        </dl>

        <p className="mt-5 border-t border-line pt-4 text-[11px] leading-relaxed text-disabled">
          لتعديل الاسم أو البريد، تواصل مع إدارة المركز.
        </p>
      </Card>

      <ChangePasswordForm forced={forced} />
    </AppPage>
  );
}

function Row({
  label,
  value,
  numeric = false,
}: {
  label: string;
  value: string;
  numeric?: boolean;
}) {
  return (
    <div>
      <dt className="text-[11px] text-disabled">{label}</dt>
      <dd className={`mt-1 text-paper ${numeric ? "numeric" : ""}`}>{value}</dd>
    </div>
  );
}
