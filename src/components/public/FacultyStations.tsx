"use client";

import * as React from "react";
import { Atom, Cpu, GraduationCap, Layers, Wrench, type LucideIcon } from "lucide-react";

import { CourseCard } from "@/components/public/CourseCard";
import { Counted } from "@/components/ui/Num";
import { NOT_OFFERED_LABEL, type FacultyIconKey, type Station } from "@/lib/faculties";
import type { CourseCard as CourseCardData } from "@/lib/data/courses";

/**
 * ══ محطّات الكليات ═══════════════════════════════════════════════════
 *
 * الكليات محطّات على المسار، والاختيار يحرّك علامة الموقع.
 *
 * ── لماذا هذا الشكل ─────────────────────────────────────────────────
 * الاختيار والمحتوى في الإطار الأول معًا: لا بوّابة قبل المحتوى، ولا
 * نقرة للوصول إليه. والصفحة تمتلئ بالمحطّات لا بالمقررات — وهو ما
 * يجعلها تبدو مقصودة وهي تحمل مقرَّرًا واحدًا.
 *
 * ── لماذا رأسي ──────────────────────────────────────────────────────
 * ليس ذوقًا. المسار الرأسي بلا اتجاه أفقي، فلا `translateX` ولا
 * افتراض جهة: العلامة تتحرّك بـ`offsetTop` المقيس. في واجهة RTL لها
 * تاريخ أخطاء اتجاه موثّق، هذا يزيل فئة الأخطاء بدل أن يتفاداها.
 *
 * ── لماذا بلا `spark` ───────────────────────────────────────────────
 * اللون الجريء محجوز بقاعدة صريحة للتقدّم والإنجاز. «أين أقف» موقعٌ
 * لا إنجاز، واستعماله هنا يستهلك أثره. المحطّة النشطة تأخذ
 * `accent-bright`/`action` وهي لغة الاختيار في المنصة.
 * ═══════════════════════════════════════════════════════════════════
 */

const ICONS: Record<FacultyIconKey, LucideIcon> = {
  arts: GraduationCap,
  it: Cpu,
  science: Atom,
  engineering: Wrench,
  /* كلية من قاعدة البيانات خارج قائمة المنصة — تُعرض ولا تُخفى */
  other: Layers,
};

const ARTS_GLYPHS = [
  { glyph: "ب", top: 12, start: 8, size: 2.5, rotate: 7 },
  { glyph: "ن", top: 58, start: 22, size: 1.7, rotate: -6 },
  { glyph: "ر", top: 26, start: 38, size: 3.1, rotate: 7 },
  { glyph: "ك", top: 72, start: 52, size: 1.9, rotate: -6 },
  { glyph: "ع", top: 40, start: 66, size: 2.2, rotate: 7 },
  { glyph: "م", top: 16, start: 80, size: 1.6, rotate: -6 },
  { glyph: "ه", top: 64, start: 92, size: 2.8, rotate: 7 },
] as const;

