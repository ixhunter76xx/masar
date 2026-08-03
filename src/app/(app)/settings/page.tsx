import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Settings } from "lucide-react";

import { auth } from "@/auth";
import { AppPage } from "@/components/shell/AppPage";
import { EmptyState } from "@/components/ui/EmptyState";
import { Role } from "@/generated/prisma/enums";
import { FIRST_ADMIN_TAB } from "@/lib/admin-tabs";

export const metadata: Metadata = { title: "الإعدادات" };

export default async function SettingsPage() {
  const session = await auth();

  // الإدارة تدخل مباشرةً إلى أول قسم إداري — مشتقًّا من ADMIN_TABS
  if (session!.user.role === Role.ADMIN) redirect(FIRST_ADMIN_TAB);

  return (
    <AppPage title="الإعدادات" description="تفضيلاتك في المنصة.">
      <EmptyState
        icon={Settings}
        title="قيد الإعداد"
        description="ستتمكن قريبًا من ضبط الإشعارات وتفضيلات العرض."
      />
    </AppPage>
  );
}
