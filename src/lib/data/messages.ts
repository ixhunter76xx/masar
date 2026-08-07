import "server-only";

import { cache } from "react";
import { notFound } from "next/navigation";

import { db } from "@/server/db";
import { enrolledInCourse } from "@/lib/data/access";
import { auth } from "@/auth";
import { Role } from "@/generated/prisma/enums";
import {
  MESSAGE_MAX_LENGTH,
  type ThreadMessage,
  type ConversationSummary,
} from "@/lib/messages";

export type { ThreadMessage, ConversationSummary };

/**
 * دور المستخدم في محادثة بعينها، محسوبًا على الخادم لا مأخوذًا من الطلب.
 *
 * ── القاعدة الأمنية ──────────────────────────────────────────────────
 * لا تُقرأ رسالة ولا تُرسل قبل المرور من هنا. الدالة تُجيب عن سؤال واحد:
 * هل هذا المستخدم **طرف** في هذه المحادثة تحديدًا؟ وطرفاها اثنان فقط:
 *
 *   • الطالب صاحب المحادثة — بشرط أن يكون **مسجّلًا فعلًا** في المقرر
 *     بحالة ACTIVE. مجرّد كونه الطالب المذكور في المسار لا يكفي؛ من
 *     انسحب من المقرر لا يواصل مراسلة مدربه.
 *   • مدرب المقرر نفسه — لا أي مدرب آخر.
 *
 * الإدارة **ليست طرفًا**. حسابها يملك صلاحيات واسعة على المقررات
 * والمستخدمين، لكن المراسلة الخاصة بين طالب ومدربه ليست بيانات إدارية.
 * إتاحتها للإدارة تعني أن لا خصوصية في المنصة أصلًا.
 * ─────────────────────────────────────────────────────────────────────
 *
 * ترجع `null` — لا تُلقي — ليقرّر المستدعي بين 404 وقائمة فارغة.
 */
export const resolveThreadAccess = cache(async function resolveThreadAccess(
  courseId: string,
  studentId: string,
): Promise<{
  viewerId: string;
  side: "student" | "instructor";
  courseId: string;
  courseTitle: string;
  studentId: string;
  studentName: string;
  instructorName: string;
} | null> {
  const session = await auth();
  if (!session?.user) return null;

  const viewerId = session.user.id;
  const role = session.user.role;

  if (role !== Role.STUDENT && role !== Role.INSTRUCTOR) return null;
  // الطالب لا يفتح محادثة غيره مهما كان المعرّف في المسار
  if (role === Role.STUDENT && studentId !== viewerId) return null;

  const course = await db.course.findFirst({
    where: {
      id: courseId,
      // المدرب: المقرر مقرره. الطالب: مسجّل فيه بحالة نشطة.
      ...(role === Role.INSTRUCTOR
        ? { presenterId: viewerId }
        : {
            ...enrolledInCourse(viewerId),
          }),
    },
    select: {
      id: true,
      title: true,
      presenter: { select: { name: true } },
    },
  });
  if (!course) return null;

  // المدرب يفتح محادثة طالب: تحقّق أن الطالب مسجّل في هذا المقرر تحديدًا
  /* الطالب طرفٌ إن كان يملك منتجًا في هذا المقرر — لا "تسجيلًا" فيه */
  const student = await db.user.findFirst({
    where: {
      id: studentId,
      enrollments: { some: { product: { courseId } } },
    },
    select: { name: true },
  });
  if (!student) return null;

  return {
    viewerId,
    side: role === Role.STUDENT ? "student" : "instructor",
    courseId: course.id,
    courseTitle: course.title,
    studentId,
    studentName: student.name,
    instructorName: course.presenter?.name ?? "",
  };
});

/** يفشل بـ 404 بدل 403: لا يكشف وجود محادثة لمن ليس طرفًا فيها */
export async function requireThreadAccess(courseId: string, studentId: string) {
  const access = await resolveThreadAccess(courseId, studentId);
  if (!access) notFound();
  return access;
}

/**
 * رسائل محادثة واحدة، مرتّبة من الأقدم للأحدث.
 * لا تُعلّم شيئًا كمقروء — القراءة فعل منفصل يقع بعد العرض.
 */
