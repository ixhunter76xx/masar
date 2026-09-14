/**
 * حارس الاعتراف بالنقرة.
 *
 * ── لماذا حارسٌ ثابت لا فحصٌ في المتصفّح ─────────────────────────────
 * كل ما يحرسه هذا الملفّ ينكسر **صامتًا**: الرابط يعمل، والصفحة تُفتح،
 * ولا خطأ في أي سجلّ — يغيب الاعتراف بالنقرة وحده. ولا يظهر ذلك في
 * بناءٍ ولا في `tsc` ولا في لقطة شاشة، لأن الفارق زمنٌ لا شكل: نصف
 * ثانيةٍ لا يتغيّر فيها شيء. وهو الصنف الذي كان قائمًا في المنصّة
 * أصلًا قبل أن يُقاس.
 *
 * فالحراسة على البنية: من يستورد ماذا، ومن يُركَّب أين. وهي رخيصة،
 * ولا تحتاج خادمًا ولا قاعدةً ولا متصفّحًا.
 *
 *   npx tsx --tsconfig tsconfig.script.json scripts/nav-feedback-regression.mts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (p: string) => fs.readFileSync(path.join(root, p), "utf8");

/** هذا الملفّ يشرح الأعطال بذكر ما أُزيل، فالبحث في نصٍّ خام يمسك
 *  الشرح لا الشيفرة. تُنزع التعليقات قبل أي بحثٍ عن نمطٍ ممنوع. */
const stripComments = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, "");

/* ── ١ · الغلاف يحمل المُعلِن ───────────────────────────────────────
   `NavLink` هو ما يستورده نحو خمسةٍ وثلاثين ملفًّا باسم `Link`. فإن
   سقط `LinkPending` من داخله صمتت المنصّة كلّها دفعةً واحدة. */
const navLink = read("src/components/ui/NavLink.tsx");
assert.match(
  navLink,
  /LinkPending/,
  "NavLink يجب أن يُركّب LinkPending — بدونه لا يعترف أي رابطٍ بالنقرة",
);

/* ── ٢ · لا رجوع إلى `next/link` العاري ────────────────────────────
   الملفّات المستثناة تستعمل `LinkPending` صراحةً بنفسها، أو هي مسار
   عطلٍ لا يُضاف إليه اعتماد. وما عداها يجب أن يمرّ من الغلاف. */
const usesPendingDirectly = [
  "src/components/shell/AreaSwitchPending.tsx",
  "src/components/shell/SidebarNav.tsx",
  "src/components/courses/CourseTabs.tsx",
  "src/components/admin/AdminTabs.tsx",
];
const exempt = new Set([
  ...usesPendingDirectly,
  "src/components/ui/NavLink.tsx",
  "src/components/motion/LinkPending.tsx",
  /* `AreaSwitch` خادميّ ويمرّر `AreaSwitchLabel` وهو يحمل المُعلِن */
  "src/components/shell/AreaSwitch.tsx",
  /* مسارا العطل: لا يُضاف إليهما اعتمادٌ جديد */
  "src/app/error.tsx",
  "src/app/not-found.tsx",
]);

function walk(dir: string, out: string[] = []) {
  for (const entry of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
    const rel = `${dir}/${entry.name}`;
    if (entry.isDirectory()) walk(rel, out);
    else if (rel.endsWith(".tsx")) out.push(rel);
  }
  return out;
}

const bare: string[] = [];
for (const file of walk("src")) {
  if (exempt.has(file)) continue;
  if (/^import Link from "next\/link";$/m.test(read(file))) bare.push(file);
}
assert.deepEqual(
  bare,
  [],
  `هذه الملفّات ترجع إلى next/link العاري، فروابطها لا تعترف بالنقرة:\n  ${bare.join("\n  ")}`,
);

/* وكلٌّ من المستثنَيات الأربعة يجب أن يبقى مستوردًا للمُعلِن فعلًا */
for (const file of usesPendingDirectly) {
  assert.match(
    read(file),
    /LinkPending/,
    `${file} مستثنًى من الغلاف بحجّة أنه يستعمل LinkPending مباشرةً — ولم يعد`,
  );
}

/* ── ٣ · الشريط مركَّبٌ في الجذر ────────────────────────────────────
   في الجذر لا في تخطيطَي المنطقتين: التنقّلة قد تعبر بينهما، ونسختان
   تعنيان عدّادين يتنازعان الخيط نفسه. */
const rootLayout = read("src/app/layout.tsx");
assert.match(rootLayout, /<NavProgress \/>/, "NavProgress يجب أن يبقى مركَّبًا في التخطيط الجذر");
for (const layout of ["src/app/(app)/layout.tsx", "src/app/(public)/layout.tsx"]) {
  assert.doesNotMatch(
    read(layout),
    /NavProgress/,
    `${layout} يجب ألّا يركّب نسخةً ثانية من الشريط`,
  );
}

/* ── ٤ · القاعدة التي تُلبس السمة مظهرها ───────────────────────────
   `LinkPending` يضع `data-pending` ولا يرسم شيئًا. فبلا هذه القاعدة
   تبقى السمة موضوعةً ولا يراها أحد. */
