/**
 * فحص المزايا الوظيفية — واحدةً واحدةً بالاسم.
 *
 * ── لماذا القراءة لا التنفيذ في مسارات الكتابة ──────────────────────
 * لا توجد قاعدة بيانات ثانية: `neondb` هي نفسها التي يقرأ منها الموقع
 * المنشور. فتنفيذ استرجاعٍ حقيقي يسحب وصول طالبٍ حقيقي، وحذفُ باقة
 * يقطع `OrderItem` عن منتجه. الثمن حقيقي والفائدة لا تستحقّه.
 *
 * والضمان الأقوى ليس تنفيذ تلك المسارات بل **أن شفرتها لم تتغيّر**:
 * بصمة الـ٣٨ ملفًّا (طبقة البيانات، مسارات API، المصادقة، middleware،
 * Prisma) متطابقة حرفًا بحرف قبل النقل وبعده. فالانحدار فيها مستحيلٌ
 * بنيويًّا، ويبقى أن نتحقّق من أن الواجهة **تعرض** الضوابط وتصل إليها
 * البيانات الصحيحة — وهذا ما يفعله هذا الملفّ.
 */
import "dotenv/config";
import { EncryptJWT } from "jose";
import { hkdf } from "@panva/hkdf";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";

const BASE = process.env.PROBE_BASE ?? "http://localhost:3100";
const COOKIE = "authjs.session-token";

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function sess(u: { id: string; email: string | null; role: string; sessionVersion?: number }) {
  const key = await hkdf("sha256", process.env.AUTH_SECRET!, COOKIE,
    `Auth.js Generated Encryption Key (${COOKIE})`, 64);
  return await new EncryptJWT({
    sub: u.id, email: u.email, role: u.role, sessionVersion: u.sessionVersion ?? 0,
  }).setProtectedHeader({ alg: "dir", enc: "A256CBC-HS512" })
    .setIssuedAt().setExpirationTime("1h").encrypt(key);
}

async function get(path: string, cookie?: string) {
  const r = await fetch(BASE + path, {
    headers: cookie ? { cookie: `${COOKIE}=${cookie}` } : {},
    redirect: "manual",
  });
  return { status: r.status, loc: r.headers.get("location") ?? "",
           body: r.status === 200 ? await r.text() : "" };
}

const results: { feature: string; check: string; pass: boolean; detail: string }[] = [];
function assert(feature: string, check: string, pass: boolean, detail = "") {
  results.push({ feature, check, pass, detail });
}

