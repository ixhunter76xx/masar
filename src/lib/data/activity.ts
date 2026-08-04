import "server-only";

import type { LucideIcon } from "lucide-react";
import {
  Megaphone,
  FileVideo,
  ClipboardCheck,
  Inbox,
  MessageSquare,
} from "lucide-react";

import { db } from "@/server/db";
import {
  Role,
  MaterialStatus,
  SubmissionStatus,
} from "@/generated/prisma/enums";

/** أنواع أحداث سجل النشاط المتاحة حاليًا */
export type ActivityKind =
  | "announcement"
  | "material"
  | "grade"
  | "pending"
  | "message";

export type ActivityEvent = {
  id: string;
  kind: ActivityKind;
  title: string;
  courseId: string;
  course: string;
  detail?: string;
  at: Date;
  /** وجهة مخصّصة — وإلا تُشتق من النوع */
  href?: string;
};

export const ACTIVITY_META: Record<
  ActivityKind,
  { label: string; icon: LucideIcon; tone: "neutral" | "warning" | "success" }
> = {
  announcement: { label: "إعلان", icon: Megaphone, tone: "neutral" },
  material: { label: "محاضرة", icon: FileVideo, tone: "success" },
  grade: { label: "درجة", icon: ClipboardCheck, tone: "success" },
  pending: { label: "بانتظار التصحيح", icon: Inbox, tone: "warning" },
  message: { label: "رسالة", icon: MessageSquare, tone: "warning" },
};

const FEED_LIMIT = 20;

/** نطاق المقررات المرئية للمستخدم حسب دوره */
function courseScope(userId: string, role: Role) {
  if (role === Role.INSTRUCTOR) return { presenterId: userId };
  if (role === Role.STUDENT) {
    return {
      products: { some: { enrollments: { some: { userId: userId } } } },
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

  const [announcements, materials, gradedSubs, gradedQuizzes, pending, messages] =
    await Promise.all([
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

    // درجات الواجبات — للطالب صاحبها فقط
    role === Role.STUDENT
      ? db.submission.findMany({
          where: { studentId: userId, status: SubmissionStatus.GRADED },
          orderBy: { gradedAt: "desc" },
          take: FEED_LIMIT,
          select: {
            id: true,
            earnedPoints: true,
            gradedAt: true,
            assignment: {
              select: {
                id: true,
                title: true,
                totalPoints: true,
                course: { select: { id: true, title: true } },
              },
            },
          },
        })
      : Promise.resolve([]),

    // نتائج الاختبارات — للطالب صاحبها فقط
    role === Role.STUDENT
      ? db.quizAttempt.findMany({
          where: { studentId: userId, submittedAt: { not: null } },
          orderBy: { submittedAt: "desc" },
          take: FEED_LIMIT,
          select: {
            id: true,
            earnedPoints: true,
            totalPoints: true,
            submittedAt: true,
            quiz: {
              select: {
                id: true,
                title: true,
                course: { select: { id: true, title: true } },
              },
            },
          },
        })
      : Promise.resolve([]),

    // تسليمات تنتظر تصحيح المدرب — العنصر الوحيد القابل للإجراء لديه
    role === Role.INSTRUCTOR
      ? db.submission.findMany({
          where: {
            status: SubmissionStatus.SUBMITTED,
            assignment: { course: { presenterId: userId } },
          },
          orderBy: { submittedAt: "desc" },
          take: FEED_LIMIT,
          select: {
            id: true,
            submittedAt: true,
            student: { select: { name: true } },
            assignment: {
              select: {
                id: true,
                title: true,
                course: { select: { id: true, title: true } },
              },
            },
          },
        })
      : Promise.resolve([]),

    /* الرسائل الواردة غير المقروءة.
       نفس شرط عدّاد القائمة الجانبية حرفيًا (senderId ليس أنا + readAt
       فارغ)، فما يظهر في السجل هو ما يعدّه الشريط لا أكثر ولا أقل.
       الإدارة ليست طرفًا في المراسلة فلا رسائل لها. */
    role === Role.ADMIN
      ? Promise.resolve([])
      : db.message.findMany({
          where: {
            readAt: null,
            senderId: { not: userId },
            conversation:
              role === Role.STUDENT
                ? { studentId: userId, course: scope }
                : { course: { presenterId: userId } },
          },
          orderBy: { createdAt: "desc" },
          take: FEED_LIMIT,
          select: {
            id: true,
            body: true,
            createdAt: true,
            sender: { select: { name: true } },
            conversation: {
              select: {
                studentId: true,
                course: { select: { id: true, title: true } },
              },
            },
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
    ...gradedSubs.map((s) => ({
      id: `gs-${s.id}`,
      kind: "grade" as const,
      title: `نُشرت درجة الواجب: ${s.assignment.title}`,
      courseId: s.assignment.course.id,
      course: s.assignment.course.title,
      detail: `${s.earnedPoints} من ${s.assignment.totalPoints}`,
      at: s.gradedAt!,
      href: `/learn/${s.assignment.course.id}/assignments/${s.assignment.id}`,
    })),
    ...gradedQuizzes.map((a) => ({
      id: `gq-${a.id}`,
      kind: "grade" as const,
      title: `نتيجة الاختبار: ${a.quiz.title}`,
      courseId: a.quiz.course.id,
      course: a.quiz.course.title,
      detail: `${a.earnedPoints} من ${a.totalPoints}`,
      at: a.submittedAt!,
      href: `/learn/${a.quiz.course.id}/quizzes/${a.quiz.id}`,
    })),
    ...pending.map((s) => ({
      id: `ps-${s.id}`,
      kind: "pending" as const,
      title: `تسليم بانتظار التصحيح: ${s.assignment.title}`,
      courseId: s.assignment.course.id,
      course: s.assignment.course.title,
      detail: s.student.name,
      at: s.submittedAt,
      href: `/learn/${s.assignment.course.id}/assignments/${s.assignment.id}`,
    })),
    ...messages.map((m) => ({
      id: `msg-${m.id}`,
      kind: "message" as const,
      title: `رسالة من ${m.sender.name}`,
      courseId: m.conversation.course.id,
      course: m.conversation.course.title,
      detail: m.body.length > 160 ? `${m.body.slice(0, 160)}…` : m.body,
      at: m.createdAt,
      href: `/learn/${m.conversation.course.id}/messages/${m.conversation.studentId}`,
    })),
  ];

  return events
    .sort((a, b) => b.at.getTime() - a.at.getTime())
    .slice(0, FEED_LIMIT);
}
