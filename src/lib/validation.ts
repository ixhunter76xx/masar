import { z } from "zod";

/**
 * مخطط التحقق من بيانات تسجيل الدخول.
 * اسم المستخدم = الرقم الأكاديمي أو البريد المؤسسي.
 */
export const loginSchema = z.object({
  username: z
    .string()
    .trim()
    .min(1, "الرجاء إدخال اسم المستخدم.")
    .min(4, "اسم المستخدم قصير جدًا.")
    .max(64, "اسم المستخدم طويل جدًا."),
  password: z
    .string()
    .min(1, "الرجاء إدخال كلمة المرور.")
    .min(6, "كلمة المرور يجب ألا تقل عن ٦ خانات."),
  remember: z.boolean().optional().default(false),
});

export type LoginInput = z.input<typeof loginSchema>;
export type LoginValues = z.output<typeof loginSchema>;
