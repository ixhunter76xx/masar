import { redirect } from "next/navigation";

import { Sidebar } from "@/components/shell/Sidebar";
import { getShellData } from "@/lib/data/shell";

/**
 * تخطيط المنطقة المحمية: شريط جانبي مثبّت يمينًا + منطقة محتوى.
 *
 * middleware يحمي هذه المسارات أصلًا، وهذا تحقّق ثانٍ على الخادم يضمن
 * توفّر الجلسة لكل الصفحات الأبناء.
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const shell = await getShellData();
  if (!shell) redirect("/login");

  return (
    <div className="min-h-dvh bg-ink">
      {/* أول عنصر قابل للتركيز: يقفز فوق الشريط الجانبي إلى المحتوى */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:start-3 focus:z-50
          focus:rounded-[10px] focus:bg-action focus:px-4 focus:py-2.5
          focus:text-sm focus:font-medium focus:text-ink"
      >
        تخطٍ إلى المحتوى
      </a>

      <Sidebar user={shell.user} counts={shell.counts} />

      {/* الهامش يقابل عرض الشريط الجانبي — ms أي يمين في RTL ويسار في LTR */}
      <div className="lg:ms-[260px]">{children}</div>
    </div>
  );
}
