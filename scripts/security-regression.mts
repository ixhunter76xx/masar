/**
 * حارس الثوابت الأمنية.
 *
 * ── لماذا حارسٌ ثابت ────────────────────────────────────────────────
 * الثغرتان اللتان أغلقهما هذا الحارس كانتا **صامتتين تمامًا**: البناء
 * أخضر، و`tsc` أخضر، والشاشات تعمل، والاختبارات الوظيفية تمرّ. ولا
 * يظهر الخلل إلا بتغيير القاعدة تحت رمزٍ قائم ثم قياس ما يحدث — وهو
 * ما لا يفعله أحد في مراجعةٍ عابرة.
 *
 *   npx tsx --tsconfig tsconfig.script.json scripts/security-regression.mts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (p: string) => fs.readFileSync(path.join(root, p), "utf8");
const strip = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

function walk(dir: string, out: string[] = []) {
  for (const e of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
    const rel = `${dir}/${e.name}`;
    if (e.isDirectory()) walk(rel, out);
    else if (/\.(ts|tsx)$/.test(rel)) out.push(rel);
  }
  return out;
}

/* ── ١ · التفويض يُقرأ من القاعدة لا من ادّعاء الرمز ─────────────────
   `auth()` يُرجع ادّعاءات الرمز، و`jwt()` لا يكتب إلا عند الدخول —
   فالرمز يبقى على حاله حتى ثلاثين يومًا مهما تغيّر الحساب بعده.
   المقيس قبل الإصلاح: حسابٌ عُطِّل ورُفعت نسخةُ جلسته بقي يمرّ في
   مسارات API بينما تُرفض صفحاته. */
const materials = strip(read("src/lib/data/materials.ts"));
assert.match(
  materials,
  /canManageCourse\(\s*courseId:\s*string,?\s*\)/,
  "canManageCourse عادت تقبل معطياتٍ من المستدعي — الدور يجب أن يُقرأ من القاعدة",
);
assert.match(
  materials,
  /getLiveUser\(\)/,
  "canManageCourse يجب أن تقرأ المستخدم الحيّ",
);

/* ولا مستدعٍ يمرّر إليها دورًا أو معرّفًا */
for (const f of walk("src")) {
  /* ملفّ التعريف نفسه: توقيعه يحوي فاصلةً لاحقة، وقد فُحص أعلاه */
  if (f === "src/lib/data/materials.ts") continue;
  const s = strip(read(f));
  assert.doesNotMatch(
    s,
    /canManageCourse\([^)]*,[^)]*\)/,
    `${f}: يمرّر معطياتٍ إلى canManageCourse — الدور المُمرَّر يأتي من الرمز`,
  );
}

/* ── ٢ · التشغيل لا يأخذ دورًا من المستدعي ──────────────────────────── */
const playback = strip(read("src/server/video-url.ts"));
assert.doesNotMatch(
  playback,
  /getPlaybackUrl\([^)]*role[^)]*\)/,
  "getPlaybackUrl عادت تأخذ الدور معطًى — يُقرأ من القاعدة",
);

/* ── ٣ · وجهة ما بعد الدخول مُطهَّرة على الخادم ──────────────────────
   `//evil.com` يبدأ بشرطة فيعدّه Auth.js نسبيًّا، والمتصفّح يقرؤه
   عنوانًا كاملًا. مقيسٌ قبل الإصلاح: الدخول ينتهي على example.com. */
for (const f of ["src/app/(auth)/login/actions.ts", "src/app/(auth)/signup/actions.ts"]) {
  const s = strip(read(f));
  assert.match(s, /safeNextPath\(/, `${f}: وجهة التحويل تُستهلك بلا تطهير`);
  assert.doesNotMatch(
    s,
    /redirectTo:\s*callbackUrl\s*(\|\||\?\?)/,
    `${f}: يمرّر callbackUrl خامًا إلى redirectTo`,
  );
}

/* والمُطهِّر نفسه يمنع الحالات الأربع المعروفة */
const { safeNextPath } = await import("../src/lib/safe-next.js");
const blocked = ["//evil.com", "https://evil.com", "/\\evil.com", "\\\\evil.com", "//", ""];
for (const b of blocked) {
  assert.equal(safeNextPath(b), undefined, `safeNextPath قبِل «${b}» وهو يجب أن يُرفض`);
}
assert.equal(safeNextPath("/dashboard"), "/dashboard", "safeNextPath رفض مسارًا داخليًّا سليمًا");
assert.equal(safeNextPath("/learn/abc?x=1"), "/learn/abc?x=1", "safeNextPath رفض مسارًا بمعاملات");

/* ── ٤ · لا ملفّ مصدرٍ يحوي محرف تحكّم ──────────────────────────────
   محرف تحكّم واحد يجعل ripgrep يعدّ الملفّ ثنائيًّا فيتخطّاه في كل
   بحث — أي أن الملفّ يغيب عن كل تدقيقٍ لاحق بلا أن يشعر أحد. وقع
   فعلًا في هذا المستودع من قبل (مسجَّل في CLAUDE.md). */
for (const f of walk("src")) {
  const s = read(f);
  const bad = [...s].some((c) => {
    const n = c.charCodeAt(0);
    return n < 32 && n !== 10 && n !== 13 && n !== 9;
  });
  assert.equal(bad, false, `${f}: يحوي محرف تحكّم — سيغيب عن كل بحثٍ نصّي`);
}

console.log("SECURITY REGRESSION PASS");
console.log(`  · ${walk("src").length} ملفًّا مفحوصًا`);
