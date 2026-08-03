import type { Metadata } from "next";

import { AppPage } from "@/components/shell/AppPage";
import { AdminTabs } from "@/components/admin/AdminTabs";
import { AdminForm } from "@/components/admin/AdminForm";
import { SelectField } from "@/components/admin/Select";
import { FormField } from "@/components/ui/Field";
import { Card } from "@/components/ui/Card";
import { UserActiveToggle } from "@/components/admin/UserActiveToggle";
import { ResetPasswordButton } from "@/components/admin/ResetPasswordButton";
import { requireAdmin, listUsers } from "@/lib/data/admin";
import { createUser } from "@/app/(app)/settings/actions";
import { ROLE_LABELS } from "@/lib/roles";
import { Role } from "@/generated/prisma/enums";
import { PasswordField } from "@/components/ui/PasswordField";

export const metadata: Metadata = { title: "المستخدمون" };

export default async function UsersPage() {
  await requireAdmin();
  const users = await listUsers();

  return (
    <AppPage title="الإدارة" hidePageHeader>
      <AdminTabs />

      <AdminForm
        title="إنشاء حساب"
        submitLabel="إنشاء الحساب"
        action={createUser}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField id="u-name" name="name" label="الاسم" placeholder="سالم أحمد الدوسري" required />
          <FormField id="u-email" name="email" type="email" label="البريد الإلكتروني" placeholder="name@masar.bh" required />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField id="u-username" name="username" label="اسم مستخدم (اختياري)" placeholder="ustath" />
          <SelectField
            id="u-role"
            name="role"
            label="الدور"
            required
            defaultValue={Role.STUDENT}
            options={[
              { value: Role.STUDENT, label: ROLE_LABELS.STUDENT },
              { value: Role.INSTRUCTOR, label: ROLE_LABELS.INSTRUCTOR },
              { value: Role.ADMIN, label: ROLE_LABELS.ADMIN },
            ]}
          />
        </div>
        {/* كانت `type="text"` مكشوفة دائمًا ليقرأها المسؤول ويسلّمها.
            صارت مخفية بزرّ إظهار: نفس القدرة على القراءة، بلا بقائها
            معروضة أمام كل من يمرّ خلف الشاشة في مكتب الإدارة. */}
        <PasswordField
          id="u-password"
          name="password"
          label="كلمة المرور المبدئية"
          placeholder="٨ خانات على الأقل"
          autoComplete="new-password"
          showStrength
          hint="سلّمها للمستخدم ليغيّرها لاحقًا. تُخزَّن مجزّأة ولا يمكن استرجاعها."
          required
        />
      </AdminForm>

      <ul className="space-y-2">
        {users.map((u) => (
          <li key={u.id}>
            <Card className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
              <div className="min-w-0">
                <p className="truncate text-[13px] text-paper">
                  {u.name}
                  {!u.isActive && (
                    <span className="ms-2 rounded-full border border-line px-2 py-0.5 text-[10px] text-subtle">
                      معطّل
                    </span>
                  )}
                </p>
                <p className="mt-0.5 text-[11px] text-subtle">
                  <span className="numeric">{u.username}</span> · {ROLE_LABELS[u.role]}
                  {u.role === Role.STUDENT && (
                    <> · <span className="numeric">{u._count.enrollments}</span> مقررات</>
                  )}
                  {u.role === Role.INSTRUCTOR && (
                    <> · <span className="numeric">{u._count.coursesPresented}</span> مقررات</>
                  )}
                  {u.mustChangePassword && (
                    <> · <span className="text-warning">لم يغيّر كلمته</span></>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <ResetPasswordButton userId={u.id} name={u.name} />
                <UserActiveToggle userId={u.id} isActive={u.isActive} />
              </div>
            </Card>
          </li>
        ))}
      </ul>
    </AppPage>
  );
}
