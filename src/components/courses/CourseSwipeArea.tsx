"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "motion/react";

import { COURSE_TABS, tabHref } from "@/lib/course-tabs";
import { useLogicalAxis } from "@/lib/use-direction";
import {
  DRAG_DISTANCE_THRESHOLD,
  DRAG_VELOCITY_THRESHOLD,
  DRAG_BOUNCE,
} from "@/lib/motion";

/** مطاطية السحب: ٢٢٪ من مسافة الإصبع — إشارة لا تمرير حقيقي للمحتوى */
const ELASTIC_OPEN = 0.22;
/** مطاطية عند طرف لا تبويب بعده — تقاوم بوضوح فيُقرأ الحدّ باللمس */
const ELASTIC_BLOCKED = 0.05;

/**
 * منطقة السحب بين تبويبات المقرر — للمس فقط.
 *
 * ── الاتجاه ──────────────────────────────────────────────────────────
 * تخيّل التبويبات شريطًا واحدًا مرتّبًا باتجاه القراءة: الأول عند بداية
 * السطر والأخير عند نهايته. التبويب **التالي** يقع باتجاه نهاية السطر،
 * ولإحضاره إلى الشاشة يجب أن ينزلق الشريط **نحو بداية السطر** — والإصبع
 * يتحرّك مع الشريط لا ضدّه.
 *
 *   LTR: بداية السطر يسارًا → سحب الإصبع لليسار = التبويب التالي
 *   RTL: بداية السطر يمينًا → سحب الإصبع لليمين = التبويب التالي
 *
 * الحالة الأولى هي المعتادة في تطبيقات الهاتف الإنجليزية، والثانية
 * مرآتها تمامًا. هذا هو الخطأ الذي يقع فيه أغلب من ينفّذ الميزة: يثبّت
 * "لليسار = التالي" فيصير السحب في العربية معكوسًا على المستخدم.
 *
 * الكود لا يعرف يمينًا من يسار: يحوّل الإزاحة إلى منطقية عبر
 * `toLogical`، والقاعدة واحدة — **سالب = التالي، موجب = السابق**.
 * تغيير `dir` على عنصر html يقلب السلوك وحده بلا سطر إضافي.
 *
 * الموضع الوحيد الذي يلزم فيه ذكر الجهة الفيزيائية هو `dragElastic`،
 * لأن motion يسمّي حافتيه `left` و`right`. لذلك تُبنى قيمته من الإشارة
 * بدل كتابة الجهتين يدويًا — انظر `elastic` أدناه.
 * ─────────────────────────────────────────────────────────────────────
 *
 * ── لماذا اللمس فقط ──────────────────────────────────────────────────
 * السحب مربوط بـ `(pointer: coarse)`. على الحاسوب يعطّل سحب الفأرة
 * تحديدَ النص ونسخه، وهو ضرر حقيقي مقابل فائدة صفر: مستخدم الحاسوب
 * لديه الشريط والروابط ولوحة المفاتيح.
 * ─────────────────────────────────────────────────────────────────────
 */
export function CourseSwipeArea({
  courseId,
  children,
}: {
  courseId: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { toLogical, sign } = useLogicalAxis();

  const [isTouch, setIsTouch] = React.useState(false);

  React.useEffect(() => {
    const query = window.matchMedia("(pointer: coarse)");
    const read = () => setIsTouch(query.matches);
    read();
    query.addEventListener("change", read);
    return () => query.removeEventListener("change", read);
  }, []);

  /** ترتيب التبويب الحالي داخل COURSE_TABS */
  const currentIndex = React.useMemo(() => {
    const base = `/learn/${courseId}`;
    // الأطول أولًا حتى لا يلتقط التبويب الافتراضي مسارات التبويبات الأخرى
    const matched = [...COURSE_TABS]
      .map((tab, index) => ({ index, href: tabHref(courseId, tab.segment) }))
      .sort((a, b) => b.href.length - a.href.length)
      .find(({ href }) => pathname === href || pathname.startsWith(`${href}/`));

    return matched?.index ?? (pathname === base ? 0 : -1);
  }, [pathname, courseId]);

  const canGoNext = currentIndex >= 0 && currentIndex < COURSE_TABS.length - 1;
  const canGoPrev = currentIndex > 0;

  /**
   * تحويل "التالي/السابق" المنطقيين إلى حافتَي motion الفيزيائيتين.
   * التالي = منطقي سالب = فيزيائي بإشارة `-sign`
   *   sign = +1 (LTR) → التالي على اليسار
   *   sign = −1 (RTL) → التالي على اليمين
   */
  const nextEdge = sign > 0 ? "left" : "right";
  const prevEdge = sign > 0 ? "right" : "left";
  const elastic = {
    [nextEdge]: canGoNext ? ELASTIC_OPEN : ELASTIC_BLOCKED,
    [prevEdge]: canGoPrev ? ELASTIC_OPEN : ELASTIC_BLOCKED,
  } as { left: number; right: number };

  if (!isTouch || currentIndex < 0) return <>{children}</>;

  return (
    <motion.div
      /* pan-y يترك التمرير الرأسي للمتصفح ويمنعه من ابتلاع السحب الأفقي */
      className="touch-pan-y"
      drag="x"
      dragDirectionLock
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={elastic}
      dragMomentum={false}
      dragTransition={DRAG_BOUNCE}
      onDragEnd={(_, info) => {
        const distance = toLogical(info.offset.x);
        const speed = toLogical(info.velocity.x);

        const wantsNext =
          distance < -DRAG_DISTANCE_THRESHOLD ||
          speed < -DRAG_VELOCITY_THRESHOLD;
        const wantsPrev =
          distance > DRAG_DISTANCE_THRESHOLD ||
          speed > DRAG_VELOCITY_THRESHOLD;

        const target =
          wantsNext && canGoNext
            ? currentIndex + 1
            : wantsPrev && canGoPrev
              ? currentIndex - 1
              : currentIndex;

        if (target !== currentIndex) {
          router.push(tabHref(courseId, COURSE_TABS[target].segment));
        }
      }}
    >
      {children}
    </motion.div>
  );
}
