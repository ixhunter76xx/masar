import { redirect } from "next/navigation";

import { AreaSwitch } from "@/components/shell/AreaSwitch";
import { BottomNav } from "@/components/shell/BottomNav";
import { PageTransition } from "@/components/motion/PageTransition";
import { Sidebar } from "@/components/shell/Sidebar";
import { Topbar } from "@/components/shell/Topbar";
import { TopbarTitleProvider } from "@/components/shell/TopbarTitle";
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
    <div className="ambient min-h-dvh bg-ink">
      {/* أول عنصر قابل للتركيز: يقفز فوق الشريط الجانبي إلى المحتوى */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:start-3 focus:z-50
          focus:rounded-[10px] focus:bg-action focus:px-4 focus:py-2.5
          focus:text-sm focus:font-medium focus:text-ink"
      >
        تخطٍ إلى المحتوى
      </a>

      {/* خارج الرأسية عمدًا — انظر تعليل الموضع في `AreaSwitch` */}
      <AreaSwitch current="study" />

      <Sidebar user={shell.user} counts={shell.counts} />

      {/* الهامش يقابل عرض الشريط الجانبي — ms أي يمين في RTL ويسار في LTR */}
      {/* الحشو السفليّ على الهاتف يقابل ارتفاع `BottomNav` الثابت، وإلا
          استقرّ آخر المحتوى تحته */}
      <div className="pb-[calc(4.5rem+env(safe-area-inset-bottom))] min-[1060px]:ms-[260px] min-[1060px]:pb-0">
        {/*
          الرأسية **فوق** `PageTransition` عمدًا، لا داخله:

          داخله كانت تُفكَّك وتُعاد تركيبها مع كل تنقّلة (لأنها كانت في
          `AppPage` أي في الصفحة)، فيغيب زرّ الخروج ويحلّ محلّه هيكل،
          وكانت تتلاشى مع المحتوى لأنها ضمن الشجرة المتحرّكة. هنا لا
          يحدث أيٌّ من الاثنين: مرساةٌ ثابتة يتبدّل تحتها المحتوى وحده.
        */}
        <TopbarTitleProvider>
          <Topbar user={shell.user} counts={shell.counts} />
          <PageTransition stationary>{children}</PageTransition>
        </TopbarTitleProvider>
      </div>

      {/* خارج `PageTransition` كالشريط الجانبي: مرساةٌ لا تتلاشى مع المحتوى */}
      <BottomNav role={shell.user.role} counts={shell.counts} />
    </div>
  );
}
