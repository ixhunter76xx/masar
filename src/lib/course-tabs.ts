/**
 * تبويبات المقرر.
 *
 * قاعدة من نظام التصميم: **أربعة تبويبات فقط** — المحتوى، الإعلانات،
 * الدرجات، الرسائل. لا تُضف تبويبًا خامسًا.
 */
export type CourseTab = {
  /** الجزء المضاف إلى /courses/[id] — فارغ يعني التبويب الافتراضي */
  segment: string;
  label: string;
  /** مفتاح العدّاد المقابل في CourseTabCounts */
  countKey?: keyof CourseTabCounts;
};

export type CourseTabCounts = {
  announcements: number;
  messages: number;
};

export const COURSE_TABS: readonly CourseTab[] = [
  { segment: "", label: "المحتوى" },
  { segment: "announcements", label: "الإعلانات", countKey: "announcements" },
  { segment: "grades", label: "الدرجات" },
  { segment: "messages", label: "الرسائل", countKey: "messages" },
] as const;

/** المسار الكامل لتبويب معيّن */
export function tabHref(courseId: string, segment: string) {
  return segment ? `/courses/${courseId}/${segment}` : `/courses/${courseId}`;
}
