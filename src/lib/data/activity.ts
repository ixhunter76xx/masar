import "server-only";

import type { LucideIcon } from "lucide-react";
import { Megaphone, FileVideo } from "lucide-react";

import { db } from "@/server/db";
import {
  Role,
  EnrollmentStatus,
  MaterialStatus,
} from "@/generated/prisma/enums";

/** أنواع أحداث سجل النشاط المتاحة حاليًا */
export type ActivityKind = "announcement" | "material";

export type ActivityEvent = {
  id: string;
  kind: ActivityKind;
  title: string;
  courseId: string;
  course: string;
  detail?: string;
  at: Date;
};

export const ACTIVITY_META: Record<
  ActivityKind,
  { label: string; icon: LucideIcon; tone: "neutral" | "warning" | "success" }
> = {
  announcement: { label: "إعلان", icon: Megaphone, tone: "neutral" },
  material: { label: "محاضرة", icon: FileVideo, tone: "success" },
};

const FEED_LIMIT = 20;

/** نطاق المقررات المرئية للمستخدم حسب دوره */
function courseScope(userId: string, role: Role) {
  if (role === Role.INSTRUCTOR) return { instructorId: userId };
  if (role === Role.STUDENT) {
    return {
      enrollments: {
        some: { studentId: userId, status: EnrollmentStatus.ACTIVE },
      },
    };
  }
  return {};
}

/**
 * سجل النشاط: الإعلانات المنشورة والمحاضرات الجاهزة عبر مقررات المستخدم،
 * مدمجة ومرتّبة زمنيًا.
 *
 * سيتوسّع تلقائيًا عند إضافة الدرجات والواجبات — يكفي دمج مصدر جديد هنا.
 */
export async function getActivityFeed(
  userId: string,
  role: Role,
): Promise<ActivityEvent[]> {
  const scope = courseScope(userId, role);
  const canSeeDrafts = role === Role.INSTRUCTOR || role === Role.ADMIN;

  const [announcements, materials] = await Promise.all([
    db.announcement.findMany({
      where: {
        course: scope,
        ...(canSeeDrafts ? {} : { publishedAt: { not: null } }),
      },
      orderBy: { createdAt: "desc" },
      take: FEED_LIMIT,
      select: {
        id: true,
        title: true,
        body: true,
        publishedAt: true,
        createdAt: true,
        course: { select: { id: true, title: true } },
      },
    }),
    db.courseMaterial.findMany({
      where: {
        course: scope,
        status: MaterialStatus.READY,
        ...(canSeeDrafts ? {} : { publishedAt: { not: null } }),
      },
      orderBy: { createdAt: "desc" },
      take: FEED_LIMIT,
      select: {
        id: true,
        title: true,
        createdAt: true,
        course: { select: { id: true, title: true } },
      },
    }),
  ]);

  const events: ActivityEvent[] = [
    ...announcements.map((a) => ({
      id: `a-${a.id}`,
      kind: "announcement" as const,
      title: a.title,
      courseId: a.course.id,
      course: a.course.title,
      detail: a.body.length > 160 ? `${a.body.slice(0, 160)}…` : a.body,
      at: a.publishedAt ?? a.createdAt,
    })),
    ...materials.map((m) => ({
      id: `m-${m.id}`,
      kind: "material" as const,
      title: `رُفعت محاضرة: ${m.title}`,
      courseId: m.course.id,
      course: m.course.title,
      at: m.createdAt,
    })),
  ];

  return events
    .sort((a, b) => b.at.getTime() - a.at.getTime())
    .slice(0, FEED_LIMIT);
}
