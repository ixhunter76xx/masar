"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { setTermStatus } from "@/app/(app)/settings/actions";
import { TermStatus } from "@/generated/prisma/enums";

export function TermStatusToggle({
  termId,
  status,
}: {
  termId: string;
  status: TermStatus;
}) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const active = status === TermStatus.ACTIVE;

  async function toggle() {
    setBusy(true);
    await setTermStatus(
      termId,
      active ? TermStatus.ARCHIVED : TermStatus.ACTIVE,
    );
    router.refresh();
    setBusy(false);
  }

  return (
    <Button variant="secondary" size="sm" loading={busy} onClick={toggle}>
      {active ? "أرشفة" : "إعادة التنشيط"}
    </Button>
  );
}
