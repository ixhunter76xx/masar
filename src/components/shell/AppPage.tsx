import { redirect } from "next/navigation";

import { PageHeader } from "@/components/shell/PageHeader";
import { SetTopbarTitle } from "@/components/shell/TopbarTitle";
import { getShellData } from "@/lib/data/shell";

/**
 * إطار موحّد لكل صفحات المنطقة المحمية: عنوان + محتوى.
 *
 * ⚠ **لم تعد تُصيّر `Topbar`.** الرأسية صارت في `(app)/layout.tsx` كي
 * لا يفكّكها `loading.tsx` عند كل تنقّلة — وكان تفكيكها يُغيّب زرّ
 * الخروج ويُومض الشريط كلّه. تُعلن الصفحة عنوانها هنا فحسب، ويصعد إلى
 * الرأسية الثابتة عبر السياق.
 *
 * يستدعي `getShellData()` نفسها التي يستدعيها التخطيط — وهي مخزّنة
 * لكل طلب، فلا يتكرر الاستعلام.
 */
export async function AppPage({
  title,
  description,
  hidePageHeader = false,
  children,
}: {
  title: string;
  description?: string;
  /** يخفي العنوان داخل الصفحة ويبقيه في الرأسية فقط */
  hidePageHeader?: boolean;
  children: React.ReactNode;
}) {
  /* قد يُصيّر App Router التخطيط والصفحة بالتوازي؛ فلا نعتمد على أن
     تحويل التخطيط سبق هذه القراءة. يمنع الحارس استثناءً عابرًا عند
     طلب RSC مجهول أو جلسة انتهت أثناء التنقّل. */
  const shell = await getShellData();
  if (!shell) redirect("/login");

  return (
    <>
      <SetTopbarTitle title={title} />
      <main id="main" className="mx-auto max-w-[1180px] px-4 py-[2.2rem] sm:px-8">
        {!hidePageHeader && (
          <PageHeader title={title} description={description} />
        )}
        {children}
      </main>
    </>
  );
}
