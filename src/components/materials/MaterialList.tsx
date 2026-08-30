"use client";

import * as React from "react";
import { ChevronDown, CircleAlert, Clock, FileText, Play } from "lucide-react";

import { VideoPlayer } from "@/components/materials/VideoPlayer";
import { DeleteMaterialButton } from "@/components/materials/DeleteMaterialButton";
import { MaterialKind, MaterialStatus } from "@/generated/prisma/enums";
import { formatBytes } from "@/lib/uploads";
import { relativeTime } from "@/lib/format";
import { groupIntoChapters, type MaterialListItem } from "@/lib/material-track";
import { Counted } from "@/components/ui/Num";

/** صيغ المعدود للملفّات — نظير `LESSON_FORMS`، وتُنقل إلى
    `numerals.ts` متى احتاجها موضعٌ ثانٍ. */
const FILE_FORMS = {
  one: "ملفّ واحد",
  two: "ملفّان",
  few: "ملفات",
  many: "ملفًّا",
} as const;
import { ar, LESSON_FORMS } from "@/lib/numerals";
import { StaggerList, StaggerItem } from "@/components/motion/Stagger";
import { cn } from "@/lib/utils";

/**
 * ═══ المسار — عنصر التوقيع ═══════════════════════════════════════════
 *
 * المنصة اسمها «مسار»، والمنهج فيها **خطٌّ متصل** لا صناديق: سكّة
 * رأسية تمرّ بعُقد، مضيئة خلف ما صار متاحًا وخافتة أمام ما لم يجهز.
 * المقصود أن يرى الطالب موضعه من الطريق في نظرة واحدة.
 *
 * ── ما تغيّر: الفصول، والملفّات على المسار نفسه ─────────────────────
 * كان المسار قائمةَ **محاضرات** متتابعة لا غير. والمقرر الحقيقيّ ليس
 * كذلك: هو فصولٌ، وفي كل فصلٍ محاضراتُه **وملخّصاته ونماذجه** معًا.
 * ووضعُ الملفّات في مكانٍ آخر يعني أن يقفز الطالب بين شاشتين ليتابع
 * فصلًا واحدًا — أي أن ترتيب الشاشة يخالف ترتيب الدراسة.
 *
 * فالمسار الآن يحمل النوعين في تسلسلٍ واحد داخل كل فصل: محاضرةٌ ثم
 * ملخّصها ثم تمارينها، بالترتيب الذي تُدرَس به فعلًا.
 *
 * ── والتوافق مع ما قبل الفصول محفوظ حرفيًّا ──────────────────────────
 * كل مادةٍ سابقة تحمل `chapterId = null`، فتقع في مجموعةٍ **بلا عنوان
 * ولا طيّ** تُعرض تمامًا كما كانت. مقرَّرٌ لم تُنشأ له فصول لا يرى
 * فرقًا واحدًا.
 *
 * ── ملاحظة على الأداء ───────────────────────────────────────────────
 * كل حركة هنا `transform` أو `opacity` فقط — لا `height` ولا `top`.
 * والطيّ يُركّب/يفكّك المحتوى بدل تحريك ارتفاعه: تحريك الارتفاع يُجبر
 * المتصفّح على إعادة تخطيط كل ما تحته في كل إطار.
 * ═════════════════════════════════════════════════════════════════════
 */
