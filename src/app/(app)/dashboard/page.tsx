import type { Metadata } from "next";
import { Inbox } from "lucide-react";

import { auth } from "@/auth";
import { AppPage } from "@/components/shell/AppPage";
import { ActivityFeed } from "@/components/activity/ActivityFeed";
import { EmptyState } from "@/components/ui/EmptyState";
import { getActivityFeed } from "@/lib/data/activity";

export const metadata: Metadata = { title: "سجل النشاط" };

export default async function ActivityPage() {
  const session = await auth();
  const events = await getActivityFeed(session!.user.id);

  return (
    <AppPage
      title="سجل النشاط"
      description="آخر الأحداث عبر جميع مقرراتك."
    >
      {events.length > 0 ? (
        <ActivityFeed events={events} />
      ) : (
        <EmptyState
          icon={Inbox}
          title="لا يوجد نشاط بعد"
          description="ستظهر هنا الدرجات والإعلانات والمواد الجديدة فور نشرها."
        />
      )}
    </AppPage>
  );
}
