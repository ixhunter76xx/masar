/**
 * حارس الهوية.
 *
 * ── العطل الذي وُجد هذا الحارس لأجله ────────────────────────────────
 * الشعار يعيش في **ثمانية** ملفّات، ثلاثةٌ منها لا تُرى إلا بعد تثبيت
 * التطبيق على الشاشة الرئيسية. فبُدِّل الشعار في الموقع وبقي القديم
 * في التطبيق المثبَّت — ولم يمسكه بناءٌ ولا `tsc` ولا فحصٌ في المتصفّح،
 * لأن الملفّ سليمٌ في ذاته وإنما هو **قديم**. والقِدَم لا يُرى بالنظر
 * إلى ملفّ واحد؛ يُرى بمقارنة الملفّات بعضها ببعض.
 *
 *   npx tsx --tsconfig tsconfig.script.json scripts/brand-regression.mts
 */
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (p: string) => fs.readFileSync(path.join(root, p));
const readText = (p: string) => fs.readFileSync(path.join(root, p), "utf8");
const sha = (buf: Buffer) => crypto.createHash("sha256").update(buf).digest("hex");

function walk(dir: string, out: string[] = []) {
  for (const e of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
    const rel = `${dir}/${e.name}`;
    if (e.isDirectory()) walk(rel, out);
    else if (/\.(ts|tsx|css)$/.test(rel)) out.push(rel);
  }
  return out;
}

/* ── ١ · كل أصل موجودٌ وبمقاسه ──────────────────────────────────────
   الغياب لا يكسر بناءً: الأيقونة المفقودة تعطي ٤٠٤ صامتة، ولا يظهر
   أثرها إلا على شاشة هاتفٍ مثبَّتٍ عليه التطبيق. */
const EXPECTED: Record<string, number> = {
  "public/logo-masar.png": 1024,
  "public/icon-192.png": 192,
  "public/icon-512.png": 512,
  "public/icon-maskable-192.png": 192,
  "public/icon-maskable-512.png": 512,
  "public/apple-touch-icon.png": 180,
  "src/app/icon.png": 512,
};

for (const file of Object.keys(EXPECTED)) {
  assert.ok(fs.existsSync(path.join(root, file)), `أصل الهوية غائب: ${file}`);
}

/* ── ٢ · الأصول كلّها اشتُقّت من مصدرٍ واحد، في الجولة نفسها ─────────
   هذا هو الشرط الذي انكسر. القفل يحمل بصمة كل مُخرَج ساعةَ التوليد،
   فأيّ ملفّ بُدِّل وحده — أو تُرك وحده — تختلف بصمته. */
const lockPath = "assets/brand-lock.json";
assert.ok(
  fs.existsSync(path.join(root, lockPath)),
  `${lockPath} غائب — وُلّدت الأصول خارج السكربت، فلا دليل على أنها من مصدرٍ واحد.\n` +
    "  npx tsx --tsconfig tsconfig.script.json scripts/generate-icons.mts <المصدر>",
);

const lock = JSON.parse(readText(lockPath)) as {
  source: string;
  generatedAt: string;
  files: Record<string, string>;
};

for (const file of Object.keys(EXPECTED)) {
  assert.ok(
    lock.files[file],
    `${file} ليس في القفل — أُضيف أصلٌ بلا توليد، فلا يُعرف أمن المصدر نفسه هو؟`,
  );
  assert.equal(
    sha(read(file)),
    lock.files[file],
    `${file} يخالف القفل — بُدِّل وحده خارج السكربت، أو تُرك قديمًا بينما جُدِّد غيره.\n` +
      "  أعِد التوليد من المصدر الواحد بدل تحرير ملفّ بمفرده.",
  );
}

/* ── ٣ · لا أصلٌ يتيمٌ من هويةٍ سابقة ───────────────────────────────
   الملفّ الذي لا يشير إليه أحد لا يظهر خطؤه أبدًا، ويبقى يُشحن مع
   المستودع. `logo-masar-mark.png` عاش هكذا: ١٣٤ كيلوبايت من هويةٍ
   متقاعدة لا يقرؤها سطرٌ واحد. */