export async function getThread(
  courseId: string,
  studentId: string,
  viewerId: string,
): Promise<ThreadMessage[]> {
  const rows = await db.message.findMany({
    where: { conversation: { courseId, studentId } },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      body: true,
      createdAt: true,
      senderId: true,
      readAt: true,
    },
  });

  return rows.map((m) => ({
    id: m.id,
    body: m.body,
    createdAt: m.createdAt,
    isMine: m.senderId === viewerId,
    // إيصال القراءة يعني المرسل وحده
    readAt: m.senderId === viewerId ? m.readAt : null,
  }));
}

/**
 * إرسال رسالة. يُنشئ المحادثة عند أول رسالة.
 *
 * الصلاحية تُتحقَّق هنا مجدّدًا ولا يُكتفى بتحقّق الصفحة: الإجراء نقطة
 * دخول مستقلة يمكن استدعاؤها مباشرة.
 */
export async function sendMessage(
  courseId: string,
  studentId: string,
  body: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const access = await resolveThreadAccess(courseId, studentId);
  if (!access) return { ok: false, error: "لا تملك صلاحية هذه المحادثة." };

  const text = body.trim();
  if (!text) return { ok: false, error: "اكتب نص الرسالة." };
  if (text.length > MESSAGE_MAX_LENGTH) {
    return {
      ok: false,
      error: `الحد الأقصى ${MESSAGE_MAX_LENGTH} حرفًا.`,
    };
  }

  const now = new Date();

  /* المحادثة والرسالة وتحديث وقت الترتيب في معاملة واحدة: إمّا أن تصل
     الرسالة ويصحّ ترتيب صندوق الوارد معًا، أو لا يتغيّر شيء. */
  await db.$transaction(async (tx) => {
    const conversation = await tx.conversation.upsert({
      where: { courseId_studentId: { courseId, studentId } },
      create: { courseId, studentId, lastMessageAt: now },
      update: { lastMessageAt: now },
      select: { id: true },
    });

    await tx.message.create({
      data: {
        conversationId: conversation.id,
        senderId: access.viewerId,
        body: text,
        createdAt: now,
      },
    });
  });

  return { ok: true };
}

/**
 * تعليم ما وصل من الطرف الآخر كمقروء.
 * `senderId: { not: viewerId }` شرط جوهري لا تحسين: بدونه يعلّم المستخدم
 * رسائله هو كمقروءة فينهار إيصال القراءة عند الطرف الآخر.
 */
export async function markThreadRead(
  courseId: string,
  studentId: string,
): Promise<number> {
  const access = await resolveThreadAccess(courseId, studentId);
  if (!access) return 0;

  const result = await db.message.updateMany({
    where: {
      conversation: { courseId, studentId },
      senderId: { not: access.viewerId },
      readAt: null,
    },
    data: { readAt: new Date() },
  });

  return result.count;
}

/* -------------------------------------------------------------------------- */
/*  العدّادات                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * شرط "الرسائل الواردة إليّ وغير المقروءة".
 *
 * مبني من طرفين: المحادثة تخصّني (كطالب أو كمدرب للمقرر)، والرسالة ليست
 * مني. الشرط الثاني هو ما يمنع عدّ رسائلي أنا في عدّادي.
 */
function inboundUnreadWhere(userId: string, role: Role) {
  const mine =
    role === Role.STUDENT
      ? {
          studentId: userId,
          // انسحاب الطالب يُسكت العدّاد كما يُغلق المحادثة
          course: enrolledInCourse(userId),
        }
      : { course: { presenterId: userId } };

  return {
    readAt: null,
    senderId: { not: userId },
    conversation: mine,
  };
}

/** رسائل غير مقروءة عبر كل المقررات — عدّاد القائمة الجانبية */
export async function countUnreadForUser(
  userId: string,
  role: Role,
): Promise<number> {
  if (role !== Role.STUDENT && role !== Role.INSTRUCTOR) return 0;
  return db.message.count({ where: inboundUnreadWhere(userId, role) });
}

