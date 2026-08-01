import { Megaphone } from "lucide-react";

import { EmptyState } from "@/components/ui/EmptyState";
import { requireCourseAccess } from "@/lib/data/courses";

type Params = { params: Promise<{ courseId: string }> };

export default async function Page({ params }: Params) {
  const { courseId } = await params;
  // تحقّق مستقل عن التخطيط — Next.js ينفّذهما على التوازي
  await requireCourseAccess(courseId);

  return (
    <EmptyState
      icon={Megaphone}
      title="لا توجد إعلانات"
      description="ستظهر هنا إعلانات المقرر مرتّبة بالتاريخ، الأحدث أولًا."
    />
  );
}
