import * as React from "react";

/**
 * ══ مشهدا «تقنية المعلومات» و«الهندسة» ══════════════════════════════
 *
 * رسمان خلفيّان يميّزان الكلية المختارة، مبنيّان على مرجعين بصريّين
 * اعتمدهما المالك: دارةٌ منطقية للأولى، ولوحةُ رسمٍ هندسيّ للثانية.
 *
 * ── القواعد التي تحكمهما ────────────────────────────────────────────
 * ١ · **الحركة على `transform` و`opacity` و`stroke-dashoffset` وحدها.**
 *     لا عرضٌ ولا إحداثيّ يتحرّك أبدًا، فلا إعادة تخطيط في أي إطار.
 *
 * ٢ · **العمق بالتراكب واختلاف السرعة، لا بالظلّ.** ثلاث طبقاتٍ
 *     بمقاييس وشفافيّات متدرّجة، كلٌّ تنجرف بزمنٍ مختلف — واختلافُ
 *     السرعة هو ما يُقرأ بُعدًا، لا التعتيم وحده.
 *
 * ٣ · **الاتجاه لا يدخل هنا.** المشهد زخرفةٌ متماثلة لا نصّ، ولا
 *     يحمل معنًى ينقلب بين RTL وLTR — فإحداثيّات SVG الفيزيائية
 *     مقصودة، وهي الاستثناء الوحيد لقاعدة تفضيل المنطقيّ.
 *
 * ٤ · `.faculty-scene` تفرض `stroke: var(--color-accent); fill: none`
 *     على كل شكل. فأيّ لونٍ مخالف يُصرَّح به على العنصر نفسه.
 * ═══════════════════════════════════════════════════════════════════
 */

/* ── هندسة البوّابات المنطقية ────────────────────────────────────────
   أشكالٌ قياسية: AND ظهرُها مستقيم ووجهها نصف دائرة، وOR ظهرُها
   مقعّر ووجهها مدبَّب، وNOT مثلّث. والفقاعة عند المخرج هي ما يحوّل
   AND إلى NAND — دائرةٌ صغيرة تحمل معنًى لا زخرفة. */

function andPath(x: number, y: number, w: number, h: number) {
  const r = h / 2;
  const flat = x + w - r;
  return `M${x},${y - r} L${flat},${y - r} A${r},${r} 0 0 1 ${flat},${y + r} L${x},${y + r} Z`;
}

function orPath(x: number, y: number, w: number, h: number) {
  const r = h / 2;
  return (
    `M${x},${y - r} Q${x + w * 0.55},${y - r * 0.92} ${x + w},${y} ` +
    `Q${x + w * 0.55},${y + r * 0.92} ${x},${y + r} ` +
    `Q${x + w * 0.3},${y} ${x},${y - r} Z`
  );
}

function notPath(x: number, y: number, w: number, h: number) {
  const r = h / 2;
  return `M${x},${y - r} L${x + w},${y} L${x},${y + r} Z`;
}

/** الظهر الثاني الذي يميّز XOR عن OR */
function xorBack(x: number, y: number, w: number, h: number) {
  const r = h / 2;
  return `M${x - 7},${y - r} Q${x + w * 0.3 - 7},${y} ${x - 7},${y + r}`;
}

type GateKind = "and" | "nand" | "or" | "nor" | "xor" | "not";

function Gate({
  kind,
  x,
  y,
  w,
  h,
}: {
  kind: GateKind;
  x: number;
  y: number;
  w: number;
  h: number;
}) {
  const bubble = kind === "nand" || kind === "nor" || kind === "not";
  const body =
    kind === "and" || kind === "nand"
      ? andPath(x, y, w, h)
      : kind === "not"
        ? notPath(x, y, w, h)
        : orPath(x, y, w, h);

  return (
    <g>
      {kind === "xor" && <path d={xorBack(x, y, w, h)} strokeWidth="1.2" />}
      <path d={body} strokeWidth="1.3" />
      {bubble && <circle cx={x + w + 3.2} cy={y} r="3.2" strokeWidth="1.2" />}
    </g>
  );
}

