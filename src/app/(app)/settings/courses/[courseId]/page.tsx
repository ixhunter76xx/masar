import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";

import { AppPage } from "@/components/shell/AppPage";
import { AdminTabs } from "@/components/admin/AdminTabs";
import { ArchiveCourseButton } from "@/components/admin/ArchiveCourseButton";
import { CourseEditForm } from "@/components/admin/CourseEditForm";
import { CoursePresenterSelect } from "@/components/admin/CoursePresenterSelect";
import { CoursePublishToggle } from "@/components/admin/CoursePublishToggle";
import { CourseSteps } from "@/components/admin/CourseSteps";
import { SectionHeading } from "@/components/admin/SectionHeading";
import { ProductCurriculumEditor } from "@/components/admin/ProductCurriculumEditor";
import { ProductManager } from "@/components/admin/ProductManager";
import { LessonPlanner } from "@/components/materials/LessonPlanner";
import { VideoUploader } from "@/components/materials/VideoUploader";
import { Card } from "@/components/ui/Card";
import { requireAdmin } from "@/lib/data/admin";
import { listLessonsForPlanner } from "@/lib/data/materials";
import { db } from "@/server/db";
import { formatFils } from "@/lib/price";
import { Role } from "@/generated/prisma/enums";

type Params = { params: Promise<{ courseId: string }> };

export const metadata: Metadata = { title: "إدارة المقرر" };

/**
 * مساحة عمل المقرر — **كل شيء في مكان واحد**.
 *
 * ── لماذا جُمعت ─────────────────────────────────────────────────────
 * كان إعداد مقرر يتوزّع على شاشتين: البيانات والباقات هنا، ومسار
 * الدروس ورفع الفيديو في `/learn/[courseId]`. فمن أنشأ مقررًا وجد
 * نفسه أمام شاشة تطلب باقةً تشير إلى دروس **لا سبيل إليها من هنا**.
 * وذلك ليس نقصَ ميزة بل نقصُ طريق.
 *
 * والترتيب أدناه يتبع ما تفرضه البيانات لا الذوق:
 * بيانات ← مسار الدروس ← الباقات ← النشر.
 *
 * ⚠ ويبقى `/learn/[courseId]` يحمل المخطّط نفسه للمدرّس — فهو لا يملك
 * صلاحية الإدارة، وحذفه من هناك يقطع عنه أداة عمله.
 */
