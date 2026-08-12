import { CircleAlert, Clock, Play } from "lucide-react";

import { VideoPlayer } from "@/components/materials/VideoPlayer";
import { DeleteMaterialButton } from "@/components/materials/DeleteMaterialButton";
import { MaterialStatus } from "@/generated/prisma/enums";
import { formatBytes } from "@/lib/uploads";
import { relativeTime } from "@/lib/format";
import type { MaterialListItem } from "@/lib/data/materials";
import { StaggerList, StaggerItem } from "@/components/motion/Stagger";

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
  return (
    <div className="relative ps-[2.375rem]">
      {/* السكّة: طبقتان — قضيب خافت ثابت، وفوقه ضوء يُرسم عند الدخول */}
      <span
        aria-hidden="true"
        className="absolute inset-y-4 start-[15px] w-0.5 rounded-full bg-line/70"
      />
      <span
        aria-hidden="true"
        className="track-draw absolute inset-y-4 start-[15px] w-0.5 origin-top rounded-full
          [background:linear-gradient(180deg,var(--color-spark)_0%,var(--color-accent-deep)_45%,transparent_100%)]"
      />

      <StaggerList className="space-y-3">
        {materials.map((m, index) => {
          const ready = m.status === MaterialStatus.READY;
          const failed = m.status === MaterialStatus.FAILED;

          return (
            <StaggerItem key={m.id} className="group relative">
              {/* العقدة — خارج البطاقة لتجلس على السكّة نفسها.
                  `numeric` على الرقم وحده: الصنف يضبط direction:ltr،
                  ووضعه على العنصر المُوضَّع يقلب `-start-` إلى الجهة
                  المقابلة (القاعدة موثّقة في globals.css). */}
              <span
                className={
                  "absolute -start-[2.375rem] top-[18px] z-10 grid size-8 place-items-center " +
                  "rounded-full border bg-ink text-[11px] shadow-[0_0_0_5px_var(--color-ink)] " +
                  "transition-[transform,border-color,color,box-shadow] duration-[320ms] ease-out " +
                  (failed
                    ? "border-danger/45 text-danger"
                    : ready
                      ? "node-live border-spark/55 text-spark group-hover:scale-110"
                      : "border-warning/35 text-warning")
                }
              >
                {failed ? (
                  <CircleAlert size={15} strokeWidth={1.75} aria-hidden="true" />
                ) : ready ? (
                  <span className="numeric">{index + 1}</span>
                ) : (
                  <Clock size={14} strokeWidth={1.75} aria-hidden="true" />
                )}
              </span>

              <div
                className={
                  "glow-edge rounded-[14px] border px-5 py-4 " +
                  "shadow-[inset_0_1px_0_rgba(255,255,255,0.045),0_1px_2px_rgba(0,0,0,0.35)] " +
                  "transition-[transform,border-color,box-shadow] duration-[320ms] ease-out " +
                  /* رأسية لا أفقية: `translateX` تتحرّك نحو اليسار
                     الفيزيائي مهما كان اتجاه الصفحة، فمعناها ينقلب
                     بين LTR وRTL. نفس الإصلاح المطبَّق في صفحة البيع. */
                  "group-hover:-translate-y-[2px] " +
                  (ready
                    ? "border-line group-hover:border-spark/40"
                    : "border-line/70") +
                  " [background:linear-gradient(168deg,var(--color-panel-lift)_0%,var(--color-panel)_62%)]"
                }
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="flex min-w-0 items-center gap-2 text-sm font-medium leading-snug text-paper">
                    {ready && (
                      <Play
                        size={12}
                        fill="currentColor"
                        strokeWidth={0}
                        aria-hidden="true"
                        className="shrink-0 text-spark/70 transition-transform duration-200 ease-out group-hover:scale-125"
                      />
                    )}
                    {m.title}
                  </p>

                  <div className="flex shrink-0 items-start gap-2">
                    <time className="mt-1 text-[11px] text-subtle">
                      {relativeTime(m.createdAt)}
                    </time>
                    {canManage && (
                      <DeleteMaterialButton
                        courseId={courseId}
                        materialId={m.id}
                        title={m.title}
                      />
                    )}
                  </div>
                </div>

                <p className="mt-1 flex flex-wrap items-center gap-x-3 text-[11px] text-subtle">
                  {m.sizeBytes !== null && (
                    <span className="numeric">{formatBytes(m.sizeBytes)}</span>
                  )}
                  {failed && <span className="text-danger">فشل الرفع</span>}
                  {!ready && !failed && <span className="text-warning">قيد الرفع</span>}
                  {canManage && ready && !m.isPublished && (
                    <span className="text-warning">مسودة</span>
                  )}
                </p>

                {ready && (
                  <div className="mt-3">
                    <VideoPlayer
                      src={`/api/courses/${courseId}/videos/${m.id}/stream`}
                      title={m.title}
                    />
                  </div>
                )}
              </div>
            </StaggerItem>
          );
        })}
      </StaggerList>
    </div>
  );
}
