-- AlterEnum
ALTER TYPE "MaterialKind" ADD VALUE 'FILE';

-- AlterTable
ALTER TABLE "course_materials" ADD COLUMN     "chapterId" TEXT;

-- CreateTable
CREATE TABLE "chapters" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chapters_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "chapters_courseId_position_idx" ON "chapters"("courseId", "position");

-- CreateIndex
CREATE INDEX "course_materials_chapterId_position_idx" ON "course_materials"("chapterId", "position");

-- AddForeignKey
ALTER TABLE "course_materials" ADD CONSTRAINT "course_materials_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "chapters"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chapters" ADD CONSTRAINT "chapters_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
