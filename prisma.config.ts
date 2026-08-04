import "dotenv/config";
import { defineConfig } from "prisma/config";

/**
 * إعداد Prisma CLI (الإصدار 7 فما فوق).
 *
 * منذ Prisma 7 لم يعد `url` مسموحًا داخل كتلة `datasource` في
 * schema.prisma، وانتقل إلى هنا. أما وقت التشغيل فيمرَّر الاتصال عبر
 * محوّل @prisma/adapter-pg في src/server/db.ts.
 *
 * **الرابط هنا يجب أن يكون المباشر لا المجمَّع**: أدوات الهجرة تحتاج
 * جلسة مباشرة (advisory locks وDDL)، وقد تفشل أو تتصرّف بغرابة عبر
 * pooler يعمل بوضع transaction. لذلك نفضّل DIRECT_URL إن وُجد.
 *
 * نستخدم `process.env` مباشرة بدل المساعد `env()` عمدًا: المساعد يرمي
 * خطأً إذا كان المتغيّر مفقودًا، وكل أوامر Prisma تحمّل هذا الملف —
 * بما فيها `prisma generate` الذي يعمل ضمن postinstall ولا يحتاج
 * اتصالاً بقاعدة البيانات. هذا يجعل `npm install` ينجح حتى بلا .env.
 */
/**
 * الرابط المباشر إن وُجد، وإلا رابط التطبيق.
 *
 * `??` وحده لا يكفي: فهو يتراجع عند null/undefined فقط، بينما القيمة
 * الشائعة هنا سلسلة **فارغة** — `.env.example` يشحن `DIRECT_URL=""`،
 * وبيئة بناء Netlify تحقن المتغيّرات المعلَنة ولو بلا قيمة. النتيجة
 * كانت `url: ""` وخطأ P1013 غامضًا («المخطط غير معروف») مع سطر
 * `Datasource "db": PostgreSQL database` بلا مضيف. نتعامل مع الفارغ
 * كغائب.
 */
function databaseUrl(): string {
  const direct = process.env.DIRECT_URL?.trim();
  if (direct) return direct;
  return process.env.DATABASE_URL?.trim() ?? "";
}

export default defineConfig({
  schema: "prisma/schema.prisma",

  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },

  datasource: {
    url: databaseUrl(),
  },
});