export function MaterialList({
  materials,
  courseId,
  canManage,
}: {
  materials: MaterialListItem[];
  courseId: string;
  canManage: boolean;
}) {
  const chapters = React.useMemo(() => groupIntoChapters(materials), [materials]);

  /* أول محاضرة جاهزة هي المعروضة — والملفّ لا يُعرض في المشغّل */
  const firstPlayable =
    materials.find((m) => m.kind === MaterialKind.VIDEO && m.status === MaterialStatus.READY) ??
    materials.find((m) => m.kind === MaterialKind.VIDEO) ??
    materials[0];

  const [selectedId, setSelectedId] = React.useState(firstPlayable?.id ?? "");
  const active = materials.find((m) => m.id === selectedId) ?? firstPlayable;

  /* الفصل الذي فيه الدرس المعروض مفتوح، وما عداه مطويّ — فلا يبدأ
     الطالب أمام قائمةٍ طويلة عليه أن يقطعها ليجد موضعه. */
  const initialOpen = React.useMemo(() => {
    const holder = chapters.find((c) => c.items.some((i) => i.id === firstPlayable?.id));
    return new Set<string>(holder?.id ? [holder.id] : []);
  }, [chapters, firstPlayable?.id]);

  const [open, setOpen] = React.useState(initialOpen);
  const toggle = (id: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  /* الترقيم متّصلٌ عبر الفصول: «الدرس ٧» واحدٌ في المقرر كلّه، لا
     السابع في فصله. الطالب يشير إليه برقمه في المقرر. */
  let counter = 0;

  return (
    <div className="grid items-start gap-[1.6rem] min-[1060px]:grid-cols-[minmax(0,1fr)_20rem]">
      {/*
        ── لوح المشاهدة يدخل ولا يُستبدَل فجأةً ─────────────────────
        اختيار درسٍ كان يبدّل المشغّل والعنوان والوصف **في إطارٍ واحد**:
        مشهدٌ كامل يحلّ محلّ مشهدٍ كامل بلا رابطٍ بينهما، والعين تقرأ
        ذلك انقطاعًا لا انتقالًا. و`key` يعيد تركيب اللوح فتُعاد حركة
        `anim-rise` — `transform` و`opacity` وحدهما.
      */}
      <div key={active?.id} className="anim-rise min-w-0">
        {active?.kind === MaterialKind.FILE ? (
          <div className="grid min-h-[18rem] place-items-center rounded-card border border-line bg-panel px-6 text-center">
            <div>
              <FileText className="mx-auto text-accent" size={26} strokeWidth={1.5} aria-hidden="true" />
              <p className="mt-3 text-sm font-medium text-paper">{active.title}</p>
              {active.description && (
                <p className="mx-auto mt-1.5 max-w-[46ch] text-xs leading-[1.9] text-muted">
                  {active.description}
                </p>
              )}
              {active.status === MaterialStatus.READY ? (
                <a
                  href={`/api/courses/${courseId}/videos/${active.id}/stream`}
                  className="press mt-4 inline-flex min-h-touch items-center gap-2 rounded-[10px] bg-action px-5 text-sm font-semibold text-ink hover:bg-accent-bright"
                >
                  <FileText size={15} strokeWidth={1.75} aria-hidden="true" />
                  فتح الملفّ
                </a>
              ) : (
                <p className="mt-3 text-xs text-subtle">هذا الملفّ قيد التجهيز.</p>
              )}
            </div>
          </div>
        ) : active?.status === MaterialStatus.READY ? (
          <>
            <VideoPlayer
              src={`/api/courses/${courseId}/videos/${active.id}/stream`}
              title={active.title}
            />
            <div className="mt-[1.1rem]">
              <h3 className="text-title-sm">{active.title}</h3>
              {active.description && (
                <p className="mt-1.5 max-w-[62ch] text-[13px] leading-[1.9] text-muted">
                  {active.description}
                </p>
              )}
              <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-subtle">
                <time>{relativeTime(active.createdAt)}</time>
                {active.sizeBytes !== null && (
                  <span className="numeric">{formatBytes(active.sizeBytes)}</span>
                )}
                {canManage && !active.isPublished && (
                  <span className="text-warning">مسودة غير منشورة</span>
                )}
              </p>
            </div>
          </>
        ) : (
          <div className="grid min-h-[18rem] place-items-center rounded-card border border-line bg-panel px-6 text-center">
            <div>
              <Clock className="mx-auto text-warning" size={24} strokeWidth={1.5} aria-hidden="true" />
              <p className="mt-3 text-sm font-medium text-paper">{active?.title}</p>
              <p className="mt-1 text-xs text-subtle">
                {active?.status === MaterialStatus.FAILED
                  ? "تعذّر تجهيز هذا الدرس."
                  : "هذا الدرس قيد التجهيز وسيظهر هنا فور اكتماله."}
              </p>
            </div>
          </div>
        )}
      </div>

      <aside>
        <p className="mb-[0.8rem] text-eyebrow">مسار المقرر</p>

        <div className="space-y-2.5">
          {chapters.map((chapter) => {
            const isLoose = chapter.id === null;
            const expanded = isLoose || open.has(chapter.id!);
            const videos = chapter.items.filter((i) => i.kind === MaterialKind.VIDEO).length;
            const files = chapter.items.length - videos;

            return (
              <section key={chapter.id ?? "loose"}>
                {!isLoose && (
                  <h3>
                    <button
                      type="button"
                      onClick={() => toggle(chapter.id!)}
                      aria-expanded={expanded}
                      className={cn(
                        "press flex w-full items-center gap-3 rounded-field border px-3.5 py-3 text-start",
                        "transition-colors duration-200",
                        expanded
                          ? "border-accent-deep bg-panel-lift"
                          : "border-line-soft bg-panel hover:border-accent-deep",
                      )}
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[0.88rem] font-semibold text-paper">
                          {chapter.title}
                        </span>
                        <span className="mt-0.5 block text-[11px] text-subtle">
                          <Counted n={videos} {...LESSON_FORMS} />
                          {files > 0 && (
                            <>
                              {" · "}
                              <Counted n={files} {...FILE_FORMS} />
                            </>
                          )}
                        </span>
                      </span>
                      <ChevronDown
                        size={15}
                        strokeWidth={2}
                        aria-hidden="true"
                        className={cn(
                          "shrink-0 text-subtle transition-transform duration-200",
                          expanded && "rotate-180",
                        )}
                      />
                    </button>
                  </h3>
                )}

                {expanded && (
                  <div className={cn("relative ps-[2.6rem]", !isLoose && "mt-2.5")}>
                    <span
                      aria-hidden="true"
                      className="track-draw absolute inset-y-[14px] start-[15px] w-0.5 origin-top rounded-sm bg-line"
                    />

                    <StaggerList className="space-y-[0.6rem]">
                      {chapter.items.map((material) => {
                        const isFile = material.kind === MaterialKind.FILE;
                        const ready = material.status === MaterialStatus.READY;
                        const failed = material.status === MaterialStatus.FAILED;
                        const selected = material.id === active?.id;
                        /* الملفّات لا تأخذ رقمًا: الترقيم للدروس، وإعطاؤه
                           لملخّصٍ يجعل «الدرس ٥» يعني شيئين مختلفين. */
                        const number = isFile ? null : ++counter;

                        return (
                          <StaggerItem key={material.id} className="group relative">
                            <span
                              className={cn(
                                "absolute -start-[2.6rem] top-[14px] z-10 grid size-8 place-items-center rounded-full border",
                                "bg-ink text-[11px] shadow-[0_0_0_5px_var(--color-ink)] transition-[background-color,border-color,color] duration-[320ms] ease-out",
                                selected
                                  ? "border-transparent bg-gradient-to-b from-accent-bright to-action text-ink"
                                  : failed
                                    ? "border-danger/45 text-danger"
                                    : isFile
                                      ? "border-line-soft text-accent-deep group-hover:border-accent-deep group-hover:text-accent"
                                      : ready
                                        ? "border-line text-subtle group-hover:border-accent-deep group-hover:text-accent"
                                        : "border-dashed border-warning/45 text-warning",
                              )}
                            >
                              {failed ? (
                                <CircleAlert size={14} strokeWidth={1.75} aria-hidden="true" />
                              ) : isFile ? (
                                <FileText size={13} strokeWidth={1.75} aria-hidden="true" />
                              ) : ready ? (
                                <span className="numeric">{ar(number!)}</span>
                              ) : (
                                <Clock size={13} strokeWidth={1.75} aria-hidden="true" />
                              )}
                            </span>

                            <button
                              type="button"
                              onClick={() => setSelectedId(material.id)}
                              aria-pressed={selected}
                              className={cn(
                                "press flex w-full items-center gap-[0.9rem] rounded-field border px-[1.2rem] py-4 text-start",
                                "transition-[transform,border-color,background-color] duration-200 ease-out hover:-translate-y-0.5",
                                selected
                                  ? "border-accent-deep bg-panel-lift"
                                  : "border-line-soft bg-panel hover:border-accent-deep",
                              )}
                            >
                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-[0.92rem] font-medium text-paper">
                                  {material.title}
                                </span>
                                <span className="mt-1 block text-[11px] text-subtle">
                                  {isFile
                                    ? ready
                                      ? "ملفّ مرفق"
                                      : "الملفّ قيد التجهيز"
                                    : ready
                                      ? relativeTime(material.createdAt)
                                      : failed
                                        ? "فشل الرفع"
                                        : "قيد الرفع"}
                                </span>
                              </span>
                              {ready &&
                                (isFile ? (
                                  <FileText
                                    size={13}
                                    strokeWidth={1.75}
                                    aria-hidden="true"
                                    className={selected ? "text-accent-bright" : "text-subtle"}
                                  />
                                ) : (
                                  <Play
                                    size={12}
                                    fill="currentColor"
                                    strokeWidth={0}
                                    aria-hidden="true"
                                    className={selected ? "text-accent-bright" : "text-subtle"}
                                  />
                                ))}
                            </button>

                            {canManage && (
                              <div className="mt-1 flex justify-end">
                                <DeleteMaterialButton
                                  courseId={courseId}
                                  materialId={material.id}
                                  title={material.title}
                                />
                              </div>
                            )}
                          </StaggerItem>
                        );
                      })}
                    </StaggerList>
                  </div>
                )}
              </section>
            );
          })}
        </div>
      </aside>
    </div>
  );
}
