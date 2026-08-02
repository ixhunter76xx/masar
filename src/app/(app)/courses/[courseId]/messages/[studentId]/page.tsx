import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { MessageThread } from "@/components/messages/MessageThread";
import { getThread, requireThreadAccess } from "@/lib/data/messages";

type Params = { params: Promise<{ courseId: string; studentId: string }> };

/**
 * محادثة مع طرف بعينه.
 *
 * `requireThreadAccess` يفشل بـ 404 لغير الطرفين — لا 403. المحادثة
 * التي لا تخصّك يجب ألّا يُعرف وجودها أصلًا.
 */
export default async function Page({ params }: Params) {
  const { courseId, studentId } = await params;
  const access = await requireThreadAccess(courseId, studentId);
  const messages = await getThread(courseId, studentId, access.viewerId);

  const peerName =
    access.side === "student" ? access.instructorName : access.studentName;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-medium text-paper">{peerName}</h2>
        <Link
          href={`/courses/${courseId}/messages`}
          className="press inline-flex min-h-touch items-center gap-1.5 rounded-[10px]
            px-2 text-xs text-muted hover:text-paper"
        >
          <ArrowRight size={14} strokeWidth={1.75} aria-hidden="true" />
          كل المحادثات
        </Link>
      </div>

      <MessageThread
        courseId={courseId}
        studentId={studentId}
        peerName={peerName}
        messages={messages}
      />
    </div>
  );
}