export default async function CourseWorkspacePage({ params }: Params) {
  await requireAdmin();
  const { courseId } = await params;

  const course = await db.course.findUnique({
    where: { id: courseId },
    select: {
      id: true,
      code: true,
      title: true,
      summary: true,
      description: true,
      facultyId: true,
      isPublished: true,
      archivedAt: true,
      presenterId: true,
      materials: {
        orderBy: { position: "asc" },
        select: { id: true, title: true, isFreePreview: true },
      },
      products: {
        orderBy: [{ sortOrder: "asc" }, { priceFils: "asc" }],
        select: {
          id: true,
          slug: true,
          title: true,
          description: true,
          priceFils: true,
          isPublished: true,
          items: { select: { lessonId: true } },
          _count: { select: { enrollments: true, orderItems: true } },
        },
      },
    },
  });

  if (!course) notFound();

  const [faculties, instructors, plan] = await Promise.all([
    db.faculty.findMany({
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true },
    }),
    db.user.findMany({
      where: { role: Role.INSTRUCTOR, isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    listLessonsForPlanner(courseId),
  ]);

  const publishedProducts = course.products.filter((p) => p.isPublished).length;

  return (
    <AppPage title="إدارة المقرر" hidePageHeader>
      <AdminTabs />

      <Link
        href="/settings/courses"
        className="press mb-4 inline-flex items-center gap-1.5 text-[12px] text-muted hover:text-paper"
      >
        <ArrowRight size={14} strokeWidth={2} aria-hidden="true" />
        كل المقررات
      </Link>

      {/* ── ترويسة المقرر وضوابطه العليا ──────────────────────────── */}
      <Card className="mb-5 px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-title-sm">
              {course.title}
              <span className="code ms-2 rounded-[6px] border border-line px-1.5 py-0.5 text-[10px] text-accent">
                {course.code}
              </span>
            </h2>
            <p className="mt-1 text-[11px] text-subtle">
              {course.isPublished ? "منشور في الكتالوج" : "مسودة — غير ظاهر للزوّار"}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <CoursePresenterSelect
              courseId={course.id}
              presenterId={course.presenterId}
              courseTitle={course.title}
              instructors={instructors}
            />
            <CoursePublishToggle
              courseId={course.id}
              isPublished={course.isPublished}
            />
            <ArchiveCourseButton
              courseId={course.id}
              title={course.title}
              archived={Boolean(course.archivedAt)}
            />
          </div>
        </div>
      </Card>

      <CourseSteps
        lessonCount={course.materials.length}
        productCount={course.products.length}
        publishedProductCount={publishedProducts}
        isPublished={course.isPublished}
      />

      {/* ── ١ · البيانات ──────────────────────────────────────────── */}
      <SectionHeading id="details" step={1} title="بيانات المقرر" />
      <Card className="mb-8 px-5 py-4">
        <CourseEditForm
          courseId={course.id}
          faculties={faculties}
          initial={{
            code: course.code,
            title: course.title,
            summary: course.summary ?? "",
            description: course.description ?? "",
            facultyId: course.facultyId ?? faculties[0]?.id ?? "",
          }}
        />
      </Card>

      {/* ── ٢ · مسار الدروس ───────────────────────────────────────── */}
      <SectionHeading
        id="lessons"
        step={2}
        title="مسار الدروس"
        description="اكتب عناوين الدروس ورتّبها الآن — بلا رفع أي فيديو. الدرس المخطَّط يحجز مكانه في المسار، وتضعه في الباقات، وترفع فيديوه متى شئت. وعلامة «مجاني» تُوضع على أكثر من درس."
      />
      <Card className="mb-4 px-5 py-4">
        <LessonPlanner courseId={course.id} lessons={plan} hideHeading />
      </Card>

      <details className="mb-8">
        <summary className="press cursor-pointer text-[12px] text-muted hover:text-paper">
          رفع فيديو لدرس
        </summary>
        <Card className="mt-3 px-5 py-4">
          <VideoUploader courseId={course.id} />
        </Card>
      </details>

      {/* ── ٣ · الباقات ───────────────────────────────────────────── */}
      <SectionHeading
        id="products"
        step={3}
        title="الباقات وأسعارها"
        count={course.products.length}
        description="الباقة مجموعة دروس بسعر — «نصف أول» أو «الدورة الكاملة» أو ما تشاء. والدرس الواحد يدخل في أكثر من باقة بلا تكرار رفعه."
      />

      {course.products.length > 0 && (
        <ul className="mb-4 space-y-3">
          {course.products.map((product) => (
            <li key={product.id}>
              <Card className="px-5 py-4">
                <ProductCurriculumEditor
                  lessons={course.materials}
                  product={{
                    id: product.id,
                    title: product.title,
                    priceFils: product.priceFils,
                    description: product.description,
                    lessonIds: product.items
                      .map((i) => i.lessonId)
                      .filter((id): id is string => id !== null),
                    soldCount: product._count.orderItems,
                  }}
                />
              </Card>
            </li>
          ))}
        </ul>
      )}

      {course.materials.length === 0 ? (
        <Card className="mb-8 px-6 py-8 text-center text-[13px] leading-[1.9] text-subtle">
          أضِف درسًا واحدًا على الأقل في المسار أعلاه، ثم أنشئ الباقات —
          <br />
          الباقة تشير إلى دروس، فلا تُبنى قبل وجودها.
        </Card>
      ) : (
        <div className="mb-8">
          <ProductManager
            courseId={course.id}
            lessons={course.materials}
            products={course.products.map((product) => ({
              id: product.id,
              slug: product.slug,
              title: product.title,
              price: formatFils(product.priceFils),
              isPublished: product.isPublished,
              lessonIds: product.items
                .map((item) => item.lessonId)
                .filter((id): id is string => id !== null),
              locked:
                product._count.enrollments > 0 || product._count.orderItems > 0,
            }))}
          />
        </div>
      )}

      {/* ── ٤ · النشر ─────────────────────────────────────────────── */}
      <SectionHeading id="publish" step={4} title="النشر" />
      <Card className="px-5 py-4">
        <p className="mb-3 text-[12px] leading-[1.9] text-subtle">
          النشر يُظهر المقرر في الكتالوج العام. ويحتاج{" "}
          <span className="text-paper">باقةً منشورة واحدة على الأقل</span> —
          مقررٌ بلا باقة يفتح للزائر صفحةً لا سبيل للشراء منها، فتُقرأ عطلًا لا
          صفحةً فارغة.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <CoursePublishToggle
            courseId={course.id}
            isPublished={course.isPublished}
          />
          {course.isPublished && (
            <Link
              href={`/courses/${course.code.toLowerCase()}`}
              className="press text-[12px] text-accent hover:underline"
            >
              افتح الصفحة العامّة ↗
            </Link>
          )}
        </div>
      </Card>
    </AppPage>
  );
}