/**
 * ══ هندسة مشهدَي التقنية والهندسة ═══════════════════════════════════
 *
 * «دوائر منطقية على مستويات متعددة» — والعبارة تُقرأ قراءتين، والرسم
 * يفي بهما معًا: دائرةٌ منطقية حقيقية (AND ← OR ← NOT) موزَّعةٌ على
 * أربعة مستويات منطقية، مرسومةٌ ثلاث مرّات على ثلاثة مستويات عمق.
 * وكل عقدةٍ فيها دائرة: المداخل، والفقاعة، والتفرّعان، والمخارج.
 *
 * ── ⚠ الشريط الظاهر من المشهد ضحلٌ جدًّا — وهذا هو السبب الأول ──────
 * `.faculty-scene` بارتفاع ٣٦٠px خلف عمود المحتوى، لكن **بطاقات
 * المقررات معتمة وتغطّي أكثره**. والمقيس بـ`getBoundingClientRect`،
 * لا بالنظر — وهو يتغيّر بعرض النافذة لأن المقياس تابعٌ لعرض العمود:
 *
 *   | عرض النافذة | `xMidYMid` ‹سابقًا› | `xMidYMin` ‹الآن› |
 *   |---|---|---|
 *   | ١٢٨٠px | `y = 0..71` | `y = 0..146` |
 *   | ١٤٤٠px | `y = 0..74` | `y = 0..126` |
 *
 * التوسيط يهدر نصف المساحة: يدفع الرسم لأسفل بمقدار `(h − 300·k)/2`
 * فيقع تحت البطاقات. والمحاذاة لأعلى تستردّها.
 *
 * ولذلك كان مشهد التقنية المعتمد يبدو خاويًا: بوّاباته الثلاث عند
 * `y = 96..164`، أي **خلف البطاقات كلّها**، ولا يظهر منه إلا خطّان
 * أفقيّان شاردان. لم يكن الرسم رديئًا — كان مقصوصًا.
 *
 * فالتكوين هنا محصورٌ في `y = 0..130`: شريطٌ عريض ضحل، لا مربّع.
 * **من يضيف عنصرًا: قِس أين تبدأ الشبكة أولًا، لا تفترض ٣٠٠ وحدة.**
 *
 * والمشهدان الآخران على `xMidYMid` ولهما القصّ نفسه — لم يُمسّا لأن
 * الطلب لم يشملهما. مقيسًا عند ١٤٤٠px: الآداب يرسم `y = 23..244`
 * والظاهر منه حتى `74`، والعلوم أوسع منه بمداراته المائلة. أي أن
 * أكثر من ثلثَي كلٍّ منهما تحت البطاقات.
 *
 * ── لماذا الشكل مُولَّد لا مكتوب باليد ───────────────────────────────
 * المستوى الواحد يُرسم ثلاث مرّات بثلاثة مقاسات. كتابته ثلاثًا تعني
 * ثلاث فرص لانحرافٍ لا يمسكه المترجم ولا تكشفه لقطة شاشة.
 *
 * ── قيود سرت على الرسم كلّه ─────────────────────────────────────────
 * • `transform`/`opacity` وحدهما. لا `stroke-dashoffset` متحرّك ولا
 *   `height` ولا `top` — جولة الأداء أزالت هذا الصنف كلّه عمدًا.
 * • العمق يتباعد بالمقاس والعتامة، لا بلونٍ جديد. و`non-scaling-stroke`
 *   يُبقي سُمك الخطّ ثابتًا مهما صغُر المستوى، فالعتامة وحدها تُبعِد.
 * • الانزياح داخل المجموعة المُصغَّرة لا خارجها، فيصغُر معها: المستوى
 *   البعيد يتحرّك أقلّ من القريب — وذلك هو المنظور الحركي بعينه.
 * • `--color-spark` بقي حيث كان: نقاط `.faculty-pulse` وحدها، بحكم
 *   صنفها القائم. ولم يُضَف إلى خيوط الإشارة — تلك `accent-bright`،
 *   فاللون الجريء محجوزٌ للتقدّم والإنجاز بقاعدة المشروع.
 * ═══════════════════════════════════════════════════════════════════
 */

/** بوّابة AND: ضلعٌ مستقيم عند المدخل، وقوسٌ نصف دائري عند المخرج. */
function andGate(x: number, cy: number, hh: number) {
  const flat = x + hh * 0.88;
  return `M${x},${cy - hh} L${flat},${cy - hh} A${hh},${hh} 0 0 1 ${flat},${cy + hh} L${x},${cy + hh} Z`;
}

/** بوّابة OR: ظهرٌ مقعّر عند المدخل، وطرفٌ مدبّب عند المخرج. */
function orGate(x: number, cy: number, hh: number, w: number) {
  return (
    `M${x},${cy - hh} Q${x + w * 0.42},${cy} ${x},${cy + hh}` +
    ` Q${x + w * 0.72},${cy + hh * 0.92} ${x + w},${cy}` +
    ` Q${x + w * 0.72},${cy - hh * 0.92} ${x},${cy - hh} Z`
  );
}

