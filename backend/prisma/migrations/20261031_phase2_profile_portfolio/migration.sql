-- Phase 2 Migration: My Profile and Portfolio
-- Additive migration preserving all Phase 0 and Phase 1 data

-- CreateEnum
CREATE TYPE "ExperienceLevel" AS ENUM ('BEGINNER', 'JUNIOR', 'MID', 'SENIOR', 'EXPERT');

-- CreateEnum
CREATE TYPE "PreferredEngagement" AS ENUM ('HOURLY', 'FIXED_PRICE', 'BOTH');

-- CreateEnum
CREATE TYPE "WorkArrangement" AS ENUM ('REMOTE', 'HYBRID', 'ON_SITE');

-- CreateEnum
CREATE TYPE "SearchVisibility" AS ENUM ('VISIBLE', 'HIDDEN');

-- CreateEnum
CREATE TYPE "RateCurrency" AS ENUM ('USD', 'INR', 'EUR', 'GBP');

-- CreateEnum
CREATE TYPE "SkillProficiency" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT');

-- CreateEnum
CREATE TYPE "FilePurpose" AS ENUM ('PROFILE_PHOTO', 'PROFILE_COVER', 'PORTFOLIO_IMAGE');

-- CreateEnum
CREATE TYPE "ResumeVisibility" AS ENUM ('PRIVATE', 'PROPOSAL_CLIENTS', 'PUBLIC');

-- AlterTable
ALTER TABLE "FreelancerProfile" ADD COLUMN     "availabilityStatus" "AvailabilityStatus" NOT NULL DEFAULT 'AVAILABLE',
ADD COLUMN     "countryCode" TEXT,
ADD COLUMN     "coverFileId" TEXT,
ADD COLUMN     "experienceLevel" "ExperienceLevel",
ADD COLUMN     "headline" TEXT,
ADD COLUMN     "locationText" TEXT,
ADD COLUMN     "photoFileId" TEXT,
ADD COLUMN     "preferredEngagement" "PreferredEngagement",
ADD COLUMN     "preferredProjectTypes" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "professionalTitle" TEXT,
ADD COLUMN     "rateCurrency" "RateCurrency" DEFAULT 'USD',
ADD COLUMN     "rateHourlyMinor" INTEGER,
ADD COLUMN     "searchVisibility" "SearchVisibility" NOT NULL DEFAULT 'VISIBLE',
ADD COLUMN     "servicesOffered" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "specialization" TEXT,
ADD COLUMN     "timezone" TEXT DEFAULT 'UTC',
ADD COLUMN     "tools" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "weeklyCapacityHours" INTEGER,
ADD COLUMN     "workArrangement" "WorkArrangement",
ALTER COLUMN "bio" DROP NOT NULL,
ALTER COLUMN "skills" SET DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "ResumeFile" ADD COLUMN     "visibility" "ResumeVisibility" NOT NULL DEFAULT 'PRIVATE';

-- CreateTable
CREATE TABLE "File" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "purpose" "FilePurpose" NOT NULL,
    "storageKey" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mime" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "sha256" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "File_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FreelancerSkill" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "skillName" TEXT NOT NULL,
    "proficiency" "SkillProficiency",
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FreelancerSkill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkExperience" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "location" TEXT,
    "startMonth" TEXT NOT NULL,
    "endMonth" TEXT,
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "responsibilities" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "achievements" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkExperience_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EducationEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "institution" TEXT NOT NULL,
    "degree" TEXT NOT NULL,
    "fieldOfStudy" TEXT,
    "startYear" INTEGER NOT NULL,
    "graduationYear" INTEGER,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EducationEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Certification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "issuer" TEXT NOT NULL,
    "issuedMonth" TEXT NOT NULL,
    "expiresMonth" TEXT,
    "credentialId" TEXT,
    "credentialUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Certification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PortfolioProject" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "tools" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "projectUrl" TEXT,
    "repoUrl" TEXT,
    "startMonth" TEXT,
    "endMonth" TEXT,
    "coverFileId" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PortfolioProject_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "File_storageKey_key" ON "File"("storageKey");

