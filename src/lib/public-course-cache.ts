import "server-only";

import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";

import {
  getPublicCourse,
  listCatalogueByFaculty,
} from "@/lib/data/courses";

/**
 * بيانات المتجر عامة ولا تعتمد على الجلسة، لذلك لا ينبغي أن تعيد نفس
 * استعلامات Neon لكل زائر. تبقى الصفحة نفسها ديناميكية من أجل nonce
 * والجلسة، بينما تُشارك نتيجة البيانات العامة بين الطلبات.
 *
 * الوسم يتيح إبطال النتيجة فور تعديل مقرر، والمهلة شبكة أمان في حال
 * أضيف مسار كتابة جديد ولم يربط بالوسم بعد.
 */
export const PUBLIC_COURSES_TAG = "public-courses";

export const getCachedCatalogue = unstable_cache(
  async () => listCatalogueByFaculty(),
  ["public-catalogue-v1"],
  { revalidate: 60, tags: [PUBLIC_COURSES_TAG] },
);

export const getCachedPublicCourse = unstable_cache(
  async (slug: string) => getPublicCourse(slug),
  ["public-course-v1"],
  { revalidate: 60, tags: [PUBLIC_COURSES_TAG] },
);

/** تُستدعى بعد كل كتابة تغيّر ما يراه الزائر في الكتالوج أو صفحة المقرر. */
export function revalidatePublicCourses() {
  revalidateTag(PUBLIC_COURSES_TAG);
  revalidatePath("/courses");
}