/** وصلةُ لحامٍ على المسار */
function Junction({ x, y }: { x: number; y: number }) {
  return (
    <circle cx={x} cy={y} r="2.2" style={{ fill: "var(--color-accent-deep)", stroke: "none" }} />
  );
}

/** رقعةُ نقاطٍ مصفوفة — تملأ الفراغ بلا أن تنافس الخطوط */
function DotField({
  x,
  y,
  cols,
  rows,
  gap = 9,
}: {
  x: number;
  y: number;
  cols: number;
  rows: number;
  gap?: number;
}) {
  const dots: React.ReactElement[] = [];
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      dots.push(
        <circle
          key={`${c}-${r}`}
          cx={x + c * gap}
          cy={y + r * gap}
          r="0.9"
          style={{ fill: "var(--color-accent-deep)", stroke: "none" }}
        />,
      );
    }
  }
  return <g opacity=".5">{dots}</g>;
}

/* ══ الدارة المنطقية ════════════════════════════════════════════════
   سلسلةٌ واحدة تعبر اللوحة: NAND ← OR ← NOT ← NAND ← XOR. ومسارُ
   النبضة هو مسار الأسلاك نفسه حرفًا بحرف، فالإشارة تمرّ **من داخل**
   الدارة لا بمحاذاتها — وهذا ما يجعلها تُقرأ حسابًا لا زينة.
   ═══════════════════════════════════════════════════════════════════ */

const CHAIN_Y = 150;
const GATE_H = 34;

const G1 = { x: 176, w: 44 };
const G2 = { x: 330, w: 52 };
const G3 = { x: 470, w: 34 };
const G4 = { x: 592, w: 44 };
const G5 = { x: 730, w: 54 };

const WIRE_D =
  `M20,${CHAIN_Y - 9} L${G1.x},${CHAIN_Y - 9} ` +
  `M20,${CHAIN_Y + 9} L${G1.x},${CHAIN_Y + 9} ` +
  `M${G1.x + G1.w + 6.4},${CHAIN_Y} L${G2.x - 24},${CHAIN_Y} ` +
  `L${G2.x - 24},${CHAIN_Y - 8} L${G2.x},${CHAIN_Y - 8} ` +
  `M${G2.x + G2.w},${CHAIN_Y} L${G3.x},${CHAIN_Y} ` +
  `M${G3.x + G3.w + 6.4},${CHAIN_Y} L${G4.x - 26},${CHAIN_Y} ` +
  `L${G4.x - 26},${CHAIN_Y + 9} L${G4.x},${CHAIN_Y + 9} ` +
  `M${G4.x + G4.w + 6.4},${CHAIN_Y} L${G5.x - 20},${CHAIN_Y} ` +
  `L${G5.x - 20},${CHAIN_Y - 8} L${G5.x},${CHAIN_Y - 8} ` +
  `M${G5.x + G5.w},${CHAIN_Y} L880,${CHAIN_Y}`;

