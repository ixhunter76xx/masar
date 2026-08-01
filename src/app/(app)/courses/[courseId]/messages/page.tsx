import { MessageSquare } from "lucide-react";

import { EmptyState } from "@/components/ui/EmptyState";
import { requireCourseAccess } from "@/lib/data/courses";

type Params = { params: Promise<{ courseId: string }> };

export default async function Page({ params }: Params) {
  const { courseId } = await params;
  // تحقّق مستقل عن التخطيط — Next.js ينفّذهما على التوازي
  await requireCourseAccess(courseId);

  return (
    <EmptyState
      icon={MessageSquare}
      title="لا توجد رسائل"
      description="ستظهر هنا مراسلاتك مع مدرب هذا المقرر."
    />
  );
}
