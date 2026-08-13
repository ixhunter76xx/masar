/**
 * يطبع كعكة جلسة صالحة لدورٍ مطلوب، لفحص الصفحات المحمية في المتصفّح.
 *   npx tsx --tsconfig tsconfig.script.json scripts/mint-session.mts ADMIN
 * ثم تُلصَق القيمة في `document.cookie`.
 *
 * لماذا السكّ بدل ملء نموذج الدخول: حتميّ، ولا يحتاج كلمة مرور، وهو
 * نفس الرمز الذي يصدره التطبيق — يمرّ من `auth()` ومن `getLiveUser()`
 * بفحصها الحيّ لـ`isActive` و`sessionVersion`.
 */
import "dotenv/config";
import { EncryptJWT } from "jose";
import { hkdf } from "@panva/hkdf";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";

const COOKIE = "authjs.session-token";
const role = (process.argv[2] ?? "STUDENT").toUpperCase();

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const u = await db.user.findFirst({ where: { role: role as never } });
if (!u) throw new Error(`لا يوجد مستخدم بدور ${role}`);

const key = await hkdf("sha256", process.env.AUTH_SECRET!, COOKIE,
  `Auth.js Generated Encryption Key (${COOKIE})`, 64);

const token = await new EncryptJWT({
  sub: u.id, email: u.email, role: u.role,
  sessionVersion: (u as { sessionVersion?: number }).sessionVersion ?? 0,
}).setProtectedHeader({ alg: "dir", enc: "A256CBC-HS512" })
  .setIssuedAt().setExpirationTime("2h").encrypt(key);

console.log(`${u.email} (${u.role})`);
console.log(`document.cookie=${JSON.stringify(`${COOKIE}=${token}; path=/`)}`);
await db.$disconnect();
