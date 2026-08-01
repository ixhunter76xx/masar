import type { Metadata } from "next";
import { Mail } from "lucide-react";

import { AppPage } from "@/components/shell/AppPage";
import { EmptyState } from "@/components/ui/EmptyState";

export const metadata: Metadata = { title: "الرسائل" };

export default function Page() {
  return (
    <AppPage title="الرسائل" description="مراسلاتك مع المدربين والإدارة.">
      <EmptyState
        icon={Mail}
        title="لا توجد رسائل"
        description="ستصلك هنا رسائل المدربين وإشعارات الإدارة."
      />
    </AppPage>
  );
}
