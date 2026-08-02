import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

/**
 * عميل Prisma مفرد (singleton).
 *
 * ── رابطان لا رابط واحد ─────────────────────────────────────────────
 * `DATABASE_URL` يجب أن يكون رابط **الـ pooler** (يحوي `-pooler` مع Neon).
 * كل نسخة من الدالة الخادمية تفتح اتصالًا، وبلا مجمّع تُستنفد حصة
 * الاتصالات بسرعة تحت الحمل.
 *
 * أما الهجرات فتحتاج اتصالًا **مباشرًا** (`DIRECT_URL`)، وتقرأه أدوات
 * Prisma من prisma.config.ts لا من هنا.
 * ────────────────────────────────────────────────────────────────────
 */
function createClient() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      "DATABASE_URL مفقود. انسخ .env.example إلى .env وعبّئ رابط قاعدة البيانات.",
    );
  }

  /**
   * حجم المجمّع لكل نسخة.
   * في البيئات الخادمية (Vercel) تُشغَّل نسخ كثيرة متوازية، فيبقى
   * نصيب كل نسخة صغيرًا ويتولّى pooler الخدمة تجميعها.
   */
  const max = Number(process.env.DB_POOL_MAX ?? 5);

  return new PrismaClient({
    adapter: new PrismaPg({
      connectionString,
      max,
      // إغلاق الاتصالات الخاملة بسرعة — النسخة الخادمية قصيرة العمر
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 10_000,
    }),
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
