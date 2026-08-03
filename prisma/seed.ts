/**
 * بيانات أولية لمنصة مسار.
 *
 * ليست بيانات اختبار كالسابق: حساب إدارة واحد، وأستاذ واحد، ومقرر
 * ARAB110 بمنتجاته الثلاثة كما وصفته وثيقة المشروع. الطلاب يسجّلون
 * أنفسهم بأنفسهم — لا حسابات طلاب مبذورة.
 *
 * ⚠ لا يُشغَّل على الإنتاج: كلمات المرور هنا معروفة.
 */
import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../src/generated/prisma/client";
import { Role, ProductItemKind, MaterialStatus } from "../src/generated/prisma/enums";
import { hash as bcryptHash } from "bcryptjs";

/* Prisma 7 يعمل بمحوّل سائق (driver adapter) لا برابط في المخطط —
   نفس ما يفعله `src/server/db.ts` وقت التشغيل. */
const db = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "",
  }),
});

/** ١ دينار = ١٠٠٠ فلس */
const dinar = (amount: number) => Math.round(amount * 1000);

async function main() {
  const hash = (plain: string) => bcryptHash(plain, 12);

  const admin = await db.user.upsert({
    where: { email: "admin@masar.bh" },
    update: {},
    create: {
      email: "admin@masar.bh",
      username: "admin",
      name: "إدارة مسار",
      passwordHash: await hash("Admin@123"),
      role: Role.ADMIN,
      mustChangePassword: false,
    },
  });

  const presenter = await db.user.upsert({
    where: { email: "ustath@masar.bh" },
    update: {},
    create: {
      email: "ustath@masar.bh",
      username: "ustath",
      name: "د. منى عبدالله",
      passwordHash: await hash("Teacher@123"),
      role: Role.INSTRUCTOR,
      mustChangePassword: false,
    },
  });
  console.log(`✓ حساب   ADMIN       ${admin.email}`);
  console.log(`✓ حساب   INSTRUCTOR  ${presenter.email}`);

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
}

main()
  .then(() => db.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await db.$disconnect();
    process.exit(1);
  });
