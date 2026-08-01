import type { Metadata } from "next";
import { LibraryBig } from "lucide-react";

import { auth } from "@/auth";
import { AppPage } from "@/components/shell/AppPage";
import { EmptyState } from "@/components/ui/EmptyState";
import { TermSection } from "@/components/courses/TermSection";
import { getCoursesByTerm } from "@/lib/data/courses";
import { Role } from "@/generated/prisma/enums";

export const metadata: Metadata = { title: "مقرراتي" };

const DESCRIPTIONS: Record<Role, string> = {
  STUDENT: "المقررات المسجَّل بها، مرتّبة حسب الفصل الدراسي.",
  INSTRUCTOR: "المقررات التي تُدرّسها، مرتّبة حسب الفصل الدراسي.",
  ADMIN: "جميع مقررات المركز، مرتّبة حسب الفصل الدراسي.",
};

export default async function CoursesPage() {
  const session = await auth();
  const { id, role } = session!.user;

  const groups = await getCoursesByTerm(id, role);

  return (
    <AppPage title="مقرراتي" description={DESCRIPTIONS[role]}>
      {groups.length > 0 ? (
        groups.map((group) => <TermSection key={group.termId} group={group} />)
      ) : (
        <EmptyState
          icon={LibraryBig}
          title="لا توجد مقررات بعد"
          description={
            role === Role.INSTRUCTOR
              ? "ستظهر هنا المقررات فور إسنادها إليك من إدارة المركز."
              : "ستظهر هنا المقررات فور تسجيلك بها من إدارة المركز."
          }
        />
      )}
    </AppPage>
  );
}
