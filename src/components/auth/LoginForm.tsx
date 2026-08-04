"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/Button";
import { PasswordField } from "@/components/ui/PasswordField";
import { Input, Label, HelpText, Checkbox } from "@/components/ui/Field";
import { loginSchema, type LoginInput, type LoginValues } from "@/lib/validation";
import { authenticate } from "@/app/(auth)/login/actions";
import { SITE } from "@/lib/site";

export function LoginForm() {
  const [formError, setFormError] = React.useState<string | null>(null);
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("next") ?? undefined;
  const passwordChanged = searchParams.get("passwordChanged") === "1";

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput, unknown, LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", remember: false },
    mode: "onSubmit",
  });

  async function onSubmit(values: LoginValues) {
    setFormError(null);
    // عند النجاح تُحوِّل الدالة الصفحة ولا تعود بقيمة
    const result = await authenticate(values, callbackUrl);
    setFormError(result.message);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-3">
      {/* رسالة خطأ عامة على مستوى النموذج */}
      {passwordChanged && !formError && (
        <div className="rounded-[10px] border border-success/50 bg-success/10 px-4 py-3 text-xs leading-relaxed text-success">
          تم تغيير كلمة المرور. سجّل الدخول بها.
        </div>
      )}

      {formError && (
        <div
          role="alert"
          className="rounded-[10px] border border-danger/60 bg-danger/10 px-4 py-3 text-xs leading-relaxed text-danger"
        >
          {formError}
        </div>
      )}

      <div>
        {/* تسمية حقيقية لا placeholder: النص النائب يختفي عند الكتابة
            فيفقد المستخدم مرجعه، ولا يُعدّ تسمية في معايير الوصولية. */}
        <Label htmlFor="email">البريد الإلكتروني</Label>
        <Input
          id="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="name@example.com"
          invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "email-error" : undefined}
          {...register("email")}
        />
        {errors.email && (
          <HelpText id="email-error" tone="danger" role="alert">
            {errors.email.message}
          </HelpText>
        )}
      </div>

      <div>
        {/* بلا مؤشّر قوة عند الدخول: الكلمة قائمة لا تُنشأ، وتقييمها
            هنا لوم بلا فائدة — لا سبيل لتغييرها من هذه الشاشة. */}
        <PasswordField
          id="password"
          label="كلمة المرور"
          autoComplete="current-password"
          error={errors.password?.message}
          {...register("password")}
        />
      </div>

      <div className="pt-1">
        <Checkbox id="remember" label="تذكّرني" {...register("remember")} />
      </div>

      <Button type="submit" fullWidth loading={isSubmitting} className="mt-1">
        {isSubmitting ? "جارٍ التحقق" : "دخول"}
      </Button>

      <div className="flex items-center justify-between text-xs">
        {/* الحد الأدنى ٤٤ بكسل للمس. الحشو يوسّع منطقة النقر، و`-ms-2`
            يعيد النص إلى محاذاته الأصلية فلا يبدو مزاحًا عن الحافة. */}
        <Link
          href="/forgot-password"
          className="-ms-2 inline-flex min-h-touch items-center rounded-[10px] px-2
            text-accent-bright transition-colors hover:text-paper"
        >
          نسيت كلمة المرور؟
        </Link>
        <span className="text-subtle">
          الدعم الفني:{" "}
          <span className="numeric text-muted">{SITE.supportPhone}</span>
        </span>
      </div>

      <p className="border-t border-line pt-3 text-center text-xs text-subtle">
        ليس لديك حساب؟{" "}
        <Link
          href="/signup"
          className="inline-flex min-h-touch items-center rounded-[10px] px-2
            text-accent-bright transition-colors hover:text-paper"
        >
          أنشئ واحدًا
        </Link>
      </p>
    </form>
  );
}
