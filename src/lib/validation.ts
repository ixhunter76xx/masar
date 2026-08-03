import { z } from "zod";

/**
 * مخطط التحقق من بيانات تسجيل الدخول.
 * اسم المستخدم = الرقم الأكاديمي أو البريد المؤسسي.
 */
export const loginSchema = z.object({
  /**
   * البريد هو معرّف الدخول.
   *
   * كان `username` في مركز حساب حيث تُنشئ الإدارة كل حساب برقم أكاديمي.
   * في مسار يسجّل الطالب نفسه ويشتري ببريده، فالبريد هو الحقل الوحيد
   * المضمون وجوده لكل حساب — و`username` صار اختياريًا لا يصلح مفتاحًا.
   *
   * `toLowerCase` هنا لا في طبقة البيانات: التطبيع جزء من قراءة المدخل،
   * فيصل إلى كل مستهلك مطبَّعًا ولا يُنسى في أحدهم.
   */
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "الرجاء إدخال البريد الإلكتروني.")
    .email("صيغة البريد غير صحيحة.")
    .max(120, "البريد طويل جدًا."),
  password: z
    .string()
    .min(1, "الرجاء إدخال كلمة المرور.")
    .min(6, "كلمة المرور يجب ألا تقل عن ٦ خانات."),
  remember: z.boolean().optional().default(false),
});

export type LoginInput = z.input<typeof loginSchema>;
export type LoginValues = z.output<typeof loginSchema>;
