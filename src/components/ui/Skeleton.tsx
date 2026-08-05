import { cn } from "@/lib/utils";

/**
 * عنصر نائب أثناء التحميل.
 * `aria-hidden` لأنه زخرفة بلا معنى؛ الإعلان عن حالة الانتظار يتم
 * على مستوى الحاوية بـ `aria-busy`.
 */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      /* `shimmer` بدل `animate-pulse`: النبض يقول «شيء يحدث»، والمسحة
         تقول «المحتوى قادم» — اتجاه الحركة نفسه يحمل المعنى. */
      className={cn("shimmer rounded-[10px] bg-line/35", className)}
    />
  );
}

/** هيكل بطاقة — يطابق أبعاد البطاقات الحقيقية فلا يحدث قفز تخطيط */
export function CardSkeleton({ lines = 2 }: { lines?: number }) {
  return (
    <div className="rounded-[14px] border border-line bg-panel px-5 py-4">
      <div className="flex gap-4">
        <Skeleton className="size-9 shrink-0 rounded-full" />
        <div className="flex-1 space-y-2.5">
          <Skeleton className="h-4 w-2/5" />
          {Array.from({ length: lines }).map((_, i) => (
            <Skeleton key={i} className="h-3 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
