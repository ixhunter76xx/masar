import { Skeleton, CardSkeleton } from "@/components/ui/Skeleton";

/** هيكل صفحة المقرر: بطاقة الرأس بتبويباتها، ثم المحتوى */
export default function CourseLoading() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      className="mx-auto max-w-[1180px] px-4 py-8 sm:px-6"
    >
      <span className="sr-only">جارٍ تحميل المقرر…</span>

      <div className="mb-6 rounded-card border border-line bg-panel">
        <div className="px-5 pt-5">
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="mt-3 h-3 w-full" />
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <Skeleton className="h-9" />
            <Skeleton className="h-9" />
            <Skeleton className="h-9" />
          </div>
        </div>
        <div className="mt-5 flex gap-6 border-t border-line px-6 py-3.5">
          <Skeleton className="h-4 w-14" />
          <Skeleton className="h-4 w-14" />
          <Skeleton className="h-4 w-14" />
          <Skeleton className="h-4 w-14" />
        </div>
      </div>

      <div className="space-y-3">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    </div>
  );
}
