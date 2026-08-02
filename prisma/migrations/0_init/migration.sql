-- الترحيل الأولي لمنصة مركز حساب.
--
-- يُنشئ الأنواع المُعدَّدة والجداول الأربعة عشر كاملةً بمفاتيحها وفهارسها.
-- أسماء القيود والفهارس متروكة لتسمية PostgreSQL التلقائية لأنها تطابق
-- تسمية Prisma حرفًا بحرف: <جدول>_<عمود>_pkey و_key و_idx و_fkey.
--
-- ملاحظة على updatedAt: بلا DEFAULT عمدًا. الحقل معلَّم @updatedAt في
-- المخطط، وعميل Prisma هو من يضبطه؛ وضع قيمة افتراضية في القاعدة يجعل
-- `prisma migrate diff` يرى انحرافًا (drift) عن المخطط.

CREATE TYPE "Role" AS ENUM ('STUDENT','INSTRUCTOR','ADMIN');
CREATE TYPE "TermStatus" AS ENUM ('ACTIVE','ARCHIVED');
CREATE TYPE "EnrollmentStatus" AS ENUM ('ACTIVE','COMPLETED','DROPPED');
CREATE TYPE "MaterialKind" AS ENUM ('VIDEO');
CREATE TYPE "MaterialStatus" AS ENUM ('PENDING','READY','FAILED');
CREATE TYPE "QuizStatus" AS ENUM ('DRAFT','PUBLISHED','CLOSED');
CREATE TYPE "QuestionKind" AS ENUM ('MULTIPLE_CHOICE','TRUE_FALSE');
CREATE TYPE "AssignmentStatus" AS ENUM ('DRAFT','PUBLISHED','CLOSED');
CREATE TYPE "SubmissionStatus" AS ENUM ('SUBMITTED','GRADED');

