import { Skeleton, CardSkeleton } from "@/components/ui/Skeleton";

/**
 * يظهر فورًا عند التنقّل بين صفحات المنطقة المحمية.
 *
 * ⚠ **لا يرسم رأسية.** كان هنا `<header>` هيكليّ يقلّد الرأسية الحقيقية
 * بارتفاعها نفسه — وكان ذلك يعالج عرضًا لعلّةٍ في البنية: الرأسية كانت
 * في `AppPage` أي داخل الصفحة، فيستبدلها هذا الملفّ عند كل تنقّلة.
 * فكان المستخدم يرى الشريط العلوي وزرّ الخروج يختفيان ثم يعودان، ويرى
 * بينهما شريطًا يشبههما ولا يعمل.
 *
 * الرأسية الآن في `(app)/layout.tsx` فوق `PageTransition`، ولا يمسّها
 * هذا الملفّ ولا يستبدلها. فما يبقى هنا هو هيكل **المحتوى** وحده،
 * وهذا هو حدّ مسؤوليته الصحيح.
 *
 * الشريط الجانبي كذلك في التخطيط — يتغيّر المحتوى وحده.
 */
export default function AppLoading() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      className="mx-auto max-w-[1180px] px-4 py-[2.2rem] sm:px-8"
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
  );
}
