-- Phase 7: Earnings, Payments & Evidence (PayPal Sandbox) Migration

-- 1. Create Enums if not exist
DO $$ BEGIN
    CREATE TYPE "PaymentEventSource" AS ENUM ('API', 'WEBHOOK', 'RECONCILE', 'DEV');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "LedgerEntryKind" AS ENUM ('FUNDED', 'RELEASED', 'REFUNDED', 'HOLD', 'PAYOUT_SIMULATED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "PayoutStatus" AS ENUM ('SIMULATED_PAID', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Add requireFunding flag to Project
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "requireFunding" BOOLEAN NOT NULL DEFAULT true;

-- 3. Create payments table
CREATE TABLE IF NOT EXISTS "payments" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "milestoneId" TEXT NOT NULL,
    "milestoneKey" TEXT,
    "amountMinor" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" "PaymentState" NOT NULL DEFAULT 'NOT_STARTED',
    "paypalOrderId" TEXT,
    "paypalCaptureId" TEXT,
    "requestId" TEXT NOT NULL,
    "agreementVersionHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "payments_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "payments_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "Milestone"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "payments_paypalOrderId_key" ON "payments"("paypalOrderId");
CREATE UNIQUE INDEX IF NOT EXISTS "payments_paypalCaptureId_key" ON "payments"("paypalCaptureId");
CREATE INDEX IF NOT EXISTS "payments_projectId_status_idx" ON "payments"("projectId", "status");
CREATE INDEX IF NOT EXISTS "payments_milestoneId_idx" ON "payments"("milestoneId");

-- 4. Create payment_events table (append-only)
CREATE TABLE IF NOT EXISTS "payment_events" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "source" "PaymentEventSource" NOT NULL DEFAULT 'API',
    "paypalEventId" TEXT,
    "eventType" TEXT NOT NULL,
    "rawPayload" JSONB NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_events_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "payment_events_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "payment_events_paypalEventId_key" ON "payment_events"("paypalEventId");
CREATE INDEX IF NOT EXISTS "payment_events_paymentId_idx" ON "payment_events"("paymentId");

-- 5. Create ledger_entries table (append-only)
CREATE TABLE IF NOT EXISTS "ledger_entries" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "milestoneKey" TEXT,
    "milestoneId" TEXT,
    "kind" "LedgerEntryKind" NOT NULL,
    "amountMinor" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "paymentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ledger_entries_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ledger_entries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ledger_entries_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ledger_entries_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "Milestone"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ledger_entries_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "ledger_entries_userId_kind_idx" ON "ledger_entries"("userId", "kind");
CREATE INDEX IF NOT EXISTS "ledger_entries_projectId_idx" ON "ledger_entries"("projectId");

-- 6. Create payouts table
CREATE TABLE IF NOT EXISTS "payouts" (
    "id" TEXT NOT NULL,
    "freelancerId" TEXT NOT NULL,
    "amountMinor" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" "PayoutStatus" NOT NULL DEFAULT 'SIMULATED_PAID',
    "methodLabel" TEXT NOT NULL DEFAULT 'PayPal (Demo)',
    "idempotencyKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payouts_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "payouts_freelancerId_fkey" FOREIGN KEY ("freelancerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "payouts_idempotencyKey_key" ON "payouts"("idempotencyKey");
CREATE INDEX IF NOT EXISTS "payouts_freelancerId_status_idx" ON "payouts"("freelancerId", "status");

-- 7. Create payout_accounts table
CREATE TABLE IF NOT EXISTS "payout_accounts" (
    "id" TEXT NOT NULL,
    "freelancerId" TEXT NOT NULL,
    "label" TEXT NOT NULL DEFAULT 'Personal PayPal',
    "accountEmail" TEXT NOT NULL,
    "last4" TEXT NOT NULL DEFAULT '0000',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payout_accounts_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "payout_accounts_freelancerId_fkey" FOREIGN KEY ("freelancerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "payout_accounts_freelancerId_key" ON "payout_accounts"("freelancerId");

-- 8. Create evidence_packets table
CREATE TABLE IF NOT EXISTS "evidence_packets" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "milestoneId" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "sha256" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evidence_packets_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "evidence_packets_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "evidence_packets_paymentId_key" ON "evidence_packets"("paymentId");
CREATE INDEX IF NOT EXISTS "evidence_packets_projectId_milestoneId_idx" ON "evidence_packets"("projectId", "milestoneId");

-- 9. Append-Only Triggers for ledger_entries and payment_events
CREATE OR REPLACE FUNCTION guard_ledger_entries_immutable()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Ledger entries are strictly append-only and cannot be updated or deleted';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_guard_ledger_entries_immutable ON "ledger_entries";
CREATE TRIGGER trg_guard_ledger_entries_immutable
BEFORE UPDATE OR DELETE ON "ledger_entries"
FOR EACH ROW EXECUTE FUNCTION guard_ledger_entries_immutable();

CREATE OR REPLACE FUNCTION guard_payment_events_immutable()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Payment events are strictly append-only and cannot be updated or deleted';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_guard_payment_events_immutable ON "payment_events";
CREATE TRIGGER trg_guard_payment_events_immutable
BEFORE UPDATE OR DELETE ON "payment_events"
FOR EACH ROW EXECUTE FUNCTION guard_payment_events_immutable();

