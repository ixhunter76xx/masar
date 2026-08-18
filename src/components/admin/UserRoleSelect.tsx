"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { setUserRole } from "@/app/(app)/settings/actions";
import { Select } from "@/components/ui/Field";
import { Role } from "@/generated/prisma/enums";

const OPTIONS = [
  { value: Role.STUDENT, label: "طالب" },
  { value: Role.INSTRUCTOR, label: "مدرب" },
  { value: Role.ADMIN, label: "إدارة" },
] as const;

/**
 * تغيير دور مستخدم من صفّه في القائمة.
 *
 * قائمة اختيار لا زرّ: الأدوار ثلاثة معروفة، وإظهارها كلها يجعل الدور
 * الحالي والبدائل مقروءةً في نظرة واحدة. والحارس على الخادم في
 * `setUserRole` — هذا مدخل لا قرار.
 */
export function UserRoleSelect({
  userId,
  role,
  name,
  disabled,
}: {
  userId: string;
  role: Role;
  name: string;
  /** حساب المدير نفسه — لا يغيّر دوره من هنا */
  disabled?: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const next = event.target.value as Role;
    if (next === role) return;

    setBusy(true);
    setError(null);

    const result = await setUserRole(userId, next);
    if (result.ok) {
      router.refresh();
    } else {
      setError(result.message);
      /* نُعيد الاختيار إلى الدور الفعلي: تركُه على ما اختاره الأدمن
         يعرض حالةً لم تُحفظ كأنها حُفظت */
      event.target.value = role;
    }
    setBusy(false);
  }

  return (
    <>
      <label htmlFor={`role-${userId}`} className="sr-only">
        دور {name}
      </label>
      {/* ضابطٌ داخل صفّ جدول، لا حقلُ نموذج: يرث اللون والحدّ وحلقة
          التركيز من `.input-field`، ويتجاوز المقاس وحده — فما يختلف
          فعلًا هو الحجم لا المعالجة. */}
      <Select
        id={`role-${userId}`}
        defaultValue={role}
        onChange={onChange}
        disabled={busy || disabled}
        className="min-h-touch w-auto px-2.5 text-[11px]"
      >
        {OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>

      {error && (
        <p role="alert" className="basis-full text-[11px] text-danger">
          {error}
        </p>
      )}
    </>
  );
}
