"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { setUserActive } from "@/app/(app)/settings/actions";

export function UserActiveToggle({
  userId,
  isActive,
}: {
  userId: string;
  isActive: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function toggle() {
    setBusy(true);
    setError(null);
    const result = await setUserActive(userId, !isActive);
    if (!result.ok) setError(result.message);
    else router.refresh();
    setBusy(false);
  }

  return (
    <div className="text-end">
      <Button variant="secondary" size="sm" loading={busy} onClick={toggle}>
        {isActive ? "تعطيل" : "تفعيل"}
      </Button>
      {error && (
        <p role="alert" className="mt-1 text-[11px] text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