/* الفراغ المحلي للدائرة: ٤٠..٨٣٠ عرضًا، و١٦..١٢٠ ارتفاعًا.
   وهو شريطٌ عريض ضحل عمدًا — لأن ما يظهر من المشهد فعلًا شريطٌ
   بهذا الشكل، لا مربّعٌ (انظر تعليق `preserveAspectRatio` أدناه). */
const IN_X = 44;
const AND_X = 150;
const AND_HH = 18;
const AND_OUT = AND_X + AND_HH * 0.88 + AND_HH;
const OR_X = 330;
const OR_W = 62;
const OR_OUT = OR_X + OR_W;
/* ملتقى السلك بالظهر المقعّر عند ±١٣ من المحور، محسوبٌ على منحنى
   بيزييه نفسه لا مقدَّرًا بالعين — وإلا بقيت فجوةٌ ظاهرة بين السلك
   والبوّابة تُقرأ خطأً في الرسم لا أسلوبًا فيه. */
const OR_IN = OR_X + 2 * 0.75 * 0.25 * 0.42 * OR_W;
const NOT_OUT = 498;
const OUT_X = 826;

const LOGIC_INPUTS = [23, 45, 91, 113] as const;
const LOGIC_LEVEL_MARKS = [112, 250, 420, 578] as const;
const LOGIC_LIT = [
  { x: AND_OUT, y: 34 },
  { x: OR_OUT, y: 68 },
  { x: OUT_X, y: 68 },
] as const;

/** مستوًى واحد من الدائرة المنطقية، كاملًا في فراغه المحلي. */
function LogicNet({ live }: { live: boolean }) {
  return (
    <>
      {/* فواصل المستويات — دليل رسمٍ خافت يقول أين ينتهي مستوى ويبدأ آخر */}
      <g strokeWidth=".9" opacity=".22" strokeDasharray="2 8">
        {LOGIC_LEVEL_MARKS.map((x) => (
          <line key={x} x1={x} y1="6" x2={x} y2="128" />
        ))}
      </g>

      {/* المستوى ١ — أربعة مداخل */}
      <g strokeWidth="1.1" opacity=".6">
        {LOGIC_INPUTS.map((y) => (
          <React.Fragment key={y}>
            <circle cx={IN_X} cy={y} r="3.4" />
            <line x1={IN_X + 4} y1={y} x2={AND_X} y2={y} />
          </React.Fragment>
        ))}
      </g>

      {/* المستوى ٢ — بوّابتا AND، ثم عمود توجيهٍ واحد إلى ما بعدهما */}
      <g strokeWidth="1.35" opacity=".85">
        <path d={andGate(AND_X, 34, AND_HH)} />
        <path d={andGate(AND_X, 102, AND_HH)} />
      </g>
      <g strokeWidth="1.1" opacity=".6">
        <path d={`M${AND_OUT},34 H260 V56 H${OR_IN}`} />
        <path d={`M${AND_OUT},102 H260 V80 H${OR_IN}`} />
      </g>

      {/* المستوى ٣ — بوّابة OR تجمع مخرجَي المستوى قبله */}
      <g strokeWidth="1.35" opacity=".85">
        <path d={orGate(OR_X, 68, 24, OR_W)} />
      </g>

      {/* المستوى ٤ — عاكس NOT بفقاعته، ثم تفرّعٌ إلى ثلاثة مخارج */}
      <g strokeWidth="1.35" opacity=".85">
        <line x1={OR_OUT} y1="68" x2="452" y2="68" />
        <path d="M452,49 L452,87 L486,68 Z" />
        <circle cx="492" cy="68" r="6" />
      </g>
      <g strokeWidth="1.1" opacity=".6">
        <path d={`M${NOT_OUT},68 H${OUT_X - 6}`} />
        <path d={`M660,68 V22 H${OUT_X - 6}`} />
        <path d={`M700,68 V112 H${OUT_X - 6}`} />
        <circle cx={OUT_X} cy="22" r="4" />
        <circle cx={OUT_X} cy="68" r="4" />
        <circle cx={OUT_X} cy="112" r="4" />
        {/* نقطتا التفرّع مصمتتان — اصطلاح المخطّطات لوصل سلكين لا لتقاطعهما.
            بأسلوبٍ سطريّ لأن `fill` سمةُ عرضٍ تغلبها قاعدة `.faculty-scene`. */}
        {[660, 700].map((x) => (
          <circle
            key={x}
            cx={x}
            cy="68"
            r="2.8"
            style={{ fill: "var(--color-accent)", stroke: "none" }}
          />
        ))}
      </g>

      {/* الإشارة على المستوى الأقرب وحده، فلا يزدحم العمق */}
      {live && (
        <>
          <path
            className="faculty-flow"
            d={`M${IN_X + 4},23 H${AND_X} M${IN_X + 4},91 H${AND_X} M${OR_OUT},68 H452 M${NOT_OUT},68 H660 M700,112 H${OUT_X - 6}`}
            strokeWidth="2.2"
            strokeLinecap="round"
            style={{ stroke: "var(--color-accent-bright)" }}
          />
          {LOGIC_LIT.map((dot, i) => (
            <circle
              key={dot.x}
              className="faculty-pulse"
              cx={dot.x}
              cy={dot.y}
              r="3.6"
              style={{ animationDelay: `${i * 1.7}s` }}
            />
          ))}
        </>
      )}
    </>
  );
}

