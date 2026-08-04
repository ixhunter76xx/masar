/**
 * بيانات أولية لمنصة مسار.
 *
 * ليست بيانات اختبار كالسابق: حساب إدارة واحد، وأستاذ واحد، ومقرر
 * ARAB110 بمنتجاته الثلاثة كما وصفته وثيقة المشروع. الطلاب يسجّلون
 * أنفسهم بأنفسهم — لا حسابات طلاب مبذورة.
 *
 * كلمات المرور لم تعد مكتوبة هنا: تُقرأ من SEED_ADMIN_PASSWORD و
 * SEED_TEACHER_PASSWORD، وإن غابا تُولَّد عشوائية وتُطبع مرة واحدة عند
 * الإنشاء. لا قيمة ثابتة معروفة في المستودع.
 */
import { randomBytes } from "node:crypto";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../src/generated/prisma/client";
import { Role, ProductItemKind, MaterialStatus } from "../src/generated/prisma/enums";
import { hash as bcryptHash } from "bcryptjs";

/* Prisma 7 يعمل بمحوّل سائق (driver adapter) لا برابط في المخطط —
   نفس ما يفعله `src/server/db.ts` وقت التشغيل. */
/* الفارغ يُعامَل كغائب — انظر التعليق في prisma.config.ts */
const connectionString =
  process.env.DIRECT_URL?.trim() || process.env.DATABASE_URL?.trim() || "";

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

/** ١ دينار = ١٠٠٠ فلس */
const dinar = (amount: number) => Math.round(amount * 1000);

/**
 * كلمة مرور حساب مبذور: من متغيّر البيئة إن وُجد، وإلا عشوائية.
 * 24 بايت عشوائي بترميز base64url ≈ 32 محرفًا — أقوى بكثير مما يُكتب يدويًا.
 */
function seedPassword(envVar: string): { value: string; fromEnv: boolean } {
  const raw = process.env[envVar]?.trim();
  if (raw) return { value: raw, fromEnv: true };
  return { value: randomBytes(24).toString("base64url"), fromEnv: false };
}

/** كلمات المرور المولَّدة لحسابات أُنشئت فعلًا — تُطبع في النهاية */
const generatedCredentials: Array<{ email: string; password: string }> = [];

