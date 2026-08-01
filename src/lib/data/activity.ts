import type { LucideIcon } from "lucide-react";
import {
  ClipboardCheck,
  Megaphone,
  FileUp,
  CalendarClock,
  MessageSquare,
} from "lucide-react";

/** أنواع أحداث سجل النشاط */
export type ActivityKind =
  | "grade" // درجة مُنشورة
  | "announcement" // إعلان جديد
  | "material" // مادة تعليمية مرفوعة
  | "due" // موعد تسليم يقترب
  | "message"; // رسالة جديدة

export type ActivityEvent = {
  id: string;
  kind: ActivityKind;
  title: string;
  course: string;
  detail?: string;
  /** درجة اختيارية تُعرض بخط Mono */
  score?: { value: number; outOf: number };
  at: Date;
};

export const ACTIVITY_META: Record<
  ActivityKind,
  { label: string; icon: LucideIcon; tone: "neutral" | "warning" | "success" }
> = {
  grade: { label: "درجة", icon: ClipboardCheck, tone: "success" },
  announcement: { label: "إعلان", icon: Megaphone, tone: "neutral" },
  material: { label: "مادة", icon: FileUp, tone: "neutral" },
  due: { label: "موعد", icon: CalendarClock, tone: "warning" },
  message: { label: "رسالة", icon: MessageSquare, tone: "neutral" },
};

/**
 * أحداث سجل النشاط.
 *
 * ⚠️ بيانات تجريبية — لا توجد جداول للمقررات والدرجات والإعلانات بعد.
 * عند إضافتها استبدل جسم الدالة باستعلام حقيقي مع إبقاء نفس التوقيع
 * ونوع `ActivityEvent`؛ صفحة العرض لن تحتاج أي تعديل.
 */
export async function getActivityFeed(
  _userId: string,
): Promise<ActivityEvent[]> {
  const now = Date.now();
  const hoursAgo = (h: number) => new Date(now - h * 3_600_000);

  return [
    {
      id: "1",
      kind: "grade",
      title: "نُشرت درجة الاختبار القصير الثاني",
      course: "التفاضل والتكامل",
      score: { value: 18, outOf: 20 },
      at: hoursAgo(2),
    },
    {
      id: "2",
      kind: "due",
      title: "الواجب الرابع — تسليم خلال يومين",
      course: "مقدمة في البرمجة",
      detail: "الأحد ١١:٥٩ مساءً",
      at: hoursAgo(5),
    },
    {
      id: "3",
      kind: "announcement",
      title: "تأجيل محاضرة الأربعاء إلى الخميس",
      course: "التفاضل والتكامل",
      detail: "لظرف طارئ، ستُعقد المحاضرة الخميس في نفس التوقيت والقاعة.",
      at: hoursAgo(21),
    },
    {
      id: "4",
      kind: "material",
      title: "رُفعت ملزمة الوحدة الثالثة",
      course: "مقدمة في البرمجة",
      detail: "PDF · ٢٤ صفحة",
      at: hoursAgo(29),
    },
    {
      id: "5",
      kind: "grade",
      title: "نُشرت درجة الواجب الثالث",
      course: "مقدمة في البرمجة",
      score: { value: 9, outOf: 10 },
      at: hoursAgo(52),
    },
    {
      id: "6",
      kind: "message",
      title: "رسالة جديدة من د. منى عبدالله",
      course: "التفاضل والتكامل",
      detail: "بخصوص استفسارك عن حل التمرين الخامس…",
      at: hoursAgo(74),
    },
  ];
}
