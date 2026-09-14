"use client";

import * as React from "react";
import { Check, ChevronDown, CircleAlert, Clock, FileText, Play } from "lucide-react";

import { toggleLessonComplete } from "@/app/(app)/learn/[courseId]/progress/actions";
import { VideoPlayer } from "@/components/materials/VideoPlayer";
import { DeleteMaterialButton } from "@/components/materials/DeleteMaterialButton";
import { MaterialKind, MaterialStatus } from "@/generated/prisma/enums";
import { formatBytes } from "@/lib/uploads";
import { relativeTime } from "@/lib/format";
import { groupIntoChapters, type MaterialListItem } from "@/lib/material-track";
import { Counted } from "@/components/ui/Num";
import { ar, LESSON_FORMS } from "@/lib/numerals";
import { StaggerList, StaggerItem } from "@/components/motion/Stagger";
import { cn } from "@/lib/utils";

/** صيغ المعدود للملفّات — نظير `LESSON_FORMS`، وتُنقل إلى
    `numerals.ts` متى احتاجها موضعٌ ثانٍ. */
const FILE_FORMS = {
  one: "ملفّ واحد",
  two: "ملفّان",
  few: "ملفات",
  many: "ملفًّا",
} as const;

/**
 * ═══ المسار — عنصر التوقيع ═══════════════════════════════════════════
 *
 * المنصة اسمها «مسار»، والمنهج فيها طريقٌ يُقطع: فصولٌ، وفي كل فصلٍ
 * محاضراتُه وملفّاته بالترتيب الذي تُدرس به.
 *
 * ── إعادة التصميم 2026-09-14: التقدّم صار مرئيًّا وقابلًا للّمس ─────
 * بطاقة التقدّم أعلى الشاشة: النسبة، وشريطٌ يمتلئ من بداية السطر
 * ومؤشّرٌ يمشي عليه، و«تابع من» تقفز إلى أوّل ما لم يُتمّ. وكل درسٍ
 * جاهز يحمل عقدةً يضغطها الطالب ليعلّمه مكتملًا — تتحوّل ذهبيةً
 * بنبضة، ويتقدّم المؤشّر فورًا (تفاؤليًّا)، ثمّ يصدّقه الخادم.
 *
 * الذهبيّ هنا في موضعه الأصليّ: **إنجاز**. والتقدّم يُحسب على الجاهز
 * وحده — درسٌ لم يُرفع لا يُتمّ، ولا يُحسب ناقصًا على الطالب.
 *
 * للإدارة والأستاذ لا بطاقة ولا عقد قابلة للضغط: التقدّم للطالب، ومن
 * يدير المقرر يرى المسار كما كان مع أدوات الحذف.
 *
 * ── ما بقي كما هو ───────────────────────────────────────────────────
 * · `chapterId = null` مجموعةٌ بلا عنوان ولا طيّ — مقرَّرٌ بلا فصولٍ
 *   لا يرى فرقًا.
 * · الترقيم متّصلٌ عبر الفصول، والملفّات بلا رقم.
 * · الطيّ يُركّب ويفكّك ولا يحرّك ارتفاعًا؛ الحركة `transform`/`opacity`.
 * ═════════════════════════════════════════════════════════════════════
 */
