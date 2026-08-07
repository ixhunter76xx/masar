import "server-only";

import { db } from "@/server/db";
import { enrolledInCourse } from "@/lib/data/access";
import { Role } from "@/generated/prisma/enums";

export type AnnouncementItem = {
  id: string;
  title: string;
  body: string;
  authorName: string;
  isPinned: boolean;
  isPublished: boolean;
  publishedAt: Date | null;
  createdAt: Date;
  /** غير مقروء — للطلاب فقط؛ المدرب مؤلّف إعلاناته */
  isUnread: boolean;
};

/**
 * إعلانات مقرر واحد.
 * الطالب يرى المنشورة فقط؛ المدرب والإدارة يريان المسودات أيضًا.
 * المثبّت أولًا، ثم الأحدث.
 */
export async function getCourseAnnouncements(
  courseId: string,
  userId: string,
  role: Role,
): Promise<AnnouncementItem[]> {
  const canSeeDrafts = role === Role.INSTRUCTOR || role === Role.ADMIN;

  const rows = await db.announcement.findMany({
    where: {
      courseId,
      ...(canSeeDrafts ? {} : { publishedAt: { not: null } }),
    },
    orderBy: [
      { isPinned: "desc" },
      { publishedAt: "desc" },
      { createdAt: "desc" },
    ],
    select: {
      id: true,
      title: true,
      body: true,
      isPinned: true,
      publishedAt: true,
      createdAt: true,
      author: { select: { name: true } },
      reads: { where: { userId }, select: { id: true } },
    },
  });

  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    body: r.body,
    authorName: r.author.name,
    isPinned: r.isPinned,
    isPublished: r.publishedAt !== null,
    publishedAt: r.publishedAt,
    createdAt: r.createdAt,
    // المؤلّف لا "يقرأ" إعلانه
    isUnread:
      role === Role.STUDENT && r.publishedAt !== null && r.reads.length === 0,
  }));
}

/** عدد الإعلانات المنشورة غير المقروءة في مقرر واحد */
export async function countUnreadInCourse(
  courseId: string,
  userId: string,
  role: Role,
): Promise<number> {
  if (role !== Role.STUDENT) return 0;

  return db.announcement.count({
    where: {
      courseId,
      publishedAt: { not: null },
      reads: { none: { userId } },
    },
  });
}

/** عدد الإعلانات غير المقروءة في كل مقررات الطالب */
export async function countUnreadForUser(
  userId: string,
  role: Role,
): Promise<number> {
  if (role !== Role.STUDENT) return 0;

  return db.announcement.count({
    where: {
      publishedAt: { not: null },
      reads: { none: { userId } },
      course: enrolledInCourse(userId),
    },
  });
}
