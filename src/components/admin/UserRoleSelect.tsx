"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { setUserRole } from "@/app/(app)/settings/actions";
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
      <select
        id={`role-${userId}`}
        defaultValue={role}
        onChange={onChange}
        disabled={busy || disabled}
        className="field-motion min-h-touch rounded-[10px] border border-line bg-ink
          px-2.5 text-[11px] text-paper hover:border-accent-deep
          focus:border-accent focus:outline-none
          disabled:cursor-not-allowed disabled:opacity-60"
      >
        {OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {error && (
        <p role="alert" className="basis-full text-[11px] text-danger">
          {error}
        </p>
      )}
    </>
  );
}
