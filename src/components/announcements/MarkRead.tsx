"use client";

import * as React from "react";
import { markAnnouncementsRead } from "@/app/(app)/courses/[courseId]/announcements/actions";

/**
 * يعلّم الإعلانات المعروضة كمقروءة بعد العرض.
 *
 * لا نفعل ذلك داخل الـ render لأن الكتابة أثناء التصيير تُفسد التخزين
 * المؤقت وتُنفَّذ مرتين في وضع التطوير الصارم.
 */
export function MarkAnnouncementsRead({
  courseId,
  ids,
}: {
  courseId: string;
  ids: string[];
}) {
  const key = ids.join(",");

  React.useEffect(() => {
    if (!key) return;
    void markAnnouncementsRead(courseId, key.split(","));
  }, [courseId, key]);

  return null;
}
