-- Phase 5: Agreements, Milestones and Change Requests Migration

-- 1. Alter Enums
ALTER TYPE "FilePurpose" ADD VALUE IF NOT EXISTS 'DELIVERABLE';

DO $$ BEGIN
    CREATE TYPE "AgreementStatus" AS ENUM ('PENDING_APPROVAL', 'ACTIVE', 'COMPLETED', 'DISPUTED', 'TERMINATED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "AgreementVersionStatus" AS ENUM ('PENDING_APPROVAL', 'ACTIVE', 'SUPERSEDED', 'REJECTED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "AgreementSource" AS ENUM ('PROPOSAL', 'CHANGE_REQUEST');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "MilestoneWorkStatus" AS ENUM ('UPCOMING', 'IN_PROGRESS', 'READY_TO_SUBMIT', 'AWAITING_CLIENT_REVIEW', 'REVISIONS_REQUESTED', 'ACCEPTED', 'DISPUTED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "SubmissionStatus" AS ENUM ('SUBMITTED', 'ACCEPTED', 'REVISIONS_REQUESTED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "ReviewDecision" AS ENUM ('ACCEPTED', 'REVISIONS_REQUESTED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "ChangeClassification" AS ENUM ('NEW_MILESTONE', 'AMENDMENT', 'CLARIFICATION', 'DEFECT', 'REDUCTION');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

ALTER TYPE "ChangeRequestStatus" ADD VALUE IF NOT EXISTS 'OPEN';
ALTER TYPE "ChangeRequestStatus" ADD VALUE IF NOT EXISTS 'QUOTE_SUBMITTED';
ALTER TYPE "ChangeRequestStatus" ADD VALUE IF NOT EXISTS 'DECLINED';
ALTER TYPE "ChangeRequestStatus" ADD VALUE IF NOT EXISTS 'WITHDRAWN';

-- 2. Create agreements Table
CREATE TABLE IF NOT EXISTS "agreements" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "proposalId" TEXT,
    "clientId" TEXT NOT NULL,
    "freelancerId" TEXT NOT NULL,
    "status" "AgreementStatus" NOT NULL DEFAULT 'PENDING_APPROVAL',
    "activeVersionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agreements_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "agreements_projectId_key" UNIQUE ("projectId"),
    CONSTRAINT "agreements_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "agreements_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "Proposal"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "agreements_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "agreements_freelancerId_fkey" FOREIGN KEY ("freelancerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "agreements_freelancerId_status_idx" ON "agreements"("freelancerId", "status");
CREATE INDEX IF NOT EXISTS "agreements_clientId_status_idx" ON "agreements"("clientId", "status");

-- 3. Create agreement_versions Table
CREATE TABLE IF NOT EXISTS "agreement_versions" (
    "id" TEXT NOT NULL,
    "agreementId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "parentVersionId" TEXT,
    "source" "AgreementSource" NOT NULL DEFAULT 'PROPOSAL',
    "sourceRefId" TEXT,
    "terms" JSONB NOT NULL,
    "contentHash" TEXT NOT NULL,
    "status" "AgreementVersionStatus" NOT NULL DEFAULT 'PENDING_APPROVAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activatedAt" TIMESTAMP(3),

    CONSTRAINT "agreement_versions_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "agreement_versions_agreementId_versionNumber_key" UNIQUE ("agreementId", "versionNumber"),
    CONSTRAINT "agreement_versions_agreementId_fkey" FOREIGN KEY ("agreementId") REFERENCES "agreements"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "agreement_versions_agreementId_status_idx" ON "agreement_versions"("agreementId", "status");
CREATE UNIQUE INDEX IF NOT EXISTS "agreement_versions_active_unique_idx" ON "agreement_versions"("agreementId") WHERE "status" = 'ACTIVE';

-- 4. Create agreement_approvals Table
CREATE TABLE IF NOT EXISTS "agreement_approvals" (
    "id" TEXT NOT NULL,
    "agreementVersionId" TEXT NOT NULL,
    "partyRole" "Role" NOT NULL,
    "userId" TEXT NOT NULL,
    "decision" "ApprovalDecision" NOT NULL,
    "contentHash" TEXT NOT NULL,
    "reason" TEXT,
    "decidedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agreement_approvals_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "agreement_approvals_version_role_key" UNIQUE ("agreementVersionId", "partyRole"),
    CONSTRAINT "agreement_approvals_agreementVersionId_fkey" FOREIGN KEY ("agreementVersionId") REFERENCES "agreement_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "agreement_approvals_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "agreement_approvals_agreementVersionId_idx" ON "agreement_approvals"("agreementVersionId");

-- 5. Alter Milestone Table
ALTER TABLE "Milestone" ALTER COLUMN "proposalVersionId" DROP NOT NULL;
ALTER TABLE "Milestone" ADD COLUMN IF NOT EXISTS "projectId" TEXT;
ALTER TABLE "Milestone" ADD COLUMN IF NOT EXISTS "agreementId" TEXT;
ALTER TABLE "Milestone" ADD COLUMN IF NOT EXISTS "milestoneKey" TEXT;
ALTER TABLE "Milestone" ADD COLUMN IF NOT EXISTS "sequence" INTEGER;
ALTER TABLE "Milestone" ADD COLUMN IF NOT EXISTS "description" TEXT;
ALTER TABLE "Milestone" ADD COLUMN IF NOT EXISTS "amountMinor" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Milestone" ADD COLUMN IF NOT EXISTS "workStatus" "MilestoneWorkStatus" NOT NULL DEFAULT 'UPCOMING';
ALTER TABLE "Milestone" ADD COLUMN IF NOT EXISTS "statusBeforeDispute" "MilestoneWorkStatus";
ALTER TABLE "Milestone" ADD COLUMN IF NOT EXISTS "dueDate" TIMESTAMP(3);
ALTER TABLE "Milestone" ADD COLUMN IF NOT EXISTS "startedAt" TIMESTAMP(3);
ALTER TABLE "Milestone" ADD COLUMN IF NOT EXISTS "acceptedAt" TIMESTAMP(3);
ALTER TABLE "Milestone" ADD COLUMN IF NOT EXISTS "removedAt" TIMESTAMP(3);
ALTER TABLE "Milestone" ADD COLUMN IF NOT EXISTS "lastAgreementVersionId" TEXT;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Milestone_projectId_fkey') THEN
        ALTER TABLE "Milestone" ADD CONSTRAINT "Milestone_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Milestone_agreementId_fkey') THEN
        ALTER TABLE "Milestone" ADD CONSTRAINT "Milestone_agreementId_fkey" FOREIGN KEY ("agreementId") REFERENCES "agreements"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS "Milestone_agreementId_sequence_idx" ON "Milestone"("agreementId", "sequence");
CREATE INDEX IF NOT EXISTS "Milestone_projectId_workStatus_idx" ON "Milestone"("projectId", "workStatus");

-- 6. Create milestone_revisions Table
CREATE TABLE IF NOT EXISTS "milestone_revisions" (
    "id" TEXT NOT NULL,
    "milestoneId" TEXT NOT NULL,
    "agreementVersionId" TEXT NOT NULL,
    "snapshot" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "milestone_revisions_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "milestone_revisions_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "Milestone"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "milestone_revisions_agreementVersionId_fkey" FOREIGN KEY ("agreementVersionId") REFERENCES "agreement_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "milestone_revisions_milestoneId_idx" ON "milestone_revisions"("milestoneId");

-- 7. Create milestone_submissions Table
CREATE TABLE IF NOT EXISTS "milestone_submissions" (
    "id" TEXT NOT NULL,
    "milestoneId" TEXT NOT NULL,
    "revisionNumber" INTEGER NOT NULL DEFAULT 1,
    "completionNote" TEXT NOT NULL,
    "links" JSONB NOT NULL DEFAULT '[]',
    "status" "SubmissionStatus" NOT NULL DEFAULT 'SUBMITTED',
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "milestone_submissions_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "milestone_submissions_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "Milestone"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "milestone_submissions_milestoneId_revisionNumber_idx" ON "milestone_submissions"("milestoneId", "revisionNumber");

-- 8. Create milestone_submission_files Table
CREATE TABLE IF NOT EXISTS "milestone_submission_files" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,

    CONSTRAINT "milestone_submission_files_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "milestone_submission_files_submissionId_fileId_key" UNIQUE ("submissionId", "fileId"),
    CONSTRAINT "milestone_submission_files_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "milestone_submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "milestone_submission_files_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "File"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- 9. Create milestone_reviews Table
CREATE TABLE IF NOT EXISTS "milestone_reviews" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "decision" "ReviewDecision" NOT NULL,
    "unmetCriteria" JSONB NOT NULL DEFAULT '[]',
    "feedback" TEXT,
    "agreementVersionId" TEXT NOT NULL,
    "decidedBy" TEXT NOT NULL,
    "decidedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "milestone_reviews_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "milestone_reviews_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "milestone_submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "milestone_reviews_submissionId_idx" ON "milestone_reviews"("submissionId");

-- 10. Create disputes Table
CREATE TABLE IF NOT EXISTS "disputes" (
    "id" TEXT NOT NULL,
    "milestoneId" TEXT NOT NULL,
    "openedByRole" "Role" NOT NULL DEFAULT 'CLIENT',
    "reason" TEXT NOT NULL,
    "status" "DisputeStatus" NOT NULL DEFAULT 'OPEN',
    "freelancerStatement" TEXT,
    "resolutionNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "disputes_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "disputes_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "Milestone"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "disputes_milestoneId_status_idx" ON "disputes"("milestoneId", "status");

-- 11. Alter ChangeRequest Table
ALTER TABLE "ChangeRequest" ADD COLUMN IF NOT EXISTS "agreementId" TEXT;
ALTER TABLE "ChangeRequest" ADD COLUMN IF NOT EXISTS "baseVersionId" TEXT;
ALTER TABLE "ChangeRequest" ADD COLUMN IF NOT EXISTS "raisedByRole" "Role" NOT NULL DEFAULT 'CLIENT';
ALTER TABLE "ChangeRequest" ADD COLUMN IF NOT EXISTS "raisedById" TEXT;
ALTER TABLE "ChangeRequest" ADD COLUMN IF NOT EXISTS "description" TEXT NOT NULL DEFAULT '';
ALTER TABLE "ChangeRequest" ADD COLUMN IF NOT EXISTS "proposedVersionId" TEXT;
ALTER TABLE "ChangeRequest" ADD COLUMN IF NOT EXISTS "sourceMessageId" TEXT;
ALTER TABLE "ChangeRequest" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ChangeRequest_agreementId_fkey') THEN
        ALTER TABLE "ChangeRequest" ADD CONSTRAINT "ChangeRequest_agreementId_fkey" FOREIGN KEY ("agreementId") REFERENCES "agreements"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ChangeRequest_raisedById_fkey') THEN
        ALTER TABLE "ChangeRequest" ADD CONSTRAINT "ChangeRequest_raisedById_fkey" FOREIGN KEY ("raisedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS "ChangeRequest_agreementId_status_idx" ON "ChangeRequest"("agreementId", "status");

-- 12. Immutability Trigger for AgreementVersion
CREATE OR REPLACE FUNCTION guard_agreement_version_immutable()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD."contentHash" IS NOT NULL THEN
        IF NEW."terms"::text != OLD."terms"::text OR NEW."contentHash" != OLD."contentHash" THEN
            RAISE EXCEPTION 'AgreementVersion terms and contentHash are immutable once created';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_guard_agreement_version_immutable ON "agreement_versions";
CREATE TRIGGER trg_guard_agreement_version_immutable
BEFORE UPDATE ON "agreement_versions"
FOR EACH ROW
EXECUTE FUNCTION guard_agreement_version_immutable();
