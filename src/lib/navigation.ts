import {
  History,
  LibraryBig,
  ClipboardList,
  Mail,
  Receipt,
  CircleUserRound,
  Settings,
  type LucideIcon,
} from "lucide-react";

import { Role } from "@/generated/prisma/enums";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** نبرة العدّاد: محايدة أو تتطلب انتباهًا */
  badgeTone?: "neutral" | "danger";
  /** يظهر لهذه الأدوار وحدها — غيابه يعني: للجميع */
  roles?: readonly Role[];
};

/**
 * عناصر التنقّل الجذرية.
 *
 * قاعدة من نظام التصميم: **ستة عناصر كحد أقصى** لأي مستخدم واحد.
 * القائمة أدناه سبعة، و`roles` تُبقي ما يراه كلٌّ منهم ستة أو أقل:
 *
 *   الطالب  ٦: نشاط · مقرراتي · درجات · رسائل · طلباتي · ملفّي
 *   الإدارة ٦: نشاط · مقرراتي · درجات · رسائل · ملفّي · إعدادات
 *   الأستاذ ٥: بلا طلبات ولا إعدادات — لا يشتري ولا يدير
 */
export const NAV_ITEMS: readonly NavItem[] = [
  { href: "/dashboard", label: "سجل النشاط", icon: History },
  {
    /* `/learn` لا `/courses`: الأخيرة صارت كتالوج البيع العام الذي
       يراه الزائر المجهول. بيئة الدراسة انتقلت إلى `/learn`. */
    href: "/learn",
    label: "مقرراتي",
    icon: LibraryBig,
    // العدّاد = الإعلانات غير المقروءة عبر كل المقررات
    badgeTone: "neutral",
  },
  {
    href: "/grades",
    label: "الدرجات",
    icon: ClipboardList,
    // للمدرب: تسليمات تنتظر التصحيح
    badgeTone: "neutral",
  },
  { href: "/messages", label: "الرسائل", icon: Mail, badgeTone: "danger" },
  { href: "/orders", label: "طلباتي", icon: Receipt, roles: [Role.STUDENT] },
  { href: "/profile", label: "الملف الشخصي", icon: CircleUserRound },
  {
    href: "/settings",
    label: "الإعدادات",
    icon: Settings,
    // للإدارة: طلبات تنتظر تأكيد الدفع
    badgeTone: "danger",
    /* للإدارة وحدها: أقسام الإعدادات كلها إدارية، وما يراه غيرهم
       صفحة «قيد الإعداد» فارغة — أي نقرة تنتهي بخيبة. تعود للجميع
       يوم تحمل تفضيلات حقيقية. */
    roles: [Role.ADMIN],
  },
] as const;

/** عدّادات العناصر التي تتطلب إجراءً من المستخدم */
export type NavCounts = Partial<Record<string, number>>;
