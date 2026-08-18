"use client";

import * as React from "react";

/**
 * يربط مجموعات الدروس ببطاقات الباقات بصريًّا من الطرفين.
 * البيانات نفسها تبقى على الخادم؛ هذا الغلاف لا يعرف سعرًا ولا ملكية،
 * بل يقرأ `data-offer-segment` ويضيف حالتي الإضاءة والتخفيف فقط.
 */
export function OfferMap({ children }: { children: React.ReactNode }) {
  const rootRef = React.useRef<HTMLDivElement>(null);

  function focus(segment: string | null) {
    const nodes = rootRef.current?.querySelectorAll<HTMLElement>("[data-offer-segment]");
    if (!nodes) return;

    nodes.forEach((node) => {
      const own = node.dataset.offerSegment;
      const related = !segment || segment === "all" || own === segment || own === "all";
      node.classList.toggle("offer-on", Boolean(segment) && related);
      node.classList.toggle("offer-off", Boolean(segment) && !related);
    });
  }

  function segmentFrom(target: EventTarget | null) {
    return target instanceof Element
      ? target.closest<HTMLElement>("[data-offer-segment]")?.dataset.offerSegment ?? null
      : null;
  }

  return (
    <div
      ref={rootRef}
      onPointerOver={(event) => focus(segmentFrom(event.target))}
      onPointerLeave={() => focus(null)}
      onFocusCapture={(event) => focus(segmentFrom(event.target))}
      onBlurCapture={(event) => {
        if (!rootRef.current?.contains(event.relatedTarget)) focus(null);
      }}
    >
      {children}
    </div>
  );
}
