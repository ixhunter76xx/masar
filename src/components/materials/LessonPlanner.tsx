"use client";

import * as React from "react";
import { ar } from "@/lib/numerals";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  ChevronUp,
  Loader2,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";

import { Card } from "@/components/ui/Card";
import { uploadVideo } from "@/lib/upload-client";
import {
  createPlannedLesson,
  deletePlannedLesson,
  moveLesson,
  renameLesson,
  setFreePreviewLesson,
} from "@/app/(app)/learn/[courseId]/lessons/actions";

export type PlannerLesson = {
  id: string;
  title: string;
  isFreePreview: boolean;
  /** الملف مرفوع وجاهز للتشغيل */
  isReady: boolean;
  /** رُفع فعلًا (بمفتاح) — يميّز «قيد الرفع» عن «مخطَّط» */
  hasFile: boolean;
  isPublished: boolean;
};

/**
 * سكّة المقرر — تخطيطًا ورفعًا في مكان واحد.
 *
 * ── ما الذي كان مكسورًا ─────────────────────────────────────────────
 * الطريق الوحيد لإنشاء درس كان رفع فيديو، فلم يكن المدرّس يستطيع
 * تخطيط منهجه قبل التصوير. والرفع كان نموذجًا عامًّا يُطلب فيه العنوان
 * يدويًا وينشئ صفًّا جديدًا دائمًا — فلا صلة بينه وبين درس بعينه.
 *
 * هنا يُبنى المنهج أولًا: عناوين وترتيب ودرس معاينة. ثم **كل درس هو
 * نقطة رفعه** — عنوانه ومكانه معروفان فلا يُعادان.
 *
 * الرفع العام لم يُمسّ: المواد غير المرتبطة بدرس بعينه تبقى عليه.
 */
export function LessonPlanner({
  courseId,
  lessons,
}: {
  courseId: string;
  lessons: PlannerLesson[];
}) {
  const router = useRouter();
  const [busy, setBusy] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [title, setTitle] = React.useState("");
  const [percent, setPercent] = React.useState<Record<string, number>>({});

  const fileInputs = React.useRef<Record<string, HTMLInputElement | null>>({});

  async function run(key: string, fn: () => Promise<{ ok: boolean; message?: string }>) {
    setBusy(key);
    setError(null);
    const result = await fn();
    if (result.ok) router.refresh();
    else setError(result.message ?? "تعذّر إتمام العملية.");
    setBusy(null);
  }

  async function onAdd(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    await run("add", () => createPlannedLesson(courseId, data));
    setTitle("");
  }

  /** رفع فيديو إلى درس بعينه — لا عنوان يُطلب، الدرس يحمله */
  async function onPick(lessonId: string, file: File) {
    setBusy(lessonId);
    setError(null);
    setPercent((p) => ({ ...p, [lessonId]: 0 }));

    try {
      await uploadVideo({
        courseId,
        file,
        materialId: lessonId,
        onProgress: (value) => setPercent((p) => ({ ...p, [lessonId]: value })),
        signal: new AbortController().signal,
      });
      router.refresh();
    } catch (uploadError) {
      setError(
        uploadError instanceof Error ? uploadError.message : "تعذّر رفع الفيديو.",
      );
    } finally {
      setBusy(null);
      setPercent((p) => {
        const next = { ...p };
        delete next[lessonId];
        return next;
      });
    }
  }

  return (
    <section className="mb-8">
      <h3 className="mb-3 text-sm font-medium text-paper">
        سكّة المقرر{" "}
        <span className="numeric text-[11px] text-subtle">{ar(lessons.length)}</span>
      </h3>

      <Card className="mb-3 px-4 py-3.5">
        <form onSubmit={onAdd} className="flex flex-wrap items-center gap-2">
          <label htmlFor="new-lesson" className="sr-only">
            عنوان الدرس الجديد
          </label>
          <input
            id="new-lesson"
            name="title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="عنوان الدرس — مثال: الاستفهام"
            className="input-field flex-1 text-[13px]"
          />
          <button
            type="submit"
            disabled={busy !== null}
            className="press inline-flex min-h-touch items-center gap-1.5 rounded-[10px]
              border border-line bg-ink px-3.5 text-xs text-paper
              transition-colors hover:border-accent-deep disabled:cursor-not-allowed"
          >
            {busy === "add" ? (
              <Loader2 size={14} className="animate-spin" aria-hidden="true" />
            ) : (
              <Plus size={14} strokeWidth={2} aria-hidden="true" />
            )}
            أضف درسًا
          </button>
        </form>
        <p className="mt-2 text-[11px] text-subtle">
          خطّط المنهج كاملًا الآن، وارفع فيديو كل درس متى صُوّر.
        </p>
      </Card>

      <ul className="space-y-2">
        {lessons.map((lesson, index) => (
          <li key={lesson.id}>
            <Card className="px-4 py-3">
              <div className="flex flex-wrap items-center gap-3">
                <span className="numeric w-5 shrink-0 text-[11px] text-subtle">
                  {ar(index + 1)}
                </span>

                <span className="min-w-0 flex-1 truncate text-[13px] text-paper">
                  {lesson.title}
                </span>

                <Status lesson={lesson} percent={percent[lesson.id]} />

                {/* الترتيب: يغيّر `position` وحده، فلا معرّف يتحرّك ولا
                    رابط باقة أو تقييم ينقطع */}
                <span className="flex items-center">
                  <IconButton
                    label={`تحريك ${lesson.title} لأعلى`}
                    disabled={index === 0 || busy !== null}
                    onClick={() => run(lesson.id, () => moveLesson(courseId, lesson.id, "up"))}
                  >
                    <ChevronUp size={15} strokeWidth={1.75} aria-hidden="true" />
                  </IconButton>
                  <IconButton
                    label={`تحريك ${lesson.title} لأسفل`}
                    disabled={index === lessons.length - 1 || busy !== null}
                    onClick={() => run(lesson.id, () => moveLesson(courseId, lesson.id, "down"))}
                  >
                    <ChevronDown size={15} strokeWidth={1.75} aria-hidden="true" />
                  </IconButton>
                </span>

                {/* نقطة الرفع الخاصة بهذا الدرس */}
                {!lesson.isReady && (
                  <>
                    <input
                      ref={(element) => {
                        fileInputs.current[lesson.id] = element;
                      }}
                      type="file"
                      accept="video/mp4"
                      className="sr-only"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) void onPick(lesson.id, file);
                        event.target.value = "";
                      }}
                    />
                    <button
                      type="button"
                      disabled={busy !== null}
                      onClick={() => fileInputs.current[lesson.id]?.click()}
                      className="press inline-flex min-h-touch items-center gap-1.5 rounded-[10px]
                        border border-line bg-ink px-3 text-xs text-paper
                        transition-colors hover:border-accent-deep disabled:cursor-not-allowed"
                    >
                      {busy === lesson.id ? (
                        <Loader2 size={14} className="animate-spin" aria-hidden="true" />
                      ) : (
                        <Upload size={14} strokeWidth={1.75} aria-hidden="true" />
                      )}
                      ارفع الفيديو
                    </button>
                  </>
                )}
              </div>

              <div className="mt-2.5 flex flex-wrap items-center gap-4 border-t border-line/70 pt-2.5">
                <label className="flex cursor-pointer items-center gap-2 text-[11px] text-muted">
                  <input
                    type="checkbox"
                    checked={lesson.isFreePreview}
                    disabled={busy !== null}
                    onChange={(event) =>
                      run(lesson.id, () =>
                        setFreePreviewLesson(courseId, lesson.id, event.target.checked),
                      )
                    }
                    className="size-3.5 accent-[var(--color-action)]"
                  />
                  معاينة مجانية
                </label>

                <RenameForm
                  courseId={courseId}
                  lesson={lesson}
                  disabled={busy !== null}
                  onDone={() => router.refresh()}
                />

                {/* الحذف للمخطَّط وحده: المرفوع يُحذف من صفحته ليُمحى
                    ملفه من R2 معه */}
                {!lesson.hasFile && (
                  <button
                    type="button"
                    disabled={busy !== null}
                    onClick={() =>
                      run(lesson.id, () => deletePlannedLesson(courseId, lesson.id))
                    }
                    className="press ms-auto inline-flex items-center gap-1 text-[11px]
                      text-subtle transition-colors hover:text-danger
                      disabled:cursor-not-allowed"
                  >
                    <Trash2 size={13} strokeWidth={1.75} aria-hidden="true" />
                    حذف
                  </button>
                )}
              </div>
            </Card>
          </li>
        ))}
      </ul>

      {lessons.length === 0 && (
        <p className="rounded-[12px] border border-line bg-panel px-5 py-6 text-[13px] text-subtle">
          لا دروس بعد. ابدأ بإضافة عناوين المنهج أعلاه — الفيديو يأتي لاحقًا.
        </p>
      )}

      {error && (
        <p role="alert" className="mt-2 text-[11px] leading-relaxed text-danger">
          {error}
        </p>
      )}
    </section>
  );
}

