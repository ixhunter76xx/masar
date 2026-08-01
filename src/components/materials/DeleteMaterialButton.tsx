"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Trash2, AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/Button";

/**
 * حذف مادة تعليمية.
 * يطلب تأكيدًا داخل البطاقة نفسها — بلا نافذة منبثقة — لأن الحذف
 * لا رجعة فيه: الملف يُمحى من التخزين ولا يمكن استرجاعه.
 */
export function DeleteMaterialButton({
  courseId,
  materialId,
  title,
}: {
  courseId: string;
  materialId: string;
  title: string;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function remove() {
    setBusy(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/courses/${courseId}/videos/${materialId}`,
        { method: "DELETE" },
      );
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error ?? "تعذّر الحذف.");
        setBusy(false);
        return;
      }

      router.refresh();
    } catch {
      setError("تعذّر الاتصال بالخادم.");
      setBusy(false);
    }
  }

  if (!confirming) {
    return (
      <Button
        variant="quiet"
        size="sm"
        onClick={() => setConfirming(true)}
        aria-label={`حذف ${title}`}
        className="shrink-0 hover:text-danger"
      >
        <Trash2 size={15} strokeWidth={1.75} aria-hidden="true" />
      </Button>
    );
  }

  return (
    <div className="shrink-0">
      <div className="flex items-center gap-2">
        <Button variant="danger" size="sm" loading={busy} onClick={remove}>
          {busy ? "جارٍ الحذف" : "تأكيد الحذف"}
        </Button>
        <Button
          variant="quiet"
          size="sm"
          disabled={busy}
          onClick={() => {
            setConfirming(false);
            setError(null);
          }}
        >
          تراجع
        </Button>
      </div>

      {!error && (
        <p className="mt-1.5 flex items-center justify-end gap-1.5 text-[11px] text-warning">
          <AlertTriangle size={12} strokeWidth={1.75} aria-hidden="true" />
          يُحذف الملف نهائيًا ولا يمكن استرجاعه
        </p>
      )}

      {error && (
        <p role="alert" className="mt-1.5 text-[11px] text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
