import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

/**
 * عميل Prisma مفرد (singleton).
 *
 * منذ Prisma 7 لا يقرأ العميل رابط الاتصال من schema.prisma، بل يُمرَّر
 * صراحةً عبر محوّل السائق (driver adapter). أما prisma.config.ts فيخدم
 * أوامر الـ CLI فقط (migrate / generate / db seed).
 *
 * في التطوير يعيد Next.js تحميل الوحدات عند كل تعديل، فنحفظ العميل على
 * globalThis لتجنّب استنفاد اتصالات قاعدة البيانات.
 */
function createClient() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      "DATABASE_URL مفقود. انسخ .env.example إلى .env وعبّئ رابط قاعدة البيانات.",
    );
  }

  return new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

const globalForPrisma = globalThis as unknown as {
  prisma?: ReturnType<typeof createClient>;
};

export const db = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
