import type { Metadata } from "next";
import { CircleUserRound } from "lucide-react";

import { AppPage } from "@/components/shell/AppPage";
import { EmptyState } from "@/components/ui/EmptyState";

export const metadata: Metadata = { title: "الملف الشخصي" };

export default function Page() {
  return (
    <AppPage title="الملف الشخصي" description="بياناتك في المنصة.">
      <EmptyState
        icon={CircleUserRound}
        title="قيد الإعداد"
        description="ستتمكن قريبًا من تعديل بياناتك وصورتك وكلمة المرور."
      />
    </AppPage>
  );
}
