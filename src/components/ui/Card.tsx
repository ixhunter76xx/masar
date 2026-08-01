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
        "bg-panel border border-line rounded-[14px]",
        className,
      )}
      {...props}
    />
  );
}
