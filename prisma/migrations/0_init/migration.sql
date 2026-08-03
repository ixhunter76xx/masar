-- الترحيل الأولي لمنصة مسار.
--
-- ── إنشاء فقط: لا يحذف شيئًا ─────────────────────────────────────────
-- كانت النسخة الأولى من هذا الملف تبدأ بـ `DROP SCHEMA public CASCADE`
-- لتفريغ قاعدة مركز حساب. وهذا **يكسر `prisma migrate deploy`**:
-- الأمر يُدرج سطرًا في `_prisma_migrations` قبل تشغيل السكربت ثم
-- يُحدّثه بعده — وذلك الجدول يعيش في `public`، فيمحوه السكربت من تحت
-- قدميه ويفشل التحديث اللاحق.
--
-- تفريغ القاعدة عملية تشغيلية منفصلة يقوم بها `prisma migrate reset`،
-- وهو يُسقط المخطط **قبل** أن يبدأ تسجيل الهجرات لا أثناءه.
--
-- الأسماء متروكة لتسمية PostgreSQL التلقائية لأنها تطابق تسمية Prisma:
-- <جدول>_<عمود>_pkey و_key و_idx و_fkey.
-- ─────────────────────────────────────────────────────────────────────

CREATE TYPE "Role" AS ENUM ('STUDENT','INSTRUCTOR','ADMIN');
CREATE TYPE "MaterialKind" AS ENUM ('VIDEO');
CREATE TYPE "MaterialStatus" AS ENUM ('PENDING','READY','FAILED');
CREATE TYPE "ProductItemKind" AS ENUM ('LESSON','QUIZ');
CREATE TYPE "GrantSource" AS ENUM ('PURCHASE','ADMIN_GRANT');
CREATE TYPE "OrderStatus" AS ENUM ('PENDING','PAID','FAILED','CANCELLED','REFUNDED');
CREATE TYPE "QuizStatus" AS ENUM ('DRAFT','PUBLISHED','CLOSED');
CREATE TYPE "QuestionKind" AS ENUM ('MULTIPLE_CHOICE','TRUE_FALSE');
CREATE TYPE "AssignmentStatus" AS ENUM ('DRAFT','PUBLISHED','CLOSED');
CREATE TYPE "SubmissionStatus" AS ENUM ('SUBMITTED','GRADED');

