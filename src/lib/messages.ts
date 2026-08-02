/**
 * ثوابت وأنواع المراسلة المشتركة بين الخادم والعميل.
 *
 * منفصلة عن `lib/data/messages.ts` عمدًا: ذاك الملف معلَّم `server-only`،
 * فاستيراد أي قيمة منه في مكوّن عميل يُفشل البناء. الأنواع وحدها تُمحى
 * عند الترجمة فلا تُسبّب ذلك، أما ثابت مثل الحد الأقصى للطول فيُستورد
 * فعلًا — ولا بدّ أن يعرفه الطرفان: المتصفح ليحدّ الإدخال، والخادم
 * ليرفض ما تجاوزه. مصدر واحد يمنع افتراقهما.
 */

/** أقصى طول لرسالة — يمنع إغراق القاعدة برسالة واحدة */
export const MESSAGE_MAX_LENGTH = 2000;

export type ThreadMessage = {
  id: string;
  body: string;
  createdAt: Date;
  /** أرسلها المستخدم الحالي — لتحديد جهة الفقاعة */
  isMine: boolean;
  /** قرأها الطرف الآخر — يظهر للمرسل فقط */
  readAt: Date | null;
};

export type ConversationSummary = {
  courseId: string;
  courseTitle: string;
  courseCode: string;
  /** الطرف الآخر: اسم المدرب للطالب، واسم الطالب للمدرب */
  peerName: string;
  /** معرّف الطالب — مفتاح المسار في كل الحالات */
  studentId: string;
  lastBody: string | null;
  lastAt: Date | null;
  unread: number;
};
