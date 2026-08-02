"use client";

import * as React from "react";
import { KeyRound, CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { FormField } from "@/components/ui/Field";
import {
  changePassword,
  signOutAfterChange,
} from "@/app/(app)/profile/actions";

export function ChangePasswordForm({ forced }: { forced: boolean }) {
  const [busy, setBusy] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    const result = await changePassword(new FormData(event.currentTarget));

    if (result.ok) {
      setDone(true);
      // مهلة قصيرة ليقرأ المستخدم الرسالة قبل إنهاء الجلسة
      setTimeout(() => void signOutAfterChange(), 1500);
    } else {
      setError(result.message);
      setBusy(false);
    }
  }

  if (done) {
    return (
      <Card className="flex items-center gap-3 px-5 py-5">
        <CheckCircle2
          size={18}
          strokeWidth={1.75}
          aria-hidden="true"
          className="text-success"
        />
        <p className="text-sm text-paper">
          تم تغيير كلمة المرور. جارٍ إنهاء الجلسة — سجّل الدخول بكلمة المرور
          الجديدة.
        </p>
      </Card>
    );
  }

  return (
    <Card className="px-5 py-5">
      <h2 className="mb-1 flex items-center gap-2 text-sm font-medium text-paper">
        <KeyRound size={16} strokeWidth={1.75} aria-hidden="true" />
        تغيير كلمة المرور
      </h2>
      <p className="mb-4 text-[11px] text-subtle">
        ستُنهى جلستك بعد التغيير وتحتاج لتسجيل الدخول من جديد.
      </p>

      <form onSubmit={onSubmit} noValidate className="space-y-3">
        <FormField
          id="cur-pw"
          name="currentPassword"
          label={forced ? "كلمة المرور المبدئية" : "كلمة المرور الحالية"}
          type="password"
          autoComplete="current-password"
          required
        />
        <FormField
          id="new-pw"
          name="newPassword"
          label="كلمة المرور الجديدة"
          type="password"
          autoComplete="new-password"
          hint="٨ خانات على الأقل."
          required
        />
        <FormField
          id="cnf-pw"
          name="confirmPassword"
          label="تأكيد كلمة المرور الجديدة"
          type="password"
          autoComplete="new-password"
          required
        />

        {error && (
          <p role="alert" className="text-xs leading-relaxed text-danger">
            {error}
          </p>
        )}

        <Button type="submit" size="sm" loading={busy}>
          حفظ كلمة المرور
        </Button>
      </form>
    </Card>
  );
}
