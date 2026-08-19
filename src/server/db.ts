import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@/generated/prisma/client";

/**
 * عميل Prisma مفرد (singleton).
 *
 * ── رابطان لا رابط واحد ─────────────────────────────────────────────
 * `DATABASE_URL` يجب أن يكون رابط **الـ pooler** (يحوي `-pooler` مع Neon).
 * `PrismaNeon` يستعمل ناقل Neon المهيّأ للبيئات الخادمية القصيرة، مع
 * مجمّع WebSocket يدعم المعاملات التفاعلية التي تعتمد عليها الطلبات
 * والرسائل. ناقل HTTP أسرع في أول قراءة لكنه لا يدعم تلك المعاملات،
 * لذلك لا يصلح عميلًا عامًا للمنصة.
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
   * حجم المجمّع وعمر الاتصال الخامل لكل نسخة.
   * Netlify قد يشغّل نسخًا كثيرة متوازية، فنبقي المهلة قصيرة هناك كي
   * لا تتراكم الاتصالات. أمّا الخادم المحلي الطويل العمر فيحتفظ بها
   * خمس دقائق: قياس البحرين→us-east-2 أظهر أن فتح الاتصال يكلف قرابة
   * 1.5ث، بينما إعادة استعماله تحوّل الجولة التالية إلى قرابة 0.2ث.
   */
  const max = Number(process.env.DB_POOL_MAX ?? 5);
  const idleTimeoutMillis = Number(
    process.env.DB_POOL_IDLE_TIMEOUT_MS ??
      (process.env.NETLIFY ? 10_000 : 300_000),
  );

  return new PrismaClient({
    adapter: new PrismaNeon({
      connectionString,
      max,
      idleTimeoutMillis,
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