/** زرّ أيقونة صغير — التسمية مطلوبة لأنه بلا نصّ مرئي */
function IconButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="press grid size-8 place-items-center rounded-[8px] text-subtle
        transition-colors hover:text-paper disabled:cursor-not-allowed
        disabled:opacity-40"
    >
      {children}
    </button>
  );
}

function Status({
  lesson,
  percent,
}: {
  lesson: PlannerLesson;
  percent: number | undefined;
}) {
  if (percent !== undefined) {
    return (
      <span className="numeric shrink-0 text-[11px] text-accent">{ar(percent)}٪</span>
    );
  }
  if (lesson.isReady) {
    return (
      <span className="shrink-0 rounded-full border border-success/50 bg-success/10 px-2 py-0.5 text-[10px] text-success">
        متاح
      </span>
    );
  }
  if (lesson.hasFile) {
    return (
      <span className="shrink-0 rounded-full border border-warning/40 px-2 py-0.5 text-[10px] text-warning">
        قيد الرفع
      </span>
    );
  }
  return (
    <span className="shrink-0 rounded-full border border-line px-2 py-0.5 text-[10px] text-subtle">
      بانتظار الرفع
    </span>
  );
}

function RenameForm({
  courseId,
  lesson,
  disabled,
  onDone,
}: {
  courseId: string;
  lesson: PlannerLesson;
  disabled: boolean;
  onDone: () => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState(lesson.title);

  if (!open) {
    return (
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(true)}
        className="press text-[11px] text-subtle transition-colors hover:text-paper disabled:cursor-not-allowed"
      >
        تعديل العنوان
      </button>
    );
  }

  return (
    <form
      onSubmit={async (event) => {
        event.preventDefault();
        const data = new FormData();
        data.set("title", value);
        await renameLesson(courseId, lesson.id, data);
        setOpen(false);
        onDone();
      }}
      className="flex items-center gap-2"
    >
      <label htmlFor={`rename-${lesson.id}`} className="sr-only">
        عنوان {lesson.title}
      </label>
      <input
        id={`rename-${lesson.id}`}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        className="field-motion h-8 rounded-[8px] border border-line bg-ink px-2.5
          text-[12px] text-paper focus:border-accent focus:outline-none"
      />
      <button type="submit" className="press text-[11px] text-accent">
        حفظ
      </button>
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="press text-[11px] text-subtle"
      >
        إلغاء
      </button>
    </form>
  );
}
