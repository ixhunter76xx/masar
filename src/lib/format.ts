/** صياغة الوقت النسبي بالعربية */
export function relativeTime(date: Date, now: Date = new Date()): string {
  const diffMs = now.getTime() - date.getTime();
  const minutes = Math.round(diffMs / 60_000);

  if (minutes < 1) return "الآن";
  if (minutes < 60) return `قبل ${minutes} دقيقة`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `قبل ${hours} ساعة`;

  const days = Math.round(hours / 24);
  if (days === 1) return "أمس";
  if (days < 7) return `قبل ${days} أيام`;

  return new Intl.DateTimeFormat("ar", {
    day: "numeric",
    month: "long",
  }).format(date);
}

/** تاريخ كامل: "٤ أغسطس ٢٠٢٦" — للسجلات المالية حيث "قبل ٣ أيام" لا يكفي */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("ar", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

/** مدى تاريخي مختصر: "١ فبراير – ١٥ يونيو ٢٠٢٦" */
export function formatDateRange(from: Date, to: Date): string {
  const day = new Intl.DateTimeFormat("ar", { day: "numeric", month: "long" });
  const full = new Intl.DateTimeFormat("ar", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return `${day.format(from)} – ${full.format(to)}`;
}
