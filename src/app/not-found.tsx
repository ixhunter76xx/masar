import Link from "next/link";
import { FileQuestion } from "lucide-react";

/**
 * صفحة "غير موجود".
 *
 * تُعرض أيضًا عند رفض الصلاحية — نُرجع 404 لا 403 عمدًا، فلا نكشف
 * وجود مورد لا يملك المستخدم حق رؤيته. لذلك النص محايد.
 */
export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center bg-ink px-4">
      {/* not-found.tsx لا يدعم تصدير metadata عند استدعاء notFound()
          من مسار متفرّع، و React 19 يرفع <title> إلى <head> تلقائيًا */}
      <title>الصفحة غير موجودة — مركز حساب</title>
      <div className="w-full max-w-md rounded-[14px] border border-line bg-panel px-6 py-8 text-center">
        <span className="mx-auto grid size-12 place-items-center rounded-full border border-line bg-ink text-muted">
          <FileQuestion size={22} strokeWidth={1.75} aria-hidden="true" />
        </span>

        <p className="numeric mt-5 text-2xl font-bold text-subtle">404</p>
        <h1 className="mt-1 text-lg font-bold text-paper">الصفحة غير موجودة</h1>
        <p className="mt-2 text-[13px] leading-relaxed text-muted">
          الرابط غير صحيح، أو أن هذا المحتوى غير متاح لحسابك.
        </p>

        <Link
          href="/dashboard"
          className="mt-6 inline-flex h-11 items-center rounded-[10px] bg-action px-5 text-sm font-medium text-ink transition-colors hover:bg-accent-bright"
        >
          العودة للرئيسية
        </Link>
      </div>
    </main>
  );
}
