import NextAuth from "next-auth";
import { NextResponse } from "next/server";

import { authConfig } from "@/auth.config";
import { buildCsp, generateNonce } from "@/lib/csp";
import { AFTER_LOGIN, AUTH_ROUTES } from "@/lib/routes";

const { auth } = NextAuth(authConfig);

/**
 * ── نموذج الحماية في مسار ────────────────────────────────────────────
 * المنصة ذات وجهين: متجر عام يتصفّحه أي زائر، وبيئة تعلّم خاصة بمن
 * اشترى. لكن المبدأ الأمني لم يتغيّر: **الحماية هي الافتراض والاستثناء
 * صريح**.
 *
 * لماذا قائمة عامة لا قائمة محمية: أي صفحة جديدة تُضاف لاحقًا تُحمى
 * تلقائيًا. لو كانت القائمة "المحمية" هي المكتوبة، لكان نسيان سطر
 * واحد يعني كشف صفحة كاملة — وهو خطأ صامت لا يظهر في أي اختبار.
 * ─────────────────────────────────────────────────────────────────────
 */

/** مسارات عامة بالمطابقة التامة */
const PUBLIC_EXACT = new Set<string>([
  "/", // الواجهة الرئيسية
  "/courses", // كتالوج المقررات
  /**
   * ملفّا الزواحف.
   *
   * ⚠ كانا محجوبين: المُطابِق أسفل هذا الملفّ يستثني `sw.js` والبيان
   * والأيقونات، ولم يستثنِهما — فكانا يسقطان في فحص الجلسة ويُحوَّلان
   * إلى `/login`. مقيسٌ: `curl /robots.txt` يعيد `/login?next=…`.
   *
   * أي أن `robots.txt` لم يكن يصل إلى زاحفٍ قطّ منذ كُتب. ولم يظهر
   * الأثر لأن مضمونه كان «امنع كل شيء»، والصفحات كلها كانت محجوبة
   * أصلًا — فالخطأ والصواب يعطيان النتيجة نفسها. وقد تبدّل الأمران
   * معًا: صار الكتالوج عامًّا، وصار الملفّ يسمح به.
   *
   * ولا يكشفان شيئًا: `robots.txt` قائمةُ مسارات، و`sitemap.xml` لا
   * يحوي إلا المقررات **المنشورة** — وهي معروضة في الكتالوج لأي زائر.
   */
  "/robots.txt",
  "/sitemap.xml",
  ...AUTH_ROUTES,
]);

/**
 * بادئات عامة — صفحة كل مقرر وما تحتها.
 *
 * الشرطة المائلة في النهاية مقصودة: `"/courses/"` لا تطابق `/coursesXYZ`
 * لو أُضيف مسار بهذا الاسم يومًا.
 *
 * ⚠ لا تضع هنا `"/learn/"` أبدًا: هذا جذر بيئة التعلّم المدفوعة.
 * (حدث فعلًا — إعادة تسمية شاملة من `/courses/` إلى `/learn/` طالت هذا
 * السطر فقلبت المعنى: فتحت المدفوع وأغلقت العام. أمسكه اختبار الزائر
 * المجهول لا القراءة.)
 */
const PUBLIC_PREFIXES = [
  "/courses/",
  /* الشروط والخصوصية: يقرؤهما من لم يُنشئ حسابًا بعدُ — وهو الوقت
     الذي يقرّر فيه إن كان سيُنشئه. حجبُهما خلف الدخول يعكس الترتيب.
     (أُضيف بعد أن حجبتهما القائمةُ فعلًا: الحماية هي الافتراض هنا،
     وهذا هو السلوك المقصود لا خطأً فيه.) */
  "/legal/",
];

function isPublic(pathname: string): boolean {
  return (
    PUBLIC_EXACT.has(pathname) ||
    PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))
  );
}

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = Boolean(req.auth);
  const publicRoute = isPublic(pathname);
  const authScreen = (AUTH_ROUTES as readonly string[]).includes(pathname);

  /* nonce جديد لكل طلب — يشمل الصفحات العامة بلا استثناء */
  const nonce = generateNonce();
  const csp = buildCsp(nonce);

  // مسجّل دخول ويفتح شاشة دخول أو تسجيل → إلى وجهته المعتادة
  if (isLoggedIn && authScreen) {
    return NextResponse.redirect(new URL(AFTER_LOGIN, req.nextUrl));
  }

  /**
   * حساب أنشأته الإدارة بكلمة مبدئية → محصور في الملف الشخصي.
   *
   * الحصر على المسارات المحمية وحدها: لا معنى لطرد المستخدم من صفحة
   * كتالوج يراها الزائر المجهول أصلًا. ولا يمسّ من سجّل بنفسه لأن
   * `mustChangePassword` افتراضه false.
   */
  if (
    isLoggedIn &&
    !publicRoute &&
    req.auth?.user?.mustChangePassword &&
    pathname !== "/profile"
  ) {
    return NextResponse.redirect(new URL("/profile", req.nextUrl));
  }

  // غير مسجّل ويفتح صفحة محمية → إلى الدخول مع حفظ الوجهة
  if (!isLoggedIn && !publicRoute) {
    const target = new URL("/login", req.nextUrl);
    target.searchParams.set("next", pathname);
    return NextResponse.redirect(target);
  }

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("content-security-policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("content-security-policy", csp);
  return response;
});

export const config = {
  /**
   * كل المسارات عدا:
   *   • `/api/*` — نقاط الواجهة تتحقق بنفسها وتُرجع JSON. و`webhook`
   *     الدفع تحديدًا لا جلسة له أصلًا: المُرسِل خادم البوابة لا متصفّح،
   *     وحمايته **توقيع** الحمولة لا المصادقة.
   *   • `manifest.webmanifest` و`sw.js` — أصول التثبيت، ولو مرّا من هنا
   *     لأُعيد الزائر إلى الدخول بدلهما فاختفى خيار التثبيت.
   *   • ملفات Next الداخلية والأصول الثابتة
   */
  matcher: [
    "/((?!api/|_next/static|_next/image|favicon.ico|icon.png|manifest.webmanifest|sw.js|.*\\.png$).*)",
  ],
};