function LogicChain({ live }: { live: boolean }) {
  return (
    <g>
      <path d={WIRE_D} strokeWidth="1.15" opacity=".75" />

      {/* مغذّياتٌ جانبية — بها تُقرأ اللوحة شبكةً لا خطًّا واحدًا */}
      <g strokeWidth="1" opacity=".45">
        <path
          d={`M20,${CHAIN_Y - 46} L${G2.x - 24},${CHAIN_Y - 46} L${G2.x - 24},${CHAIN_Y + 8} L${G2.x},${CHAIN_Y + 8}`}
        />
        <path
          d={`M20,${CHAIN_Y + 52} L${G4.x - 26},${CHAIN_Y + 52} L${G4.x - 26},${CHAIN_Y - 9} L${G4.x},${CHAIN_Y - 9}`}
        />
        <path
          d={`M${G3.x + G3.w + 6.4},${CHAIN_Y} L${G5.x - 20},${CHAIN_Y} L${G5.x - 20},${CHAIN_Y + 8} L${G5.x},${CHAIN_Y + 8}`}
        />
      </g>

      <Gate kind="nand" x={G1.x} y={CHAIN_Y} w={G1.w} h={GATE_H} />
      <Gate kind="or" x={G2.x} y={CHAIN_Y} w={G2.w} h={GATE_H} />
      <Gate kind="not" x={G3.x} y={CHAIN_Y} w={G3.w} h={GATE_H} />
      <Gate kind="nand" x={G4.x} y={CHAIN_Y} w={G4.w} h={GATE_H} />
      <Gate kind="xor" x={G5.x} y={CHAIN_Y} w={G5.w} h={GATE_H} />

      <Junction x={G2.x - 24} y={CHAIN_Y} />
      <Junction x={G4.x - 26} y={CHAIN_Y} />
      <Junction x={G5.x - 20} y={CHAIN_Y} />

      {/* ── النبضة ─────────────────────────────────────────────────
          شرطةٌ تجري على مسار الأسلاك بـ`stroke-dashoffset`. لا عنصر
          يتبدّل موضعه، ولا شيء يُعاد تخطيطه — تتحرّك إزاحةُ النقش. */}
      {live && (
        <path
          className="it-signal"
          d={WIRE_D}
          strokeWidth="2"
          strokeLinecap="round"
          style={{ stroke: "var(--color-spark)" }}
        />
      )}
    </g>
  );
}

export function ItScene() {
  return (
    <svg viewBox="0 0 900 300" preserveAspectRatio="xMidYMid meet">
      <g strokeWidth=".9" opacity=".12">
        {[26, 68, 232, 274].map((y) => (
          <line key={y} x1="16" y1={y} x2="884" y2={y} />
        ))}
      </g>
      <g opacity=".35">
        <DotField x={96} y={214} cols={9} rows={4} />
        <DotField x={648} y={36} cols={10} rows={3} />
        <DotField x={430} y={244} cols={7} rows={3} />
      </g>

      {/* المستوى ٣ — أبعد سلسلة: أصغر وأخفت وأبطأ */}
      <g transform="translate(96,-58) scale(.3)" opacity=".26">
        <g className="faculty-drift" style={{ animationDuration: "38s", animationDelay: "-14s" }}>
          <LogicChain live={false} />
        </g>
      </g>

      {/* المستوى ٢ */}
      <g transform="translate(470,132) scale(.4)" opacity=".34">
        <g className="faculty-drift" style={{ animationDuration: "29s", animationDelay: "-7s" }}>
          <LogicChain live={false} />
        </g>
      </g>

      {/* المستوى ١ — الأقرب، وفيه وحده تسري الإشارة */}
      <g className="faculty-drift" style={{ animationDuration: "23s" }}>
        <LogicChain live />
      </g>
    </svg>
  );
}

/* ══ لوحة الرسم الهندسيّ ════════════════════════════════════════════
   مسنّناتٌ متعاشقة، وجسرٌ مشدود، ومكعّبٌ متساوي القياس، وسُداسيّات،
   وخطوطُ قياسٍ منقّطة بأسهم، ومقطعُ قطعةٍ مخرَّطة — كما في المرجع.
   ═══════════════════════════════════════════════════════════════════ */

/** مسنّن: دائرتان وأسنانٌ شعاعية مرسومة واحدًا واحدًا — `dasharray`
    على الدائرة يعطي شرطاتٍ لا أسنانًا. */
