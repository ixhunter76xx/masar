import type { Metadata } from "next";
import Link from "next/link";

import { Card } from "@/components/ui/Card";
import { Logo } from "@/components/ui/Logo";
import { SITE } from "@/lib/site";

export const metadata: Metadata = { title: "استعادة كلمة المرور" };

export default function ForgotPasswordPage() {
  return (
    <Card className="px-7 py-8 text-center">
      <Logo size={72} className="mx-auto" />
      <h1 className="mt-5 text-[20px] font-bold text-paper">
        استعادة كلمة المرور
      </h1>
      <p className="mt-3 text-[13px] leading-relaxed text-muted">
        للحصول على كلمة مرور جديدة، تواصل مع الدعم الفني في {SITE.name} على
        الرقم <span className="numeric text-paper">{SITE.supportPhone}</span>.
      </p>
      <Link
        href="/login"
        className="mt-6 inline-block text-xs text-accent-bright hover:text-paper transition-colors"
      >
        العودة إلى تسجيل الدخول
      </Link>
    </Card>
  );
}
