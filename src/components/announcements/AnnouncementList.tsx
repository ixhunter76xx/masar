"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Pin, Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { AnnouncementForm } from "@/components/announcements/AnnouncementForm";
import { deleteAnnouncement } from "@/app/(app)/courses/[courseId]/announcements/actions";
import { relativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { AnnouncementItem } from "@/lib/data/announcements";
import { StaggerList, StaggerItem } from "@/components/motion/Stagger";

export function AnnouncementList({
  courseId,
  announcements,
  canManage,
}: {
  courseId: string;
  announcements: AnnouncementItem[];
  canManage: boolean;
}) {
  const [editingId, setEditingId] = React.useState<string | null>(null);

  return (
    <StaggerList className="space-y-3">
      {announcements.map((a) =>
        editingId === a.id ? (
          <StaggerItem key={a.id}>
            <AnnouncementForm
              courseId={courseId}
              editing={{
                id: a.id,
                title: a.title,
                body: a.body,
                isPinned: a.isPinned,
                isPublished: a.isPublished,
              }}
              onDone={() => setEditingId(null)}
            />
          </StaggerItem>
        ) : (
          <StaggerItem key={a.id}>
            <Row
              courseId={courseId}
              announcement={a}
              canManage={canManage}
              onEdit={() => setEditingId(a.id)}
            />
          </StaggerItem>
        ),
      )}
    </StaggerList>
  );
}

function Row({
  courseId,
  announcement: a,
  canManage,
  onEdit,
}: {
  courseId: string;
  announcement: AnnouncementItem;
  canManage: boolean;
  onEdit: () => void;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function remove() {
    setBusy(true);
    const result = await deleteAnnouncement(courseId, a.id);
    if (result.ok) router.refresh();
    else {
      setError(result.message);
      setBusy(false);
    }
  }

  return (
    <Card
      className={cn(
        "px-5 py-4",
        // شريط على الحافة الابتدائية يميّز غير المقروء
        a.isUnread && "border-s-2 border-s-accent-bright",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {a.isPinned && (
              <Pin
                size={13}
                strokeWidth={1.75}
                aria-label="مثبّت"
                className="shrink-0 text-accent"
              />
            )}
            <p className="text-sm font-medium leading-snug text-paper">
              {a.title}
            </p>
            {a.isUnread && (
              <span className="rounded-full bg-action px-2 py-0.5 text-[10px] font-medium text-ink">
                جديد
              </span>
            )}
            {canManage && !a.isPublished && (
              <span className="rounded-full border border-line px-2 py-0.5 text-[10px] text-warning">
                مسودة
              </span>
            )}
          </div>

          <p className="mt-2 whitespace-pre-line text-[13px] leading-relaxed text-muted">
            {a.body}
          </p>

          <p className="mt-3 text-[11px] text-subtle">
            {a.authorName} ·{" "}
            <time dateTime={(a.publishedAt ?? a.createdAt).toISOString()}>
              {relativeTime(a.publishedAt ?? a.createdAt)}
            </time>
          </p>
        </div>

        {canManage && !confirming && (
          <div className="flex shrink-0 gap-1">
            <Button
              variant="quiet"
              size="sm"
              onClick={onEdit}
              aria-label={`تعديل ${a.title}`}
            >
              <Pencil size={15} strokeWidth={1.75} aria-hidden="true" />
            </Button>
            <Button
              variant="quiet"
              size="sm"
              onClick={() => setConfirming(true)}
              aria-label={`حذف ${a.title}`}
              className="hover:text-danger"
            >
              <Trash2 size={15} strokeWidth={1.75} aria-hidden="true" />
            </Button>
          </div>
        )}

        {canManage && confirming && (
          <div className="flex shrink-0 items-center gap-2">
            <Button variant="danger" size="sm" loading={busy} onClick={remove}>
              تأكيد الحذف
            </Button>
            <Button
              variant="quiet"
              size="sm"
              disabled={busy}
              onClick={() => setConfirming(false)}
            >
              تراجع
            </Button>
          </div>
        )}
      </div>

      {error && (
        <p role="alert" className="mt-2 text-[11px] text-danger">
          {error}
        </p>
      )}
    </Card>
  );
}
