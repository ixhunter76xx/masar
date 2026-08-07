-- ═══ الكليات ════════════════════════════════════════════════════════
--
-- المنصة كانت تعرض قائمة مقررات مسطّحة بلا تصنيف أعلى، فتقرأ كموقع
-- مقرر واحد لا كمنصة جامعة. `Faculty` تعطي الكتالوج محورًا يكبر عليه.
--
-- **إضافية بالكامل**: جدول جديد وعمود يقبل NULL. لا عمود يُحذف ولا صفّ
-- قائم يتغيّر معناه — والمقرر بلا كلية يبقى صالحًا ويُعرض في مجموعة
-- «مقررات أخرى» بدل أن يختفي.
--
-- الكليتان أدناه بيانات أوّلية لا هيكل: تُنشآن هنا لأن الكتالوج يحتاج
-- تصنيفًا فعليًا ليُختبر، وتُنشئهما البذرة أيضًا بنفس المسارات فلا
-- تتكرران على قاعدة مزروعة (`ON CONFLICT DO NOTHING`).
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE "faculties" (
    "id"        TEXT NOT NULL,
    "slug"      TEXT NOT NULL,
    "name"      TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "faculties_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "faculties_slug_key" ON "faculties"("slug");
CREATE INDEX "faculties_sortOrder_idx" ON "faculties"("sortOrder");

ALTER TABLE "courses" ADD COLUMN "facultyId" TEXT;
CREATE INDEX "courses_facultyId_sortOrder_idx" ON "courses"("facultyId", "sortOrder");

ALTER TABLE "courses"
  ADD CONSTRAINT "courses_facultyId_fkey"
  FOREIGN KEY ("facultyId") REFERENCES "faculties"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- الكليتان الأوليان
INSERT INTO "faculties" ("id", "slug", "name", "sortOrder", "updatedAt")
VALUES
  (gen_random_uuid()::text, 'it',   'تقنية المعلومات', 1, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'arts', 'الآداب',          2, CURRENT_TIMESTAMP)
ON CONFLICT ("slug") DO NOTHING;

-- ARAB110 مقرر لغة عربية — يتبع الآداب. مشروط بالمسار لا بالمعرّف
-- كي تبقى الهجرة صالحة على قاعدة لا تحوي هذا المقرر.
UPDATE "courses"
SET "facultyId" = (SELECT "id" FROM "faculties" WHERE "slug" = 'arts')
WHERE "code" = 'ARAB110' AND "facultyId" IS NULL;
