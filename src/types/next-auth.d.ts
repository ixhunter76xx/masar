import type { DefaultSession } from "next-auth";
import type { Role } from "@/generated/prisma/enums";

declare module "next-auth" {
  interface User {
    role: Role;
    username: string | null;
    mustChangePassword: boolean;
    /** رقم إصدار الجلسة وقت الدخول — يُقارَن بالجدول لإبطال الجلسات */
    sessionVersion: number;
  }

  interface Session {
    user: {
      id: string;
      role: Role;
      username: string | null;
      mustChangePassword: boolean;
    /** رقم إصدار الجلسة وقت الدخول — يُقارَن بالجدول لإبطال الجلسات */
    sessionVersion: number;
    } & DefaultSession["user"];
  }
}

// ملاحظة: `next-auth/jwt` مجرّد إعادة تصدير لـ `@auth/core/jwt`،
// لذلك التوسعة يجب أن تستهدف الوحدة الأصلية وإلا لن تُدمج.
declare module "@auth/core/jwt" {
  interface JWT {
    role: Role;
    username: string | null;
    mustChangePassword: boolean;
    /** رقم إصدار الجلسة وقت الدخول — يُقارَن بالجدول لإبطال الجلسات */
    sessionVersion: number;
  }
}
