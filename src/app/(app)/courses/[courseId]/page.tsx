import Link from "next/link";
import { FolderOpen, Plus } from "lucide-react";

import { EmptyState } from "@/components/ui/EmptyState";
import { VideoUploader } from "@/components/materials/VideoUploader";
import { MaterialList } from "@/components/materials/MaterialList";
import { QuizList } from "@/components/quizzes/QuizList";
import { requireCourseAccess } from "@/lib/data/courses";
import { canManageCourse, getCourseMaterials } from "@/lib/data/materials";
import { getCourseQuizzes } from "@/lib/data/quizzes";

type Params = { params: Promise<{ courseId: string }> };

export default async function CourseContentPage({ params }: Params) {
  const { courseId } = await params;
  // تحقّق مستقل عن التخطيط — Next.js ينفّذهما على التوازي
  const { user } = await requireCourseAccess(courseId);

  const [canManage, materials, quizzes] = await Promise.all([
    canManageCourse(courseId, user.id, user.role),
    getCourseMaterials(courseId, user.role),
    getCourseQuizzes(courseId, user.role),
  ]);

  const isEmpty = materials.length === 0 && quizzes.length === 0;

  return (
    <>
      {canManage && <VideoUploader courseId={courseId} />}

      {isEmpty ? (
        <EmptyState
          icon={FolderOpen}
          title="لا يوجد محتوى بعد"
          description={
            canManage
              ? "ارفع أول محاضرة من النموذج أعلاه، أو أنشئ اختبارًا."
              : "ستظهر هنا المحاضرات والاختبارات فور نشرها من المدرب."
          }
        />
      ) : (
        <>
          {quizzes.length > 0 && (
            <section className="mb-8">
              <h3 className="mb-3 text-sm font-medium text-paper">
                الاختبارات{" "}
                <span className="numeric text-[11px] text-disabled">
                  {quizzes.length}
                </span>
              </h3>
              <QuizList
                quizzes={quizzes}
                courseId={courseId}
                canManage={canManage}
              />
            </section>
          )}

          {materials.length > 0 && (
            <section>
              <h3 className="mb-3 text-sm font-medium text-paper">
                المحاضرات{" "}
                <span className="numeric text-[11px] text-disabled">
                  {materials.length}
                </span>
              </h3>
              <MaterialList
                materials={materials}
                courseId={courseId}
                canManage={canManage}
              />
            </section>
          )}
        </>
      )}

      {canManage && (
        <Link
          href={`/courses/${courseId}/quizzes/new`}
          className="mt-6 inline-flex h-11 items-center gap-2 rounded-[10px] border border-line px-5 text-sm text-muted transition-colors hover:border-accent-deep hover:text-paper"
        >
          <Plus size={16} strokeWidth={1.75} aria-hidden="true" />
          إنشاء اختبار
        </Link>
      )}
    </>
  );
}
