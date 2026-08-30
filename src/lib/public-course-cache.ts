import "server-only";

import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";

import {
  getPublicCourse,
  listCatalogueByFaculty,
  listHiddenFacultySlugs,
} from "@/lib/data/courses";

/**
 * بيانات المتجر عامة ولا تعتمد على الجلسة، لذلك لا ينبغي أن تعيد نفس
 * استعلامات Neon لكل زائر. تبقى الصفحة نفسها ديناميكية من أجل nonce
 * والجلسة، بينما تُشارك نتيجة البيانات العامة بين الطلبات.
 *
 * الوسم يتيح إبطال النتيجة فور تعديل مقرر، والمهلة شبكة أمان في حال
 * أضيف مسار كتابة جديد ولم يربط بالوسم بعد.
 *
 * ── ⚠ لماذا صارت المهلة ساعةً بعد أن كانت دقيقة ─────────────────────
 * المقيس على بناء إنتاج: الطلب البارد لـ`/courses` **‏١٫٢٣ ثانية**
 * قبل أوّل بايت، والطلبات التالية ‏١١–١٨ مللي ثانية. أي أن الدقيقة
 * كانت تعني أن **زائرًا في كل دقيقة** يدفع ثانيةً وربعًا على صفحة
 * الهبوط — وهي أوّل ما يراه من لا حساب له، وأبطأُ لحظةٍ في المنصّة.
 *
 * والمهلة ليست هي ما يحفظ الطزاجة أصلًا؛ الوسم هو. فطولها لا يزيد
 * البيانات قِدَمًا ما دام كل كاتبٍ يُبطلها.
 *
 * ⚠ وشرطُ ذلك أن تكون التغطية كاملة — وقد كانت ناقصة: مسارا رفع
 * الفيديو وحذفه لم يكونا يُبطلان شيئًا. وكانت الدقيقةُ تستر ذلك.
 * أُصلحا مع هذا التغيير، وبدونهما كان الرفع سيغيب ساعةً كاملة.
 */
export const PUBLIC_COURSES_TAG = "public-courses";

export const getCachedCatalogue = unstable_cache(
  async () => listCatalogueByFaculty(),
  ["public-catalogue-v1"],
  { revalidate: 3600, tags: [PUBLIC_COURSES_TAG] },
);

export const getCachedPublicCourse = unstable_cache(
  async (slug: string) => getPublicCourse(slug),
  ["public-course-v1"],
  { revalidate: 3600, tags: [PUBLIC_COURSES_TAG] },
);

/** بنفس الوسم: إخفاء كلية من اللوحة يُبطلها فورًا مع الكتالوج. */
export const getCachedHiddenFaculties = unstable_cache(
  async () => listHiddenFacultySlugs(),
  ["public-hidden-faculties-v1"],
  { revalidate: 3600, tags: [PUBLIC_COURSES_TAG] },
);

/** تُستدعى بعد كل كتابة تغيّر ما يراه الزائر في الكتالوج أو صفحة المقرر. */
export function revalidatePublicCourses() {
  revalidateTag(PUBLIC_COURSES_TAG);
  revalidatePath("/courses");
}
