/**
 * مِجَسّ الانحدار — يقيس السلوك لا الشكل.
 *
 * الغرض: بعد كل طبقة من النقل البصري، نعيد تشغيله ونقارن الناتج
 * بالأساس.  أي فرق في عمود الحالة أو في العلامات = انحدار وظيفي.
 *
 * لماذا العلامات وليس رمز الحالة وحده: CLAUDE.md يوثّق أن صفحة
 * «غير موجود» ترجع 200 لا 404 في المنطقة المحمية، فرمز الحالة **لا
 * يميّز** المسموح من الممنوع.  ولذلك نبحث عن نصٍّ لا يوجد إلا في
 * الصفحة الحقيقية.  ويوثّق أيضًا أن حدّ «غير موجود» يُشحن داخل كل
 * حمولة RSC، فمطابقة النصّ يجب أن تكون على شيء يخصّ الصفحة وحدها.
 *
 * الجلسة تُسكّ ولا تُكتب في نموذج الدخول: أسرع، وحتميّ، ولا يحتاج
 * كلمة مرور.  الاسم `authjs.session-token` على HTTP المحلّي —
 * و`__Secure-` بادئةٌ إلزامية على HTTPS وهي جزء من ملح التوقيع.
 */
import "dotenv/config";
import { EncryptJWT, base64url } from "jose";
import { hkdf } from "@panva/hkdf";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";

const BASE = process.env.PROBE_BASE ?? "http://localhost:3100";
const SECRET = process.env.AUTH_SECRET!;
if (!SECRET) throw new Error("AUTH_SECRET مفقود — لا يمكن سكّ جلسة");

const COOKIE = "authjs.session-token";

/** نفس اشتقاق Auth.js v5 للمفتاح، وإلا رُفض الرمز بصمت */
async function key(salt: string) {
  return await hkdf("sha256", SECRET, salt,
    `Auth.js Generated Encryption Key (${salt})`, 64);
}

async function mint(payload: Record<string, unknown>) {
  const salt = COOKIE;
  return await new EncryptJWT(payload)
    .setProtectedHeader({ alg: "dir", enc: "A256CBC-HS512" })
    .setIssuedAt().setExpirationTime("1h")
    .encrypt(await key(salt));
}

type Probe = { path: string; as: string; expect: string; marker?: string };

async function hit(path: string, cookie?: string) {
  const res = await fetch(BASE + path, {
    headers: cookie ? { cookie: `${COOKIE}=${cookie}` } : {},
    redirect: "manual",
  });
  const body = res.status === 200 ? await res.text() : "";
  return { status: res.status, loc: res.headers.get("location") ?? "", body };
}

const rows: string[] = [];
function row(...cells: string[]) { rows.push(cells.join(" | ")); }

