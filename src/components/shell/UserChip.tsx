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
    <div className={cn("flex items-center gap-3 min-w-0", className)}>
      <span
        aria-hidden="true"
        className="grid size-9 shrink-0 place-items-center rounded-full border border-line bg-ink text-sm text-muted"
      >
        {initial(name)}
      </span>
      <div className="min-w-0">
        <p className="truncate text-[13px] font-medium text-paper">{name}</p>
        <p className="truncate text-[11px] text-muted">{ROLE_LABELS[role]}</p>
      </div>
    </div>
  );
}