const css = read("src/app/globals.css");
assert.match(css, /a\[data-pending\]\s*\{/, "قاعدة a[data-pending] غابت عن globals.css");
assert.match(
  css,
  /html\[dir="rtl"\]\s+\.nav-progress\s*\{[^}]*transform-origin:\s*right/,
  "شريط التقدّم يجب أن ينمو من يمين السطر في RTL",
);

/* ── ٥ · `transform-origin` لا يقبل الكلمات المنطقية ───────────────
   `inline-start` قيمةٌ غير صالحة يرفضها المتصفّح صامتًا ويعود إلى
   المركز. وقعت مرّةً في مؤشّر قوّة كلمة المرور، ومقيسة: `50px 5px`. */
for (const file of walk("src")) {
  assert.doesNotMatch(
    read(file).replace(/\/\*[\s\S]*?\*\//g, ""),
    /origin-\[(inline|block)-(start|end)\]/,
    `${file}: قيمة transform-origin منطقية — غير صالحة، وتسقط إلى المركز صامتةً`,
  );
}

/* ── ٦ · لكل شريطٍ منزلقٍ معرّفُه ──────────────────────────────────
   عنصران يحملان `layoutId` واحدًا يتنازعانه فيقفز بينهما. وقع ذلك
   في تبويبات المقرر، ويحرسه `course-transition-regression`. وهنا
   الخطر نفسه بين القائمتين: `SidebarContent` يُصيَّر مرّتين — المثبّت
   واللوحة المنسحبة — والمثبّت باقٍ في الشجرة وإن خفي. */
const sidebar = read("src/components/shell/Sidebar.tsx");
assert.match(sidebar, /scope="sidebar"/, "الشريط المثبّت يجب أن يمرّر نطاقه");

/* اللوحة المنسحبة حُذفت في إعادة التصميم (2026-09-14) وحلّ محلّها
   الشريط السفليّ. فالحراسة عليه: مركَّبٌ في تخطيط المنطقة المحمية،
   ويمرّ من `NavLink` فتعترف روابطه بالنقرة. */
const bottomNav = read("src/components/shell/BottomNav.tsx");
assert.match(read("src/app/(app)/layout.tsx"), /<BottomNav /, "الشريط السفليّ غاب عن تخطيط المنطقة المحمية");
assert.match(bottomNav, /from "@\/components\/ui\/NavLink"/, "الشريط السفليّ يجب أن يمرّ من NavLink");
assert.ok(
  !fs.existsSync(path.join(root, "src/components/shell/MobileNav.tsx")),
  "MobileNav عاد — والشريط السفليّ يحلّ محلّه، فنسختان تعنيان بابين للشيء نفسه",
);

const ids = walk("src")
  .flatMap((file) => [...read(file).matchAll(/layoutId=\{?["'`]([^"'`}]+)/g)]
    .map((m) => ({ file, id: m[1]! })));
const byId = new Map<string, string[]>();
for (const { file, id } of ids) {
  /* المعرّف المُركَّب (`nav-active-${scope}`) يُقرأ بجذره، وهو مقصود:
     نسختان بنطاقين مختلفين، لا تصادم. */
  const key = id.replace(/\$\{.*$/, "*");
  byId.set(key, [...(byId.get(key) ?? []), file]);
}
for (const [id, files] of byId) {
  if (id.endsWith("*")) continue;
  assert.equal(
    new Set(files).size,
    1,
    `معرّف الانزلاق «${id}» مستعملٌ في أكثر من ملفّ: ${[...new Set(files)].join(", ")}`,
  );
}

/* ── ٧ · لا `mode="wait"` في المنطقة المحمية ───────────────────────
   كان يجمّد الشاشة على محتوًى قديم عند التنقّل السريع: المسار يتبدّل
   والصفحة القديمة تبقى معروضة، بلا خطأ في أي سجلّ. مقيسٌ ٤ من ٤.
   والسبب أن `wait` ينتظر إعلانَ انتهاء الخروج، وحدُّ Suspense تحته
   قد لا يُعلنه أبدًا. ولا حاجة إليه أصلًا: خروج المنطقة المحمية
   بزمن صفر. أعادَته يعيد العطل صامتًا. */
/* التعليقات تُنزع أولًا: هذا الملفّ يشرح العطل بذكر الوضع
   الذي أزيل، فالبحث في نصٍّ خام يمسك الشرح لا الشيفرة. */
const transition = stripComments(read("src/components/motion/PageTransition.tsx"));
assert.doesNotMatch(
  transition,
  /mode=\{?["']wait["']/,
  'PageTransition عاد إلى mode="wait" — وهو يجمّد المنطقة المحمية على محتوًى قديم',
);
assert.match(
  transition,
  /if \(stationary\)/,
  "المنطقة المحمية يجب أن تُصيَّر بلا AnimatePresence — الفرع المبكّر غاب",
);

/* ── ٨ · شريط تبويبات الإدارة في التخطيط لا في الصفحات ─────────────
   إعادتُه إلى الصفحات تُعيد اختفاءه مع كل تنقّلة (مقيسٌ ٢٨٦٨ms). */
const settingsLayout = "src/app/(app)/settings/(tabs)/layout.tsx";
assert.ok(fs.existsSync(path.join(root, settingsLayout)), `${settingsLayout} غاب`);
assert.match(read(settingsLayout), /AdminTabs/, "تخطيط أقسام الإدارة لم يعد يحمل الشريط");
for (const seg of ["orders", "courses", "users", "faculties", "students", "instructors"]) {
  const p = `src/app/(app)/settings/(tabs)/${seg}/page.tsx`;
  assert.ok(fs.existsSync(path.join(root, p)), `${p} خرج من مجموعة (tabs)`);
  assert.doesNotMatch(
    read(p).replace(/\/\*[\s\S]*?\*\//g, ""),
    /<AdminTabs|<AppPage/,
    `${p} يصيّر غلافًا ثانيًا — التخطيط يحمله`,
  );
}

console.log("NAV FEEDBACK REGRESSION PASS");
console.log(`  · ${walk("src").length} ملفًّا مفحوصًا · ${byId.size} معرّف انزلاق`);
