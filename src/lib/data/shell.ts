import "server-only";

import { cache } from "react";

import { getLiveUser } from "@/lib/data/session";
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
    /* المستخدم من الجدول لا من الرمز: تعطيلُ حساب أو إنزال دوره يسري
       على الجلسة المفتوحة فورًا — انظر `getLiveUser`. */
    const user = await getLiveUser();
    if (!user) return null;

    return {
      user: { id: user.id, name: user.name, role: user.role },
      counts: await getNavCounts(user.id, user.role),
    };
  },
);

/** المستخدم وحده — مخزّن أيضًا لمن لا يحتاج العدّادات */
export const getCurrentUser = cache(async () => getLiveUser());
