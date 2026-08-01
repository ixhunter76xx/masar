import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { Sidebar } from "@/components/shell/Sidebar";
import { getNavCounts } from "@/lib/data/counts";

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
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = { name: session.user.name ?? "", role: session.user.role };
  const counts = await getNavCounts(session.user.id, session.user.role);

  return (
    <div className="min-h-dvh bg-ink">
      <Sidebar user={user} counts={counts} />

      {/* الهامش يقابل عرض الشريط الجانبي — ms أي يمين في RTL ويسار في LTR */}
      <div className="lg:ms-[260px]">{children}</div>
    </div>
  );
}
