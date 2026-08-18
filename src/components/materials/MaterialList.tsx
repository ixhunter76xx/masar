"use client";

import * as React from "react";
import { CircleAlert, Clock, Play } from "lucide-react";

import { VideoPlayer } from "@/components/materials/VideoPlayer";
import { DeleteMaterialButton } from "@/components/materials/DeleteMaterialButton";
import { MaterialStatus } from "@/generated/prisma/enums";
import { formatBytes } from "@/lib/uploads";
import { relativeTime } from "@/lib/format";
import type { MaterialListItem } from "@/lib/data/materials";
import { StaggerList, StaggerItem } from "@/components/motion/Stagger";
import { cn } from "@/lib/utils";

/**
 * ═══ المسار — عنصر التوقيع ═══════════════════════════════════════════
 *
 * المنصة اسمها «مسار»، وكانت محاضراتها تُعرض قائمةَ بطاقاتٍ منفصلة —
 * أي أن أكثر شاشة يعيش فيها الطالب لم تكن تحمل شيئًا من فكرة المنصة.
 *
 * هنا المنهج **خطٌّ متصل** لا صناديق: سكّة رأسية تمرّ بعُقد مرقّمة،
 * مضيئة خلف ما صار متاحًا وخافتة أمام ما لم يجهز بعد. المقصود أن يرى
 * الطالب موضعه من الطريق في نظرة واحدة، لا أن يعدّ البطاقات.
 *
 * السكّة تُرسم عند الدخول من أعلى إلى أسفل (`--draw`)، فالصفحة تبدو
 * كأنها تُبنى على مهل بدل أن تهبط دفعة واحدة.
 *
 * ── ملاحظة على الأداء ───────────────────────────────────────────────
 * كل حركة هنا `transform` أو `opacity` فقط — لا `height` ولا `top`
 * ولا `width`. رسم السكّة يتم بـ`scaleY` على عنصر مطلق، فلا يُعيد
 * المتصفّح حساب التخطيط لأي عنصر أثناء الحركة.
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
  const first = materials.find((material) => material.status === MaterialStatus.READY) ?? materials[0];
  const [selectedId, setSelectedId] = React.useState(first?.id ?? "");
  const active = materials.find((material) => material.id === selectedId) ?? first;

  return (
    <div className="grid items-start gap-[1.6rem] min-[1060px]:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="min-w-0">
        {active?.status === MaterialStatus.READY ? (
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
        <p className="mb-[0.8rem] text-eyebrow">دروس المقرر</p>
        <div className="relative ps-[2.6rem]">
          <span
            aria-hidden="true"
            className="track-draw absolute inset-y-[14px] start-[15px] w-0.5 origin-top rounded-sm bg-line"
          />

          <StaggerList className="space-y-[0.6rem]">
            {materials.map((material, index) => {
              const ready = material.status === MaterialStatus.READY;
              const failed = material.status === MaterialStatus.FAILED;
              const selected = material.id === active?.id;

              return (
                <StaggerItem key={material.id} className="group relative">
                  <span
                    className={cn(
                      "absolute -start-[2.6rem] top-[14px] z-10 grid size-8 place-items-center rounded-full border",
                      "bg-ink text-[11px] shadow-[0_0_0_5px_var(--color-ink)] transition-all duration-[320ms] ease-out",
                      selected
                        ? "border-transparent bg-gradient-to-b from-accent-bright to-action text-ink"
                        : failed
                          ? "border-danger/45 text-danger"
                          : ready
                            ? "border-line text-subtle group-hover:border-accent-deep group-hover:text-accent"
                            : "border-dashed border-warning/45 text-warning",
                    )}
                  >
                    {failed ? (
                      <CircleAlert size={14} strokeWidth={1.75} aria-hidden="true" />
                    ) : ready ? (
                      <span className="numeric">{index + 1}</span>
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
                        {ready ? relativeTime(material.createdAt) : failed ? "فشل الرفع" : "قيد الرفع"}
                      </span>
                    </span>
                    {ready && (
                      <Play
                        size={12}
                        fill="currentColor"
                        strokeWidth={0}
                        aria-hidden="true"
                        className={selected ? "text-accent-bright" : "text-subtle"}
                      />
                    )}
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
      </aside>
    </div>
  );
}
