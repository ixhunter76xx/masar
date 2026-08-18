import { Skeleton, CardSkeleton } from "@/components/ui/Skeleton";

/**
 * يظهر فورًا عند التنقّل بين صفحات المنطقة المحمية.
 *
 * الشريط الجانبي يبقى ظاهرًا لأنه في التخطيط لا في الصفحة — يتغيّر
 * المحتوى وحده. بدون هذا الملف كانت الواجهة تتجمّد حتى تنتهي كل
 * استعلامات الخادم.
 */
export default function AppLoading() {
  return (
    <>
      {/* هيكل الرأسية بنفس ارتفاعها الحقيقي (64px) */}
      <div className="sticky top-0 z-40 border-b border-line bg-ink/90">
        <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
          <Skeleton className="h-5 w-40" />
        </div>
      </div>

      <div
        role="status"
        aria-busy="true"
        aria-live="polite"
        className="mx-auto max-w-[1180px] px-4 py-8 sm:px-6"
      >
        <span className="sr-only">جارٍ التحميل…</span>

        <Skeleton className="mb-2 h-6 w-48" />
        <Skeleton className="mb-6 h-4 w-72" />

        <div className="space-y-3">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton lines={1} />
        </div>
      </div>
    </>
  );
}
