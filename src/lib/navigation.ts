import {
  History,
  LibraryBig,
  ClipboardList,
  Mail,
  CircleUserRound,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** نبرة العدّاد: محايدة أو تتطلب انتباهًا */
  badgeTone?: "neutral" | "danger";
};

/**
 * عناصر التنقّل الجذرية.
 *
 * قاعدة من نظام التصميم: **ستة عناصر كحد أقصى** — النشاط، مقرراتي،
 * الدرجات، الرسائل، الملف الشخصي، الإعدادات. لا تُضف عنصرًا سابعًا؛
 * أي وظيفة جديدة تندرج تحت أحد هذه الستة.
 */
export const NAV_ITEMS: readonly NavItem[] = [
  { href: "/dashboard", label: "سجل النشاط", icon: History },
  {
    href: "/courses",
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
  { href: "/profile", label: "الملف الشخصي", icon: CircleUserRound },
  { href: "/settings", label: "الإعدادات", icon: Settings },
] as const;

/** عدّادات العناصر التي تتطلب إجراءً من المستخدم */
export type NavCounts = Partial<Record<string, number>>;
