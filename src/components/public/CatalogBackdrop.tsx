import type { CSSProperties } from "react";

/**
 * خلفية الكتالوج — نسيجٌ يسري، وخيوطُ ضوءٍ تنزل على المسار، وهالتان.
 *
 * مكوّن خادم بلا سطر جافاسكربت: الحركة كلّها CSS في `globals.css`
 * (`.catalog-*`)، والقيم هنا بياناتٌ تُمرَّر متغيّراتٍ لا منطقٌ يُشحن.
 * زخرفةٌ خالصة: `aria-hidden` ولا تستقبل نقرة.
 */

type Thread = {
  top: string;
  start: string;
  width: string;
  tone: "spark" | "paper";
  alpha: number;
  dur: number;
  delay: number;
};

const THREADS: readonly Thread[] = [
  { top: "60px", start: "12%", width: "min(280px, 40vw)", tone: "spark", alpha: 55, dur: 9, delay: 0 },
  { top: "180px", start: "38%", width: "min(200px, 32vw)", tone: "paper", alpha: 40, dur: 13, delay: -4 },
  { top: "120px", start: "68%", width: "min(240px, 36vw)", tone: "spark", alpha: 40, dur: 11, delay: -7 },
  { top: "300px", start: "22%", width: "min(160px, 28vw)", tone: "paper", alpha: 28, dur: 16, delay: -11 },
  { top: "250px", start: "84%", width: "min(190px, 30vw)", tone: "spark", alpha: 30, dur: 14, delay: -2 },
];

const MOTES = [
  { top: "96px", start: "26%", size: 4, tone: "spark", dur: 17, delay: 0 },
  { top: "212px", start: "58%", size: 3, tone: "paper", dur: 23, delay: -6 },
  { top: "342px", start: "44%", size: 4, tone: "spark", dur: 29, delay: -13 },
  { top: "150px", start: "78%", size: 3, tone: "paper", dur: 21, delay: -9 },
  { top: "410px", start: "14%", size: 3, tone: "spark", dur: 25, delay: -3 },
] as const;

const toneVar = (tone: "spark" | "paper") =>
  tone === "spark" ? "var(--color-spark)" : "var(--color-paper)";

export function CatalogBackdrop({ short = false }: { short?: boolean }) {
  return (
    /* `short`: صفحة المقرر — الخلفية تاجٌ للرأس لا مسرحٌ للصفحة */
    <div className={short ? "catalog-backdrop catalog-backdrop-short" : "catalog-backdrop"} aria-hidden="true">
      <div className="catalog-weave" />

      <div className="catalog-threads">
        {THREADS.map((t) => (
          <span
            key={`${t.top}-${t.start}`}
            className="catalog-thread"
            style={
              {
                insetBlockStart: t.top,
                insetInlineStart: t.start,
                width: t.width,
                "--dur": `${t.dur}s`,
                "--delay": `${t.delay}s`,
                background: `linear-gradient(to left, transparent, color-mix(in srgb, ${toneVar(t.tone)} ${t.alpha}%, transparent), transparent)`,
              } as CSSProperties
            }
          />
        ))}
        {MOTES.map((m) => (
          <span
            key={`${m.top}-${m.start}`}
            className="catalog-mote"
            style={
              {
                insetBlockStart: m.top,
                insetInlineStart: m.start,
                width: m.size,
                height: m.size,
                background: `color-mix(in srgb, ${toneVar(m.tone)} 55%, transparent)`,
                "--dur": `${m.dur}s`,
                "--delay": `${m.delay}s`,
              } as CSSProperties
            }
          />
        ))}
      </div>

      <div className="catalog-aura catalog-aura-a" />
      <div className="catalog-aura catalog-aura-b" />
      <div className="catalog-glow" />
      <div className="catalog-fade" />
    </div>
  );
}
