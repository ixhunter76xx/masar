import type { Metadata } from "next";
import { Suspense } from "react";

import { Card } from "@/components/ui/Card";
import { Logo } from "@/components/ui/Logo";
import { LoginForm } from "@/components/auth/LoginForm";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "تسجيل الدخول",
  description: `تسجيل الدخول إلى ${SITE.tagline}`,
};

export default function LoginPage() {
  return (
    <Card className="px-7 py-8">
      {/* الهوية */}
      <header className="flex flex-col items-center text-center mb-7">
        <Logo size={80} />
        <h1 className="mt-5 text-[22px] font-bold tracking-tight text-paper">
          تسجيل الدخول
        </h1>
        <p className="mt-1.5 text-[13px] text-muted">{SITE.tagline}</p>
      </header>

      {/* Suspense مطلوب: النموذج يقرأ معامل ?next من الرابط */}
      <Suspense fallback={<div className="h-[248px]" />}>
        <LoginForm />
      </Suspense>
    </Card>
  );
}
