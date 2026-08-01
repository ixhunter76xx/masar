import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../src/generated/prisma/client";
import { Role, TermStatus } from "../src/generated/prisma/enums";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL مفقود — تأكد من وجود ملف .env.");
}

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

/** حسابات تجريبية للتطوير — لا تُستخدم في الإنتاج */
const SEED_USERS = [
  {
    username: "20231045",
    email: "20231045@hisab.edu",
    name: "سالم أحمد الدوسري",
    password: "Student@123",
    role: Role.STUDENT,
  },
  {
    username: "instructor",
    email: "instructor@hisab.edu",
    name: "د. منى عبدالله",
    password: "Teacher@123",
    role: Role.INSTRUCTOR,
  },
  {
    username: "admin",
    email: "admin@hisab.edu",
    name: "إدارة مركز حساب",
    password: "Admin@123",
    role: Role.ADMIN,
  },
];

const SEED_TERMS = [
  {
    name: "2025/2026 — الفصل الثاني",
    startsOn: new Date("2026-02-01"),
    endsOn: new Date("2026-06-15"),
    status: TermStatus.ACTIVE,
  },
  {
    name: "2025/2026 — الفصل الأول",
    startsOn: new Date("2025-09-01"),
    endsOn: new Date("2026-01-15"),
    status: TermStatus.ARCHIVED,
  },
];

/** المقررات مرتبطة بالفصل عبر اسمه، ويُحوَّل إلى مفتاح أجنبي أدناه */
const SEED_COURSES = [
  {
    code: "MATH101",
    title: "التفاضل والتكامل",
    description:
      "أساسيات النهايات والاشتقاق والتكامل وتطبيقاتها في حل المسائل الهندسية والفيزيائية.",
    term: "2025/2026 — الفصل الثاني",
  },
  {
    code: "CS102",
    title: "مقدمة في البرمجة",
    description:
      "المفاهيم الأساسية للبرمجة: المتغيّرات، التحكم في المسار، الدوال، وهياكل البيانات البسيطة.",
    term: "2025/2026 — الفصل الثاني",
  },
  {
    code: "STAT110",
    title: "الإحصاء التطبيقي",
    description: "مقاييس النزعة المركزية والتشتّت، والاحتمالات، واختبار الفرضيات.",
    term: "2025/2026 — الفصل الثاني",
  },
  {
    code: "MATH100",
    title: "الرياضيات التمهيدية",
    description: "الجبر والمثلثات كتحضير لمقرر التفاضل والتكامل.",
    term: "2025/2026 — الفصل الأول",
  },
];

async function main() {
  // ١) المستخدمون
  const users = new Map<string, string>();
  for (const u of SEED_USERS) {
    const passwordHash = await bcrypt.hash(u.password, 12);
    const saved = await db.user.upsert({
      where: { username: u.username },
      update: { name: u.name, role: u.role, passwordHash, isActive: true },
      create: {
        username: u.username,
        email: u.email,
        name: u.name,
        passwordHash,
        role: u.role,
      },
    });
    users.set(u.username, saved.id);
    console.log(`✓ مستخدم  ${u.role.padEnd(10)} ${u.username}  /  ${u.password}`);
  }

  // ٢) الفصول الدراسية
  const terms = new Map<string, string>();
  for (const t of SEED_TERMS) {
    const saved = await db.term.upsert({
      where: { name: t.name },
      update: { startsOn: t.startsOn, endsOn: t.endsOn, status: t.status },
      create: t,
    });
    terms.set(t.name, saved.id);
    console.log(`✓ فصل     ${t.status.padEnd(10)} ${t.name}`);
  }

  // ٣) المقررات
  const instructorId = users.get("instructor")!;
  const courses: { id: string; code: string }[] = [];

  for (const c of SEED_COURSES) {
    const termId = terms.get(c.term)!;
    const saved = await db.course.upsert({
      where: { termId_code: { termId, code: c.code } },
      update: { title: c.title, description: c.description, instructorId },
      create: {
        code: c.code,
        title: c.title,
        description: c.description,
        termId,
        instructorId,
      },
    });
    courses.push({ id: saved.id, code: c.code });
    console.log(`✓ مقرر    ${c.code.padEnd(10)} ${c.title}`);
  }

  // ٤) تسجيل الطالب في كل المقررات
  const studentId = users.get("20231045")!;
  for (const c of courses) {
    await db.enrollment.upsert({
      where: { studentId_courseId: { studentId, courseId: c.id } },
      update: {},
      create: { studentId, courseId: c.id },
    });
  }
  console.log(`✓ تسجيل   الطالب 20231045 في ${courses.length} مقررات`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
