import { CirclePlay, CircleAlert, Clock } from "lucide-react";

import { Card } from "@/components/ui/Card";
import { VideoPlayer } from "@/components/materials/VideoPlayer";
import { DeleteMaterialButton } from "@/components/materials/DeleteMaterialButton";
import { MaterialStatus } from "@/generated/prisma/enums";
import { formatBytes } from "@/lib/uploads";
import { relativeTime } from "@/lib/format";
import type { MaterialListItem } from "@/lib/data/materials";
import { StaggerList, StaggerItem } from "@/components/motion/Stagger";

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
    <StaggerList className="space-y-3">
      {materials.map((m) => {
        const ready = m.status === MaterialStatus.READY;
        const failed = m.status === MaterialStatus.FAILED;

        return (
          <StaggerItem key={m.id}>
            <Card className="px-5 py-4">
              <div className="flex items-start gap-4">
                <span
                  className={
                    "grid size-9 shrink-0 place-items-center rounded-full border bg-ink " +
                    (failed
                      ? "border-danger/40 text-danger"
                      : ready
                        ? "border-line text-accent"
                        : "border-warning/30 text-warning")
                  }
                >
                  {failed ? (
                    <CircleAlert size={17} strokeWidth={1.75} aria-hidden="true" />
                  ) : ready ? (
                    <CirclePlay size={17} strokeWidth={1.75} aria-hidden="true" />
                  ) : (
                    <Clock size={17} strokeWidth={1.75} aria-hidden="true" />
                  )}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-medium leading-snug text-paper">
                      {m.title}
                    </p>

                    <div className="flex shrink-0 items-start gap-2">
                      <time className="mt-1.5 text-[11px] text-subtle">
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
              </div>
            </Card>
          </StaggerItem>
        );
      })}
    </StaggerList>
  );
}
