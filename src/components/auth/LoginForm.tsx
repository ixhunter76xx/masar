"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/Button";
import { PasswordField } from "@/components/ui/PasswordField";
import { Input, Label, HelpText, Checkbox } from "@/components/ui/Field";
import { FormAlert } from "@/components/ui/FormAlert";
import { loginSchema, type LoginInput, type LoginValues } from "@/lib/validation";
import { authenticate } from "@/app/(auth)/login/actions";

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
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-[1.15rem]">
      {/* رسالة خطأ عامة على مستوى النموذج */}
      {passwordChanged && !formError && (
        <FormAlert tone="success">تم تغيير كلمة المرور. سجّل الدخول بها.</FormAlert>
      )}

      {formError && <FormAlert>{formError}</FormAlert>}

      <div>
        {/* تسمية حقيقية لا placeholder: النص النائب يختفي عند الكتابة
            فيفقد المستخدم مرجعه، ولا يُعدّ تسمية في معايير الوصولية. */}
        <Label htmlFor="email">البريد الجامعي</Label>
        <Input
          id="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          dir="ltr"
          placeholder="you@stu.uob.edu.bh"
          invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "email-error" : "email-hint"}
          {...register("email")}
        />
        {errors.email ? (
          <HelpText id="email-error" tone="danger" role="alert">
            {errors.email.message}
          </HelpText>
        ) : (
          <HelpText id="email-hint">استعمل بريدك الجامعي إن وُجد.</HelpText>
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

      <div className="flex items-center justify-between gap-4">
        <Checkbox id="remember" label="أبقني داخلًا" {...register("remember")} />
        <Link
          href="/forgot-password"
          className="-me-2 inline-flex min-h-touch items-center rounded-[10px] px-2
            text-xs text-accent-bright transition-colors hover:text-paper"
        >
          نسيت كلمة المرور؟
        </Link>
      </div>

      <Button type="submit" fullWidth loading={isSubmitting}>
        {isSubmitting ? "جارٍ التحقق" : "دخول"}
      </Button>

      <p className="mt-1 text-center text-xs text-subtle">
        ليس لك حساب؟{" "}
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
