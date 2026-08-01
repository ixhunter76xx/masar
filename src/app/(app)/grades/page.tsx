import type { Metadata } from "next";
import { ClipboardList } from "lucide-react";

import { AppPage } from "@/components/shell/AppPage";
import { EmptyState } from "@/components/ui/EmptyState";

export const metadata: Metadata = { title: "الدرجات" };

export default function Page() {
  return (
    <AppPage title="الدرجات" description="درجاتك في جميع عناصر التقييم.">
      <EmptyState
        icon={ClipboardList}
        title="لا توجد درجات منشورة"
        description="ستظهر درجاتك هنا فور اعتمادها من المدرب."
      />
    </AppPage>
  );
}