/** رسائل غير مقروءة داخل مقرر واحد — عدّاد التبويب */
export async function countUnreadInCourse(
  courseId: string,
  userId: string,
  role: Role,
): Promise<number> {
  if (role !== Role.STUDENT && role !== Role.INSTRUCTOR) return 0;

  const where = inboundUnreadWhere(userId, role);
  return db.message.count({
    where: { ...where, conversation: { ...where.conversation, courseId } },
  });
}

/* -------------------------------------------------------------------------- */
/*  القوائم                                                                    */
/* -------------------------------------------------------------------------- */

type ConversationRow = {
  courseId: string;
  studentId: string;
  course: { title: string; code: string; presenter: { name: string } | null };
  student: { name: string };
  messages: { body: string; createdAt: Date }[];
  _count: { messages: number };
};

function toSummary(row: ConversationRow, side: "student" | "instructor") {
  const last = row.messages[0];
  return {
    courseId: row.courseId,
    courseTitle: row.course.title,
    courseCode: row.course.code,
    peerName: side === "student" ? row.course.presenter?.name ?? "" : row.student.name,
    studentId: row.studentId,
    lastBody: last?.body ?? null,
    lastAt: last?.createdAt ?? null,
    unread: row._count.messages,
  };
}

const summarySelect = (userId: string) => ({
  courseId: true,
  studentId: true,
  course: {
    select: { title: true, code: true, presenter: { select: { name: true } } },
  },
  student: { select: { name: true } },
  // آخر رسالة فقط — مقتطف صندوق الوارد
  messages: {
    orderBy: { createdAt: "desc" as const },
    take: 1,
    select: { body: true, createdAt: true },
  },
  // عدّ غير المقروء الوارد داخل نفس الاستعلام بدل استعلام لكل محادثة
  _count: {
    select: {
      messages: { where: { readAt: null, senderId: { not: userId } } },
    },
  },
});

/** صندوق الوارد عبر كل المقررات */
export async function getInbox(
  userId: string,
  role: Role,
): Promise<ConversationSummary[]> {
  if (role !== Role.STUDENT && role !== Role.INSTRUCTOR) return [];

  const rows = await db.conversation.findMany({
    where:
      role === Role.STUDENT
        ? {
            studentId: userId,
            course: {
              ...enrolledInCourse(userId),
            },
          }
        : { course: { presenterId: userId } },
    orderBy: { lastMessageAt: "desc" },
    select: summarySelect(userId),
  });

  const side = role === Role.STUDENT ? "student" : "instructor";
  return rows.map((row) => toSummary(row, side));
}

/**
 * قائمة طلاب المقرر للمدرب: كل طالب مسجّل، سواء بدأ المراسلة أم لا.
 * تُبنى من التسجيلات لا من المحادثات، فيستطيع المدرب بدء محادثة جديدة.
 */
export async function getCourseRoster(
  courseId: string,
  presenterId: string,
): Promise<ConversationSummary[]> {
  const course = await db.course.findFirst({
    where: { id: courseId, presenterId },
    select: { title: true, code: true },
  });
  if (!course) return [];

  const [enrollments, conversations] = await Promise.all([
    /* طلاب المقرر = من يملك أي منتج فيه. `distinct` لأن الطالب قد
       يملك أكثر من منتج في المقرر نفسه فيتكرر بلا هذا القيد. */
    db.enrollment.findMany({
      where: { product: { courseId } },
      distinct: ["userId"],
      orderBy: { user: { name: "asc" } },
      select: { userId: true, user: { select: { name: true } } },
    }),
    db.conversation.findMany({
      where: { courseId },
      select: {
        studentId: true,
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { body: true, createdAt: true },
        },
        _count: {
          select: {
            messages: {
              where: { readAt: null, senderId: { not: presenterId } },
            },
          },
        },
      },
    }),
  ]);

  const byStudent = new Map(conversations.map((c) => [c.studentId, c]));

  return enrollments.map(({ userId: studentId, user: student }) => {
    const conversation = byStudent.get(studentId);
    const last = conversation?.messages[0];
    return {
      courseId,
      courseTitle: course.title,
      courseCode: course.code,
      peerName: student.name,
      studentId,
      lastBody: last?.body ?? null,
      lastAt: last?.createdAt ?? null,
      unread: conversation?._count.messages ?? 0,
    };
  });
}
