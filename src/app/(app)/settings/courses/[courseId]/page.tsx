import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";

import { AppPage } from "@/components/shell/AppPage";
import { Card } from "@/components/ui/Card";
import { ProductManager } from "@/components/admin/ProductManager";
import { requireAdmin } from "@/lib/data/admin";
import { db } from "@/server/db";
import { formatFils } from "@/lib/price";

type Params = { params: Promise<{ courseId: string }> };

export const metadata: Metadata = { title: "باقات المقرر" };

export default async function CourseProductsPage({ params }: Params) {
  await requireAdmin();
  const { courseId } = await params;

  const course = await db.course.findUnique({
    where: { id: courseId },
    select: {
      id: true,
      code: true,
      title: true,
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
          priceFils: true,
          isPublished: true,
          items: { select: { lessonId: true } },
          _count: { select: { enrollments: true, orderItems: true } },
        },
      },
    },
  });

  if (!course) notFound();

  return (
    <AppPage title="باقات المقرر" hidePageHeader>
      <Link
        href="/settings/courses"
        className="mb-4 inline-flex items-center gap-1.5 text-[12px] text-muted transition-colors hover:text-paper"
      >
        <ArrowRight size={14} strokeWidth={1.75} aria-hidden="true" />
        كل المقررات
      </Link>

      <Card className="mb-6 px-5 py-4">
        <h2 className="text-sm font-medium text-paper">
          {course.title}
          <span className="numeric ms-2 text-[11px] text-accent">{course.code}</span>
        </h2>
        <p className="mt-1 text-[11px] leading-relaxed text-subtle">
          الباقة تُباع بدروس هذا المقرر. الدروس تُنشأ بالرفع من صفحة
          المقرر — والباقة تشير إليها، فارفع أولًا ثم سعّر.
        </p>
      </Card>

      {course.materials.length === 0 ? (
        <Card className="px-6 py-10 text-center text-[13px] text-subtle">
          لا دروس في هذا المقرر بعد. ارفع درسًا واحدًا على الأقل قبل
          إنشاء باقة.
        </Card>
      ) : (
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
            /* المرتبطة بطلب أو اشتراك لا تُحذف — الزرّ يُخفى بدل أن
               يُعرض ثم يُرفض */
            locked:
              product._count.enrollments > 0 || product._count.orderItems > 0,
          }))}
        />
      )}
    </AppPage>
  );
}
