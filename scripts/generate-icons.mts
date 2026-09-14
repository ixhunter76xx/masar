/**
 * توليد كل أصول الهوية من مصدرٍ واحد.
 *
 * ── لماذا سكربت لا عملٌ يدويّ ────────────────────────────────────────
 * الشعار يظهر في **ثمانية** ملفّات، ثلاثةٌ منها لا تُرى إلا بعد تثبيت
 * التطبيق على الهاتف. وتغييرُ بعضها وترك بعض هو بالضبط ما وقع من قبل:
 * بقي الشعار القديم حيًّا في التطبيق المثبَّت بينما تبدّل في الموقع.
 * فالمصدر واحد، والاشتقاق آليّ، ولا يُنسى ملفّ لأنه ليس في الذاكرة.
 *
 *   npx tsx --tsconfig tsconfig.script.json scripts/generate-icons.mts <المصدر>
 *
 * ── لماذا تُنزع الخلفية ─────────────────────────────────────────────
 * ملفّ الهوية يصل بخلفيةٍ مصمتة. وشعارُ الواجهة يجلس على أسطحٍ ثلاثة
 * (`ink` و`panel` و`panel-lift`)، فلو حمل خلفيته لظهر مربّعٌ باهتٌ
 * حوله على كل سطحٍ يخالف لونه. تُنزع الخلفية بمطابقة لون الركن مع
 * سماحية، فيبقى ما عداه — بما فيه الطريق الرماديّ — سليمًا.
 *
 * ── ولماذا الأيقونات مصمتة بلون القاعدة ─────────────────────────────
 * أيقونة التطبيق تُعرض على خلفية النظام، وشفافيّتها تعني ظهور خلفية
 * سطح المكتب خلف الحروف. وتُركَّب على `--color-ink` نفسه الذي يعلنه
 * `theme_color`، فتذوب شاشةُ الإقلاع في الأيقونة بلا حدٍّ مرئيّ.
 *
 * ── وحصّة القناع ────────────────────────────────────────────────────
 * أندرويد يقتطع أيقونة `maskable` بشكلٍ يختاره الجهاز ولا يضمن إلا
 * ٨٠٪ الوسطى. فحصّة الرسم فيها أضيق عمدًا: يُقتطع الهامش لا الشعار.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const sha = (buf: Buffer) => crypto.createHash("sha256").update(buf).digest("hex");

/** لون القاعدة — نفسه في `globals.css` و`manifest.ts` و`viewport` */
const INK = "#131110";

/**
 * منحدر الشفافية بدل عتبةٍ صمّاء.
 *
 * العتبة الواحدة تعطي حوافَّ مسنّنة، وتبتلع الطريق إن قاربت لونه.
 * المقيس في المصدر: الخلفية `rgb(52,51,51)` مسطّحة، وأغمق نقطةٍ في
 * الطريق تبعد عنها ٣٢. فما دون `KEY_LO` خلفيةٌ خالصة تُمحى، وما فوق
 * `KEY_HI` رسمٌ يبقى، وبينهما تدرّجٌ يحفظ نعومة الحواف.
 */
const KEY_LO = 8;
const KEY_HI = 24;

/**
 * أقصى نسبةٍ يشغلها ارتفاع الرسم من ضلع المربّع.
 *
 * مكوّن `Logo` يعرض المصدر المربّع بعرض `size × 2.45` داخل صندوقٍ
 * ارتفاعه `size`، أي أنه لا يُظهر إلا ‏١÷٢٫٤٥ ≈ ‏٤٠٫٨٪ من ارتفاع
 * المربّع. فلو تجاوز الرسمُ ذلك قُصَّ رأسه وقدمه. تُترك هوامش أمانٍ
 * صغيرة تحت الحدّ.
 */
const ART_HEIGHT_RATIO = 0.38;

/** حصّة الرسم من ضلع الأيقونة العادية */
const ICON_FILL = 0.78;
/** وحصّتها من أيقونة القناع — داخل دائرة الأمان (٨٠٪) بهامش */
const MASKABLE_FILL = 0.56;

const root = process.cwd();
const source = process.argv[2];

if (!source) {
  console.error("مرّر مسار الشعار المصدر:\n  npx tsx --tsconfig tsconfig.script.json scripts/generate-icons.mts assets/logo-source.png");
  process.exit(1);
}
if (!fs.existsSync(source)) {
  console.error(`لا ملفّ عند: ${source}`);
  process.exit(1);
}

/**
 * ينزع الخلفية المصمتة ويقصّ الرسم إلى حدوده.
 *
 * يُقرأ لون الخلفية من الركن العلويّ الأيسر لا من قيمةٍ مكتوبة: المصدر
 * قد يصل بأي درجة رماديّة، وقراءتُه من الصورة تجعل السكربت يعمل على
 * أي نسخةٍ لاحقة بلا تعديل.
 */
