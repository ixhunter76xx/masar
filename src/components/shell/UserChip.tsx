import { ROLE_LABELS } from "@/lib/roles";
import { cn } from "@/lib/utils";
import type { Role } from "@/generated/prisma/enums";

/** الحرف الأول من الاسم للأفاتار */
function initial(name: string) {
  return name.trim().charAt(0) || "؟";
}

export function UserChip({
  name,
  role,
  className,
}: {
  name: string;
  role: Role;
  className?: string;
}) {
  return (
    <div className={cn("flex min-w-0 w-full items-center gap-[0.65rem] rounded-[12px] p-[0.55rem]", className)}>
      <span
        aria-hidden="true"
        className="grid size-8 shrink-0 place-items-center rounded-full border border-line bg-ink text-[13px] text-muted"
      >
        {initial(name)}
      </span>
      <div className="min-w-0">
        <p className="truncate text-[0.81rem] font-semibold text-paper">{name}</p>
        <p className="truncate text-[0.68rem] text-subtle">{ROLE_LABELS[role]}</p>
      </div>
    </div>
  );
}
