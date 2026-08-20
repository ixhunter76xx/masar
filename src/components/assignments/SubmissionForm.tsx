"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Upload, Paperclip } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Label, HelpText, Textarea } from "@/components/ui/Field";
import { formatBytes } from "@/lib/uploads";

export function SubmissionForm({
  courseId,
  assignmentId,
  allowedExtensions,
  maxFileMb,
  existingNote,
  existingFileName,
  isLate,
}: {
  courseId: string;
  assignmentId: string;
  allowedExtensions: string[];
  maxFileMb: number;
  existingNote: string | null;
  existingFileName: string | null;
  isLate: boolean;
}) {
  const router = useRouter();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [file, setFile] = React.useState<File | null>(null);
  const [note, setNote] = React.useState(existingNote ?? "");
  const [percent, setPercent] = React.useState(0);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const endpoint = `/api/courses/${courseId}/assignments/${assignmentId}/submission`;
  const maxBytes = maxFileMb * 1024 * 1024;

  function pick(selected: File | null) {
    setError(null);
    if (!selected) return setFile(null);

    const ext = selected.name.split(".").pop()?.toLowerCase() ?? "";
    if (!allowedExtensions.includes(ext)) {
      setFile(null);
      setError(`الصيغ المسموحة: ${allowedExtensions.join("، ")}.`);
      return;
    }
    if (selected.size > maxBytes) {
      setFile(null);
      setError(`حجم الملف ${formatBytes(selected.size)} — الحد ${maxFileMb} ميجابايت.`);
      return;
    }
    setFile(selected);
  }

  /** رفع مباشر إلى R2 — XHR لأن fetch لا يوفّر تقدّم الرفع */
  function put(url: string, blob: File): Promise<void> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", url, true);
      xhr.setRequestHeader("content-type", blob.type);
      xhr.upload.onprogress = (e) =>
        setPercent(Math.round((e.loaded / e.total) * 100));
      xhr.onload = () =>
        xhr.status >= 200 && xhr.status < 300
          ? resolve()
          : reject(new Error(`فشل الرفع (${xhr.status}).`));
      // نفس فخّ CORS الموصوف في upload-client.ts — الرفع يعبر النطاق إلى R2
      xhr.onerror = () =>
        reject(
          new Error(
            "تعذّر الوصول إلى التخزين أثناء الرفع — تحقّق من الاتصال، " +
              "ومن أن نطاق الموقع (بمنفذه) مضاف في سياسة CORS على R2.",
          ),
        );
      xhr.send(blob);
    });
  }

  async function submit() {
    if (!file && !note.trim()) {
      setError("أرفق ملفًا أو اكتب ملاحظة.");
      return;
    }

    setBusy(true);
    setError(null);
    setPercent(0);

    try {
      let uploaded = false;

      if (file) {
        const signRes = await fetch(endpoint, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            action: "sign",
            fileName: file.name,
            contentType: file.type || "application/octet-stream",
            sizeBytes: file.size,
          }),
        });
        const signData = await signRes.json().catch(() => ({}));
        if (!signRes.ok) throw new Error(signData.error ?? "تعذّر بدء الرفع.");

        await put(signData.url, file);
        uploaded = true;
      }

      const finishRes = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "finish",
          note: note.trim() || undefined,
          uploaded,
        }),
      });
      const finishData = await finishRes.json().catch(() => ({}));
      if (!finishRes.ok) throw new Error(finishData.error ?? "تعذّر التسليم.");

      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "تعذّر التسليم.");
    }
    setBusy(false);
  }

  return (
    <Card className="mb-6 px-5 py-5">
      <h3 className="mb-1 text-sm font-medium text-paper">
        {existingFileName || existingNote ? "إعادة التسليم" : "تسليم الواجب"}
      </h3>
      <p className="mb-4 text-[11px] text-subtle">
        {allowedExtensions.join("، ")} · حتى{" "}
        <span className="numeric">{maxFileMb}</span> ميجابايت
        {existingFileName || existingNote
          ? " · إعادة التسليم تُلغي التصحيح السابق"
          : ""}
      </p>

      {isLate && (
        <p className="mb-4 text-[12px] text-warning">
          الموعد النهائي انتهى — سيُسجَّل تسليمك كمتأخر.
        </p>
      )}

      <div className="space-y-3">
        <div>
          <input
            ref={inputRef}
            type="file"
            accept={allowedExtensions.map((e) => `.${e}`).join(",")}
            disabled={busy}
            onChange={(e) => pick(e.target.files?.[0] ?? null)}
            className="block w-full text-[13px] text-muted
              file:me-3 file:rounded-[10px] file:border-0
              file:bg-action file:px-4 file:py-2.5
              file:text-[13px] file:font-medium file:text-ink
              hover:file:bg-accent-bright disabled:file:bg-disabled"
          />
          {file && (
            <HelpText>
              {file.name} · <span className="numeric">{formatBytes(file.size)}</span>
            </HelpText>
          )}
          {!file && existingFileName && (
            <HelpText>
              <Paperclip
                size={11}
                strokeWidth={1.75}
                aria-hidden="true"
                className="inline align-[-1px] me-1"
              />
              المرفق الحالي: {existingFileName}
            </HelpText>
          )}
        </div>

        <div>
          <Label htmlFor="submission-note">ملاحظة (اختياري)</Label>
          <Textarea
            id="submission-note"
            rows={3}
            value={note}
            disabled={busy}
            onChange={(e) => setNote(e.target.value)}
            placeholder="أي توضيح تودّ إضافته للمدرب…"
          />
        </div>
      </div>

      {busy && percent > 0 && (
        <div className="mt-4">
          <div className="flex items-baseline justify-between text-[11px]">
            <span className="text-muted">جارٍ رفع الملف…</span>
            <span className="numeric text-paper">{percent}%</span>
          </div>
          <div
            role="progressbar"
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
            className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink"
          >
            {/*
              ── `scaleX` لا `width` ────────────────────────────────
              هذا الشريط يتحرّك عشرات المرّات في الثانية طوال رفعٍ قد
              يدوم دقائق. و`width` يعيد التخطيط والرسم في كل خطوة،
              فوق شبكةٍ تعمل أصلًا. و`scaleX` على المركّب وحده.

              والحافّة المستديرة على المسار الخارجي مع `overflow-hidden`
              لا على الحشوة: تحجيمُ حشوةٍ مستديرة يمطّ نصف قطرها
              فتصير بيضويّة عند النسب الصغيرة.

              والمنشأ عند بداية السطر — يمينًا في RTL، وقد وُضع صراحةً
              لأن `transform-origin` لا يقبل الكلمات المنطقية.
            */}
            <div
              className="h-full w-full origin-right bg-action transition-transform duration-200 ease-out"
              style={{ transform: `scaleX(${percent / 100})` }}
            />
          </div>
        </div>
      )}

      {error && (
        <p role="alert" className="mt-3 text-xs leading-relaxed text-danger">
          {error}
        </p>
      )}

      <Button size="sm" loading={busy} onClick={submit} className="mt-4">
        <Upload size={15} strokeWidth={1.75} aria-hidden="true" />
        تسليم
      </Button>
    </Card>
  );
}
