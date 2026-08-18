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
    <Card className="p-[clamp(1.6rem,4vw,2.3rem)]">
      <header className="mb-[1.8rem] grid justify-items-center gap-[0.9rem] text-center">
        <Logo size={44} variant="full" bare />
        <div>
          <h1 className="mb-[0.3rem] text-[22px] font-bold tracking-tight text-paper">
            إنشاء حساب
          </h1>
          <p className="text-[13px] text-muted">
            دقيقة واحدة، ثم تختار ما تحتاجه من الدورات.
          </p>
        </div>
      </header>

      {/* Suspense مطلوب: النموذج يقرأ معامل ?next من الرابط */}
      <Suspense fallback={<div className="h-[420px]" />}>
        <SignupForm />
      </Suspense>
    </Card>
  );
}
