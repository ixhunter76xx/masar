import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * تنبيهٌ على مستوى النموذج — منقول من `.authalert` في المعاينة المعتمدة
 * (`design/vision/index.html` السطر ٦٨١ على فرع `masar-vision`).
 *
 * ── لماذا مكوّنٌ لا صنف يُنسخ ────────────────────────────────────────
 * كان الشيء نفسه مكتوبًا بثلاث طرق: شريطٌ محدود في `LoginForm`، ونسخةٌ
 * حرفية منه في `SignupForm`، ونصٌّ أحمر عارٍ بلا حدٍّ ولا رمز في
 * `ChangePasswordForm`. أي منها يُقرأ صحيحًا وحده؛ ومجتمعةً تقول إن
 * الخطأ يبدو مختلفًا حسب الشاشة التي وقع فيها.
 *
 * ── الرمز ليس زينة ──────────────────────────────────────────────────
 * الخطأ لا يُقال باللون وحده (WCAG 1.4.1): من لا يميّز الأحمر يجب أن
 * يعرف أن هذا خطأ. الرمز `aria-hidden` لأن `role="alert"` يُعلن النصّ
 * نفسه — وإعلان «ضرب» فوقه ضجيج لا معلومة.
 *
 * الفرق بين النبرتين: **الخطأ يُعلَن مقاطعًا** (`role="alert"`) لأنه
 * يمنع المتابعة، و**النجاح يُعلَن مهذَّبًا** (`role="status"`) لأنه خبرٌ
 * لا يستدعي تصحيحًا.
 */
export function FormAlert({
  tone = "danger",
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  tone?: "danger" | "success";
}) {
  const danger = tone === "danger";

  return (
    <div
      role={danger ? "alert" : "status"}
      className={cn(
        "flex items-start gap-2.5 rounded-field border px-[0.95rem] py-[0.8rem]",
        "text-[0.8rem] leading-[1.7]",
        /* ── يدخل ولا يظهر فجأةً ──────────────────────────────────
           التنبيه يولد بعد فشل إرسالٍ أو نجاحه، أي في اللحظة التي
           تكون فيها العين على الزرّ لا على أعلى النموذج. وظهورٌ
           آنيّ فوق الزرّ يزيح ما تحته بلا أن يُلاحَظ مصدرُ الإزاحة.
           `anim-rise` — الدخول الموحّد في المنصّة: صعودٌ قصير مع
           تلاشٍ، `transform` و`opacity` وحدهما، ويسقط إلى تلاشٍ
           صرف عند `prefers-reduced-motion`. */
        "anim-rise",
        danger
          ? "border-danger/40 bg-danger/10 text-danger"
          : "border-success/40 bg-success/10 text-success",
        className,
      )}
      {...props}
    >
      <span aria-hidden="true" className="mt-[0.1rem] shrink-0 font-bold">
        {danger ? "✕" : "✓"}
      </span>
      <span>{children}</span>
    </div>
  );
}
