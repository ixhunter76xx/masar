import type { Metadata } from "next";
import { Settings } from "lucide-react";

import { AppPage } from "@/components/shell/AppPage";
import { EmptyState } from "@/components/ui/EmptyState";

export const metadata: Metadata = { title: "الإعدادات" };

export default function Page() {
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
