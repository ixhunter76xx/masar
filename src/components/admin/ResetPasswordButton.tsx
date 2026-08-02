"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { KeyRound } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { resetUserPassword } from "@/app/(app)/settings/actions";

export function ResetPasswordButton({
  userId,
  name,
}: {
  userId: string;
  name: string;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    const result = await resetUserPassword(
      userId,
      new FormData(event.currentTarget),
    );

    if (result.ok) {
      setDone(true);
      setOpen(false);
      router.refresh();
      setTimeout(() => setDone(false), 3000);
    } else {
      setError(result.message);
    }
    setBusy(false);
  }

  if (done) {
    return <span className="text-[11px] text-success">أُعيد التعيين ✓</span>;
  }

  if (!open) {
    return (
      <Button
        variant="quiet"
        size="sm"
        onClick={() => setOpen(true)}
        aria-label={`إعادة تعيين كلمة مرور ${name}`}
      >
        <KeyRound size={14} strokeWidth={1.75} aria-hidden="true" />
      </Button>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="text-end">
      <div className="flex items-center gap-2">
        <Input
          name="password"
          type="text"
          placeholder="كلمة مرور مبدئية جديدة"
          className="h-9 w-52"
          required
        />
        <Button type="submit" size="sm" loading={busy}>
          تعيين
        </Button>
        <Button
          variant="quiet"
          size="sm"
          disabled={busy}
          onClick={() => setOpen(false)}
        >
          إلغاء
        </Button>
      </div>
      <p className="mt-1 text-[11px] text-subtle">
        سيُجبَر المستخدم على تغييرها عند أول دخول.
      </p>
      {error && (
        <p role="alert" className="mt-1 text-[11px] text-danger">
          {error}
        </p>
      )}
    </form>
  );
}
