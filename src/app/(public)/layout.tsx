import Link from "next/link";

import { auth } from "@/auth";
import { PageTransition } from "@/components/motion/PageTransition";
import { Logo } from "@/components/ui/Logo";
import { SITE } from "@/lib/site";

/**
 * غلاف الواجهة العامة — ما يراه الزائر قبل أي حساب.
 *
 * ── لماذا لا شريط جانبي هنا ──────────────────────────────────────────
 * الشريط الجانبي بعناصره الستة هو هوية بيئة التعلم. عرضه على من لم
 * يشترِ بعد يقدّم له ستة أبواب كلها مغلقة — إحباط لا دعوة. المتجر
 * والمدرسة وجهان لمنصة واحدة، لكن لكل وجه إطاره.
 * ─────────────────────────────────────────────────────────────────────
 */
export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  /**
   * الجلسة تُقرأ للعرض فقط — لا حراسة هنا، فالصفحات تحتها عامة عمدًا.
   *
   * كان الشريط يعرض «تسجيل الدخول» و«إنشاء حساب» لكل زائر، بمن فيهم
   * من سجّل دخوله قبل دقيقة: يُدعى إلى إنشاء حساب يملكه، ولا يجد
   * طريقًا واحدًا يعود به إلى ما اشتراه.
   */
  const session = await auth();

  return (
    <div className="ambient min-h-dvh bg-ink">
      <header
        className="sticky top-0 z-40 flex h-[68px] items-center gap-4
          border-b border-line/70 bg-ink/70 px-4 backdrop-blur-xl sm:px-8"
      >
        <Link href="/courses" aria-label={SITE.name} className="press">
          <Logo size={40} variant="full" bare />
        </Link>

        <nav className="ms-auto flex items-center gap-0.5">
          <Link
            href="/courses"
            className="press inline-flex min-h-touch items-center rounded-[10px]
              px-3.5 text-[13px] font-medium text-paper"
          >
            المقررات
          </Link>
          {session?.user ? (
            <Link
              href="/learn"
              className="press ms-1.5 inline-flex min-h-touch items-center rounded-[10px]
                border border-line bg-panel px-3.5 text-[13px] font-medium text-paper
                transition-colors hover:border-accent-deep hover:bg-panel-lift"
            >
              مقرراتي
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="press inline-flex min-h-touch items-center rounded-[10px]
                  px-3.5 text-[13px] text-muted hover:text-paper"
              >
                تسجيل الدخول
              </Link>
              <Link
                href="/signup"
                className="press ms-1.5 inline-flex min-h-touch items-center rounded-[10px]
                  border border-line bg-panel px-3.5 text-[13px] font-medium text-paper
                  transition-colors hover:border-accent-deep hover:bg-panel-lift"
              >
                إنشاء حساب
              </Link>
            </>
          )}
        </nav>
      </header>

      <main>
        <PageTransition>{children}</PageTransition>
      </main>

      <footer className="mt-20 border-t border-line py-8">
        <div
          className="mx-auto flex max-w-[1120px] flex-wrap items-center
            justify-between gap-4 px-4 text-xs text-subtle sm:px-8"
        >
          <span>
            © <span className="numeric">{SITE.copyrightYear}</span> {SITE.name} —{" "}
            {SITE.tagline}
          </span>
          {/* `min-h-touch` على الرابطين: بلا ارتفاع صريح كانا ١٦ بكسل
              فقط — نصًّا يُقرأ ولا يكاد يُنقر على الجوال. */}
          <span className="flex flex-wrap items-center gap-x-4">
            <Link
              href="/legal/terms"
              className="inline-flex min-h-touch items-center hover:text-paper"
            >
              شروط الاستخدام
            </Link>
            <Link
              href="/legal/privacy"
              className="inline-flex min-h-touch items-center hover:text-paper"
            >
              سياسة الخصوصية
            </Link>
            <span className="inline-flex min-h-touch items-center">
              الدعم الفني{" "}
              <span className="numeric text-muted">&nbsp;{SITE.supportPhone}</span>
            </span>
          </span>
        </div>
      </footer>
    </div>
  );
}
