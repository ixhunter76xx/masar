"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { ActionResult } from "@/app/(app)/settings/actions";

/**
 * غلاف موحّد لنماذج الإدارة: يستدعي إجراء الخادم، ويعرض الخطأ،
 * ويُفرّغ الحقول ويحدّث الصفحة عند النجاح.
 */
export function AdminForm({
  title,
  submitLabel,
  action,
  children,
}: {
  title: string;
  submitLabel: string;
  action: (formData: FormData) => Promise<ActionResult>;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const formRef = React.useRef<HTMLFormElement>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    const result = await action(new FormData(event.currentTarget));

    if (result.ok) {
      formRef.current?.reset();
      router.refresh();
    } else {
      setError(result.message);
    }
    setBusy(false);
  }

  return (
    <Card className="mb-6 px-5 py-5">
      <h2 className="mb-4 text-sm font-medium text-paper">{title}</h2>

      <form ref={formRef} onSubmit={onSubmit} noValidate className="space-y-3">
        {children}

        {error && (
          <p role="alert" className="text-xs leading-relaxed text-danger">
            {error}
          </p>
        )}

        <Button type="submit" size="sm" loading={busy}>
          {submitLabel}
        </Button>
      </form>
    </Card>
  );
}
