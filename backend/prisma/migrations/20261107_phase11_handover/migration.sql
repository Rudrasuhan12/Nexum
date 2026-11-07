-- CreateEnum
CREATE TYPE "HandoverStatus" AS ENUM ('PENDING_SUBMISSION', 'IN_REVIEW', 'COMPLETED');

-- CreateEnum
CREATE TYPE "HandoverCategory" AS ENUM ('REPOSITORY', 'DOCUMENTATION', 'DEPLOYMENT', 'CREDENTIALS', 'TESTS', 'IP_TRANSFER', 'CUSTOM');

-- CreateEnum
CREATE TYPE "HandoverItemStatus" AS ENUM ('PENDING', 'PROVIDED', 'ACCEPTED', 'REVISIONS_REQUESTED');

-- CreateTable
CREATE TABLE "ProjectHandover" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "status" "HandoverStatus" NOT NULL DEFAULT 'PENDING_SUBMISSION',
    "requestedById" TEXT NOT NULL,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "contentHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectHandover_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectHandoverItem" (
    "id" TEXT NOT NULL,
    "handoverId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "HandoverCategory" NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "status" "HandoverItemStatus" NOT NULL DEFAULT 'PENDING',
    "providedUrl" TEXT,
    "providedFileKey" TEXT,
    "providedNotes" TEXT,
    "rejectionReason" TEXT,
    "providedAt" TIMESTAMP(3),
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectHandoverItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProjectHandover_projectId_key" ON "ProjectHandover"("projectId");

-- CreateIndex
CREATE INDEX "ProjectHandover_projectId_status_idx" ON "ProjectHandover"("projectId", "status");

-- CreateIndex
CREATE INDEX "ProjectHandoverItem_handoverId_status_idx" ON "ProjectHandoverItem"("handoverId", "status");

-- AddForeignKey
ALTER TABLE "ProjectHandover" ADD CONSTRAINT "ProjectHandover_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectHandoverItem" ADD CONSTRAINT "ProjectHandoverItem_handoverId_fkey" FOREIGN KEY ("handoverId") REFERENCES "ProjectHandover"("id") ON DELETE CASCADE ON UPDATE CASCADE;

