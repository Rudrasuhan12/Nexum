-- Migration: 20261102_phase4_proposals
-- Expand ProposalStatus enum
ALTER TYPE "ProposalStatus" ADD VALUE IF NOT EXISTS 'UNDER_REVIEW';
ALTER TYPE "ProposalStatus" ADD VALUE IF NOT EXISTS 'SHORTLISTED';
ALTER TYPE "ProposalStatus" ADD VALUE IF NOT EXISTS 'INTERVIEW_DISCUSSION';
ALTER TYPE "ProposalStatus" ADD VALUE IF NOT EXISTS 'COUNTEROFFER_RECEIVED';
ALTER TYPE "ProposalStatus" ADD VALUE IF NOT EXISTS 'WITHDRAWN';

-- Expand FilePurpose enum
ALTER TYPE "FilePurpose" ADD VALUE IF NOT EXISTS 'PROPOSAL_ATTACHMENT';

-- CreateTable Proposal
CREATE TABLE IF NOT EXISTS "Proposal" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "freelancerId" TEXT NOT NULL,
    "status" "ProposalStatus" NOT NULL DEFAULT 'DRAFT',
    "currentVersionId" TEXT,
    "rejectionFeedback" TEXT,
    "submittedAt" TIMESTAMP(3),
    "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Proposal_pkey" PRIMARY KEY ("id")
);

-- Partial unique index on Proposal (Active live proposal per project per freelancer)
CREATE UNIQUE INDEX IF NOT EXISTS "proposals_project_freelancer_active_unique" 
ON "Proposal"("projectId", "freelancerId") 
WHERE "status" != 'WITHDRAWN';

CREATE INDEX IF NOT EXISTS "Proposal_freelancerId_status_idx" ON "Proposal"("freelancerId", "status");
CREATE INDEX IF NOT EXISTS "Proposal_projectId_status_idx" ON "Proposal"("projectId", "status");

-- AlterTable ProposalVersion
ALTER TABLE "ProposalVersion" ADD COLUMN IF NOT EXISTS "proposalId" TEXT;
ALTER TABLE "ProposalVersion" ADD COLUMN IF NOT EXISTS "versionNumber" INTEGER;
ALTER TABLE "ProposalVersion" ADD COLUMN IF NOT EXISTS "authorRole" "Role" NOT NULL DEFAULT 'FREELANCER';
ALTER TABLE "ProposalVersion" ADD COLUMN IF NOT EXISTS "contentHash" TEXT;
ALTER TABLE "ProposalVersion" ADD COLUMN IF NOT EXISTS "coverLetter" TEXT;
ALTER TABLE "ProposalVersion" ADD COLUMN IF NOT EXISTS "approach" TEXT;
ALTER TABLE "ProposalVersion" ADD COLUMN IF NOT EXISTS "scopeText" TEXT;
ALTER TABLE "ProposalVersion" ADD COLUMN IF NOT EXISTS "deliverables" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE "ProposalVersion" ADD COLUMN IF NOT EXISTS "exclusionsText" TEXT;
ALTER TABLE "ProposalVersion" ADD COLUMN IF NOT EXISTS "assumptionsText" TEXT;
ALTER TABLE "ProposalVersion" ADD COLUMN IF NOT EXISTS "dependencies" TEXT;
ALTER TABLE "ProposalVersion" ADD COLUMN IF NOT EXISTS "paymentModel" TEXT;
ALTER TABLE "ProposalVersion" ADD COLUMN IF NOT EXISTS "totalAmountMinor" INTEGER;
ALTER TABLE "ProposalVersion" ADD COLUMN IF NOT EXISTS "hourlyRateMinor" INTEGER;
ALTER TABLE "ProposalVersion" ADD COLUMN IF NOT EXISTS "estimatedHours" INTEGER;
ALTER TABLE "ProposalVersion" ADD COLUMN IF NOT EXISTS "estimatedDurationWeeks" INTEGER;
ALTER TABLE "ProposalVersion" ADD COLUMN IF NOT EXISTS "startAvailableOn" TIMESTAMP(3);
ALTER TABLE "ProposalVersion" ADD COLUMN IF NOT EXISTS "portfolioSnapshot" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE "ProposalVersion" ADD COLUMN IF NOT EXISTS "submittedAt" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "ProposalVersion_proposalId_idx" ON "ProposalVersion"("proposalId");

-- CreateTable ProposalAttachment
CREATE TABLE IF NOT EXISTS "ProposalAttachment" (
    "id" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProposalAttachment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ProposalAttachment_proposalId_fileId_key" ON "ProposalAttachment"("proposalId", "fileId");

-- CreateTable ProposalEvent
CREATE TABLE IF NOT EXISTS "ProposalEvent" (
    "id" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "proposalVersionId" TEXT,
    "actorRole" "Role" NOT NULL,
    "actorId" TEXT,
    "type" TEXT NOT NULL,
    "fromStatus" "ProposalStatus" NOT NULL,
    "toStatus" "ProposalStatus" NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProposalEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ProposalEvent_proposalId_createdAt_idx" ON "ProposalEvent"("proposalId", "createdAt");

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Proposal_projectId_fkey') THEN
        ALTER TABLE "Proposal" ADD CONSTRAINT "Proposal_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Proposal_freelancerId_fkey') THEN
        ALTER TABLE "Proposal" ADD CONSTRAINT "Proposal_freelancerId_fkey" FOREIGN KEY ("freelancerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ProposalVersion_proposalId_fkey') THEN
        ALTER TABLE "ProposalVersion" ADD CONSTRAINT "ProposalVersion_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "Proposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ProposalAttachment_proposalId_fkey') THEN
        ALTER TABLE "ProposalAttachment" ADD CONSTRAINT "ProposalAttachment_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "Proposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ProposalAttachment_fileId_fkey') THEN
        ALTER TABLE "ProposalAttachment" ADD CONSTRAINT "ProposalAttachment_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "File"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ProposalEvent_proposalId_fkey') THEN
        ALTER TABLE "ProposalEvent" ADD CONSTRAINT "ProposalEvent_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "Proposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ProposalEvent_proposalVersionId_fkey') THEN
        ALTER TABLE "ProposalEvent" ADD CONSTRAINT "ProposalEvent_proposalVersionId_fkey" FOREIGN KEY ("proposalVersionId") REFERENCES "ProposalVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;