export function MaterialList({
  materials,
  courseId,
  canManage,
  completedIds = [],
}: {
  materials: MaterialListItem[];
  courseId: string;
  canManage: boolean;
  completedIds?: string[];
}) {
  const trackProgress = !canManage;
  const chapters = React.useMemo(() => groupIntoChapters(materials), [materials]);
  const ordered = React.useMemo(() => chapters.flatMap((c) => c.items), [chapters]);

  const serverCompleted = React.useMemo(() => new Set(completedIds), [completedIds]);
  const [completed, applyCompletion] = React.useOptimistic(
    serverCompleted,
    (current: Set<string>, change: { id: string; done: boolean }) => {
      const next = new Set(current);
      if (change.done) next.add(change.id);
      else next.delete(change.id);
      return next;
    },
  );
  const [, startTransition] = React.useTransition();
  const [progressError, setProgressError] = React.useState<string | null>(null);

  /* أول محاضرة جاهزة لم تُتمّ هي المعروضة — والملفّ لا يُعرض في المشغّل */
  const ready = ordered.filter((m) => m.status === MaterialStatus.READY);
  const resume = ready.find((m) => !serverCompleted.has(m.id));
  const firstPlayable =
    (trackProgress && resume?.kind === MaterialKind.VIDEO ? resume : undefined) ??
    ordered.find((m) => m.kind === MaterialKind.VIDEO && m.status === MaterialStatus.READY) ??
    ordered.find((m) => m.kind === MaterialKind.VIDEO) ??
    ordered[0];

  const [selectedId, setSelectedId] = React.useState(firstPlayable?.id ?? "");
  const active = materials.find((m) => m.id === selectedId) ?? firstPlayable;
  const playerRef = React.useRef<HTMLDivElement>(null);

  /* الفصل الذي فيه الدرس المعروض مفتوح، وما عداه مطويّ — فلا يبدأ
     الطالب أمام قائمةٍ طويلة عليه أن يقطعها ليجد موضعه. */
  const initialOpen = React.useMemo(() => {
    const holder = chapters.find((c) => c.items.some((i) => i.id === firstPlayable?.id));
    return new Set<string>(holder?.id ? [holder.id] : []);
  }, [chapters, firstPlayable?.id]);

  const [open, setOpen] = React.useState(initialOpen);
  const toggleChapter = (id: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  function toggleDone(id: string) {
    const done = !completed.has(id);
    setProgressError(null);
    startTransition(async () => {
      applyCompletion({ id, done });
      const result = await toggleLessonComplete(id, done);
      if (!result.ok) setProgressError(result.error);
    });
  }

  function openLesson(id: string) {
    setSelectedId(id);
    const holder = chapters.find((c) => c.items.some((i) => i.id === id));
    if (holder?.id) setOpen((prev) => new Set(prev).add(holder.id!));
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    playerRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  }

  const total = ready.length;
  const done = ready.filter((m) => completed.has(m.id)).length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const nextUp = ready.find((m) => !completed.has(m.id));

  /* الترقيم متّصلٌ عبر الفصول: «الدرس ٧» واحدٌ في المقرر كلّه، لا
     السابع في فصله. الطالب يشير إليه برقمه في المقرر. */
  let counter = 0;

  return (
    <div>
      {trackProgress && total > 0 && (
        <section
          aria-label="تقدّمك في المقرر"
          className="mb-6 rounded-[18px] border border-line-soft bg-gradient-to-bl from-panel-lift to-panel p-4 sm:mb-8 sm:rounded-[22px] sm:p-[26px]"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-x-5 gap-y-1">
            <p className="flex items-baseline gap-2.5 sm:gap-3">
              <span className="numeric text-[30px] font-bold leading-none tracking-[-0.04em] text-spark sm:text-[36px]">
                {ar(pct)}٪
              </span>
              <span className="text-xs text-muted sm:text-sm">
                {ar(done)} من {ar(total)} مكتملة
              </span>
            </p>
            <p className="text-[11px] text-subtle sm:text-[13px]">
              {done >= total ? "أتممت كل ما رُفع من المقرر" : `بقي ${ar(total - done)} للنهاية`}
            </p>
          </div>

          <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={pct}
            aria-label="نسبة الإتمام"
            className="relative mt-7 h-1.5 rounded-full bg-line-soft sm:mt-9"
          >
            <span
              aria-hidden="true"
              className="progress-fill absolute inset-0 rounded-full bg-gradient-to-l from-spark to-spark/50 transition-transform duration-[620ms] ease-spring"
              style={{ transform: `scaleX(${pct / 100})` }}
            />
            {/* المؤشّر يمشي بـ`inset-inline-start` — عنصرٌ مطلقٌ صغير لا
                يُعيد تخطيط شيءٍ حوله، ويبقى منطقيًّا فينقلب مع `dir`. */}
            <span
              aria-hidden="true"
              className="node-live absolute top-1/2 size-5 -translate-y-1/2 rounded-full border-[3px] border-ink bg-spark transition-[inset-inline-start] duration-[620ms] ease-spring"
              style={{ insetInlineStart: `${pct}%`, marginInlineStart: "-10px" }}
            />
          </div>
          <div className="mt-5 flex justify-between text-[10.5px] text-subtle sm:mt-6 sm:text-[11px]">
            <span>البداية</span>
            <span>النهاية</span>
          </div>

          {nextUp && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-[14px] border border-line-soft bg-ink/60 px-4 py-3.5 sm:mt-[22px] sm:gap-5 sm:px-[18px] sm:py-4">
              <div className="min-w-0">
                <p className="text-[11px] text-subtle sm:text-[11.5px]">
                  {done === 0 ? "ابدأ من" : "تابع من"}
                </p>
                <p className="mt-1 truncate text-[13.5px] font-semibold sm:text-[14.5px]">{nextUp.title}</p>
              </div>
              <button
                type="button"
                onClick={() => openLesson(nextUp.id)}
                className="press min-h-[46px] w-full rounded-field bg-spark px-[22px] text-sm font-semibold text-on-spark
                  transition-[translate,filter] duration-[240ms] ease-spring hover:-translate-y-0.5 hover:brightness-110 sm:w-auto"
              >
                {nextUp.kind === MaterialKind.FILE ? "افتح الملفّ" : "تابع الدرس"}
              </button>
            </div>
          )}

          {progressError && (
            <p role="alert" className="mt-3 text-xs text-danger">
              {progressError}
            </p>
          )}
        </section>
      )}

      <div className="grid items-start gap-[1.6rem] min-[1060px]:grid-cols-[minmax(0,1fr)_21rem]">
        {/*
          ── لوح المشاهدة يدخل ولا يُستبدَل فجأةً ─────────────────────
          `key` يعيد تركيب اللوح فتُعاد حركة `anim-rise` عند كل اختيار.
        */}
        <div ref={playerRef} key={active?.id} className="anim-rise min-w-0 scroll-mt-24">
          {active?.kind === MaterialKind.FILE ? (
            <div className="grid min-h-[18rem] place-items-center rounded-card border border-line-soft bg-panel px-6 text-center">
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
              <div className="mt-[1.1rem] flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
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
                {trackProgress && (
                  <button
                    type="button"
                    onClick={() => toggleDone(active.id)}
                    aria-pressed={completed.has(active.id)}
                    className={cn(
                      "press inline-flex min-h-touch shrink-0 items-center gap-2 rounded-full border px-4 text-[13px] font-medium transition-colors duration-200",
                      completed.has(active.id)
                        ? "border-spark/40 bg-spark/10 text-spark"
                        : "border-line text-muted hover:border-accent-deep hover:text-paper",
                    )}
                  >
                    <Check size={14} strokeWidth={2.5} aria-hidden="true" />
                    {completed.has(active.id) ? "أتممته" : "علّمه مكتملًا"}
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="grid min-h-[18rem] place-items-center rounded-card border border-line-soft bg-panel px-6 text-center">
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
              const chReady = chapter.items.filter((i) => i.status === MaterialStatus.READY);
              const chDone = chReady.filter((i) => completed.has(i.id)).length;
              const chComplete = chReady.length > 0 && chDone === chReady.length;

              return (
                <section
                  key={chapter.id ?? "loose"}
                  className={cn(!isLoose && "overflow-hidden rounded-card border border-line-soft bg-panel")}
                >
                  {!isLoose && (
                    <h3>
                      <button
                        type="button"
                        onClick={() => toggleChapter(chapter.id!)}
                        aria-expanded={expanded}
                        className={cn(
                          "press flex min-h-[54px] w-full items-center gap-3 px-3.5 text-start transition-colors duration-200",
                          expanded ? "bg-panel-lift" : "hover:bg-panel-lift/60",
                        )}
                      >
                        {trackProgress && chReady.length > 0 && (
                          <span
                            className={cn(
                              "numeric shrink-0 rounded-lg px-2 py-1 text-[11px] transition-colors duration-[240ms]",
                              chComplete ? "bg-spark text-on-spark" : "bg-panel-high/60 text-subtle",
                            )}
                          >
                            {ar(chDone)}/{ar(chReady.length)}
                          </span>
                        )}
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
                            "shrink-0 transition-[rotate,color] duration-[360ms] ease-spring",
                            expanded ? "rotate-180 text-spark" : "text-subtle",
                          )}
                        />
                      </button>
                    </h3>
                  )}

                  {expanded && (
                    <StaggerList
                      className={cn("space-y-1.5", !isLoose && "anim-rise px-2 pb-2.5 pt-1.5")}
                    >
                      {chapter.items.map((material) => {
                        const isFile = material.kind === MaterialKind.FILE;
                        const isReady = material.status === MaterialStatus.READY;
                        const failed = material.status === MaterialStatus.FAILED;
                        const selected = material.id === active?.id;
                        const isDone = completed.has(material.id);
                        /* الملفّات لا تأخذ رقمًا: الترقيم للدروس، وإعطاؤه
                           لملخّصٍ يجعل «الدرس ٥» يعني شيئين مختلفين. */
                        const number = isFile ? null : ++counter;
                        const canToggle = trackProgress && isReady;

                        const knob = (
                          <span
                            className={cn(
                              "grid size-[26px] shrink-0 place-items-center rounded-full border-2 text-[11px]",
                              "transition-[background-color,border-color,color] duration-[240ms]",
                              isDone && canToggle
                                ? "anim-pop border-spark bg-spark text-on-spark"
                                : failed
                                  ? "border-danger/45 text-danger"
                                  : !isReady
                                    ? "border-dashed border-warning/45 text-warning"
                                    : selected
                                      ? "border-spark/60 bg-ink text-spark"
                                      : "border-line bg-ink text-subtle",
                            )}
                          >
                            {isDone && canToggle ? (
                              <Check size={14} strokeWidth={3} aria-hidden="true" />
                            ) : failed ? (
                              <CircleAlert size={14} strokeWidth={1.75} aria-hidden="true" />
                            ) : !isReady ? (
                              <Clock size={13} strokeWidth={1.75} aria-hidden="true" />
                            ) : isFile ? (
                              <FileText size={13} strokeWidth={1.75} aria-hidden="true" />
                            ) : (
                              <span className="numeric">{ar(number!)}</span>
                            )}
                          </span>
                        );

                        return (
                          <StaggerItem key={material.id}>
                            <div
                              className={cn(
                                "flex items-center gap-2 rounded-field border ps-2 pe-3 transition-[border-color,background-color] duration-200",
                                selected
                                  ? "border-spark/35 bg-panel-lift"
                                  : isDone && canToggle
                                    ? "border-transparent bg-spark/6"
                                    : isLoose
                                      ? "border-line-soft bg-panel hover:border-line"
                                      : "border-transparent hover:bg-panel-lift/70",
                              )}
                            >
                              {canToggle ? (
                                <button
                                  type="button"
                                  onClick={() => toggleDone(material.id)}
                                  aria-pressed={isDone}
                                  aria-label={
                                    isDone
                                      ? `إلغاء إتمام «${material.title}»`
                                      : `علّم «${material.title}» مكتملًا`
                                  }
                                  className="press grid size-11 shrink-0 place-items-center rounded-full"
                                >
                                  {knob}
                                </button>
                              ) : (
                                <span className="grid size-11 shrink-0 place-items-center" aria-hidden="true">
                                  {knob}
                                </span>
                              )}

                              <button
                                type="button"
                                onClick={() => setSelectedId(material.id)}
                                aria-pressed={selected}
                                className="press flex min-h-[52px] min-w-0 flex-1 items-center gap-3 text-start"
                              >
                                <span className="min-w-0 flex-1">
                                  <span className="block truncate text-[0.9rem] font-medium text-paper">
                                    {material.title}
                                  </span>
                                  <span className="mt-0.5 block text-[11px] text-subtle">
                                    {isFile
                                      ? isReady
                                        ? "ملفّ مرفق"
                                        : "الملفّ قيد التجهيز"
                                      : isReady
                                        ? relativeTime(material.createdAt)
                                        : failed
                                          ? "فشل الرفع"
                                          : "قيد الرفع"}
                                  </span>
                                </span>
                                {isReady &&
                                  (isFile ? (
                                    <FileText
                                      size={13}
                                      strokeWidth={1.75}
                                      aria-hidden="true"
                                      className={selected ? "text-spark" : "text-subtle"}
                                    />
                                  ) : (
                                    <Play
                                      size={12}
                                      fill="currentColor"
                                      strokeWidth={0}
                                      aria-hidden="true"
                                      className={selected ? "text-spark" : "text-subtle"}
                                    />
                                  ))}
                              </button>
                            </div>

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
                  )}
                </section>
              );
            })}
          </div>
        </aside>
      </div>
    </div>
  );
}
