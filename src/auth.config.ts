import type { NextAuthConfig } from "next-auth";

/**
 * الإعدادات الصالحة لبيئة Edge (middleware).
 *
 * لا تحتوي على مزوّدي الدخول ولا على Prisma، لأن middleware يعمل على
 * Edge runtime ولا يستطيع تشغيل عميل قاعدة البيانات. المزوّدون يُضافون
 * في `src/auth.ts` الذي يعمل على Node.
 */
export const authConfig = {
  /**
   * مطلوب عند الاستضافة الذاتية (خارج Vercel) وإلا يرفض Auth.js كل طلب
   * برسالة UntrustedHost. البديل: ضبط متغيّر AUTH_URL بعنوان الموقع.
   * تأكّد أن الوكيل العكسي (nginx مثلًا) يمرّر ترويسات X-Forwarded-* بشكل صحيح.
   */
  trustHost: true,

  pages: {
    signIn: "/login",
    error: "/login",
  },

  session: { strategy: "jwt" },

  // المزوّدون يُضافون في auth.ts
  providers: [],

  callbacks: {
    /** نقل المعرّف والدور من المستخدم إلى الرمز عند أول تسجيل دخول */
    jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.role = user.role;
        token.username = user.username;
        token.name = user.name;
      }
      return token;
    },

    /** إتاحة المعرّف والدور للواجهة عبر الجلسة */
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.role = token.role;
        session.user.username = token.username;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
