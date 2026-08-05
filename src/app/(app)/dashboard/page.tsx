import type { Metadata } from "next";
import { Compass, Inbox } from "lucide-react";

import { auth } from "@/auth";
import { AppPage } from "@/components/shell/AppPage";
import { ActivityFeed } from "@/components/activity/ActivityFeed";
import { EmptyState } from "@/components/ui/EmptyState";
import { getActivityFeed } from "@/lib/data/activity";
import { getMyCourses } from "@/lib/data/courses";

export const metadata: Metadata = { title: "سجل النشاط" };

export default async function ActivityPage() {
  const session = await auth();
  const [events, myCourses] = await Promise.all([
    getActivityFeed(session!.user.id, session!.user.role),
    getMyCourses(),
  ]);

  /**
   * ── لماذا حالتان فارغتان لا واحدة ───────────────────────────────────
   * هذه أول شاشة بعد إنشاء الحساب. ومن أنشأ حسابه للتوّ أنشأه ليشتري،
   * فكان يُستقبَل بصندوق وارد فارغ: «لا يوجد نشاط بعد» — جملة صادقة
   * وبلا أي طريق للأمام. لا رابط، ولا خطوة، ولا ذكر للمقررات.
   *
   * «لا نشاط» و«لا تملك مقررًا» حالتان مختلفتان تمامًا: الأولى انتظار
   * طبيعي لمن اشترى، والثانية طريق مسدود لمن لم يشترِ بعد. التمييز
   * بينهما هو الفرق بين شاشة تُخبر وشاشة تدلّ.
   */
  const ownsNothing = myCourses.length === 0;

  return (
    <AppPage
      title="سجل النشاط"
      description="آخر الأحداث عبر جميع مقرراتك."
    >
      {events.length > 0 ? (
        <ActivityFeed events={events} />
      ) : ownsNothing ? (
        <EmptyState
          icon={Compass}
          title="لنبدأ بمقرر"
          description="بعد أن تحصل على مقرر، تظهر هنا دروسه الجديدة ودرجاتك وإعلانات الأستاذ."
          action={{ href: "/courses", label: "تصفّح المقررات" }}
        />
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
