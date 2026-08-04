import Link from "next/link";

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
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-ink">
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
              transition-colors hover:border-accent-deep hover:bg-[#16212d]"
          >
            إنشاء حساب
          </Link>
        </nav>
      </header>

      <main>{children}</main>

      <footer className="mt-20 border-t border-line py-8">
        <div
          className="mx-auto flex max-w-[1120px] flex-wrap items-center
            justify-between gap-4 px-4 text-xs text-subtle sm:px-8"
        >
          <span>
            © <span className="numeric">{SITE.copyrightYear}</span> {SITE.name} —{" "}
            {SITE.tagline}
          </span>
          <span>
            الدعم الفني{" "}
            <span className="numeric text-muted">{SITE.supportPhone}</span>
          </span>
        </div>
      </footer>
    </div>
  );
}
