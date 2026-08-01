import * as React from "react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/Field";

export function SelectField({
  id,
  label,
  options,
  placeholder,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
  id: string;
  label: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <select
        id={id}
        className={cn(
          "w-full h-11 px-3 rounded-[10px]",
          "bg-ink text-paper text-sm border border-line",
          "transition-colors duration-150 hover:border-accent-deep",
          "focus:border-accent focus:outline-none",
          "disabled:text-disabled disabled:cursor-not-allowed",
        )}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
