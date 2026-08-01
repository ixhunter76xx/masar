import { FolderOpen } from "lucide-react";

import { EmptyState } from "@/components/ui/EmptyState";
import { VideoUploader } from "@/components/materials/VideoUploader";
import { MaterialList } from "@/components/materials/MaterialList";
import { requireCourseAccess } from "@/lib/data/courses";
import { canManageCourse, getCourseMaterials } from "@/lib/data/materials";

type Params = { params: Promise<{ courseId: string }> };

export default async function CourseContentPage({ params }: Params) {
  const { courseId } = await params;
  // تحقّق مستقل عن التخطيط — Next.js ينفّذهما على التوازي
  const { user } = await requireCourseAccess(courseId);

  const [canManage, materials] = await Promise.all([
    canManageCourse(courseId, user.id, user.role),
    getCourseMaterials(courseId, user.role),
  ]);

  return (
    <>
      {canManage && <VideoUploader courseId={courseId} />}

      {materials.length > 0 ? (
        <MaterialList
          materials={materials}
          courseId={courseId}
          canManage={canManage}
        />
      ) : (
        <EmptyState
          icon={FolderOpen}
          title="لا يوجد محتوى بعد"
          description={
            canManage
              ? "ارفع أول محاضرة مسجّلة من النموذج أعلاه."
              : "ستظهر هنا المحاضرات والملازم فور نشرها من المدرب."
          }
        />
      )}
    </>
  );
}
