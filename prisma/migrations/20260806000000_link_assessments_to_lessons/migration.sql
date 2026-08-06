-- ═══ ربط التقييمات بالدروس — إنفاذ نطاق الحزم ═══════════════════════
--
-- القاعدة المتَّفق عليها: الاختبار والواجب يتبعان نطاق درسهما بالضبط.
-- من يملك حزمة تحوي الدرس يرى تقييماته، ومن لا يملكها لا يراها.
--
-- قبل هذه الهجرة لم يكن للاختبار ولا للواجب أي رابط بدرس، فكان النطاق
-- الوحيد الممكن هو المقرر كلّه — ولهذا كان مشتري نصف المقرر يرى
-- اختبارات نصفه الآخر.
--
-- **إضافي بالكامل**: عمودان يقبلان NULL وفهرسان ومفتاحان أجنبيان. لا
-- عمود يُحذف ولا بيانات تُمسّ، والبناء المنشور حاليًا لا يعرف العمودين
-- ولا يقرؤهما، فتطبيق الهجرة قبل نشر الكود لا يكسره.
--
-- NULL يعني «تقييم على مستوى المقرر» — وهو سلوك كل صف قائم اليوم،
-- فالهجرة لا تغيّر ما يراه أحد حتى يُربط التقييم بدرس صراحةً.
--
-- ON DELETE SET NULL لا CASCADE: حذف درس يجب ألّا يمحو اختبارًا معه
-- ومحاولاتِه ودرجاتِها — يعود التقييم إلى نطاق المقرر ويُعاد ربطه.
-- ═══════════════════════════════════════════════════════════════════

ALTER TABLE "quizzes" ADD COLUMN "lessonId" TEXT;
ALTER TABLE "assignments" ADD COLUMN "lessonId" TEXT;

CREATE INDEX "quizzes_lessonId_idx" ON "quizzes"("lessonId");
CREATE INDEX "assignments_lessonId_idx" ON "assignments"("lessonId");

ALTER TABLE "quizzes"
  ADD CONSTRAINT "quizzes_lessonId_fkey"
  FOREIGN KEY ("lessonId") REFERENCES "course_materials"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "assignments"
  ADD CONSTRAINT "assignments_lessonId_fkey"
  FOREIGN KEY ("lessonId") REFERENCES "course_materials"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
