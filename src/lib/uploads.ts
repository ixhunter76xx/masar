/** قيود رفع الفيديو — مشتركة بين المتصفح والخادم */

/** الحد الأقصى لحجم ملف الفيديو: 1 جيجابايت */
export const MAX_VIDEO_BYTES = 1024 * 1024 * 1024;

/** الصيغة الوحيدة المدعومة حاليًا */
export const ALLOWED_VIDEO_TYPE = "video/mp4";
export const ALLOWED_VIDEO_EXT = ".mp4";

/**
 * حجم الجزء في الرفع المجزّأ: 10 ميجابايت.
 * S3/R2 يشترطان ألا يقل الجزء عن 5MB (عدا الأخير)، و10MB يوازن بين
 * عدد الطلبات وحجم ما يُعاد رفعه عند فشل جزء.
 */
export const PART_SIZE = 10 * 1024 * 1024;

/** أقصى عدد محاولات لإعادة رفع جزء فاشل */
export const MAX_PART_RETRIES = 3;

/** صياغة حجم بالبايت إلى نص عربي مقروء */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} بايت`;
  const units = ["كيلوبايت", "ميجابايت", "جيجابايت"];
  let value = bytes / 1024;
  let i = 0;
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024;
    i++;
  }
  return `${value.toFixed(value < 10 ? 1 : 0)} ${units[i]}`;
}

/** تحقّق من الملف قبل بدء الرفع — تجربة مستخدم، والخادم يتحقق مجددًا */
export function validateVideoFile(file: File): string | null {
  if (file.type !== ALLOWED_VIDEO_TYPE) {
    return "الصيغة المدعومة حاليًا هي MP4 فقط.";
  }
  if (file.size > MAX_VIDEO_BYTES) {
    return `حجم الملف ${formatBytes(file.size)} — الحد الأقصى ${formatBytes(MAX_VIDEO_BYTES)}.`;
  }
  if (file.size === 0) return "الملف فارغ.";
  return null;
}
