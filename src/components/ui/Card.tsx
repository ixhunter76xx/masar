import * as React from "react";
import { cn } from "@/lib/utils";

/** سطح لوحة داكن بحدود — الأساس البصري لكل البطاقات */
export function Card({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-card border border-line bg-panel shadow-[inset_0_1px_0_var(--hair),0_2px_4px_var(--shadow)]",
        className,
      )}
      {...props}
    />
  );
}
