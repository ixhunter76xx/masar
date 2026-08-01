import { auth } from "@/auth";
import { Topbar } from "@/components/shell/Topbar";
import { PageHeader } from "@/components/shell/PageHeader";
import { getNavCounts } from "@/lib/data/counts";

/** إطار موحّد لكل صفحات المنطقة المحمية: رأسية + عنوان + محتوى */
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
  const session = await auth();
  const user = {
    name: session!.user.name ?? "",
    role: session!.user.role,
  };
  const counts = await getNavCounts(session!.user.id, session!.user.role);

  return (
    <>
      <Topbar title={title} user={user} counts={counts} />
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        {!hidePageHeader && (
          <PageHeader title={title} description={description} />
        )}
        {children}
      </main>
    </>
  );
}
