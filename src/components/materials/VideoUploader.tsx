"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Upload, X, CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { FormField, HelpText } from "@/components/ui/Field";
import { uploadVideo } from "@/lib/upload-client";
import {
  ALLOWED_VIDEO_EXT,
  ALLOWED_VIDEO_TYPE,
  MAX_VIDEO_BYTES,
  formatBytes,
  validateVideoFile,
} from "@/lib/uploads";

type Phase = "idle" | "uploading" | "done" | "error";

export function VideoUploader({ courseId }: { courseId: string }) {
  const router = useRouter();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const controllerRef = React.useRef<AbortController | null>(null);

  const [file, setFile] = React.useState<File | null>(null);
  const [title, setTitle] = React.useState("");
  const [phase, setPhase] = React.useState<Phase>("idle");
  const [percent, setPercent] = React.useState(0);
  const [error, setError] = React.useState<string | null>(null);

  const busy = phase === "uploading";

  function pickFile(selected: File | null) {
    setError(null);
    if (!selected) return setFile(null);

    const problem = validateVideoFile(selected);
    if (problem) {
      setFile(null);
      setError(problem);
      return;
    }

    setFile(selected);
    if (!title) setTitle(selected.name.replace(/\.mp4$/i, ""));
  }

  function reset() {
    setFile(null);
    setTitle("");
    setPercent(0);
    setPhase("idle");
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function start() {
    if (!file || !title.trim()) {
      setError("اختر ملفًا وأدخل عنوانًا للمحاضرة.");
      return;
    }

    const controller = new AbortController();
    controllerRef.current = controller;
    setPhase("uploading");
    setPercent(0);
    setError(null);

    try {
      await uploadVideo({
        courseId,
        file,
        title: title.trim(),
        onProgress: setPercent,
        signal: controller.signal,
      });
      setPhase("done");
      router.refresh();
    } catch (e) {
      if (controller.signal.aborted) {
        reset();
        return;
      }
      setPhase("error");
      setError(e instanceof Error ? e.message : "تعذّر رفع الفيديو.");
    } finally {
      controllerRef.current = null;
    }
  }

  if (phase === "done") {
    return (
      <Card className="mb-6 flex items-center gap-3 px-5 py-4">
        <CheckCircle2
          size={18}
          strokeWidth={1.75}
          className="text-success"
          aria-hidden="true"
        />
        <p className="flex-1 text-sm text-paper">تم رفع المحاضرة ونشرها.</p>
        <Button variant="secondary" size="sm" onClick={reset}>
          رفع محاضرة أخرى
        </Button>
      </Card>
    );
  }

  return (
    <Card className="mb-6 px-5 py-5">
      <h3 className="text-sm font-medium text-paper">رفع محاضرة مسجّلة</h3>
      <p className="mt-1 text-[11px] text-subtle">
        MP4 فقط · الحد الأقصى {formatBytes(MAX_VIDEO_BYTES)}
      </p>

      <div className="mt-4 space-y-3">
        <div>
          <input
            ref={inputRef}
            type="file"
            accept={`${ALLOWED_VIDEO_TYPE},${ALLOWED_VIDEO_EXT}`}
            disabled={busy}
            onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
            className="block w-full text-[13px] text-muted
              file:me-3 file:rounded-[10px] file:border-0
              file:bg-action file:px-4 file:py-2.5
              file:text-[13px] file:font-medium file:text-ink
              hover:file:bg-accent-bright
              disabled:file:bg-disabled"
          />
          {file && (
            <HelpText>
              {file.name} · <span className="numeric">{formatBytes(file.size)}</span>
            </HelpText>
          )}
        </div>

        <FormField
          id="material-title"
          label="عنوان المحاضرة"
          placeholder="مثال: الوحدة الثالثة — النهايات"
          value={title}
          disabled={busy}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      {busy && (
        <div className="mt-4">
          <div className="flex items-baseline justify-between text-[11px]">
            <span className="text-muted">جارٍ الرفع…</span>
            <span className="numeric text-paper">{percent}%</span>
          </div>
          <div
            role="progressbar"
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="تقدّم رفع الفيديو"
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
          <p className="mt-2 text-[11px] text-subtle">
            لا تُغلق الصفحة. يُرفع الملف على أجزاء، ويُعاد رفع الجزء الفاشل
            وحده عند تعثّر الاتصال.
          </p>
        </div>
      )}

      {error && (
        <p role="alert" className="mt-3 text-xs leading-relaxed text-danger">
          {error}
        </p>
      )}

      <div className="mt-4 flex gap-2">
        {busy ? (
          <Button
            variant="danger"
            size="sm"
            onClick={() => controllerRef.current?.abort()}
          >
            <X size={15} strokeWidth={1.75} aria-hidden="true" />
            إلغاء الرفع
          </Button>
        ) : (
          <Button size="sm" onClick={start} disabled={!file || !title.trim()}>
            <Upload size={15} strokeWidth={1.75} aria-hidden="true" />
            رفع ونشر
          </Button>
        )}
      </div>
    </Card>
  );
}