function Gear({
  cx,
  cy,
  r,
  teeth,
  depth = 6,
}: {
  cx: number;
  cy: number;
  r: number;
  teeth: number;
  depth?: number;
}) {
  const spokes: React.ReactElement[] = [];
  for (let i = 0; i < teeth; i++) {
    const a = (i / teeth) * Math.PI * 2;
    const c = Math.cos(a);
    const s = Math.sin(a);
    spokes.push(
      <line
        key={i}
        x1={cx + c * r}
        y1={cy + s * r}
        x2={cx + c * (r + depth)}
        y2={cy + s * (r + depth)}
        strokeWidth="1.5"
      />,
    );
  }
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} strokeWidth="1.2" />
      <circle cx={cx} cy={cy} r={r * 0.62} strokeWidth="1" opacity=".7" />
      <circle cx={cx} cy={cy} r={r * 0.2} strokeWidth="1" opacity=".6" />
      {spokes}
    </g>
  );
}

function Hex({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  const pts: string[] = [];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 - Math.PI / 6;
    pts.push(`${(cx + Math.cos(a) * r).toFixed(1)},${(cy + Math.sin(a) * r).toFixed(1)}`);
  }
  return <path d={`M${pts.join(" L")} Z`} strokeWidth="1.1" />;
}

/** خطّ قياسٍ منقّط برأسَي سهم — لغةُ ورقة الرسم */
function Dim({ x1, y1, x2, y2 }: { x1: number; y1: number; x2: number; y2: number }) {
  const horizontal = Math.abs(y2 - y1) < Math.abs(x2 - x1);
  const head = (x: number, y: number, dir: number) =>
    horizontal
      ? `M${x + 6 * dir},${y - 3.4} L${x},${y} L${x + 6 * dir},${y + 3.4}`
      : `M${x - 3.4},${y + 6 * dir} L${x},${y} L${x + 3.4},${y + 6 * dir}`;
  return (
    <g strokeWidth="1" opacity=".55">
      <line x1={x1} y1={y1} x2={x2} y2={y2} strokeDasharray="5 4" />
      <path d={head(x1, y1, 1)} />
      <path d={head(x2, y2, -1)} />
    </g>
  );
}

/** مكعّبٌ متساوي القياس، سلكيّ بلا أوجه */
function IsoBox({ x, y, s }: { x: number; y: number; s: number }) {
  const dx = s * 0.866;
  const dy = s * 0.5;
  return (
    <g strokeWidth="1.15">
      <path d={`M${x},${y} L${x + dx},${y - dy} L${x + dx * 2},${y} L${x + dx},${y + dy} Z`} />
      <path d={`M${x},${y} L${x},${y + s} L${x + dx},${y + dy + s} L${x + dx},${y + dy}`} />
      <path d={`M${x + dx * 2},${y} L${x + dx * 2},${y + s} L${x + dx},${y + dy + s}`} />
      <path d={`M${x + dx},${y + dy} L${x + dx},${y + dy + s}`} strokeWidth=".9" opacity=".5" />
    </g>
  );
}

/** جسرٌ مشدود ببرجٍ وكوابل */
function CableBridge({ x, y, w }: { x: number; y: number; w: number }) {
  const towerX = x + w * 0.34;
  const towerTop = y - 62;
  const cables: React.ReactElement[] = [];
  for (let i = 1; i <= 5; i++) {
    const t = i / 6;
    cables.push(
      <line
        key={`r${i}`}
        x1={towerX}
        y1={towerTop + i * 7}
        x2={towerX + t * (w * 0.62)}
        y2={y}
        strokeWidth=".85"
      />,
      <line
        key={`l${i}`}
        x1={towerX}
        y1={towerTop + i * 7}
        x2={towerX - t * (w * 0.3)}
        y2={y}
        strokeWidth=".85"
      />,
    );
  }
  return (
    <g>
      <line x1={x} y1={y} x2={x + w} y2={y} strokeWidth="1.4" />
      <line x1={towerX} y1={towerTop} x2={towerX} y2={y + 16} strokeWidth="1.5" />
      <g opacity=".6">{cables}</g>
      <g strokeWidth="1" opacity=".45">
        {[0.08, 0.5, 0.92].map((t) => (
          <line key={t} x1={x + w * t} y1={y} x2={x + w * t} y2={y + 14} />
        ))}
      </g>
    </g>
  );
}

