-- إضافة المراسلة: محادثة ثنائية بين طالب ومدرب في سياق مقرر.
--
-- لا حذف ولا تعديل لأي جدول قائم — إضافة صرفة، فتطبيقها على قاعدة
-- تعمل لا يمسّ أي بيانات موجودة.

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
