"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Megaphone, Pin } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { FormField, Label, Checkbox } from "@/components/ui/Field";
import {
  createAnnouncement,
  updateAnnouncement,
  type ActionResult,
} from "@/app/(app)/courses/[courseId]/announcements/actions";

export type EditableAnnouncement = {
  id: string;
  title: string;
  body: string;
  isPinned: boolean;
  isPublished: boolean;
};

export function AnnouncementForm({
  courseId,
  editing,
  onDone,
}: {
  courseId: string;
  editing?: EditableAnnouncement;
  onDone?: () => void;
}) {
  const router = useRouter();
  const formRef = React.useRef<HTMLFormElement>(null);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    const data = new FormData(event.currentTarget);
    const result: ActionResult = editing
      ? await updateAnnouncement(courseId, editing.id, data)
      : await createAnnouncement(courseId, data);

    if (result.ok) {
      if (!editing) formRef.current?.reset();
      router.refresh();
      onDone?.();
    } else {
      setError(result.message);
    }
    setBusy(false);
  }

  const idPrefix = editing ? `edit-${editing.id}` : "new";

  return (
    <Card className="mb-6 px-5 py-5">
      <h2 className="mb-4 flex items-center gap-2 text-sm font-medium text-paper">
        <Megaphone size={16} strokeWidth={1.75} aria-hidden="true" />
        {editing ? "تعديل الإعلان" : "إعلان جديد"}
      </h2>

      <form ref={formRef} onSubmit={onSubmit} noValidate className="space-y-3">
        <FormField
          id={`${idPrefix}-title`}
          name="title"
          label="العنوان"
          placeholder="تأجيل محاضرة الأربعاء"
          defaultValue={editing?.title}
          required
        />

        <div>
          <Label htmlFor={`${idPrefix}-body`}>النص</Label>
          <textarea
            id={`${idPrefix}-body`}
            name="body"
            rows={4}
            defaultValue={editing?.body}
            placeholder="اكتب تفاصيل الإعلان للطلاب…"
            required
            className="w-full rounded-[10px] bg-ink px-4 py-3 text-sm text-paper
              border border-line placeholder:text-disabled leading-relaxed
              transition-colors duration-150 hover:border-accent-deep
              focus:border-accent focus:outline-none resize-y"
          />
        </div>

        <div className="flex flex-wrap items-center gap-5 pt-1">
          <Checkbox
            id={`${idPrefix}-publish`}
            name="publish"
            label="نشر للطلاب الآن"
            defaultChecked={editing ? editing.isPublished : true}
          />
          <Checkbox
            id={`${idPrefix}-pinned`}
            name="isPinned"
            label="تثبيت أعلى القائمة"
            defaultChecked={editing?.isPinned ?? false}
          />
        </div>

        {error && (
          <p role="alert" className="text-xs leading-relaxed text-danger">
            {error}
          </p>
        )}

        <div className="flex items-center gap-2">
          <Button type="submit" size="sm" loading={busy}>
            {editing ? "حفظ التعديل" : "نشر الإعلان"}
          </Button>
          {editing && (
            <Button
              variant="quiet"
              size="sm"
              disabled={busy}
              onClick={onDone}
            >
              إلغاء
            </Button>
          )}
          {!editing && (
            <span className="inline-flex items-center gap-1 text-[11px] text-subtle">
              <Pin size={11} strokeWidth={1.75} aria-hidden="true" />
              بلا نشر يُحفظ كمسودة لا يراها الطلاب
            </span>
          )}
        </div>
      </form>
    </Card>
  );
}
