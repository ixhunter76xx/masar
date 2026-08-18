import Image from "next/image";

import { SITE } from "@/lib/site";
import { cn } from "@/lib/utils";

/** شكل مربّع الهوية المحيط بالشعار */
type LogoShape = "square" | "circle";

/**
 * أي نسخة من الشعار تُعرض:
 * - `full` الشعار الكامل: الرمز + كلمة MASAR تحته
 * - `mark`  الرمز وحده بلا كتابة لاتينية
 * - `auto`  (الافتراضي) يختار حسب المقاس
 */
type LogoVariant = "auto" | "full" | "mark";

/**
 * الحد الذي تصبح تحته الكتابة اللاتينية غير مقروءة، فنكتفي بالرمز.
 */
const FULL_LOGO_MIN_SIZE = 64;

/**
 * ── نقطة الاستبدال الوحيدة ───────────────────────────────────────────
 * الشعار الحالي صورة نقطية مستخرجة من نسخة أولية. عند وصول الشعار
 * النهائي: استبدل الملفّين هنا فقط — أو حوّل هذا المكوّن إلى SVG مضمّن
 * إن وصل بصيغة متجهية، وهو الأفضل لأنه يبقى حادًّا في كل مقاس ويأخذ
 * لونه من `currentColor` فلا يحتاج نسخة لكل خلفية.
 * ─────────────────────────────────────────────────────────────────────
 */
const SOURCES: Record<Exclude<LogoVariant, "auto">, string> = {
  full: "/logo-masar.png?v=vision-20260814",
  /* المرجع المعتمد يقدّم هويةً واحدة لا رمزًا أزرق بديلًا. */
  mark: "/logo-masar.png?v=vision-20260814",
};

export function Logo({
  size = 80,
  shape = "square",
  variant = "auto",
  /** يعرض الشعار بلا مربّع الهوية خلفه */
  bare = false,
  className,
}: {
  size?: number;
  shape?: LogoShape;
  variant?: LogoVariant;
  bare?: boolean;
  className?: string;
}) {
  const resolved =
    variant === "auto"
      ? size >= FULL_LOGO_MIN_SIZE
        ? "full"
        : "mark"
      : variant;

  // الرمز وحده أعرض نسبيًا من الشعار الكامل، فيأخذ نسبة أصغر من المربّع
  const ratio = resolved === "mark" ? 0.7 : 0.86;
  const inner = Math.round(size * ratio);

  const image = (
    <Image
      src={SOURCES[resolved]}
      alt={`شعار ${SITE.name}`}
      width={inner}
      height={inner}
      priority
      className="object-contain"
      style={{ width: inner, height: inner }}
    />
  );

  /* بلا مربّع: الشعار المعتمد على الخلفية الداكنة مباشرةً. مناسب للرأسية
     والصفحات العامة حيث إطارٌ إضافي يثقل الواجهة. */
  if (bare) {
    /* ملف الهوية مربع وفي وسطه توقيع أفقي. نقصّ فراغه الرأسي داخل
       غلاف أفقي بدل تصغير المربع كله حتى يصير التوقيع غير مقروء. */
    if (resolved === "full") {
      const width = Math.round(size * 2.45);
      return (
        <span
          className={cn("relative inline-flex shrink-0 items-center justify-center overflow-hidden", className)}
          style={{ width, height: size }}
        >
          <Image
            src={SOURCES.full}
            alt={`شعار ${SITE.name}`}
            width={width}
            height={width}
            priority
            className="max-w-none object-contain"
            style={{ width, height: width }}
          />
        </span>
      );
    }

    return (
      <span
        className={cn("inline-flex shrink-0 items-center justify-center", className)}
        style={{ width: size, height: size }}
      >
        {image}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center shrink-0",
        shape === "circle" ? "rounded-full" : "rounded-[14px]",
        "border border-line bg-panel",
        className,
      )}
      style={{ width: size, height: size }}
    >
      {image}
    </span>
  );
}