async function main() {
  const hash = (plain: string) => bcryptHash(plain, 12);

  /**
   * ننشئ الحساب فقط إن لم يكن موجودًا — نفس سلوك `upsert` بـ`update: {}`
   * السابق. الفرق أننا نعرف هنا هل أُنشئ فعلًا، فلا نطبع كلمة مرور مولَّدة
   * لحساب قائم لم تُطبَّق عليه (وهو ما كان سيضلّل عند إعادة البذر).
   */
  async function ensureUser(input: {
    email: string;
    username: string;
    name: string;
    role: Role;
    passwordEnvVar: string;
  }) {
    const existing = await db.user.findUnique({
      where: { email: input.email },
      select: { id: true, email: true },
    });
    if (existing) {
      console.log(`• حساب   ${input.role.padEnd(11)} ${existing.email}  (موجود مسبقًا — لم يُمسّ)`);
      return existing;
    }

    const password = seedPassword(input.passwordEnvVar);
    const user = await db.user.create({
      data: {
        email: input.email,
        username: input.username,
        name: input.name,
        passwordHash: await hash(password.value),
        role: input.role,
        mustChangePassword: false,
      },
      select: { id: true, email: true },
    });

    if (!password.fromEnv) {
      generatedCredentials.push({ email: user.email, password: password.value });
    }
    console.log(
      `✓ حساب   ${input.role.padEnd(11)} ${user.email}  ` +
        `(كلمة المرور من ${password.fromEnv ? input.passwordEnvVar : "توليد عشوائي"})`,
    );
    return user;
  }

  await ensureUser({
    email: "admin@masar.bh",
    username: "admin",
    name: "إدارة مسار",
    role: Role.ADMIN,
    passwordEnvVar: "SEED_ADMIN_PASSWORD",
  });

  const presenter = await ensureUser({
    email: "ustath@masar.bh",
    username: "ustath",
    name: "د. منى عبدالله",
    role: Role.INSTRUCTOR,
    passwordEnvVar: "SEED_TEACHER_PASSWORD",
  });

  const course = await db.course.upsert({
    where: { code: "ARAB110" },
    update: {},
    create: {
      code: "ARAB110",
      slug: "arab110",
      title: "مهارات الاتصال باللغة العربية",
      summary: "شرح مركّز لمقرر ARAB110 كما يُدرَّس في جامعة البحرين.",
      description:
        "يغطّي المقرر الاستفهام والصرف والنحو والبلاغة، بدروس مسجّلة " +
        "لكل موضوع واختبارات قصيرة تقيس الفهم بعد كل وحدة.",
      isPublished: true,
      sortOrder: 1,
      presenterId: presenter.id,
    },
  });
  console.log(`✓ مقرر   ${course.code}  ${course.title}`);

  /* الدروس مملوكة للمقرر لا للمنتج — المنتجات تشير إليها.
     `PENDING` لأن الفيديو لم يُرفع بعد؛ الرفع من لوحة الإدارة يجعلها READY. */
  const lessonSeed = [
    { title: "الاستفهام", free: true },
    { title: "الصرف", free: false },
    { title: "النحو", free: false },
    { title: "البلاغة", free: false },
  ];

  const lessons = [];
  for (const [index, item] of lessonSeed.entries()) {
    const lesson = await db.courseMaterial.upsert({
      where: { objectKey: `seed/${course.code}/${index + 1}` },
      update: {},
      create: {
        courseId: course.id,
        title: item.title,
        objectKey: `seed/${course.code}/${index + 1}`,
        status: MaterialStatus.PENDING,
        position: index,
        isFreePreview: item.free,
        uploadedById: presenter.id,
      },
    });
    lessons.push(lesson);
    console.log(`  درس   ${item.free ? "مجاني" : "     "}  ${item.title}`);
  }

  /* المنتجات الثلاثة متداخلة عمدًا: "الكاملة" تشير إلى الدروس نفسها التي
     تشير إليها الدورتان الأخريان — لا نسخة ثانية من أي فيديو. */
  const catalogue = [
    { slug: "midterm", title: "دورة المنتصف", price: dinar(8), lessons: [0, 1] },
    { slug: "final", title: "دورة النهائي", price: dinar(8), lessons: [2, 3] },
    { slug: "full", title: "الدورة الكاملة", price: dinar(14), lessons: [0, 1, 2, 3] },
  ];

  for (const [order, entry] of catalogue.entries()) {
    const product = await db.product.upsert({
      where: { courseId_slug: { courseId: course.id, slug: entry.slug } },
      update: { priceFils: entry.price },
      create: {
        courseId: course.id,
        slug: entry.slug,
        title: entry.title,
        priceFils: entry.price,
        isPublished: true,
        sortOrder: order,
      },
    });

    for (const [position, lessonIndex] of entry.lessons.entries()) {
      await db.productItem.upsert({
        where: {
          productId_lessonId: {
            productId: product.id,
            lessonId: lessons[lessonIndex].id,
          },
        },
        update: { position },
        create: {
          productId: product.id,
          kind: ProductItemKind.LESSON,
          lessonId: lessons[lessonIndex].id,
          position,
        },
      });
    }

    console.log(
      `✓ منتج   ${entry.title.padEnd(16)} ${(entry.price / 1000).toFixed(3)} د.ب  (${entry.lessons.length} دروس)`,
    );
  }

  /* الفرصة الوحيدة لرؤية كلمات المرور المولَّدة — لا تُخزَّن إلا مُجزّأة. */
  if (generatedCredentials.length) {
    console.log(
      "\n" +
        "═".repeat(64) +
        "\n  كلمات مرور مولَّدة عشوائيًا — تُعرض هذه المرة فقط.\n" +
        "  احفظها الآن ثم غيّرها من داخل المنصة. لتثبيتها مسبقًا بدل\n" +
        "  التوليد، اضبط SEED_ADMIN_PASSWORD و SEED_TEACHER_PASSWORD.\n" +
        "═".repeat(64),
    );
    for (const c of generatedCredentials) {
      console.log(`  ${c.email.padEnd(20)} ${c.password}`);
    }
    console.log("═".repeat(64) + "\n");
  }
}

main()
  .then(() => db.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await db.$disconnect();
    process.exit(1);
  });
