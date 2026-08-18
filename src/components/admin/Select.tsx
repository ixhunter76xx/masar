import * as React from "react";
import { Label, Select } from "@/components/ui/Field";

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
      {/* كانت هنا نسخةٌ حرفية من أنماط `Input` — الشكل نفسه مكتوبًا
          مرّتين، وهو ما يجعل تغييرًا في الحقل يُصلح أحدهما ويترك الآخر. */}
      <Select id={id} {...props}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </Select>
    </div>
  );
}
