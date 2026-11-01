-- Phase 6: Workspace, Mediated Chat, Files, Tasks, Meetings and Private Nexum AI Migration

-- 1. Alter Enums
ALTER TYPE "FilePurpose" ADD VALUE IF NOT EXISTS 'CHAT_ATTACHMENT';
ALTER TYPE "FilePurpose" ADD VALUE IF NOT EXISTS 'PROJECT_FILE';

DO $$ BEGIN
    CREATE TYPE "ParticipantRole" AS ENUM ('CLIENT', 'FREELANCER', 'OBSERVER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "SenderKind" AS ENUM ('USER', 'NEXUM', 'SYSTEM');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "MessageClass" AS ENUM (
        'QUESTION',
        'CLARIFICATION',
        'FEEDBACK',
        'SCOPE_CHANGE',
        'PRICE_OR_DEADLINE',
        'APPROVAL_LIKE',
        'PAYMENT_QUESTION',
        'DISPUTE',
        'GENERAL',
        'NEXUM_CARD'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "MessageDeliveryStatus" AS ENUM (
        'PENDING_REVIEW',
        'AWAITING_SENDER_CONFIRMATION',
        'DELIVERED',
        'DISCARDED'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "MediationState" AS ENUM ('REVIEWED', 'NOT_REVIEWED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "ProposedAction" AS ENUM (
        'RELAY',
        'DRAFT_CHANGE_REQUEST',
        'LINK_PENDING_VERSION',
        'NONE'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "ProjectFileCategory" AS ENUM ('REFERENCE', 'ATTACHMENT', 'DELIVERABLE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "WorkspaceTaskStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'DONE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "TaskVisibility" AS ENUM ('PRIVATE', 'SHARED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "MeetingStatus" AS ENUM ('PROPOSED', 'ACCEPTED', 'DECLINED', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "DecisionKind" AS ENUM ('PROJECT_NOTE', 'APPROVED_CHANGE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "AIDraftStatus" AS ENUM ('DRAFT', 'SENT', 'DISCARDED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Create Shared Chat Tables
CREATE TABLE IF NOT EXISTS "conversations" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "conversations_projectId_key" ON "conversations"("projectId");

CREATE TABLE IF NOT EXISTS "conversation_participants" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "ParticipantRole" NOT NULL,
    "lastReadMessageId" TEXT,
    "lastReadAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversation_participants_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "conversation_participants_conversationId_userId_key" ON "conversation_participants"("conversationId", "userId");
CREATE INDEX IF NOT EXISTS "conversation_participants_userId_idx" ON "conversation_participants"("userId");

CREATE TABLE IF NOT EXISTS "messages" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "senderId" TEXT,
    "senderKind" "SenderKind" NOT NULL DEFAULT 'USER',
    "originalBody" TEXT NOT NULL,
    "clientMessageId" TEXT,
    "messageClass" "MessageClass" NOT NULL DEFAULT 'GENERAL',
    "status" "MessageDeliveryStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "mediationState" "MediationState" NOT NULL DEFAULT 'NOT_REVIEWED',
    "visibleToUserId" TEXT,
    "cardType" TEXT,
    "cardPayload" JSONB,
    "relatedType" TEXT,
    "relatedId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveredAt" TIMESTAMP(3),

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "messages_conversationId_clientMessageId_key" ON "messages"("conversationId", "clientMessageId");
CREATE INDEX IF NOT EXISTS "messages_conversationId_createdAt_idx" ON "messages"("conversationId", "createdAt");
CREATE INDEX IF NOT EXISTS "messages_senderId_idx" ON "messages"("senderId");

CREATE TABLE IF NOT EXISTS "message_attachments" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_attachments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "message_attachments_messageId_idx" ON "message_attachments"("messageId");
CREATE INDEX IF NOT EXISTS "message_attachments_fileId_idx" ON "message_attachments"("fileId");

CREATE TABLE IF NOT EXISTS "mediation_results" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "classification" "MessageClass" NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "summaryForRecipient" TEXT NOT NULL,
    "structuredPayload" JSONB,
    "proposedAction" "ProposedAction" NOT NULL DEFAULT 'RELAY',
    "requiresSenderConfirmation" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "model" TEXT,
    "promptVersion" TEXT,
    "validatorResults" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mediation_results_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "mediation_results_messageId_key" ON "mediation_results"("messageId");

-- 3. Create Project Shared Context Tables (Files, Tasks, Meetings, Decisions)
CREATE TABLE IF NOT EXISTS "project_files" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "category" "ProjectFileCategory" NOT NULL DEFAULT 'REFERENCE',
    "name" TEXT NOT NULL,
    "versionGroupId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL DEFAULT 1,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_files_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "project_files_projectId_category_idx" ON "project_files"("projectId", "category");
CREATE INDEX IF NOT EXISTS "project_files_versionGroupId_versionNumber_idx" ON "project_files"("versionGroupId", "versionNumber");

CREATE TABLE IF NOT EXISTS "workspace_tasks" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "milestoneId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "WorkspaceTaskStatus" NOT NULL DEFAULT 'TODO',
    "dueDate" TIMESTAMP(3),
    "visibility" "TaskVisibility" NOT NULL DEFAULT 'PRIVATE',
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "workspace_tasks_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "workspace_tasks_projectId_visibility_idx" ON "workspace_tasks"("projectId", "visibility");

CREATE TABLE IF NOT EXISTS "meetings" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "proposedBy" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "joinUrl" TEXT,
    "status" "MeetingStatus" NOT NULL DEFAULT 'PROPOSED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "meetings_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "meetings_projectId_startsAt_idx" ON "meetings"("projectId", "startsAt");

CREATE TABLE IF NOT EXISTS "meeting_responses" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "response" TEXT NOT NULL,
    "respondedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "meeting_responses_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "meeting_responses_meetingId_userId_key" ON "meeting_responses"("meetingId", "userId");

CREATE TABLE IF NOT EXISTS "project_decisions" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "kind" "DecisionKind" NOT NULL DEFAULT 'PROJECT_NOTE',
    "binding" BOOLEAN NOT NULL DEFAULT false,
    "sourceType" TEXT NOT NULL DEFAULT 'MANUAL_NOTE',
    "sourceRefId" TEXT,
    "agreementVersionId" TEXT,
    "recordedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_decisions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "project_decisions_projectId_kind_idx" ON "project_decisions"("projectId", "kind");

-- 4. Create Isolated Private AI Workspace Tables
CREATE TABLE IF NOT EXISTS "ai_chats" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "projectId" TEXT,
    "title" TEXT NOT NULL DEFAULT 'New chat',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_chats_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ai_chats_ownerId_updatedAt_idx" ON "ai_chats"("ownerId", "updatedAt");

CREATE TABLE IF NOT EXISTS "ai_chat_messages" (
    "id" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_chat_messages_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ai_chat_messages_chatId_createdAt_idx" ON "ai_chat_messages"("chatId", "createdAt");

CREATE TABLE IF NOT EXISTS "ai_drafts" (
    "id" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "targetConversationId" TEXT,
    "body" TEXT NOT NULL,
    "status" "AIDraftStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_drafts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ai_drafts_chatId_ownerId_idx" ON "ai_drafts"("chatId", "ownerId");

CREATE TABLE IF NOT EXISTS "ai_calls" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "promptVersion" TEXT NOT NULL,
    "inputRecordRefs" JSONB NOT NULL DEFAULT '[]',
    "tokensIn" INTEGER NOT NULL DEFAULT 0,
    "tokensOut" INTEGER NOT NULL DEFAULT 0,
    "latencyMs" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'SUCCESS',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_calls_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ai_calls_userId_purpose_idx" ON "ai_calls"("userId", "purpose");

-- 5. Foreign Key Constraints
DO $$ BEGIN
    ALTER TABLE "conversations" ADD CONSTRAINT "conversations_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    ALTER TABLE "conversation_participants" ADD CONSTRAINT "conversation_participants_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    ALTER TABLE "conversation_participants" ADD CONSTRAINT "conversation_participants_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    ALTER TABLE "messages" ADD CONSTRAINT "messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    ALTER TABLE "messages" ADD CONSTRAINT "messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    ALTER TABLE "message_attachments" ADD CONSTRAINT "message_attachments_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    ALTER TABLE "message_attachments" ADD CONSTRAINT "message_attachments_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "File"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    ALTER TABLE "mediation_results" ADD CONSTRAINT "mediation_results_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    ALTER TABLE "project_files" ADD CONSTRAINT "project_files_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    ALTER TABLE "project_files" ADD CONSTRAINT "project_files_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "File"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    ALTER TABLE "project_files" ADD CONSTRAINT "project_files_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    ALTER TABLE "workspace_tasks" ADD CONSTRAINT "workspace_tasks_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    ALTER TABLE "workspace_tasks" ADD CONSTRAINT "workspace_tasks_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    ALTER TABLE "meetings" ADD CONSTRAINT "meetings_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    ALTER TABLE "meetings" ADD CONSTRAINT "meetings_proposedBy_fkey" FOREIGN KEY ("proposedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    ALTER TABLE "meeting_responses" ADD CONSTRAINT "meeting_responses_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "meetings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    ALTER TABLE "meeting_responses" ADD CONSTRAINT "meeting_responses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    ALTER TABLE "project_decisions" ADD CONSTRAINT "project_decisions_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    ALTER TABLE "ai_chats" ADD CONSTRAINT "ai_chats_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    ALTER TABLE "ai_chat_messages" ADD CONSTRAINT "ai_chat_messages_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "ai_chats"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    ALTER TABLE "ai_drafts" ADD CONSTRAINT "ai_drafts_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "ai_chats"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    ALTER TABLE "ai_calls" ADD CONSTRAINT "ai_calls_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
