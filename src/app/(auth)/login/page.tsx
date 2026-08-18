import type { Metadata } from "next";
import { Suspense } from "react";

import { Card } from "@/components/ui/Card";
import { Logo } from "@/components/ui/Logo";
import { LoginForm } from "@/components/auth/LoginForm";
import { SITE } from "@/lib/site";

/**
 * تصيير عند الطلب — مطلوب لسياسة أمان المحتوى.
 *
 * الـ nonce يُولَّد لكل طلب في middleware، وصفحة مولَّدة مسبقًا تُحفظ
 * بنصوص بلا nonce فتحجبها السياسة كاملةً. باقي صفحات المنصة ديناميكية
 * أصلًا لأنها تقرأ الجلسة؛ هاتان الصفحتان العامتان الاستثناء الوحيد.
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "تسجيل الدخول",
  description: `تسجيل الدخول إلى ${SITE.tagline}`,
};

export default function LoginPage() {
  /* الحشو مرن: `clamp(1.6rem,4vw,2.3rem)` كما في `.authcard` */
  return (
    <Card className="p-[clamp(1.6rem,4vw,2.3rem)]">
      {/* الهوية — `.authhead`: شبكة مركزيّة بفجوة ‎.9rem */}
      <header className="mb-[1.8rem] grid justify-items-center gap-[0.9rem] text-center">
        <Logo size={44} variant="full" bare />
        <div>
          <h1 className="mb-[0.3rem] text-[22px] font-bold tracking-tight text-paper">
            أهلًا بعودتك
          </h1>
          <p className="text-[13px] text-muted">ادخل لتتابع من حيث توقّفت.</p>
        </div>
      </header>

      {/* Suspense مطلوب: النموذج يقرأ معامل ?next من الرابط */}
      <Suspense fallback={<div className="h-[248px]" />}>
        <LoginForm />
      </Suspense>
    </Card>
  );
}
