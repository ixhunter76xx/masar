import NextAuth from "next-auth";
import { NextResponse } from "next/server";

import { authConfig } from "@/auth.config";

const { auth } = NextAuth(authConfig);

/** المسارات المتاحة بلا تسجيل دخول */
const PUBLIC_ROUTES = ["/login", "/forgot-password"];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = Boolean(req.auth);
  const isPublic = PUBLIC_ROUTES.includes(pathname);

  // مسجّل دخول ويحاول فتح صفحة الدخول → إلى لوحة التحكم
  if (isLoggedIn && isPublic) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
  }

  // حساب جديد لم يغيّر كلمته → محصور في الملف الشخصي.
  // نقرأها من رمز الجلسة لا من قاعدة البيانات، لأن middleware يعمل
  // على Edge حيث لا يعمل Prisma.
  if (
    isLoggedIn &&
    req.auth?.user?.mustChangePassword &&
    pathname !== "/profile"
  ) {
    return NextResponse.redirect(new URL("/profile", req.nextUrl));
  }

  // غير مسجّل ويحاول فتح صفحة محمية → إلى الدخول مع حفظ الوجهة
  if (!isLoggedIn && !isPublic) {
    const target = new URL("/login", req.nextUrl);
    if (pathname !== "/") target.searchParams.set("next", pathname);
    return NextResponse.redirect(target);
  }

  return NextResponse.next();
});

export const config = {
  /**
   * كل المسارات عدا:
   *   • `/api/*` — نقاط الواجهة البرمجية تتحقق من الجلسة بنفسها وتُرجع
   *     401/403 بصيغة JSON. لو مرّت من هنا لأعادت تحويلًا 307 إلى صفحة
   *     الدخول، فيتلقّى العميل صفحة HTML بدل رسالة خطأ مفهومة.
   *   • ملفات Next الداخلية والأصول الثابتة
   */
  matcher: ["/((?!api/|_next/static|_next/image|favicon.ico|icon.png|.*\\.png$).*)"],
};
