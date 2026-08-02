"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/Button";
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
    defaultValues: { username: "", password: "", remember: false },
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
        <Label htmlFor="username">اسم المستخدم</Label>
        <Input
          id="username"
          autoComplete="username"
          placeholder="الرقم الأكاديمي أو البريد المؤسسي"
          invalid={Boolean(errors.username)}
          aria-describedby={errors.username ? "username-error" : undefined}
          {...register("username")}
        />
        {errors.username && (
          <HelpText id="username-error" tone="danger" role="alert">
            {errors.username.message}
          </HelpText>
        )}
      </div>

      <div>
        <Label htmlFor="password">كلمة المرور</Label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          invalid={Boolean(errors.password)}
          aria-describedby={errors.password ? "password-error" : undefined}
          {...register("password")}
        />
        {errors.password && (
          <HelpText id="password-error" tone="danger" role="alert">
            {errors.password.message}
          </HelpText>
        )}
      </div>

      <div className="pt-1">
        <Checkbox id="remember" label="تذكّرني" {...register("remember")} />
      </div>

      <Button type="submit" fullWidth loading={isSubmitting} className="mt-1">
        {isSubmitting ? "جارٍ التحقق" : "دخول"}
      </Button>

      <div className="flex items-center justify-between pt-3 text-xs">
        <Link
          href="/forgot-password"
          className="text-accent-bright hover:text-paper transition-colors"
        >
          نسيت كلمة المرور؟
        </Link>
        <span className="text-disabled">
          الدعم الفني:{" "}
          <span className="numeric text-muted">{SITE.supportPhone}</span>
        </span>
      </div>
    </form>
  );
}
