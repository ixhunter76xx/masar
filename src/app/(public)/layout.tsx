import Link from "next/link";

import { auth } from "@/auth";
import { AreaSwitch } from "@/components/shell/AreaSwitch";
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
      {/* خارج الرأسية عمدًا — انظر تعليل الموضع في `AreaSwitch` */}
      <AreaSwitch current="catalogue" />

      <header className="sticky top-0 z-40 border-b border-line/70 bg-ink/88 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1180px] items-center gap-4 px-4 sm:px-8">
          <Link href="/courses" aria-label={SITE.name} className="press">
            <Logo size={40} variant="full" bare />
          </Link>

          {/* رأسية المرجع للزائر تحمل بابًا واحدًا فقط. أمّا المسجّل
              فبابه الثابت إلى منطقة الدراسة هو `AreaSwitch`. */}
          <nav className="ms-auto flex items-center">
            {!session?.user && (
              /**
               * ⚠ انحرافٌ مقصود عن المعاينة، وسببه بلاغُ المالك.
               *
               * المصدر يعطيه `.btn .btn-sm` — زرًّا محايدًا بحدٍّ خافت،
               * وكان المنقول مطابقًا له حرفًا بحرف. لكن المعاينة لقطةٌ
               * بعرضٍ ضيّق، والمنتج يُفتح على ١٩٠٠px: هناك يصير الزرّ
               * ٥٧×٣٤px وحيدًا عند `x=385` بينما الشعار عند `x=1403`
               * والمبدّل عند `x=873` — أي في آخر ركنٍ تصل إليه العين
               * العربية، على بُعد ألف بكسل من أول ما تراه.
               *
               * وبلاغ المالك كان حرفيًّا «وأين زرّ تسجيل الدخول أصلًا».
               * فالحيادُ هنا لا يخدم: الدخول هو الباب الوحيد إلى نصف
               * المنتج، ويقصده كل من ضغط «الدراسة» فرُدّ إليه.
               *
               * فأخذ نبرة الفعل من النظام نفسه — `--color-action`
               * المستعملة في نداءات الشراء — بلا لونٍ جديد ولا مقاسٍ
               * جديد: المقاس ‹34px · .78rem› كما في المصدر تمامًا.
               */
              <Link
                href="/login"
                className="press inline-flex min-h-[34px] items-center rounded-full
                  bg-action px-[0.95rem] text-[0.78rem] font-semibold text-ink
                  shadow-[0_1px_0_var(--hair),0_6px_18px_-10px_var(--shadow)]
                  hover:bg-accent-bright"
              >
                دخول
              </Link>
            )}

            {/**
             * ── حالة المستخدم المسجَّل — الانحراف رقم ٢، مُغلَقًا ────────
             *
             * كانت هذه الرأسية **فارغة تمامًا** للمسجَّل: لا اسم، ولا باب
             * إلى حسابه، ولا خروج. والمعاينة لا تُمثّل الحالة أصلًا لأنها
             * لقطةُ زائر.
             *
             * وأثرُها العمليّ ظهر في بلاغ المالك: فتح الكتالوج وهو مسجَّل،
             * فرأى رأسيةً بلا شيء واستنتج أن زرّ الدخول «غير موجود». وهو
             * محقّ في وصف ما رأى — الرأسية لم تكن تقول له إنه داخلٌ أصلًا.
             *
             * فتقول الآن مَن هو، وتفتح بابه. نبرةٌ محايدة عمدًا: `bg-action`
             * محجوزة لـ«دخول» وحده، فلا يتنافس بابٌ مفتوح مع دعوةٍ للفتح.
             */}
            {session?.user && (
              <Link
                href="/dashboard"
                className="press inline-flex min-h-[34px] items-center gap-2 rounded-full
                  border border-line bg-[var(--sunk)] px-[0.85rem] text-[0.78rem] text-paper
                  hover:border-accent-deep hover:bg-panel-lift"
              >
                <span
                  aria-hidden="true"
                  className="grid size-[22px] shrink-0 place-items-center rounded-full
                    bg-panel-high text-[11px] font-semibold text-accent"
                >
                  {session.user.name?.trim().charAt(0) ?? "ح"}
                </span>
                <span className="max-w-[10ch] truncate">
                  {session.user.name?.trim().split(" ")[0] ?? "حسابي"}
                </span>
              </Link>
            )}
          </nav>
        </div>
      </header>

      <main>
        <PageTransition>{children}</PageTransition>
      </main>

      <footer className="mt-20 border-t border-line py-8">
        <div
          className="mx-auto flex max-w-[1180px] flex-wrap items-center
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
