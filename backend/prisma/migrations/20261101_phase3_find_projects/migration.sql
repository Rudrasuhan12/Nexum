-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "budgetType" TEXT NOT NULL DEFAULT 'FIXED_PRICE',
ADD COLUMN     "category" TEXT,
ADD COLUMN     "experienceLevel" "ExperienceLevel",
ADD COLUMN     "location" TEXT DEFAULT 'Remote',
ADD COLUMN     "skills" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateTable
CREATE TABLE "SavedProject" (
    "id" TEXT NOT NULL,
    "freelancerId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedProject_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SavedProject_freelancerId_idx" ON "SavedProject"("freelancerId");

-- CreateIndex
CREATE INDEX "SavedProject_projectId_idx" ON "SavedProject"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "SavedProject_freelancerId_projectId_key" ON "SavedProject"("freelancerId", "projectId");

-- CreateIndex
CREATE INDEX "Project_state_visibility_idx" ON "Project"("state", "visibility");

-- CreateIndex
CREATE INDEX "Project_budgetCents_idx" ON "Project"("budgetCents");

-- CreateIndex
CREATE INDEX "Project_category_idx" ON "Project"("category");

-- AddForeignKey
ALTER TABLE "SavedProject" ADD CONSTRAINT "SavedProject_freelancerId_fkey" FOREIGN KEY ("freelancerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedProject" ADD CONSTRAINT "SavedProject_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
