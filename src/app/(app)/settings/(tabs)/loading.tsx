import { CardSkeleton, Skeleton } from "@/components/ui/Skeleton";

/**
 * هيكل محتوى القسم فقط — شريط التبويبات يبقى في التخطيط.
 *
 * وهذا هو الفرق كلّه عن `(app)/loading.tsx`: ذاك يرسم عنوانًا وهيكلًا
 * لأنه يحلّ محلّ صفحةٍ كاملة، وهذا يحلّ محلّ **جسم التبويب** وحده.
 * فبلا هذا الملفّ يرث المسارُ هيكلَ المنطقة كلّها، فيرسم عنوانًا
 * ثانيًا تحت التبويبات ويُقرأ كأن الشاشة كلها أُعيد بناؤها.
 */
export default function SettingsTabLoading() {
  return (
    <div role="status" aria-busy="true" aria-live="polite" className="space-y-3">
      <span className="sr-only">جارٍ تحميل القسم…</span>

      <Skeleton className="mb-4 h-4 w-56" />
      <CardSkeleton />
      <CardSkeleton />
      <CardSkeleton lines={1} />
    </div>
  );
}