export function EngineeringScene() {
  return (
    <svg viewBox="0 0 900 300" preserveAspectRatio="xMidYMid meet">
      <g strokeWidth=".8" opacity=".1">
        {[30, 90, 150, 210, 270].map((y) => (
          <line key={y} x1="12" y1={y} x2="888" y2={y} />
        ))}
        {[120, 300, 480, 660].map((x) => (
          <line key={x} x1={x} y1="8" x2={x} y2="292" />
        ))}
      </g>
      <g opacity=".3">
        <DotField x={548} y={210} cols={8} rows={4} />
        <DotField x={196} y={30} cols={6} rows={2} />
      </g>

      <g strokeWidth=".9" opacity=".38">
        {[
          [352, 96],
          [468, 226],
          [612, 118],
          [268, 250],
        ].map(([x, y]) => (
          <React.Fragment key={`${x}-${y}`}>
            <line x1={x - 5} y1={y} x2={x + 5} y2={y} />
            <line x1={x} y1={y - 5} x2={x} y2={y + 5} />
          </React.Fragment>
        ))}
      </g>

      {/* المسنّنات تدور فعلًا، والصغير أسرع وفي الجهة المضادّة كما
          يقتضي التعاشق — والاتجاهان المتضادّان هما ما يجعلها تُقرأ
          «متعاشقة» لا «دائرتين تدوران». */}
      <g opacity=".55">
        <g className="gear-cw" style={{ transformOrigin: "128px 74px" }}>
          <Gear cx={128} cy={74} r={40} teeth={16} depth={7} />
        </g>
        <g className="gear-ccw" style={{ transformOrigin: "196px 116px" }}>
          <Gear cx={196} cy={116} r={24} teeth={11} depth={6} />
        </g>
      </g>

      <g className="faculty-drift" style={{ animationDuration: "31s" }} opacity=".5">
        <CableBridge x={64} y={244} w={250} />
      </g>

      <g
        className="faculty-drift"
        style={{ animationDuration: "26s", animationDelay: "-8s" }}
        opacity=".5"
      >
        <IsoBox x={704} y={182} s={46} />
      </g>

      {/* السُداسيّات تتنفّس بتتابعٍ لا معًا */}
      <g opacity=".55">
        {[
          { cx: 452, cy: 150, r: 26, d: "0s" },
          { cx: 496, cy: 176, r: 18, d: "1.4s" },
          { cx: 414, cy: 184, r: 13, d: "2.8s" },
        ].map((h) => (
          <g
            key={h.cx}
            className="hex-breathe"
            style={{ transformOrigin: `${h.cx}px ${h.cy}px`, animationDelay: h.d }}
          >
            <Hex cx={h.cx} cy={h.cy} r={h.r} />
          </g>
        ))}
      </g>

      {/* خطوط القياس تُرسم ثمّ تثبت، فتبدو اللوحة قيد الإنشاء */}
      <g className="dim-draw">
        <Dim x1={64} y1={272} x2={314} y2={272} />
        <Dim x1={704} y1={162} x2={784} y2={162} />
        <Dim x1={860} y1={182} x2={860} y2={252} />
      </g>

      {/* مقطعُ قطعةٍ مخرَّطة — تظليلُ المقطع بخطوطٍ مائلة، وخطُّ
          المحور بنقشِ «شرطة-نقطة» كما تُرسم المحاور فعلًا */}
      <g opacity=".42">
        <path
          d="M782,44 L866,44 L866,66 L840,66 L840,92 L866,92 L866,114 L782,114 Z"
          strokeWidth="1.2"
        />
        <g strokeWidth=".7" opacity=".55">
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <line key={i} x1={786 + i * 12} y1="46" x2={772 + i * 12} y2="112" />
          ))}
        </g>
        <line
          x1="746"
          y1="79"
          x2="778"
          y2="79"
          strokeWidth=".9"
          strokeDasharray="7 4 2 4"
          opacity=".7"
        />
      </g>
    </svg>
  );
}