/**
 * جمالون ورِن: وترٌ علويّ وآخر سفليّ يربطهما قطريٌّ متعرّج **واحد
 * متّصل**. المسار الواحد يصف البنية كما تُنشأ فعلًا — لا مثلثاتٍ
 * منفصلة تتصادف عند نقطة، وذلك الفرق بين رسمٍ يقرأه مهندس ورسمٍ
 * يشبهه من بعيد.
 */
function Truss({
  x0,
  x1,
  top,
  bottom,
  bays,
  joints = false,
  live = false,
}: {
  x0: number;
  x1: number;
  top: number;
  bottom: number;
  bays: number;
  joints?: boolean;
  live?: boolean;
}) {
  const panel = (x1 - x0) / bays;
  const lower = Array.from({ length: bays + 1 }, (_, i) => x0 + i * panel);
  const upper = Array.from({ length: bays }, (_, i) => x0 + (i + 0.5) * panel);
  const web = [
    `M${x0},${bottom}`,
    ...upper.map((x, i) => `L${x},${top} L${x0 + (i + 1) * panel},${bottom}`),
  ].join(" ");

  return (
    <>
      <path d={web} strokeWidth="1" opacity=".62" />
      <line x1={x0 + panel / 2} y1={top} x2={x1 - panel / 2} y2={top} strokeWidth="1.4" />
      <line x1={x0} y1={bottom} x2={x1} y2={bottom} strokeWidth="1.4" />
      {joints && (
        <g strokeWidth="1" opacity=".7">
          {lower.map((x) => (
            <circle key={`b${x}`} cx={x} cy={bottom} r="2.6" />
          ))}
          {upper.map((x) => (
            <circle key={`t${x}`} cx={x} cy={top} r="2.6" />
          ))}
        </g>
      )}
      {/* الحمل يسري في السطح — قِطعٌ قصيرة لأن `.faculty-flow` تُظهر
          أوّل شَرطةٍ من كل مسارٍ فرعيّ، فالتقسيم هو ما يوزّع الوميض */}
      {live && (
        <path
          className="faculty-flow"
          d={lower
            .slice(0, -1)
            .map((x) => `M${x},${bottom} H${x + panel}`)
            .join(" ")}
          strokeWidth="2.2"
          strokeLinecap="round"
          style={{ stroke: "var(--color-accent-bright)" }}
        />
      )}
    </>
  );
}

/* الجسر القريب: هندسته في مكانٍ واحد، فالمساند والأحمال والمفاصل
   كلها تُشتقّ منها ولا يُكتب أيٌّ منها بيده. الأصلُ الواحد هو ما
   يمنع السهمَ من الانزلاق عن مفصله إذا تغيّر عدد العيون. */