async function main() {
  const db = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  });
  const [admin, student] = await Promise.all([
    db.user.findFirst({ where: { role: "ADMIN" } }),
    db.user.findFirst({ where: { role: "STUDENT" } }),
  ]);
  if (!admin || !student) throw new Error("لا يوجد حساب إدارة أو طالب");

  const sess = async (u: { id: string; email: string | null; role: string; sessionVersion?: number }) =>
    await mint({ sub: u.id, email: u.email, role: u.role,
                 sessionVersion: (u as any).sessionVersion ?? 0 });

  const cAdmin = await sess(admin as any);
  const cStud = await sess(student as any);

  const checks: Probe[] = [
    // حدود الزائر المجهول
    { path: "/",                as: "anon",  expect: "307→/courses" },
    /* 2026-09-14: عنوان الكتالوج صار «المقررات المتاحة» مع إعادة التصميم */
    { path: "/courses",         as: "anon",  expect: "200", marker: "المقررات المتاحة" },
    { path: "/dashboard",       as: "anon",  expect: "307→/login" },
    { path: "/learn",           as: "anon",  expect: "307→/login" },
    { path: "/settings/orders", as: "anon",  expect: "307→/login" },
    { path: "/login",           as: "anon",  expect: "200", marker: "كلمة المرور" },
    { path: "/signup",          as: "anon",  expect: "200" },
    { path: "/legal/terms",     as: "anon",  expect: "200" },
    // الطالب
    { path: "/dashboard",       as: "stud",  expect: "200" },
    { path: "/learn",           as: "stud",  expect: "200" },
    { path: "/grades",          as: "stud",  expect: "200" },
    { path: "/messages",        as: "stud",  expect: "200" },
    { path: "/orders",          as: "stud",  expect: "200" },
    { path: "/profile",         as: "stud",  expect: "200" },
    /* حدّ الدور: الإعدادات للإدارة وحدها.
       ⚠ العلامة تخصّ الصفحة نفسها.  كنت أبحث عن «الطلبات» فطابقت
       **«طلباتي» في شريط التنقّل** — وهو ظاهر للطالب — فقرأتُ تسريبًا
       لا وجود له.  وهذا هو الفخّ الذي يوثّقه CLAUDE.md حرفيًّا: لا
       تُقاس الصلاحية بمطابقة نصّ قد يأتي من الإطار لا من الصفحة. */
    { path: "/settings",        as: "stud",  expect: "denied", marker: "إنشاء حساب" },
    { path: "/settings/orders", as: "stud",  expect: "denied", marker: "بانتظار" },
    { path: "/settings/users",  as: "stud",  expect: "denied", marker: "إنشاء حساب" },
    { path: "/settings/courses",as: "stud",  expect: "denied", marker: "مقرر جديد" },
    // الإدارة
    { path: "/settings",        as: "admin", expect: "200" },
    { path: "/settings/orders", as: "admin", expect: "200", marker: "بانتظار" },
    { path: "/settings/users",  as: "admin", expect: "200", marker: "إنشاء حساب" },
    { path: "/settings/courses",as: "admin", expect: "200", marker: "مقرر جديد" },
  ];

  row("as", "path", "status", "loc", "marker");
  row("---", "---", "---", "---", "---");
  for (const c of checks) {
    const cookie = c.as === "admin" ? cAdmin : c.as === "stud" ? cStud : undefined;
    const r = await hit(c.path, cookie);
    let marker = "-";
    if (c.marker) marker = r.body.includes(c.marker) ? "found" : "MISSING";
    /* «ممنوع» يُقاس بغياب علامةِ الصفحة، لا برمز الحالة: CLAUDE.md
       يوثّق أن المنطقة المحمية ترجع 200 على «غير موجود» أيضًا. */
    if (c.expect === "denied")
      marker = r.body.includes(c.marker!) ? "LEAKED" : "blocked";
    row(c.as, c.path, String(r.status), r.loc.replace(BASE, "") || "-", marker);
  }

  // بيانات حيّة تُثبت أن طبقة الحزم والأسعار لم تتغيّر
  const [courses, products, orders, enrol, mats] = await Promise.all([
    db.course.count(), db.product.count(), db.order.count(),
    db.enrollment.count(), db.courseMaterial.count(),
  ]);
  const prods = await db.product.findMany({
    select: { slug: true, title: true, priceFils: true, isPublished: true,
              _count: { select: { items: true, enrollments: true, orderItems: true } } },
    orderBy: { slug: "asc" },
  });

  console.log(rows.join("\n"));
  console.log("\ncounts | courses=%d products=%d orders=%d enrollments=%d materials=%d",
    courses, products, orders, enrol, mats);
  console.log("bundles | " + prods.map(p =>
    `${p.slug}[${p.isPublished ? "pub" : "unpub"}]=${p.priceFils}f/` +
    `${p._count.items}items/${p._count.enrollments}enr/${p._count.orderItems}oi`).join("  "));

  await db.$disconnect();
}

main().catch(e => { console.error("PROBE FAILED:", e.message); process.exit(1); });