CREATE TABLE "users" (id TEXT PRIMARY KEY, username TEXT UNIQUE NOT NULL, email TEXT UNIQUE,
  name TEXT NOT NULL, "passwordHash" TEXT NOT NULL, role "Role" NOT NULL DEFAULT 'STUDENT',
  "isActive" BOOLEAN NOT NULL DEFAULT true, "mustChangePassword" BOOLEAN NOT NULL DEFAULT true,
  "lastLoginAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL);
CREATE INDEX ON "users"(role);

CREATE TABLE "terms" (id TEXT PRIMARY KEY, name TEXT UNIQUE NOT NULL, "startsOn" DATE NOT NULL,
  "endsOn" DATE NOT NULL, status "TermStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL);
CREATE INDEX ON "terms"(status,"startsOn");

CREATE TABLE "courses" (id TEXT PRIMARY KEY, code TEXT NOT NULL, title TEXT NOT NULL, description TEXT,
  "termId" TEXT NOT NULL REFERENCES "terms"(id) ON DELETE RESTRICT,
  "instructorId" TEXT NOT NULL REFERENCES "users"(id) ON DELETE RESTRICT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  UNIQUE("termId",code));
CREATE INDEX ON "courses"("instructorId");

CREATE TABLE "enrollments" (id TEXT PRIMARY KEY,
  "studentId" TEXT NOT NULL REFERENCES "users"(id) ON DELETE CASCADE,
  "courseId" TEXT NOT NULL REFERENCES "courses"(id) ON DELETE CASCADE,
  status "EnrollmentStatus" NOT NULL DEFAULT 'ACTIVE',
  "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, UNIQUE("studentId","courseId"));
CREATE INDEX ON "enrollments"("courseId");

CREATE TABLE "course_materials" (id TEXT PRIMARY KEY,
  "courseId" TEXT NOT NULL REFERENCES "courses"(id) ON DELETE CASCADE,
  kind "MaterialKind" NOT NULL DEFAULT 'VIDEO', status "MaterialStatus" NOT NULL DEFAULT 'PENDING',
  title TEXT NOT NULL, description TEXT, "objectKey" TEXT UNIQUE NOT NULL,
  "contentType" TEXT NOT NULL DEFAULT 'video/mp4', "sizeBytes" BIGINT, "durationSec" INTEGER,
  "uploadedById" TEXT NOT NULL REFERENCES "users"(id) ON DELETE RESTRICT,
  position INTEGER NOT NULL DEFAULT 0, "publishedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL);
CREATE INDEX ON "course_materials"("courseId",position);
CREATE INDEX ON "course_materials"("courseId",status);

CREATE TABLE "announcements" (id TEXT PRIMARY KEY,
  "courseId" TEXT NOT NULL REFERENCES "courses"(id) ON DELETE CASCADE,
  title TEXT NOT NULL, body TEXT NOT NULL,
  "authorId" TEXT NOT NULL REFERENCES "users"(id) ON DELETE RESTRICT,
  "publishedAt" TIMESTAMP(3), "isPinned" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL);
CREATE INDEX ON "announcements"("courseId","publishedAt");

CREATE TABLE "announcement_reads" (id TEXT PRIMARY KEY,
  "announcementId" TEXT NOT NULL REFERENCES "announcements"(id) ON DELETE CASCADE,
  "userId" TEXT NOT NULL REFERENCES "users"(id) ON DELETE CASCADE,
  "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, UNIQUE("announcementId","userId"));
CREATE INDEX ON "announcement_reads"("userId");

CREATE TABLE "quizzes" (id TEXT PRIMARY KEY,
  "courseId" TEXT NOT NULL REFERENCES "courses"(id) ON DELETE CASCADE,
  title TEXT NOT NULL, description TEXT, status "QuizStatus" NOT NULL DEFAULT 'DRAFT',
  "maxAttempts" INTEGER NOT NULL DEFAULT 1, "timeLimitMin" INTEGER,
  "opensAt" TIMESTAMP(3), "closesAt" TIMESTAMP(3),
  "shuffleQuestions" BOOLEAN NOT NULL DEFAULT false,
  "authorId" TEXT NOT NULL REFERENCES "users"(id) ON DELETE RESTRICT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL);
CREATE INDEX ON "quizzes"("courseId",status);

CREATE TABLE "questions" (id TEXT PRIMARY KEY,
  "quizId" TEXT NOT NULL REFERENCES "quizzes"(id) ON DELETE CASCADE,
  kind "QuestionKind" NOT NULL DEFAULT 'MULTIPLE_CHOICE', text TEXT NOT NULL,
  points INTEGER NOT NULL DEFAULT 1, position INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL);
CREATE INDEX ON "questions"("quizId",position);

CREATE TABLE "question_options" (id TEXT PRIMARY KEY,
  "questionId" TEXT NOT NULL REFERENCES "questions"(id) ON DELETE CASCADE,
  text TEXT NOT NULL, "isCorrect" BOOLEAN NOT NULL DEFAULT false,
  position INTEGER NOT NULL DEFAULT 0);
CREATE INDEX ON "question_options"("questionId",position);

CREATE TABLE "quiz_attempts" (id TEXT PRIMARY KEY,
  "quizId" TEXT NOT NULL REFERENCES "quizzes"(id) ON DELETE CASCADE,
  "studentId" TEXT NOT NULL REFERENCES "users"(id) ON DELETE CASCADE,
  "attemptNumber" INTEGER NOT NULL,
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "submittedAt" TIMESTAMP(3),
  "earnedPoints" INTEGER, "totalPoints" INTEGER,
  UNIQUE("quizId","studentId","attemptNumber"));
CREATE INDEX ON "quiz_attempts"("studentId");

CREATE TABLE "answers" (id TEXT PRIMARY KEY,
  "attemptId" TEXT NOT NULL REFERENCES "quiz_attempts"(id) ON DELETE CASCADE,
  "questionId" TEXT NOT NULL REFERENCES "questions"(id) ON DELETE CASCADE,
  "selectedOptionId" TEXT REFERENCES "question_options"(id) ON DELETE SET NULL,
  "isCorrect" BOOLEAN, "earnedPoints" INTEGER, UNIQUE("attemptId","questionId"));

CREATE TABLE "assignments" (id TEXT PRIMARY KEY,
  "courseId" TEXT NOT NULL REFERENCES "courses"(id) ON DELETE CASCADE,
  title TEXT NOT NULL, description TEXT, status "AssignmentStatus" NOT NULL DEFAULT 'DRAFT',
  "totalPoints" INTEGER NOT NULL DEFAULT 10, "dueAt" TIMESTAMP(3),
  "allowLate" BOOLEAN NOT NULL DEFAULT false, "latePenaltyPercent" INTEGER NOT NULL DEFAULT 0,
  "allowedExtensions" TEXT[] DEFAULT ARRAY['pdf','docx','zip','png','jpg']::TEXT[],
  "maxFileMb" INTEGER NOT NULL DEFAULT 20,
  "authorId" TEXT NOT NULL REFERENCES "users"(id) ON DELETE RESTRICT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL);
CREATE INDEX ON "assignments"("courseId",status);

CREATE TABLE "submissions" (id TEXT PRIMARY KEY,
  "assignmentId" TEXT NOT NULL REFERENCES "assignments"(id) ON DELETE CASCADE,
  "studentId" TEXT NOT NULL REFERENCES "users"(id) ON DELETE CASCADE,
  note TEXT, "objectKey" TEXT, "fileName" TEXT, "fileSizeBytes" BIGINT, "contentType" TEXT,
  "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "isLate" BOOLEAN NOT NULL DEFAULT false,
  status "SubmissionStatus" NOT NULL DEFAULT 'SUBMITTED',
  "rawPoints" INTEGER, "earnedPoints" INTEGER, feedback TEXT, "gradedAt" TIMESTAMP(3),
  "gradedById" TEXT REFERENCES "users"(id) ON DELETE SET NULL,
  UNIQUE("assignmentId","studentId"));
CREATE INDEX ON "submissions"("assignmentId",status);
