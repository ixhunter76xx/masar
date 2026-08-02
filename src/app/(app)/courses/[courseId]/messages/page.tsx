import { MessageSquare } from "lucide-react";

import { EmptyState } from "@/components/ui/EmptyState";
import { ConversationList } from "@/components/messages/ConversationList";
import { MessageThread } from "@/components/messages/MessageThread";
import { requireCourseAccess } from "@/lib/data/courses";
import { getCourseRoster, getThread, requireThreadAccess } from "@/lib/data/messages";
import { Role } from "@/generated/prisma/enums";

type Params = { params: Promise<{ courseId: string }> };

/**
 * تبويب الرسائل: واجهتان حسب الدور.
 *   الطالب  → محادثته الوحيدة مع مدرب المقرر، مفتوحة مباشرة.
 *   المدرب  → قائمة طلابه المسجّلين، وكل اسم يفتح محادثته.
 */
export default async function Page({ params }: Params) {
  const { courseId } = await params;
  const { user } = await requireCourseAccess(courseId);

  if (user.role === Role.INSTRUCTOR) {
    const roster = await getCourseRoster(courseId, user.id);
    return roster.length === 0 ? (
      <EmptyState
        icon={MessageSquare}
        title="لا طلاب مسجّلون"
        description="ستظهر هنا محادثاتك مع طلاب هذا المقرر بعد تسجيلهم."
      />
    ) : (
      <ConversationList conversations={roster} />
    );
  }

  if (user.role !== Role.STUDENT) {
    return (
      <EmptyState
        icon={MessageSquare}
        title="المراسلة بين الطلاب والمدربين"
        description="المحادثات خاصة بطرفيها، ولا يشارك فيها حساب الإدارة."
      />
    );
  }

  const access = await requireThreadAccess(courseId, user.id);
  const messages = await getThread(courseId, user.id, user.id);

  return (
    <MessageThread
      courseId={courseId}
      studentId={user.id}
      peerName={access.instructorName}
      messages={messages}
    />
  );
}
