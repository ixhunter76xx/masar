import type { Metadata } from "next";
import { NavLink as Link } from "@/components/ui/NavLink";
import { ArrowLeft, Compass, Inbox, Play } from "lucide-react";

import { auth } from "@/auth";
import { AppPage } from "@/components/shell/AppPage";
import { ActivityFeed } from "@/components/activity/ActivityFeed";
import { CourseCard } from "@/components/courses/CourseCard";
import { StaggerItem, StaggerList } from "@/components/motion/Stagger";
import { EmptyState } from "@/components/ui/EmptyState";
import { getActivityFeed } from "@/lib/data/activity";
import { getCourseResume, getMyCourses } from "@/lib/data/courses";

export const metadata: Metadata = { title: "سجل النشاط" };

export default async function ActivityPage() {
  const session = await auth();
  const [events, myCourses] = await Promise.all([
    getActivityFeed(session!.user.id, session!.user.role),
    getMyCourses(),
  ]);
  const resumes = await Promise.all(
    myCourses.map((course) => getCourseResume(course.id)),
  );
  const resumeIndex = resumes.findIndex((resume) => resume.lesson !== null);
  const resume = resumeIndex >= 0 ? resumes[resumeIndex] : null;
  const resumeCourse = resumeIndex >= 0 ? myCourses[resumeIndex] : null;
  const progress =
    resume && resume.ownedReady > 0
      ? Math.round((resume.completed / resume.ownedReady) * 100)
      : 0;

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
    <AppPage title="سجل النشاط" hidePageHeader>
      <p className="text-eyebrow">مساء الخير</p>
      <h1 className="mb-[1.6rem] mt-[0.3rem] text-[clamp(1.7rem,3.6vw,2.6rem)] font-bold leading-[1.3] tracking-[-0.032em]">
        أهلًا، {session!.user.name?.split(" ")[0] ?? "بك"}
      </h1>

      {ownsNothing ? (
        <EmptyState
          icon={Compass}
          title="لنبدأ بمقرر"
          description="بعد أن تحصل على مقرر، تظهر هنا دروسه الجديدة ودرجاتك وإعلانات الأستاذ."
          action={{ href: "/courses", label: "تصفّح المقررات" }}
        />
      ) : (
        <>
          {resume && resumeCourse && resume.lesson && (
            <section className="relative overflow-hidden rounded-[24px] border border-spark/25 px-6 py-6 [background:linear-gradient(150deg,color-mix(in_srgb,var(--color-spark-deep)_16%,transparent),var(--color-panel)_58%)] sm:px-7">
              <span aria-hidden="true" className="pointer-events-none absolute -end-[60px] -top-[60px] size-60 rounded-full [background:radial-gradient(circle,color-mix(in_srgb,var(--color-spark)_17%,transparent),transparent_68%)]" />
              <div className="relative">
                <p className="text-eyebrow text-spark">
                  {resume.kind === "resume" ? "تابع من حيث وقفت" : "ابدأ مسارك"}
                </p>
                <h2 className="mb-1 mt-2 text-title-lg">{resume.lesson.title}</h2>
                <p className="text-xs text-subtle">{resumeCourse.title}</p>

                {resume.completed > 0 && (
                  <div className="my-4 max-w-[22rem]">
                    <div
                      className="h-1.5 overflow-hidden rounded-full bg-line-soft"
                      role="progressbar"
                      aria-label="نسبة الإنجاز"
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={progress}
                    >
                      <span
                        className="block h-full rounded-full [background:linear-gradient(90deg,var(--color-spark-deep),var(--color-spark))]"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}

                <Link
                  href={`/learn/${resumeCourse.id}`}
                  className="press mt-4 inline-flex min-h-touch items-center gap-2 rounded-field px-5 text-sm font-semibold text-ink [background:linear-gradient(180deg,var(--color-spark),var(--color-spark-deep))]"
                >
                  <Play size={14} fill="currentColor" strokeWidth={0} aria-hidden="true" />
                  {resume.kind === "resume" ? "أكمل الدرس" : "ابدأ الدرس"}
                  <ArrowLeft size={15} strokeWidth={2} aria-hidden="true" />
                </Link>
              </div>
            </section>
          )}

          <SectionTitle className="mt-11">مقرراتي</SectionTitle>
          <StaggerList as="div" className="grid gap-[1.15rem] [grid-template-columns:repeat(auto-fit,minmax(15rem,1fr))]">
            {myCourses.map((course, index) => (
              <StaggerItem key={course.id} className="h-full">
                <CourseCard course={course} resume={resumes[index]} />
              </StaggerItem>
            ))}
          </StaggerList>

          <SectionTitle className="mt-11">آخر النشاط</SectionTitle>
          {events.length > 0 ? (
            <ActivityFeed events={events} />
          ) : (
            <EmptyState
              icon={Inbox}
              title="لا يوجد نشاط بعد"
              description="ستظهر هنا الدرجات والإعلانات والمواد الجديدة فور نشرها."
            />
          )}
        </>
      )}
    </AppPage>
  );
}

function SectionTitle({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h2 className={`mb-4 flex items-center gap-2.5 text-title-lg ${className}`}>
      <span className="h-[19px] w-[3px] rounded-sm bg-gradient-to-b from-accent-bright to-accent-deep" />
      {children}
    </h2>
  );
}