CREATE TABLE "users" (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE,
  name TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  role "Role" NOT NULL DEFAULT 'STUDENT',
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
  "lastLoginAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE INDEX ON "users"(role);

CREATE TABLE "courses" (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  summary TEXT,
  description TEXT,
  "coverKey" TEXT,
  "isPublished" BOOLEAN NOT NULL DEFAULT false,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "presenterId" TEXT REFERENCES "users"(id) ON DELETE SET NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE INDEX ON "courses"("isPublished","sortOrder");
CREATE INDEX ON "courses"("presenterId");

CREATE TABLE "products" (
  id TEXT PRIMARY KEY,
  "courseId" TEXT NOT NULL REFERENCES "courses"(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  "priceFils" INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'BHD',
  "isPublished" BOOLEAN NOT NULL DEFAULT false,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  UNIQUE("courseId", slug),
  -- السعر بالفلس: صفر مسموح (منتج مجاني) والسالب لا معنى له
  CONSTRAINT products_price_nonnegative CHECK ("priceFils" >= 0)
);
CREATE INDEX ON "products"("courseId","sortOrder");
CREATE INDEX ON "products"("isPublished");

CREATE TABLE "course_materials" (
  id TEXT PRIMARY KEY,
  "courseId" TEXT NOT NULL REFERENCES "courses"(id) ON DELETE CASCADE,
  kind "MaterialKind" NOT NULL DEFAULT 'VIDEO',
  status "MaterialStatus" NOT NULL DEFAULT 'PENDING',
  title TEXT NOT NULL,
  description TEXT,
  "objectKey" TEXT UNIQUE NOT NULL,
  "contentType" TEXT NOT NULL DEFAULT 'video/mp4',
  "sizeBytes" BIGINT,
  "durationSec" INTEGER,
  "uploadedById" TEXT NOT NULL REFERENCES "users"(id) ON DELETE RESTRICT,
  position INTEGER NOT NULL DEFAULT 0,
  "isFreePreview" BOOLEAN NOT NULL DEFAULT false,
  "publishedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE INDEX ON "course_materials"("courseId",position);
CREATE INDEX ON "course_materials"("courseId",status);

CREATE TABLE "quizzes" (
  id TEXT PRIMARY KEY,
  "courseId" TEXT NOT NULL REFERENCES "courses"(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status "QuizStatus" NOT NULL DEFAULT 'DRAFT',
  "maxAttempts" INTEGER NOT NULL DEFAULT 1,
  "timeLimitMin" INTEGER,
  "opensAt" TIMESTAMP(3),
  "closesAt" TIMESTAMP(3),
  "shuffleQuestions" BOOLEAN NOT NULL DEFAULT false,
  "authorId" TEXT NOT NULL REFERENCES "users"(id) ON DELETE RESTRICT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE INDEX ON "quizzes"("courseId",status);

CREATE TABLE "product_items" (
  id TEXT PRIMARY KEY,
  "productId" TEXT NOT NULL REFERENCES "products"(id) ON DELETE CASCADE,
  kind "ProductItemKind" NOT NULL,
  "lessonId" TEXT REFERENCES "course_materials"(id) ON DELETE CASCADE,
  "quizId" TEXT REFERENCES "quizzes"(id) ON DELETE CASCADE,
  position INTEGER NOT NULL DEFAULT 0,
  UNIQUE("productId","lessonId"),
  UNIQUE("productId","quizId"),
  -- النوع والمرجع يتطابقان، وأحدهما بالضبط غير فارغ.
  -- بلا هذا القيد يمكن أن يوجد سطر kind='LESSON' بلا lessonId فيختفي
  -- من المنهج بلا أثر، أو سطر يحمل المرجعين فيُحتسب مرتين.
  CONSTRAINT product_items_exactly_one_ref CHECK (
    (kind = 'LESSON' AND "lessonId" IS NOT NULL AND "quizId" IS NULL) OR
    (kind = 'QUIZ'   AND "quizId"   IS NOT NULL AND "lessonId" IS NULL)
  )
);
CREATE INDEX ON "product_items"("productId",position);

CREATE TABLE "orders" (
  id TEXT PRIMARY KEY,
  number TEXT UNIQUE NOT NULL,
  "userId" TEXT NOT NULL REFERENCES "users"(id) ON DELETE RESTRICT,
  status "OrderStatus" NOT NULL DEFAULT 'PENDING',
  "totalFils" INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'BHD',
  "paidAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT orders_total_nonnegative CHECK ("totalFils" >= 0)
);
CREATE INDEX ON "orders"("userId","createdAt");
CREATE INDEX ON "orders"(status);

CREATE TABLE "order_items" (
  id TEXT PRIMARY KEY,
  "orderId" TEXT NOT NULL REFERENCES "orders"(id) ON DELETE CASCADE,
  -- RESTRICT لا CASCADE: حذف منتج يجب ألّا يمحو سجلًّا ماليًا
  "productId" TEXT NOT NULL REFERENCES "products"(id) ON DELETE RESTRICT,
  "unitPriceFils" INTEGER NOT NULL,
  "titleSnapshot" TEXT NOT NULL,
  UNIQUE("orderId","productId")
);

CREATE TABLE "payments" (
  id TEXT PRIMARY KEY,
  "orderId" TEXT NOT NULL REFERENCES "orders"(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  "providerPaymentId" TEXT NOT NULL,
  status TEXT NOT NULL,
  "amountFils" INTEGER NOT NULL,
  "rawPayload" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  -- مفتاح عدم تكرار الـ webhook: البوابة تعيد الإرسال عند الشك
  UNIQUE(provider,"providerPaymentId")
);
CREATE INDEX ON "payments"("orderId");

CREATE TABLE "enrollments" (
  id TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "users"(id) ON DELETE CASCADE,
  "productId" TEXT NOT NULL REFERENCES "products"(id) ON DELETE CASCADE,
  source "GrantSource" NOT NULL DEFAULT 'PURCHASE',
  "orderId" TEXT REFERENCES "orders"(id) ON DELETE SET NULL,
  "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3),
  UNIQUE("userId","productId")
);
CREATE INDEX ON "enrollments"("userId");
CREATE INDEX ON "enrollments"("productId");

CREATE TABLE "lesson_progress" (
  id TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "users"(id) ON DELETE CASCADE,
  "lessonId" TEXT NOT NULL REFERENCES "course_materials"(id) ON DELETE CASCADE,
  "positionSec" INTEGER NOT NULL DEFAULT 0,
  "completedAt" TIMESTAMP(3),
  "updatedAt" TIMESTAMP(3) NOT NULL,
  UNIQUE("userId","lessonId")
);
CREATE INDEX ON "lesson_progress"("userId","updatedAt");

-- ── ما يبقى مبنيًّا وخارج نطاق الإصدار الأول ─────────────────────────
-- الإعلانات والاختبارات والواجبات والرسائل. جداولها تُنشأ كاملةً حتى
-- لا تحتاج هجرة عند تفعيلها، وفحوص الوصول فيها تمرّ الآن عبر
-- `hasCourseAccess` بدل التسجيل في مقرر.

CREATE TABLE "announcements" (
  id TEXT PRIMARY KEY,
  "courseId" TEXT NOT NULL REFERENCES "courses"(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  "authorId" TEXT NOT NULL REFERENCES "users"(id) ON DELETE RESTRICT,
  "publishedAt" TIMESTAMP(3),
  "isPinned" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE INDEX ON "announcements"("courseId","publishedAt");

CREATE TABLE "announcement_reads" (
  id TEXT PRIMARY KEY,
  "announcementId" TEXT NOT NULL REFERENCES "announcements"(id) ON DELETE CASCADE,
  "userId" TEXT NOT NULL REFERENCES "users"(id) ON DELETE CASCADE,
  "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("announcementId","userId")
);
CREATE INDEX ON "announcement_reads"("userId");

CREATE TABLE "questions" (
  id TEXT PRIMARY KEY,
  "quizId" TEXT NOT NULL REFERENCES "quizzes"(id) ON DELETE CASCADE,
  kind "QuestionKind" NOT NULL DEFAULT 'MULTIPLE_CHOICE',
  text TEXT NOT NULL,
  points INTEGER NOT NULL DEFAULT 1,
  position INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE INDEX ON "questions"("quizId",position);

CREATE TABLE "question_options" (
  id TEXT PRIMARY KEY,
  "questionId" TEXT NOT NULL REFERENCES "questions"(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  "isCorrect" BOOLEAN NOT NULL DEFAULT false,
  position INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX ON "question_options"("questionId",position);

CREATE TABLE "quiz_attempts" (
  id TEXT PRIMARY KEY,
  "quizId" TEXT NOT NULL REFERENCES "quizzes"(id) ON DELETE CASCADE,
  "studentId" TEXT NOT NULL REFERENCES "users"(id) ON DELETE CASCADE,
  "attemptNumber" INTEGER NOT NULL,
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "submittedAt" TIMESTAMP(3),
  "earnedPoints" INTEGER,
  "totalPoints" INTEGER,
  UNIQUE("quizId","studentId","attemptNumber")
);
CREATE INDEX ON "quiz_attempts"("studentId");

CREATE TABLE "answers" (
  id TEXT PRIMARY KEY,
  "attemptId" TEXT NOT NULL REFERENCES "quiz_attempts"(id) ON DELETE CASCADE,
  "questionId" TEXT NOT NULL REFERENCES "questions"(id) ON DELETE CASCADE,
  "selectedOptionId" TEXT REFERENCES "question_options"(id) ON DELETE SET NULL,
  "isCorrect" BOOLEAN,
  "earnedPoints" INTEGER,
  UNIQUE("attemptId","questionId")
);

CREATE TABLE "assignments" (
  id TEXT PRIMARY KEY,
  "courseId" TEXT NOT NULL REFERENCES "courses"(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status "AssignmentStatus" NOT NULL DEFAULT 'DRAFT',
  "totalPoints" INTEGER NOT NULL DEFAULT 10,
  "dueAt" TIMESTAMP(3),
  "allowLate" BOOLEAN NOT NULL DEFAULT false,
  "latePenaltyPercent" INTEGER NOT NULL DEFAULT 0,
  "allowedExtensions" TEXT[] DEFAULT ARRAY['pdf','docx','zip','png','jpg']::TEXT[],
  "maxFileMb" INTEGER NOT NULL DEFAULT 20,
  "authorId" TEXT NOT NULL REFERENCES "users"(id) ON DELETE RESTRICT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE INDEX ON "assignments"("courseId",status);

CREATE TABLE "submissions" (
  id TEXT PRIMARY KEY,
  "assignmentId" TEXT NOT NULL REFERENCES "assignments"(id) ON DELETE CASCADE,
  "studentId" TEXT NOT NULL REFERENCES "users"(id) ON DELETE CASCADE,
  note TEXT,
  "objectKey" TEXT,
  "fileName" TEXT,
  "fileSizeBytes" BIGINT,
  "contentType" TEXT,
  "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "isLate" BOOLEAN NOT NULL DEFAULT false,
  status "SubmissionStatus" NOT NULL DEFAULT 'SUBMITTED',
  "rawPoints" INTEGER,
  "earnedPoints" INTEGER,
  feedback TEXT,
  "gradedAt" TIMESTAMP(3),
  "gradedById" TEXT REFERENCES "users"(id) ON DELETE SET NULL,
  UNIQUE("assignmentId","studentId")
);
CREATE INDEX ON "submissions"("assignmentId",status);

CREATE TABLE "conversations" (
  id TEXT PRIMARY KEY,
  "courseId" TEXT NOT NULL REFERENCES "courses"(id) ON DELETE CASCADE,
  "studentId" TEXT NOT NULL REFERENCES "users"(id) ON DELETE CASCADE,
  "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("courseId","studentId")
);
CREATE INDEX ON "conversations"("courseId","lastMessageAt");
CREATE INDEX ON "conversations"("studentId","lastMessageAt");

CREATE TABLE "messages" (
  id TEXT PRIMARY KEY,
  "conversationId" TEXT NOT NULL REFERENCES "conversations"(id) ON DELETE CASCADE,
  "senderId" TEXT NOT NULL REFERENCES "users"(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  "readAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX ON "messages"("conversationId","createdAt");
CREATE INDEX ON "messages"("senderId","readAt");