const referenced = new Set<string>();
const sources = [...walk("src"), "src/app/manifest.ts"];
for (const f of sources) {
  const text = readText(f);
  for (const m of text.matchAll(/["'`(]\/([\w./-]+\.(?:png|svg|ico|jpg|webp))/g)) {
    referenced.add(`public/${m[1]}`);
  }
}
/* أصول Next.js الاصطلاحية لا يشير إليها أحد بالاسم — الإطار يلتقطها */
const conventional = new Set(["src/app/icon.png"]);

const orphans: string[] = [];
for (const e of fs.readdirSync(path.join(root, "public"), { withFileTypes: true })) {
  if (!e.isFile() || !/\.(png|svg|ico|jpg|webp)$/.test(e.name)) continue;
  const rel = `public/${e.name}`;
  if (!referenced.has(rel) && !EXPECTED[rel]) orphans.push(rel);
}
assert.deepEqual(
  orphans,
  [],
  `أصولٌ يتيمة لا يشير إليها مصدر — بقايا هويةٍ سابقة تُشحن بلا سبب:\n  ${orphans.join("\n  ")}`,
);

/* ── ٤ · مكوّن الشعار يقرأ الملفّ المعتمد وحده ──────────────────────
   نقطة استبدالٍ واحدة: أي مسارٍ ثانٍ يعني هويةً ثانية تُنسى عند التغيير. */
const logo = readText("src/components/ui/Logo.tsx");
const logoPaths = [...logo.matchAll(/[`"']\/([\w./-]+\.png)/g)].map((m) => m[1]!);
assert.ok(logoPaths.length > 0, "Logo.tsx لم يعد يشير إلى ملفّ شعار");
assert.deepEqual(
  [...new Set(logoPaths)],
  ["logo-masar.png"],
  `Logo.tsx يشير إلى أكثر من ملفّ: ${[...new Set(logoPaths)].join(", ")}`,
);

/* ── ٤ب · كل رابط أصلٍ بصريّ يحمل نسخة الهوية ───────────────────────
   بدونها لا يرى أحدٌ الشعار الجديد: المتصفّح يخزّن الملفّ بعنوانه،
   وواتساب يخزّن `og:image` لكل رابطٍ شورك، والنظام يخزّن أيقونة
   التطبيق المثبَّت. النشر وحده لا يبطل أيًّا من الثلاثة. */
for (const file of ["src/components/ui/Logo.tsx", "src/app/manifest.ts", "src/app/layout.tsx"]) {
  const text = readText(file);
  const bare = [...text.matchAll(/["']\/((?:icon|apple-touch-icon|logo)[\w./-]*\.png)["']/g)];
  assert.deepEqual(
    bare.map((m) => m[1]!),
    [],
    `${file}: روابط أصولٍ بلا نسخة (?v=…) — سيبقى الشعار القديم مخزَّنًا:\n  ${bare
      .map((m) => m[1]!)
      .join("\n  ")}`,
  );
  assert.match(
    text,
    /\?v=\$\{SITE\.brandVersion\}/,
    `${file}: لا يستعمل SITE.brandVersion — نسخةٌ مكتوبةٌ بيدٍ تتخلّف عند التغيير`,
  );
}

/* ── ٥ · البيان يعلن الأربع، ولون الإقلاع يطابق القاعدة ─────────────
   لونٌ مخالف يعني وميضًا بلون آخر بين شاشة النظام وأوّل إطارٍ يرسمه
   التطبيق — وهو أظهر ما يُرى عند الإقلاع. */
const manifest = readText("src/app/manifest.ts");
for (const icon of ["/icon-192.png", "/icon-512.png", "/icon-maskable-192.png", "/icon-maskable-512.png"]) {
  assert.match(manifest, new RegExp(icon.replace(/[/.]/g, "\\$&")), `البيان لا يعلن ${icon}`);
}
assert.match(manifest, /purpose:\s*"maskable"/, "البيان فقد أيقونات القناع — أندرويد سيؤطّرها بحافةٍ بيضاء");

const css = readText("src/app/globals.css");
const ink = css.match(/--color-ink:\s*(#[0-9a-fA-F]{6})/)?.[1]?.toLowerCase();
assert.ok(ink, "تعذّرت قراءة --color-ink من globals.css");
for (const [file, label] of [
  ["src/app/manifest.ts", "البيان"],
  ["src/app/layout.tsx", "الميتاداتا"],
] as const) {
  const text = readText(file).toLowerCase();
  assert.ok(
    text.includes(ink!),
    `${label} (${file}) يعلن لونًا يخالف --color-ink (${ink}) — وميضٌ عند الإقلاع`,
  );
}

/* ── ٦ · شاشة الإقلاع مركَّبةٌ ومشروطةٌ بوضع التطبيق ────────────────
   لو سقط الشرط ظهرت الشاشة لكل زائرٍ في المتصفّح — وهي للتطبيق
   المثبَّت وحده. */
const launch = "src/components/brand/PwaLaunch.tsx";
assert.ok(fs.existsSync(path.join(root, launch)), `${launch} غاب — لا شاشة إقلاع`);
assert.match(readText("src/app/layout.tsx"), /<PwaLaunch \/>/, "PwaLaunch غير مركَّب في التخطيط الجذر");
assert.match(css, /display-mode:\s*standalone/, "شرط وضع التطبيق غاب — الشاشة ستظهر في المتصفّح أيضًا");
assert.match(
  css,
  /@media\s*\(prefers-reduced-motion:\s*reduce\)[\s\S]{0,900}?pwa-launch/,
  "شاشة الإقلاع لا تحترم تخفيض الحركة",
);

console.log("BRAND REGRESSION PASS");
console.log(`  · ${Object.keys(EXPECTED).length} أصلًا مقفلًا على مصدرٍ واحد (${lock.source.slice(0, 12)}…)`);
console.log(`  · وُلّدت في ${lock.generatedAt}`);
