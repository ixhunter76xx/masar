-- CreateEnum
CREATE TYPE "MaterialKind" AS ENUM ('VIDEO');

-- CreateEnum
CREATE TYPE "MaterialStatus" AS ENUM ('PENDING', 'READY', 'FAILED');

-- CreateTable
CREATE TABLE "course_materials" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "kind" "MaterialKind" NOT NULL DEFAULT 'VIDEO',
    "status" "MaterialStatus" NOT NULL DEFAULT 'PENDING',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "objectKey" TEXT NOT NULL,
    "contentType" TEXT NOT NULL DEFAULT 'video/mp4',
    "sizeBytes" BIGINT,
    "durationSec" INTEGER,
    "uploadedById" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "course_materials_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "course_materials_objectKey_key" ON "course_materials"("objectKey");

-- CreateIndex
CREATE INDEX "course_materials_courseId_position_idx" ON "course_materials"("courseId", "position");

-- CreateIndex
CREATE INDEX "course_materials_courseId_status_idx" ON "course_materials"("courseId", "status");

-- AddForeignKey
ALTER TABLE "course_materials" ADD CONSTRAINT "course_materials_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_materials" ADD CONSTRAINT "course_materials_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