const TRUSS_SPAN = { x0: 70, x1: 830, top: 34, bottom: 108, bays: 9 } as const;
/* ثلاثة أحمال متناظرة حول المنتصف، والوسطى في وسط البحر تمامًا —
   وهو موضع أقصى انثناء، وهو نفسه مركزُ `faculty-flex` أدناه. وعددُ
   العيون فرديّ لأجل ذلك: الزوجيّ يجعل المنتصف عقدةً سفلية لا علوية. */
const TRUSS_LOADS = [1, 4, 7].map(
  (i) => TRUSS_SPAN.x0 + (i + 0.5) * ((TRUSS_SPAN.x1 - TRUSS_SPAN.x0) / TRUSS_SPAN.bays),
);

/**
 * رسمٌ دلالي خفيف يميّز كل كلية.
 *
 * «الآداب» و«العلوم» كما في المعاينة المعتمدة حرفًا بحرف. أمّا
 * «تقنية المعلومات» و«الهندسة» فأُعيد رسمهما (انظر التعليق أعلاه):
 * المعتمد فيهما كان يقع خلف بطاقات المقررات فلا يكاد يُرى.
 */
function FacultyScene({ icon, running }: { icon: FacultyIconKey; running: boolean }) {
  return (
    <div
      className="faculty-scene"
      data-paused={running ? undefined : "true"}
      aria-hidden="true"
    >
      {icon === "arts" && (
        <>
          <svg viewBox="0 0 900 300" preserveAspectRatio="xMidYMid meet">
            <g className="faculty-drift">
              <path className="faculty-draw" strokeWidth="1.4" d="M40,210 C170,60 300,250 430,140 S690,40 860,170" />
              <path className="faculty-draw" strokeWidth="1" opacity=".55" d="M40,250 C200,120 320,270 470,180 S720,90 860,215" />
              <path className="faculty-draw" strokeWidth=".8" opacity=".35" d="M60,150 C200,40 330,180 480,90 S700,10 850,120" />
              <path className="faculty-flow" strokeWidth="2.2" stroke="var(--color-spark)" strokeLinecap="round" d="M40,210 C170,60 300,250 430,140 S690,40 860,170" />
              <path className="faculty-flow" strokeWidth="1.6" stroke="var(--color-accent-bright)" strokeLinecap="round" opacity=".5" style={{ animationDuration: "34s", animationDelay: "-9s" }} d="M40,250 C200,120 320,270 470,180 S720,90 860,215" />
            </g>
          </svg>
          <div className="faculty-glyphs">
            {ARTS_GLYPHS.map((item) => (
              <span
                key={item.glyph}
                style={{
                  top: `${item.top}%`,
                  insetInlineStart: `${item.start}%`,
                  fontSize: `${item.size}rem`,
                  transform: `rotate(${item.rotate}deg)`,
                } as React.CSSProperties}
              >
                {item.glyph}
              </span>
            ))}
          </div>
        </>
      )}

      {icon === "it" && (
        <svg viewBox="0 0 900 300" preserveAspectRatio="xMidYMin meet">
          {/* المستوى ٠ — سكك اللوحة، أبعد ما في المشهد وأخفته */}
          <g strokeWidth="1" opacity=".13">
            {[16, 58, 100, 142, 184].map((y) => <line key={y} x1="24" y1={y} x2="876" y2={y} />)}
          </g>

          {/* المستوى ٣ — الأصغر والأخفت، ويتحرّك أبطأ ما في المشهد */}
          <g transform="translate(58,0) scale(.26)" opacity=".28">
            <g className="faculty-drift" style={{ animationDuration: "34s", animationDelay: "-13s" }}>
              <LogicNet live={false} />
            </g>
          </g>

          {/* المستوى ٢ — يتراكب على الأقرب من أعلاه، والتراكب هو ما يُقرأ عمقًا */}
          <g transform="translate(404,-2) scale(.36)" opacity=".4">
            <g className="faculty-drift" style={{ animationDuration: "27s", animationDelay: "-6s" }}>
              <LogicNet live={false} />
            </g>
          </g>

          {/* المستوى ١ — الأقرب، وهو وحده الذي تسري فيه الإشارة */}
          <g className="faculty-drift" style={{ animationDuration: "21s" }}>
            <LogicNet live />
          </g>
        </svg>
      )}

      {icon === "science" && (
        <svg viewBox="0 0 900 300" preserveAspectRatio="xMidYMid meet">
          <g className="faculty-spin" style={{ transformOrigin: "450px 150px" }}>
            <ellipse className="faculty-draw" cx="450" cy="150" rx="300" ry="96" strokeWidth="1.2" />
            <ellipse className="faculty-draw" cx="450" cy="150" rx="300" ry="96" strokeWidth="1" opacity=".6" transform="rotate(60 450 150)" />
            <ellipse className="faculty-draw" cx="450" cy="150" rx="300" ry="96" strokeWidth="1" opacity=".6" transform="rotate(-60 450 150)" />
          </g>
          <circle className="faculty-pulse" cx="450" cy="150" r="7" fill="var(--color-spark)" stroke="none" />
        </svg>
      )}

      {(icon === "engineering" || icon === "other") && (
        <svg viewBox="0 0 900 300" preserveAspectRatio="xMidYMin meet">
          {/* المستوى ٠ — خطوط المنسوب على ورقة الرسم */}
          <g strokeWidth=".9" opacity=".13">
            {[20, 66, 112, 158].map((y) => <line key={y} x1="20" y1={y} x2="880" y2={y} />)}
          </g>

          {/* المستوى ٣ — جسرٌ بعيد، ستّ عيون فقط لأن التفصيل لا يُقرأ على هذا المقاس */}
          <g transform="translate(66,-4) scale(.2)" opacity=".26">
            <g className="faculty-drift" style={{ animationDuration: "33s", animationDelay: "-15s" }}>
              <Truss {...TRUSS_SPAN} bays={5} />
            </g>
          </g>

          {/* المستوى ٢ */}
          <g transform="translate(566,-8) scale(.28)" opacity=".34">
            <g className="faculty-drift" style={{ animationDuration: "25s", animationDelay: "-7s" }}>
              <Truss {...TRUSS_SPAN} bays={6} />
            </g>
          </g>

          {/* الأحمال عند ثلاث عُقد علوية بعينها — لا موزّعة بالتقريب */}
          <g strokeWidth="1.1" opacity=".5">
            {TRUSS_LOADS.map((x) => (
              <React.Fragment key={x}>
                <line x1={x} y1="4" x2={x} y2="24" />
                <path d={`M${x - 5},19 L${x},29 L${x + 5},19`} />
              </React.Fragment>
            ))}
          </g>

          {/* المستوى ١ — الجسر القريب: مفاصله ومسانده كاملة. الانثناء
              وحده يتحرّك، والسطح والمساند ثابتة خارجه — لأن ما ينزل
              تحت الحمل هو الوتر العلويّ لا الركيزة. */}
          <g className="faculty-flex" style={{ transformOrigin: `450px ${TRUSS_SPAN.bottom}px` }}>
            <Truss {...TRUSS_SPAN} joints live />
          </g>
          {TRUSS_LOADS.map((x, i) => (
            <circle
              key={x}
              className="faculty-pulse"
              cx={x}
              cy={TRUSS_SPAN.top}
              r="3.6"
              style={{ animationDelay: `${i * 1.9}s` }}
            />
          ))}

          {/* السطح يمتدّ خارج الجمالون — الجسر جزءٌ من طريق لا شيءٌ قائم بذاته */}
          <line x1="26" y1="114" x2="874" y2="114" strokeWidth="1" opacity=".38" />

          {/* المساند: مفصلٌ ثابت طرفًا وحاملٌ متدحرج طرفًا — والفرق
              بينهما هو ما يجعل الجسر يتمدّد بالحرارة بدل أن يتشقّق */}
          <g strokeWidth="1.1" opacity=".55">
            <path d="M70,114 L59,132 L81,132 Z" />
            <line x1="44" y1="132" x2="96" y2="132" />
            <path d="M830,114 L819,128 L841,128 Z" />
            <circle cx="823" cy="132" r="4" />
            <circle cx="837" cy="132" r="4" />
            <line x1="804" y1="138" x2="856" y2="138" />
          </g>
          <g strokeWidth=".9" opacity=".26">
            {[48, 60, 72, 84].map((x) => (
              <line key={x} x1={x} y1="132" x2={x - 7} y2="141" />
            ))}
            {[808, 820, 832, 844].map((x) => (
              <line key={x} x1={x} y1="138" x2={x - 7} y2="147" />
            ))}
          </g>
        </svg>
      )}
    </div>
  );
}