async function extractArtwork(input: string) {
  const src = sharp(input).ensureAlpha();
  const { width, height } = await src.metadata();
  if (!width || !height) throw new Error("تعذّرت قراءة أبعاد المصدر");

  const { data, info } = await src
    .raw()
    .toBuffer({ resolveWithObject: true });

  const ch = info.channels;
  const [br, bg, bb] = [data[0]!, data[1]!, data[2]!];

  /* لو كان المصدر شفّافًا أصلًا فلا شيء يُنزع */
  const cornerAlpha = ch === 4 ? data[3]! : 255;
  const alreadyTransparent = cornerAlpha === 0;

  if (!alreadyTransparent) {
    for (let i = 0; i < data.length; i += ch) {
      const dist = Math.max(
        Math.abs(data[i]! - br),
        Math.abs(data[i + 1]! - bg),
        Math.abs(data[i + 2]! - bb),
      );
      const t = (dist - KEY_LO) / (KEY_HI - KEY_LO);
      data[i + 3] = Math.round(Math.min(1, Math.max(0, t)) * 255);
    }
  }

  /* يُقصّ إلى حدود الرسم ثم يُوسَّط في مربّع: مكوّن `Logo` يفترض
     مصدرًا مربّعًا ويقصّ فراغه الرأسيّ بنفسه، فتغيير النسبة هنا
     يكسر حساباته. */
  const keyed = sharp(Buffer.from(data), { raw: { width, height, channels: ch as 3 | 4 } })
    .png();

  const trimmed = await keyed.trim({ threshold: 1 }).toBuffer({ resolveWithObject: true });
  const side = Math.ceil(
    Math.max(trimmed.info.width * 1.02, trimmed.info.height / ART_HEIGHT_RATIO),
  );

  const squared = await sharp({
    create: { width: side, height: side, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([{ input: trimmed.data, gravity: "centre" }])
    .png()
    .toBuffer();

  /* الرسم بحدوده الضيّقة — تستعمله الأيقونات. لو أُعطيت المربّع
     المبطَّن لحسبت حصّتها من ضلعٍ معظمه فراغ، فخرج الشعار ضئيلًا.
     `trim` مسبوقٌ بـ`.png()` فمخرجه بايتات PNG لا خامًا. */
  const tight = trimmed.data;

  return { squared, tight, artWidth: trimmed.info.width, artHeight: trimmed.info.height, side };
}

/** يركّب الرسم على مربّعٍ مصمت بحصّةٍ محدّدة من الضلع */
async function renderIcon(art: Buffer, size: number, fill: number) {
  const inner = Math.round(size * fill);
  const scaled = await sharp(art)
    .resize(inner, inner, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  return sharp({
    create: { width: size, height: size, channels: 4, background: INK },
  })
    .composite([{ input: scaled, gravity: "centre" }])
    .flatten({ background: INK })
    .png()
    .toBuffer();
}

const { squared, tight, artWidth, artHeight, side } = await extractArtwork(source);

console.log("══ توليد أصول الهوية ══");
console.log(`  المصدر: ${source}`);
console.log(`  الرسم بعد نزع الخلفية والقصّ: ${artWidth}×${artHeight} → مربّع ${side}×${side}\n`);

/* ١ · شعار الواجهة — شفّاف، مربّع، بحجمٍ يكفي أعلى مقاسٍ يُطلب */
const APP_LOGO = 1024;
const appLogo = await sharp(squared)
  .resize(APP_LOGO, APP_LOGO, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png({ compressionLevel: 9 })
  .toBuffer();

/* ٢ · بقيّة الأصول — مصمتة بلون القاعدة */
const targets: { file: string; size: number; fill: number; note: string }[] = [
  { file: "public/icon-192.png", size: 192, fill: ICON_FILL, note: "PWA any" },
  { file: "public/icon-512.png", size: 512, fill: ICON_FILL, note: "PWA any + OG + Twitter" },
  { file: "public/icon-maskable-192.png", size: 192, fill: MASKABLE_FILL, note: "أندرويد maskable" },
  { file: "public/icon-maskable-512.png", size: 512, fill: MASKABLE_FILL, note: "أندرويد maskable" },
  { file: "public/apple-touch-icon.png", size: 180, fill: ICON_FILL, note: "شاشة iOS الرئيسية" },
  { file: "src/app/icon.png", size: 512, fill: ICON_FILL, note: "أيقونة التبويب (favicon)" },
];

/**
 * ── القفل ───────────────────────────────────────────────────────────
 * يسجّل بصمة المصدر وبصمة كل مُخرَج. وحارس الهوية يعيد حسابها، فيمسك
 * الحالة التي وقعت فعلًا: تبديل بعض الأصول وترك بعضها — أو تبديل ملفّ
 * بيدٍ خارج هذا السكربت. أصولُ الهوية إمّا اشتُقّت معًا أو لم تشتقّ.
 */
const lock: { source: string; generatedAt: string; files: Record<string, string> } = {
  source: sha(fs.readFileSync(source)),
  generatedAt: new Date().toISOString(),
  files: {},
};

fs.writeFileSync(path.join(root, "public/logo-masar.png"), appLogo);
lock.files["public/logo-masar.png"] = sha(appLogo);
console.log(`  ✓ ${"public/logo-masar.png".padEnd(32)} ${APP_LOGO}×${APP_LOGO}  شفّاف — شعار الواجهة`);

for (const t of targets) {
  const buf = await renderIcon(tight, t.size, t.fill);
  fs.writeFileSync(path.join(root, t.file), buf);
  lock.files[t.file] = sha(buf);
  console.log(`  ✓ ${t.file.padEnd(32)} ${t.size}×${t.size}  ${t.note}`);
}

fs.writeFileSync(path.join(root, "assets/brand-lock.json"), `${JSON.stringify(lock, null, 2)}\n`);
console.log(`  ✓ ${"assets/brand-lock.json".padEnd(32)} بصمة المصدر و${Object.keys(lock.files).length} مُخرَجات`);

console.log("\nتمّ. شغّل الآن حارس الهوية:");
console.log("  npx tsx --tsconfig tsconfig.script.json scripts/brand-regression.mts");
