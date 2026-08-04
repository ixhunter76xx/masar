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

/* -------------------------------------------------------------------------- */
/*  التسجيل الذاتي                                                             */
/* -------------------------------------------------------------------------- */

/**
 * تطبيع رقم البحرين إلى صيغة `wa.me` — أرقام فقط بمفتاح الدولة.
 *
 * يقبل ما يكتبه الناس فعلًا: `3306 0460`، `+973 3306-0460`، `0097333060460`.
 * الرقم المحلي ثماني خانات ويبدأ بـ ٣ (نقّال) أو ٦ أو ١ — ومفتاح البحرين
 * ٩٧٣. نخزّن `97333060460` لأنه ما يقبله رابط المحادثة بلا معالجة.
 */
export function normalizeBahrainPhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  const local = digits.startsWith("00973")
    ? digits.slice(5)
    : digits.startsWith("973")
      ? digits.slice(3)
      : digits;

  if (!/^[136]\d{7}$/.test(local)) return null;
  return `973${local}`;
}

export const signupSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "الرجاء إدخال اسمك.")
    .max(80, "الاسم طويل جدًا."),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "الرجاء إدخال البريد الإلكتروني.")
    .email("صيغة البريد غير صحيحة.")
    .max(120, "البريد طويل جدًا."),
  /**
   * رقم واتساب مطلوب لا اختياري: إتمام الدفع يجري في المحادثة، فبلا
   * رقمٍ لا يكتمل الطلب — وطلبُه لاحقًا يعني مقاطعة الطالب في منتصف
   * الشراء. يُخزَّن مطبَّعًا بصيغة `wa.me`.
   */
  phone: z
    .string()
    .trim()
    .min(1, "الرجاء إدخال رقم واتساب.")
    .transform((value, ctx) => {
      const normalized = normalizeBahrainPhone(value);
      if (!normalized) {
        ctx.addIssue({
          code: "custom",
          message: "رقم بحريني غير صحيح — مثال: 33060460",
        });
        return z.NEVER;
      }
      return normalized;
    }),
  /**
   * ٨ خانات حدًّا أدنى ولا شرط تعقيد.
   *
   * مؤشّر القوة إرشادي لا مانع، كما اتُّفق: قواعد التعقيد الإلزامية
   * تُنتج `Passw0rd!` وتدفع الناس إلى كتابة كلماتهم على ورق. الطول
   * وحده هو ما يزيد الكلفة على المهاجم فعلًا — وهو موقف NIST.
   */
  password: z
    .string()
    .min(8, "كلمة المرور يجب ألا تقل عن ٨ خانات.")
    .max(72, "كلمة المرور طويلة جدًا."),
});

export type SignupInput = z.input<typeof signupSchema>;
export type SignupValues = z.output<typeof signupSchema>;
