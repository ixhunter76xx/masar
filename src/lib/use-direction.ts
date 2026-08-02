"use client";

import * as React from "react";

export type Direction = "rtl" | "ltr";

/**
 * اتجاه القراءة الفعلي المقروء من المستند.
 *
 * لا يُفترض RTL ثابتًا رغم أن المنصة عربية: الاتجاه يُقرأ من
 * `document.documentElement.dir` ويُراقَب تغيّره. هذا يجعل كل الإيماءات
 * المبنية عليه صحيحة تلقائيًا لو أُضيفت واجهة إنجليزية لاحقًا.
 *
 * القيمة الابتدائية "rtl" لتطابق ما يُصيّره الخادم فلا يحدث اختلاف ترطيب.
 */
export function useDirection(): Direction {
  const [dir, setDir] = React.useState<Direction>("rtl");

  React.useEffect(() => {
    const root = document.documentElement;

    const read = () =>
      setDir(
        (root.getAttribute("dir") ??
          getComputedStyle(root).direction) === "ltr"
          ? "ltr"
          : "rtl",
      );

    read();
    const observer = new MutationObserver(read);
    observer.observe(root, { attributes: true, attributeFilter: ["dir"] });
    return () => observer.disconnect();
  }, []);

  return dir;
}

/**
 * محوّل الإحداثيات الفيزيائية إلى منطقية.
 *
 * ── القاعدة الوحيدة التي يقوم عليها كل شيء ─────────────────────────
 * **الموجب = باتجاه نهاية السطر (inline-end)**
 *   في LTR نهاية السطر يمينًا  → المنطقي = +الفيزيائي
 *   في RTL نهاية السطر يسارًا  → المنطقي = −الفيزيائي
 *
 * وبالتالي في كل المنصة:
 *   منطقي **سالب** = "للأمام" — التبويب التالي، وإخراج اللوحة من الشاشة
 *   منطقي **موجب** = "للخلف" — التبويب السابق
 *
 * لا يُكتب `left` أو `right` في أي منطق إيماءة. تُكتب الإشارة فقط.
 * ───────────────────────────────────────────────────────────────────
 */
export function useLogicalAxis() {
  const dir = useDirection();
  const sign = dir === "rtl" ? -1 : 1;

  return React.useMemo(
    () => ({
      dir,
      /** ‎+1 في LTR و‎−1 في RTL */
      sign,
      /** يحوّل إزاحة أو سرعة أفقية فيزيائية إلى منطقية */
      toLogical: (physical: number) => physical * sign,
      /** يحوّل مسافة منطقية إلى فيزيائية — للأنماط والتحريك */
      toPhysical: (logical: number) => logical * sign,
    }),
    [dir, sign],
  );
}
