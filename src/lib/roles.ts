import type { Role } from "@/generated/prisma/enums";

/** التسميات العربية للأدوار */
export const ROLE_LABELS: Record<Role, string> = {
  STUDENT: "طالب",
  INSTRUCTOR: "مدرب",
  ADMIN: "إدارة",
};
