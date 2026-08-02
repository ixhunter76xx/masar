import type { Metadata } from "next";
import { Mail } from "lucide-react";

import { AppPage } from "@/components/shell/AppPage";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConversationList } from "@/components/messages/ConversationList";
import { getCurrentUser } from "@/lib/data/shell";
import { getInbox } from "@/lib/data/messages";
import { Role } from "@/generated/prisma/enums";

export const metadata: Metadata = { title: "الرسائل" };

export default async function Page() {
  const user = await getCurrentUser();

  /* الإدارة ليست طرفًا في المراسلة الخاصة — انظر resolveThreadAccess */
  if (!user || user.role === Role.ADMIN) {
    return (
      <AppPage title="الرسائل">
        <EmptyState
          icon={Mail}
          title="المراسلة بين الطلاب والمدربين"
          description="المحادثات خاصة بطرفيها، ولا يشارك فيها حساب الإدارة."
        />
      </AppPage>
    );
  }

  const conversations = await getInbox(user.id, user.role);
  const isStudent = user.role === Role.STUDENT;

  return (
    <AppPage
      title="الرسائل"
      description={
        isStudent
          ? "محادثاتك مع مدربي مقرراتك."
          : "محادثاتك مع طلاب مقرراتك."
      }
    >
      {conversations.length === 0 ? (
        <EmptyState
          icon={Mail}
          title="لا توجد محادثات"
          description={
            isStudent
              ? "افتح أي مقرر ثم تبويب الرسائل لمراسلة مدربه."
              : "افتح أي مقرر ثم تبويب الرسائل لمراسلة طلابه."
          }
        />
      ) : (
        <ConversationList conversations={conversations} showCourse />
      )}
    </AppPage>
  );
}
