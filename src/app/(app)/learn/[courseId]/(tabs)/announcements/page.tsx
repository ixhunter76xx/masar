import { Megaphone } from "lucide-react";

import { EmptyState } from "@/components/ui/EmptyState";
import { AnnouncementForm } from "@/components/announcements/AnnouncementForm";
import { AnnouncementList } from "@/components/announcements/AnnouncementList";
import { MarkAnnouncementsRead } from "@/components/announcements/MarkRead";
import { requireCourseAccess } from "@/lib/data/courses";
import { canManageCourse } from "@/lib/data/materials";
import { getCourseAnnouncements } from "@/lib/data/announcements";

type Params = { params: Promise<{ courseId: string }> };

export default async function AnnouncementsPage({ params }: Params) {
  const { courseId } = await params;
  // تحقّق مستقل عن التخطيط — Next.js ينفّذهما على التوازي
  const { user } = await requireCourseAccess(courseId);

  const [canManage, announcements] = await Promise.all([
    canManageCourse(courseId),
    getCourseAnnouncements(courseId, user.id, user.role),
  ]);

  const unreadIds = announcements.filter((a) => a.isUnread).map((a) => a.id);

  return (
    <>
      {canManage && <AnnouncementForm courseId={courseId} />}

      {announcements.length > 0 ? (
        <AnnouncementList
          courseId={courseId}
          announcements={announcements}
          canManage={canManage}
        />
      ) : (
        <EmptyState
          icon={Megaphone}
          title="لا توجد إعلانات"
          description={
            canManage
              ? "انشر أول إعلان من النموذج أعلاه."
              : "ستظهر هنا إعلانات المقرر مرتّبة بالتاريخ، الأحدث أولًا."
          }
        />
      )}

      <MarkAnnouncementsRead courseId={courseId} ids={unreadIds} />
    </>
  );
}
