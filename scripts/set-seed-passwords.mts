/**
 * إعادة ضبط كلمة مرور الحسابين التجريبيين على قاعدة قائمة.
 *
 * لماذا يلزم سكربت منفصل: `prisma/seed.ts` يستخدم `ensureUser()`
 * (بحث ثم إنشاء) لا `upsert`، فهو لا يلمس كلمة مرور حساب موجود أصلًا.
 * هذه خاصية مقصودة في البذرة ولا ينبغي تغييرها — فبديلها (`upsert`
 * مع `update: {}`) يطبع كلمة مرور جديدة دون تطبيقها، وهو أسوأ من
 * كلمة معروفة لأنه يبدو ناجحًا. لذلك تُعاد إعادة الضبط من هنا.
 *
 * يقرأ القيم من SEED_ADMIN_PASSWORD و SEED_TEACHER_PASSWORD في `.env`
 * — لا قيمة ثابتة في المستودع. لا يشتغل بلا هذين المتغيّرين.
 *
 * للتشغيل:  npx tsx scripts/set-seed-passwords.mts
 */
import "dotenv/config";
import { hash } from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const TARGETS = [
  { email: "admin@masar.bh", envVar: "SEED_ADMIN_PASSWORD" },
  { email: "ustath@masar.bh", envVar: "SEED_TEACHER_PASSWORD" },
  // حسابا اختبار من التسجيل الذاتي لا من البذرة — يُتخطّيان بلا ضجيج
  // إن لم يوجدا، فقاعدة نظيفة حديثة لن تحتويهما.
  { email: "student.test@masar.bh", envVar: "SEED_STUDENT_PASSWORD" },
  { email: "fresh.visitor@masar.bh", envVar: "SEED_VISITOR_PASSWORD" },
] as const;

/** حسابات البذرة وحدها إلزامية؛ غيابُ حساب اختباري ليس فشلًا */
const REQUIRED = new Set(["admin@masar.bh", "ustath@masar.bh"]);

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

let failed = false;

for (const { email, envVar } of TARGETS) {
  const password = process.env[envVar]?.trim();
  if (!password) {
    if (REQUIRED.has(email)) {
      console.error(`✗ ${email}: المتغيّر ${envVar} غير مضبوط في .env — تُخُطّي.`);
      failed = true;
    } else {
      console.log(`· ${email}: ${envVar} غير مضبوط — تُخُطّي.`);
    }
    continue;
  }

  const user = await db.user.findUnique({
    where: { email },
    select: { id: true, role: true },
  });
  if (!user) {
    if (REQUIRED.has(email)) {
      console.error(`✗ ${email}: الحساب غير موجود — شغّل npx prisma db seed أولًا.`);
      failed = true;
    } else {
      console.log(`· ${email}: غير موجود — تُخُطّي.`);
    }
    continue;
  }

  await db.user.update({
    where: { id: user.id },
    data: {
      passwordHash: await hash(password, 10),
      mustChangePassword: false,
      isActive: true,
    },
  });

  console.log(`✓ ${email} (${user.role}) — ضُبطت من ${envVar}`);
}

await db.$disconnect();
process.exit(failed ? 1 : 0);