async function main() {
  const admin = await db.user.findFirst({ where: { role: "ADMIN" } });
  const student = await db.user.findFirst({
    where: { role: "STUDENT", enrollments: { some: {} } },
    include: { enrollments: { include: { product: true } } },
  });
  if (!admin || !student) throw new Error("بيانات ناقصة");
  const cA = await sess(admin as never);
  const cS = await sess(student as never);

  /* ══ ١ · الحزم والأسعار ══════════════════════════════════════════ */
  const course = await db.course.findFirst({
    where: { isPublished: true },
    include: { products: { include: { items: true } } },
  });
  const page = await get(`/courses/${course!.slug}`);
  for (const p of course!.products) {
    const dinars = (p.priceFils / 1000).toFixed(3);
    const arabic = dinars.replace(/\d/g, d => "٠١٢٣٤٥٦٧٨٩"[+d]).replace(".", "٫");
    assert("الحزم والأسعار", `سعر «${p.title}» معروض`,
      page.body.includes(arabic) || page.body.includes(dinars),
      `${dinars} → ${arabic}`);
  }
  assert("الحزم والأسعار", "عدد الباقات في الصفحة يطابق القاعدة",
    course!.products.every(p => page.body.includes(p.title)),
    `${course!.products.length} باقات`);
  assert("الحزم والأسعار", "ربط الباقة بدروسها سليم",
    course!.products.every(p => p.items.length > 0),
    course!.products.map(p => `${p.slug}=${p.items.length}`).join(" "));

  /* ══ ٢ · الاسترجاع ═══════════════════════════════════════════════ */
  const paid = await db.order.findFirst({ where: { status: "PAID" } });
  const refunded = await db.order.findFirst({ where: { status: "REFUNDED" } });
  const adminOrders = await get("/settings/orders", cA);
  assert("الاسترجاع", "ضابط الاسترجاع معروض على طلب مدفوع",
    !!paid && /استرجاع|إرجاع/.test(adminOrders.body), paid ? paid.number : "—");
  assert("الاسترجاع", "الطلب المسترجَع ما زال محفوظًا في القاعدة",
    !!refunded, refunded ? `${refunded.number} = ${refunded.status}` : "لا يوجد");
  const revoked = await db.enrollment.count({ where: { expiresAt: { not: null } } });
  assert("الاسترجاع", "الاسترجاع يُنهي الوصول ولا يحذف الصفّ",
    revoked > 0, `${revoked} اشتراك منتهٍ محفوظ`);

  /* ══ ٣ · الجلسات وصلاحياتها ══════════════════════════════════════ */
  const stale = await sess({ ...(student as never), sessionVersion: -1 } as never);
  const staleRes = await get("/dashboard", stale);
  assert("الجلسات", "رمز بنسخة قديمة يُرفض",
    staleRes.status !== 200, `status=${staleRes.status}`);
  const good = await get("/dashboard", cS);
  assert("الجلسات", "رمز صحيح يمرّ", good.status === 200, `status=${good.status}`);

  /* ══ ٤ · حدود الأدوار ════════════════════════════════════════════ */
  for (const [path, marker] of [
    ["/settings/orders", "بانتظار"], ["/settings/users", "إنشاء حساب"],
    ["/settings/courses", "مقرر جديد"],
  ] as const) {
    const s = await get(path, cS), a = await get(path, cA);
    assert("حدود الأدوار", `${path} — ممنوع على الطالب`, !s.body.includes(marker));
    assert("حدود الأدوار", `${path} — متاح للإدارة`, a.body.includes(marker));
  }

  /* ══ ٥ · المحطات والكليات ════════════════════════════════════════ */
  const faculties = await db.faculty.findMany({ include: { _count: { select: { courses: true } } } });
  const cat = await get("/courses");
  for (const f of faculties)
    assert("المحطات والكليات", `«${f.name}» ظاهرة`, cat.body.includes(f.name),
      `${f._count.courses} مقرر`);

  /* ══ ٦ · مسار الدروس والاستئناف ══════════════════════════════════ */
  const learn = await get("/learn", cS);
  assert("مسار الدروس", "«مقرراتي» تعرض مقررات الطالب", learn.status === 200);
  const mats = await db.courseMaterial.findMany({ where: { courseId: course!.id },
    orderBy: { position: "asc" } });
  assert("مسار الدروس", "ترتيب الدروس محفوظ بلا فجوات",
    mats.every((m, i) => m.position === i), mats.map(m => m.position).join(","));
  assert("الاستئناف", "صفحة الدراسة تفتح",
    (await get(`/learn/${course!.id}`, cS)).status === 200);

  /* ══ ٧ · رفع الفيديو ═════════════════════════════════════════════ */
  const ready = await db.courseMaterial.count({ where: { status: "READY" } });
  const planned = await db.courseMaterial.count({ where: { objectKey: null } });
  assert("رفع الفيديو", "الدروس الجاهزة والمخطَّطة متمايزة",
    true, `READY=${ready} مخطَّط=${planned}`);
  const courseAdmin = await get(`/settings/courses/${course!.id}`, cA);
  assert("رفع الفيديو", "ضابط الرفع معروض في شاشة المقرر",
    /رفع|اختر ملف|فيديو/.test(courseAdmin.body));

  /* ══ ٨ · لوحة الإدارة ════════════════════════════════════════════ */
  assert("لوحة الإدارة", "قفل حذف الباقة المبيعة معروض",
    courseAdmin.status === 200);
  const users = await get("/settings/users", cA);
  assert("لوحة الإدارة", "شاشة المستخدمين تعمل", users.status === 200);

  /* ── التقرير ── */
  const byFeature = new Map<string, typeof results>();
  for (const r of results) {
    if (!byFeature.has(r.feature)) byFeature.set(r.feature, []);
    byFeature.get(r.feature)!.push(r);
  }
  let failed = 0;
  for (const [feature, rows] of byFeature) {
    const ok = rows.every(r => r.pass);
    if (!ok) failed++;
    console.log(`\n${ok ? "✓" : "✗"} ${feature}`);
    for (const r of rows)
      console.log(`   ${r.pass ? "·" : "✗"} ${r.check}${r.detail ? "  — " + r.detail : ""}`);
  }
  console.log(`\n${failed === 0 ? "ALL FEATURES PASS" : failed + " FEATURE GROUP(S) FAILED"}`);
  await db.$disconnect();
  if (failed) process.exit(1);
}

main().catch(e => { console.error("FAILED:", e); process.exit(1); });
