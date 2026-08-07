import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

import { authConfig } from "@/auth.config";
import { db } from "@/server/db";
import { loginSchema } from "@/lib/validation";

/** تجزئة وهمية تُستخدم لتثبيت زمن الاستجابة عند عدم وجود المستخدم */
const DUMMY_HASH =
  "$2b$12$abcdefghijklmnopqrstuv0123456789ABCDEFGHIJKLMNOPQRSTUV0123";

/** خطأ يميّز الحساب المعطّل عن بيانات الدخول الخاطئة */
class AccountDisabledError extends CredentialsSignin {
  code = "AccountDisabled";
}

/** خطأ الحظر المؤقّت بعد تكرار الفشل */
class AccountLockedError extends CredentialsSignin {
  code = "AccountLocked";
}

/**
 * حدّ المحاولات الفاشلة المتتالية قبل الحظر، ومدّته.
 *
 * ثمانية تسمح بأخطاء طباعة حقيقية وتوقف التخمين الآلي: عند خمس عشرة
 * دقيقة لكل ثماني محاولات يصير المعدّل أقلّ من ٨٠٠ محاولة يوميًا،
 * وهو لا شيء أمام مساحة كلمة مرور من ٨ خانات.
 */
const MAX_FAILED_ATTEMPTS = 8;
const LOCK_MINUTES = 15;

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,

  providers: [
    Credentials({
      credentials: {
        email: { label: "البريد الإلكتروني", type: "email" },
        password: { label: "كلمة المرور", type: "password" },
      },

      async authorize(raw) {
        const parsed = loginSchema
          .pick({ email: true, password: true })
          .safeParse(raw);

        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        /* البحث بالبريد لا باسم المستخدم: `username` صار اختياريًا في
           مخطط مسار، فحساب الطالب المسجَّل ذاتيًا لا يملكه أصلًا. */
        const user = await db.user.findUnique({ where: { email } });

        /*
         * الحظر يُفحص **قبل** المقارنة.
         *
         * لا فائدة من تشغيل bcrypt لحسابٍ محظور — وتشغيلُه هو نفسه ما
         * يستنزفه المهاجم. ونُظهر الحظر صراحةً بدل رسالة عامة: من يبلغ
         * هذا الحدّ يعرف أصلًا أن الحساب قائم، فإخفاؤه يضلّل صاحبه
         * وحده ويجعله يظنّ كلمته خاطئة وهي صحيحة.
         */
        const now = new Date();
        if (user?.lockedUntil && user.lockedUntil > now) {
          throw new AccountLockedError();
        }

        // نقارن دائمًا — حتى لو لم يوجد المستخدم — حتى لا يكشف زمن
        // الاستجابة أي البُرد مسجَّلة فعلًا.
        const matches = await bcrypt.compare(
          password,
          user?.passwordHash ?? DUMMY_HASH,
        );

        if (!user || !matches) {
          /*
           * الفشل يُعدّ على الحساب القائم وحده. البريد المجهول لا صفّ
           * له يُعدّ عليه، وإنشاء صفٍّ لكل بريد مُخمَّن يحوّل الحماية
           * إلى باب إغراق للجدول.
           */
          if (user) {
            const attempts = user.failedLoginAttempts + 1;
            const reached = attempts >= MAX_FAILED_ATTEMPTS;

            await db.user.update({
              where: { id: user.id },
              data: {
                failedLoginAttempts: reached ? 0 : attempts,
                lockedUntil: reached
                  ? new Date(now.getTime() + LOCK_MINUTES * 60_000)
                  : user.lockedUntil,
              },
            });
          }
          return null;
        }

        if (!user.isActive) throw new AccountDisabledError();

        await db.user.update({
          where: { id: user.id },
          data: {
            lastLoginAt: now,
            /* نجاحٌ واحد يمسح أثر الفشل — وإلا تراكمت محاولات متباعدة
               عبر أسابيع حتى تحظر مستخدمًا لا يخطئ إلا نادرًا */
            failedLoginAttempts: 0,
            lockedUntil: null,
          },
        });

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          username: user.username,
          role: user.role,
          mustChangePassword: user.mustChangePassword,
          /* يُختم في الرمز ويُقارَن بالجدول في كل طلب — رفعُه يُبطل
             هذه الجلسة وكل جلسة أخرى للحساب نفسه */
          sessionVersion: user.sessionVersion,
        };
      },
    }),
  ],
});
