-- AlterTable
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "budgetMinCents" INTEGER,
ADD COLUMN IF NOT EXISTS "budgetMaxCents" INTEGER;

-- CreateTable
CREATE TABLE IF NOT EXISTS "ProjectInvitation" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "freelancerId" TEXT NOT NULL,
    "message" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),

    CONSTRAINT "ProjectInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "ProjectInvitation_projectId_freelancerId_key" ON "ProjectInvitation"("projectId", "freelancerId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ProjectInvitation_freelancerId_status_idx" ON "ProjectInvitation"("freelancerId", "status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ProjectInvitation_projectId_status_idx" ON "ProjectInvitation"("projectId", "status");

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ProjectInvitation_projectId_fkey'
  ) THEN
    ALTER TABLE "ProjectInvitation" ADD CONSTRAINT "ProjectInvitation_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ProjectInvitation_freelancerId_fkey'
  ) THEN
    ALTER TABLE "ProjectInvitation" ADD CONSTRAINT "ProjectInvitation_freelancerId_fkey" FOREIGN KEY ("freelancerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
