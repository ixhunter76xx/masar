"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/Button";
import { PasswordField } from "@/components/ui/PasswordField";
import { Input, Label, HelpText } from "@/components/ui/Field";
import { FormAlert } from "@/components/ui/FormAlert";
import { signupSchema, type SignupInput, type SignupValues } from "@/lib/validation";
import { signup } from "@/app/(auth)/signup/actions";

export function SignupForm() {
  const [formError, setFormError] = React.useState<string | null>(null);
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("next") ?? undefined;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupInput, unknown, SignupValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: "", email: "", phone: "", password: "" },
    mode: "onSubmit",
  });

  async function onSubmit(values: SignupValues) {
    setFormError(null);
    // عند النجاح تُحوِّل الدالة الصفحة ولا تعود بقيمة
    const result = await signup(values, callbackUrl);
    setFormError(result.message);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-3">
      {formError && <FormAlert>{formError}</FormAlert>}

      <div>
        <Label htmlFor="name">الاسم</Label>
        <Input
          id="name"
          autoComplete="name"
          placeholder="الاسم كما تحب أن نناديك"
          invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? "name-error" : undefined}
          {...register("name")}
        />
        {errors.name && (
          <HelpText id="name-error" tone="danger" role="alert">
            {errors.name.message}
          </HelpText>
        )}
      </div>

      <div>
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
        <Label htmlFor="phone">رقم واتساب</Label>
        <Input
          id="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          dir="ltr"
          className="text-start"
          placeholder="33060460"
          invalid={Boolean(errors.phone)}
          aria-describedby={errors.phone ? "phone-error" : "phone-hint"}
          {...register("phone")}
        />
        {errors.phone ? (
          <HelpText id="phone-error" tone="danger" role="alert">
            {errors.phone.message}
          </HelpText>
        ) : (
          /* سبب الطلب معلن: حقلٌ لا يُفهم سببه يُملأ بأرقام وهمية */
          <HelpText id="phone-hint">
            نستخدمه لإتمام الدفع والتواصل بشأن طلبك — لا للرسائل الترويجية.
          </HelpText>
        )}
      </div>

      <div>
        <PasswordField
          id="password"
          label="كلمة المرور"
          autoComplete="new-password"
          showStrength
          hint="٨ خانات على الأقل. المؤشّر إرشادي ولا يمنع الإنشاء."
          error={errors.password?.message}
          {...register("password")}
        />
      </div>

      <Button type="submit" fullWidth loading={isSubmitting} className="mt-1">
        {isSubmitting ? "جارٍ الإنشاء" : "إنشاء الحساب"}
      </Button>

      <p className="pt-1 text-center text-xs text-subtle">
        لديك حساب؟{" "}
        <Link
          href="/login"
          className="inline-flex min-h-touch items-center rounded-[10px] px-2
            text-accent-bright transition-colors hover:text-paper"
        >
          تسجيل الدخول
        </Link>
      </p>
    </form>
  );
}
