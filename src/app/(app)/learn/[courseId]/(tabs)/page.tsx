import { NavLink as Link } from "@/components/ui/NavLink";
import { FolderOpen, Plus } from "lucide-react";

import { EmptyState } from "@/components/ui/EmptyState";
import { VideoUploader } from "@/components/materials/VideoUploader";
import { LessonPlanner } from "@/components/materials/LessonPlanner";
import { MaterialList } from "@/components/materials/MaterialList";
import { QuizList } from "@/components/quizzes/QuizList";
import { AssignmentList } from "@/components/assignments/AssignmentList";
import { requireCourseAccess } from "@/lib/data/courses";
import {
  canManageCourse,
  getCourseMaterials,
  listChapters,
  listLessonsForPlanner,
} from "@/lib/data/materials";
import { getCourseQuizzes } from "@/lib/data/quizzes";
import { getCourseAssignments } from "@/lib/data/assignments";
import { getCompletedLessonIds } from "@/lib/data/progress";
import { ar } from "@/lib/numerals";

type Params = { params: Promise<{ courseId: string }> };

export default async function CourseContentPage({ params }: Params) {
  const { courseId } = await params;
  // تحقّق مستقل عن التخطيط — Next.js ينفّذهما على التوازي
  const { user } = await requireCourseAccess(courseId);

  const [canManage, materials, quizzes, assignments, completedIds] = await Promise.all([
    canManageCourse(courseId),
    getCourseMaterials(courseId),
    getCourseQuizzes(courseId, user.id, user.role),
    getCourseAssignments(courseId, user.id, user.role),
    getCompletedLessonIds(courseId),
  ]);

  /* السكّة للمدير وحده: تشمل المخطَّط وغير المنشور، وهو ما لا يراه
     الطالب أصلًا. `getCourseMaterials` تصفّي بالحزمة والنشر، فلا تصلح
     للتخطيط — التخطيط يحتاج كل دروس المقرر بترتيبها. */
  const [plan, chapters] = canManage
    ? await Promise.all([listLessonsForPlanner(courseId), listChapters(courseId)])
    : [[], []];

  const isEmpty =
    materials.length === 0 && quizzes.length === 0 && assignments.length === 0;

  return (
    <>
      {/* التخطيط أولًا ثم الرفع العام: السكّة هي مكان العمل اليومي،
          والرفع العام للمواد غير المرتبطة بدرس بعينه. */}
      {canManage && <LessonPlanner courseId={courseId} lessons={plan} chapters={chapters} />}

      {canManage && <VideoUploader courseId={courseId} />}

      {isEmpty ? (
        <EmptyState
          icon={FolderOpen}
          title="لا يوجد محتوى بعد"
          description={
            canManage
              ? "ارفع أول محاضرة من النموذج أعلاه، أو أنشئ اختبارًا أو واجبًا."
              : "ستظهر هنا المحاضرات والاختبارات والواجبات فور نشرها."
          }
        />
      ) : (
        <>
          {/* المشغّل أولًا ومسار الدروس إلى جانبه؛ وهو ترتيب شاشة
              الدراسة في المرجع، ويمنع تكرار مشغّل كامل داخل كل بطاقة. */}
          <section className="mb-8">
            <h3 className="mb-3 text-sm font-medium text-paper">
              المحاضرات{" "}
              <span className="numeric text-[11px] text-subtle">
                {ar(materials.length)}
              </span>
            </h3>

            {materials.length > 0 ? (
              <MaterialList
                materials={materials}
                courseId={courseId}
                canManage={canManage}
                completedIds={completedIds}
              />
            ) : (
              <p className="rounded-[12px] border border-line bg-panel px-5 py-6 text-[13px] leading-relaxed text-subtle">
                {canManage
                  ? "لا محاضرات منشورة بعد — ارفع أول محاضرة من النموذج أعلاه."
                  : "لم تُنشر محاضرات هذا المقرر بعد. ستظهر هنا فور رفعها، ووصولك إليها مفتوح بلا انتهاء."}
              </p>
            )}
          </section>

          {(quizzes.length > 0 || assignments.length > 0) && (
            <div className="grid items-start gap-6 xl:grid-cols-2">
              {quizzes.length > 0 && (
                <section>
                  <h3 className="mb-3 text-sm font-medium text-paper">
                    الاختبارات{" "}
                    <span className="numeric text-[11px] text-subtle">
                      {ar(quizzes.length)}
                    </span>
                  </h3>
                  <QuizList
                    quizzes={quizzes}
                    courseId={courseId}
                    canManage={canManage}
                  />
                </section>
              )}

              {assignments.length > 0 && (
                <section>
                  <h3 className="mb-3 text-sm font-medium text-paper">
                    الواجبات{" "}
                    <span className="numeric text-[11px] text-subtle">
                      {ar(assignments.length)}
                    </span>
                  </h3>
                  <AssignmentList
                    assignments={assignments}
                    courseId={courseId}
                    canManage={canManage}
                  />
                </section>
              )}
            </div>
          )}
        </>
      )}

      {canManage && (
        <div className="mt-6 flex flex-wrap gap-2">
          <Link
            href={`/learn/${courseId}/quizzes/new`}
            className="inline-flex h-11 items-center gap-2 rounded-[10px] border border-line px-5 text-sm text-muted press hover:border-accent-deep hover:text-paper"
          >
            <Plus size={16} strokeWidth={1.75} aria-hidden="true" />
            إنشاء اختبار
          </Link>
          <Link
            href={`/learn/${courseId}/assignments/new`}
            className="inline-flex h-11 items-center gap-2 rounded-[10px] border border-line px-5 text-sm text-muted press hover:border-accent-deep hover:text-paper"
          >
            <Plus size={16} strokeWidth={1.75} aria-hidden="true" />
            إنشاء واجب
          </Link>
        </div>
      )}
    </>
  );
}
