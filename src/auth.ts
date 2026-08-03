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

        // نقارن دائمًا — حتى لو لم يوجد المستخدم — حتى لا يكشف زمن
        // الاستجابة أي البُرد مسجَّلة فعلًا.
        const matches = await bcrypt.compare(
          password,
          user?.passwordHash ?? DUMMY_HASH,
        );

        if (!user || !matches) return null;
        if (!user.isActive) throw new AccountDisabledError();

        await db.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          username: user.username,
          role: user.role,
          mustChangePassword: user.mustChangePassword,
        };
      },
    }),
  ],
});
