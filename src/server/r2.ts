import "server-only";

import { S3Client } from "@aws-sdk/client-s3";

/**
 * عميل S3 موجّه إلى Cloudflare R2.
 *
 * R2 متوافق مع واجهة S3، لذلك نستخدم AWS SDK مع نقطة نهاية مخصّصة.
 * `region: "auto"` مطلوب من الـ SDK ولا يستخدمه R2.
 */
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `${name} مفقود. أضف بيانات Cloudflare R2 إلى .env.local — انظر .env.example.`,
    );
  }
  return value;
}

/**
 * نقطة نهاية R2.
 * تُقرأ من R2_ENDPOINT إن وُجدت، وإلا تُبنى من معرّف الحساب.
 */
function endpoint(): string {
  return (
    process.env.R2_ENDPOINT ||
    `https://${requireEnv("R2_ACCOUNT_ID")}.r2.cloudflarestorage.com`
  );
}

let client: S3Client | undefined;

export function r2(): S3Client {
  if (!client) {
    client = new S3Client({
      region: "auto",
      endpoint: endpoint(),
      credentials: {
        accessKeyId: requireEnv("R2_ACCESS_KEY_ID"),
        secretAccessKey: requireEnv("R2_SECRET_ACCESS_KEY"),
      },
    });
  }
  return client;
}

export function r2Bucket(): string {
  return requireEnv("R2_BUCKET_NAME");
}

/**
 * مفتاح الكائن داخل الدلو.
 * التنظيم حسب المقرر يسهّل الحذف الجماعي والمراجعة.
 */
export function videoObjectKey(courseId: string, materialId: string): string {
  return `courses/${courseId}/videos/${materialId}.mp4`;
}
