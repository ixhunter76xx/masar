import "server-only";

import { cache } from "react";

import { auth } from "@/auth";
import { getNavCounts } from "@/lib/data/counts";
import type { NavCounts } from "@/lib/navigation";
import type { Role } from "@/generated/prisma/enums";

export type ShellUser = {
  id: string;
  name: string;
  role: Role;
};

/**
 * بيانات الهيكل المشتركة بين تخطيط المنطقة المحمية والرأسية.
 *
 * ── لماذا `cache()` ─────────────────────────────────────────────────
 * الشريط الجانبي يعيش في `(app)/layout.tsx` والرأسية في `AppPage`،
 * وكلاهما يحتاج المستخدم والعدّادات. بلا تخزين كان كل تحميل صفحة ينفّذ
 * `auth()` مرتين و**استعلامَي عدّادات مرتين**.
 *
 * `cache()` من React يخزّن النتيجة **لكل طلب خادم على حدة** — لا عبر
 * الطلبات ولا بين المستخدمين. فيتشارك المستدعيان تنفيذًا واحدًا،
 * ويبقى كل موضع يطلب ما يحتاجه بلا تمرير خصائص عبر الشجرة.
 * ────────────────────────────────────────────────────────────────────
 */
export const getShellData = cache(
  async (): Promise<{ user: ShellUser; counts: NavCounts } | null> => {
    const session = await auth();
    if (!session?.user) return null;

    const { id, role } = session.user;

    return {
      user: { id, name: session.user.name ?? "", role },
      counts: await getNavCounts(id, role),
    };
  },
);

/** الجلسة وحدها — مخزّنة أيضًا لمن لا يحتاج العدّادات */
export const getCurrentUser = cache(async () => {
  const session = await auth();
  return session?.user ?? null;
});
