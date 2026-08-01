import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Settings } from "lucide-react";

import { auth } from "@/auth";
import { AppPage } from "@/components/shell/AppPage";
import { EmptyState } from "@/components/ui/EmptyState";
import { Role } from "@/generated/prisma/enums";

export const metadata: Metadata = { title: "الإعدادات" };

export default async function SettingsPage() {
  const session = await auth();

  // الإدارة تدخل مباشرةً إلى أدوات الإدارة
  if (session!.user.role === Role.ADMIN) redirect("/settings/terms");

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