export function FacultyStations({
  stations,
}: {
  stations: Station<CourseCardData>[];
}) {
  const first = stations.find((s) => s.courses.length > 0) ?? stations[0];
  const [active, setActive] = React.useState(first?.slug ?? "");
  const sectionRef = React.useRef<HTMLDivElement>(null);
  const railRef = React.useRef<HTMLUListElement>(null);
  const [sceneVisible, setSceneVisible] = React.useState(true);
  const [mark, setMark] = React.useState({ y: 0, progress: 0, ready: false });

  const station = stations.find((s) => s.slug === active) ?? first;
  const lessons = station?.courses.reduce((n, c) => n + c.lessonCount, 0) ?? 0;

  React.useLayoutEffect(() => {
    const rail = railRef.current;
    if (!rail) return;

    const measure = () => {
      const node = rail.querySelector<HTMLElement>(
        `[data-slug="${CSS.escape(active)}"] [data-node]`,
      );
      if (!node) return;

      const y = node.offsetTop + node.offsetHeight / 2;
      const drawable = Math.max(rail.offsetHeight - 24, 1);
      const progress = Math.min(Math.max((y - 12) / drawable, 0), 1);
      setMark((previous) =>
        previous.ready &&
        Math.abs(previous.y - y) < 0.5 &&
        Math.abs(previous.progress - progress) < 0.001
          ? previous
          : { y, progress, ready: true },
      );
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(rail);
    return () => observer.disconnect();
  }, [active, stations]);

  React.useEffect(() => {
    const node = sectionRef.current;
    if (!node || !("IntersectionObserver" in window)) return;

    const observer = new IntersectionObserver(
      ([entry]) => setSceneVisible(entry.isIntersecting),
      { rootMargin: "160px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  if (!station) return null;

  return (
    <div
      ref={sectionRef}
      className="grid gap-[2.6rem] min-[1000px]:grid-cols-[16.5rem_minmax(0,1fr)] min-[1000px]:gap-12"
    >
      {/* ══ السكّة ══════════════════════════════════════════════════ */}
      <div className="min-w-0">
        <p className="mb-[0.9rem] text-eyebrow">المضاءة فيها مقررات الآن</p>

        <div className="relative">
          {/* السكّة الكاملة — تُرسم مرة واحدة عند الدخول */}
          <span
            aria-hidden="true"
            className="track-draw absolute inset-y-3 start-[19px] w-0.5 origin-top rounded-full bg-line"
          />
          {/* الجزء المقطوع حتى المحطّة الحالية */}
          <span
            aria-hidden="true"
            className="absolute inset-y-3 start-[19px] w-0.5 origin-top rounded-full
              bg-[linear-gradient(180deg,var(--color-accent-bright),var(--color-accent-deep))]"
            style={{
              transform: `scaleY(${mark.progress})`,
              transition: mark.ready ? "transform var(--dur-slow) var(--ease-out)" : "none",
            }}
          />
          {/* هالة تتبع المحطّة الحالية */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute start-[-14px] top-0 size-[68px] rounded-full
              [background:radial-gradient(circle,color-mix(in_srgb,var(--color-accent-bright)_16%,transparent),transparent_70%)]"
            style={{
              opacity: mark.ready ? 0.7 : 0,
              transform: `translateY(${mark.y - 34}px)`,
              transition: mark.ready
                ? "transform var(--dur-slow) var(--ease-out), opacity var(--dur-fast) ease-out"
                : "none",
            }}
          />

          <ul ref={railRef} className="relative space-y-0.5">
            {stations.map((s) => {
              const Icon = ICONS[s.icon];
              const on = s.slug === active;
              const empty = s.courses.length === 0;
              return (
                <li key={s.slug} data-slug={s.slug}>
                  <button
                    type="button"
                    onClick={() => setActive(s.slug)}
                    aria-current={on ? "true" : undefined}
                    className={`group flex w-full items-center gap-3 rounded-field py-2 pe-3 ps-1.5
                      text-start transition-colors duration-200
                      ${on ? "bg-panel-lift/70" : "hover:bg-panel/60"}`}
                  >
                    <span
                      data-node
                      className={`grid size-9 shrink-0 place-items-center rounded-full border
                        shadow-[0_0_0_5px_var(--color-ink)]
                        transition-[transform,background-color,border-color,color] duration-[320ms] ease-out
                        ${
                          on
                            ? "scale-105 border-transparent text-ink [background:linear-gradient(180deg,var(--color-accent-bright),var(--color-action))]"
                            : empty
                              ? "border-dashed border-line bg-ink text-disabled"
                              : "border-line bg-ink text-accent group-hover:border-accent-deep group-hover:text-accent-bright"
                        }`}
                    >
                      <Icon size={16} strokeWidth={1.75} aria-hidden="true" />
                    </span>

                    <span className="min-w-0 flex-1">
                      <span
                        className={`block truncate text-[13px] transition-colors duration-200 ${
                          on
                            ? "font-semibold text-paper"
                            : empty
                              ? "text-subtle"
                              : "text-muted group-hover:text-paper"
                        }`}
                      >
                        {s.name}
                      </span>
                      <span className="block text-[10.5px] text-subtle">
                        {empty ? (
                          NOT_OFFERED_LABEL
                        ) : (
                          <>
                            <Counted n={s.courses.length} few="مقررات" many="مقررًا" />
                          </>
                        )}
                      </span>
                    </span>

                    {s.courses.some((c) => c.hasFreePreview) && (
                      <span
                        aria-label="فيها معاينة مجانية"
                        className="size-1.5 shrink-0 rounded-full bg-success"
                      />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* ══ المحتوى — حاضر من الإطار الأول ═════════════════════════ */}
      <div key={active} className="relative isolate min-w-0 anim-rise">
        <FacultyScene icon={station.icon} running={sceneVisible} />
        <div className="mb-5 flex flex-wrap items-baseline justify-between gap-3 border-b border-line pb-4">
          <h2 className="text-title-lg">{station.name}</h2>
          <p className="text-xs text-subtle">
            {station.courses.length === 0 ? (
              "لا مقررات على المنصة من هذه الكلية"
            ) : (
              <>
                <Counted n={station.courses.length} few="مقررات" many="مقررًا" /> ·{" "}
                <Counted n={lessons} few="دروس" many="درسًا" /> مسجّلة
              </>
            )}
          </p>
        </div>

        {station.courses.length === 0 ? (
          <div className="rounded-card border border-dashed border-line bg-panel/30 px-6 py-14 text-center">
            <p className="text-sm text-muted">{station.name} محطّة على المسار لم تُطرح بعد.</p>
            <p className="mx-auto mt-2 max-w-[38ch] text-xs leading-[1.9] text-subtle">
              نضيف المقررات كلية بعد كلية، ولا نعِد بموعد. اختر محطّة مضاءة الآن.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 items-start gap-[1.125rem] min-[520px]:[grid-template-columns:repeat(auto-fit,minmax(18.5rem,1fr))]">
            {station.courses.map((c, i) => (
              <div
                key={c.id}
                style={{ animationDelay: `${i * 45}ms` }}
                className="anim-rise"
              >
                <CourseCard course={c} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
