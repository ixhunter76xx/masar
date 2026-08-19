import { CardSkeleton } from "@/components/ui/Skeleton";

/** هيكل محتوى التبويب فقط؛ رأس المقرر وتبويباته يبقيان في التخطيط */
export default function CourseLoading() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      className="space-y-3"
    >
      <span className="sr-only">جارٍ تحميل المقرر…</span>

      <CardSkeleton />
      <CardSkeleton />
    </div>
  );
}
