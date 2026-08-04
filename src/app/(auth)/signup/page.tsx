import type { Metadata } from "next";
import { Suspense } from "react";

import { Card } from "@/components/ui/Card";
import { Logo } from "@/components/ui/Logo";
import { SignupForm } from "@/components/auth/SignupForm";
import { SITE } from "@/lib/site";

/** تصيير عند الطلب — الـ nonce يُولَّد لكل طلب، وصفحة مولَّدة مسبقًا تُحجب */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "إنشاء حساب",
  description: `أنشئ حسابك في ${SITE.tagline}`,
};

export default function SignupPage() {
  return (
    <Card className="px-7 py-8">
      <header className="mb-7 flex flex-col items-center text-center">
        <Logo size={80} />
        <h1 className="mt-5 text-[22px] font-bold tracking-tight text-paper">
          إنشاء حساب
        </h1>
        <p className="mt-1.5 text-[13px] text-muted">
          دقيقة واحدة، ثم تختار ما تحتاجه من الدورات.
        </p>
      </header>

      {/* Suspense مطلوب: النموذج يقرأ معامل ?next من الرابط */}
      <Suspense fallback={<div className="h-[420px]" />}>
        <SignupForm />
      </Suspense>
    </Card>
  );
}