-- CreateIndex
CREATE INDEX "File_ownerId_purpose_idx" ON "File"("ownerId", "purpose");

-- CreateIndex
CREATE INDEX "FreelancerSkill_userId_idx" ON "FreelancerSkill"("userId");

-- CreateIndex
CREATE INDEX "FreelancerSkill_profileId_idx" ON "FreelancerSkill"("profileId");

-- CreateIndex
CREATE UNIQUE INDEX "FreelancerSkill_profileId_skillName_key" ON "FreelancerSkill"("profileId", "skillName");

-- CreateIndex
CREATE INDEX "WorkExperience_userId_idx" ON "WorkExperience"("userId");

-- CreateIndex
CREATE INDEX "WorkExperience_profileId_idx" ON "WorkExperience"("profileId");

-- CreateIndex
CREATE INDEX "EducationEntry_userId_idx" ON "EducationEntry"("userId");

-- CreateIndex
CREATE INDEX "EducationEntry_profileId_idx" ON "EducationEntry"("profileId");

-- CreateIndex
CREATE INDEX "Certification_userId_idx" ON "Certification"("userId");

-- CreateIndex
CREATE INDEX "Certification_profileId_idx" ON "Certification"("profileId");

-- CreateIndex
CREATE INDEX "PortfolioProject_userId_idx" ON "PortfolioProject"("userId");

-- CreateIndex
CREATE INDEX "PortfolioProject_profileId_displayOrder_idx" ON "PortfolioProject"("profileId", "displayOrder");

-- CreateIndex
CREATE INDEX "FreelancerProfile_searchVisibility_availabilityStatus_idx" ON "FreelancerProfile"("searchVisibility", "availabilityStatus");

-- AddForeignKey
ALTER TABLE "FreelancerProfile" ADD CONSTRAINT "FreelancerProfile_photoFileId_fkey" FOREIGN KEY ("photoFileId") REFERENCES "File"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FreelancerProfile" ADD CONSTRAINT "FreelancerProfile_coverFileId_fkey" FOREIGN KEY ("coverFileId") REFERENCES "File"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FreelancerSkill" ADD CONSTRAINT "FreelancerSkill_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FreelancerSkill" ADD CONSTRAINT "FreelancerSkill_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "FreelancerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkExperience" ADD CONSTRAINT "WorkExperience_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkExperience" ADD CONSTRAINT "WorkExperience_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "FreelancerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EducationEntry" ADD CONSTRAINT "EducationEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EducationEntry" ADD CONSTRAINT "EducationEntry_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "FreelancerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Certification" ADD CONSTRAINT "Certification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Certification" ADD CONSTRAINT "Certification_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "FreelancerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PortfolioProject" ADD CONSTRAINT "PortfolioProject_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PortfolioProject" ADD CONSTRAINT "PortfolioProject_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "FreelancerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PortfolioProject" ADD CONSTRAINT "PortfolioProject_coverFileId_fkey" FOREIGN KEY ("coverFileId") REFERENCES "File"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ===========================================================================
-- Data Preservation & Safe Backfill (Uses deterministic unique IDs, NOT cuid())
-- ===========================================================================

-- 1. Backfill professionalTitle from title where professionalTitle is NULL
UPDATE "FreelancerProfile"
SET "professionalTitle" = "title"
WHERE "professionalTitle" IS NULL AND "title" IS NOT NULL;

-- 2. Backfill legacy skills into FreelancerSkill (avoiding duplicates)
INSERT INTO "FreelancerSkill" ("id", "userId", "profileId", "skillName", "proficiency", "createdAt")
SELECT 
    'mig_sk_' || substr(md5(fp."userId" || s.skill), 1, 24),
    fp."userId",
    fp."id",
    trim(s.skill),
    'INTERMEDIATE'::"SkillProficiency",
    NOW()
FROM "FreelancerProfile" fp,
LATERAL unnest(fp."skills") AS s(skill)
WHERE s.skill IS NOT NULL AND trim(s.skill) <> ''
ON CONFLICT ("profileId", "skillName") DO NOTHING;

