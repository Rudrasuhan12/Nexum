process.env.DISABLE_BACKGROUND_WORKER = "true";
process.env.NODE_ENV = "test";
process.env.ENABLE_DEV_TOOLS = "true";

/**
 * NEXUM FREELANCER BACKEND — PHASE 7 COMPREHENSIVE VERIFICATION SUITE
 *
 * Implements all 30 checks specified in the Freelancer Backend Build Guide:
 *
 * Check 1:  Startup refusal: refuse to run with live PayPal URL unless production
 * Check 2:  PayPal Orders v2 Client: create order returns CREATED status and checkout links
 * Check 3:  PayPal Orders v2 Client: capture order completes and returns captureId
 * Check 4:  PayPal token caching: idempotent token retrieval without duplicate requests
 * Check 5:  Funding gate: starting unfunded milestone returns 409 PAYMENT_NOT_FUNDED
 * Check 6:  Funding gate: starting CAPTURED funded milestone succeeds with 200
 * Check 7:  DB trigger immutability: direct SQL UPDATE on ledger_entries is blocked
 * Check 8:  DB trigger immutability: direct SQL DELETE on ledger_entries is blocked
 * Check 9:  DB trigger immutability: direct SQL UPDATE on payment_events is blocked
 * Check 10: DB trigger immutability: direct SQL DELETE on payment_events is blocked
 * Check 11: Append-only ledger: RELEASED entry created on milestone acceptance
 * Check 12: Append-only ledger idempotency: repeating accept does not duplicate RELEASED entry
 * Check 13: Append-only ledger: HOLD entry created when dispute opened on accepted milestone
 * Check 14: Append-only ledger: PAYOUT_SIMULATED entry created on simulated payout
 * Check 15: State machine: valid transitions CREATED -> APPROVED -> CAPTURED succeed
 * Check 16: State machine: illegal transition CREATED -> CAPTURED throws ConflictError
 * Check 17: Honest labels: CREATED maps to "Not funded"
 * Check 18: Honest labels: APPROVED maps to "Funding in progress"
 * Check 19: Honest labels: CAPTURED + IN_PROGRESS maps to "Funded"
 * Check 20: Honest labels: CAPTURED + ACCEPTED maps to "Available"
 * Check 21: Honest labels: dispute / NEEDS_SUPPORT maps to "On hold"
 * Check 22: Honest labels: UNKNOWN maps to "Checking"
 * Check 23: Webhooks: bad signature returns 400 and preserves payment state
 * Check 24: Webhooks: valid signature CHECKOUT.ORDER.APPROVED transitions payment to APPROVED
 * Check 25: Webhooks: valid signature PAYMENT.CAPTURE.COMPLETED transitions payment to CAPTURED
 * Check 26: Webhook deduplication: replayed paypalEventId returns 200 deduplicated
 * Check 27: Evidence packet determinism: identical SHA-256 regardless of JSON key order
 * Check 28: Evidence packet retrieval: GET /payments/:id/evidence returns verified payload and hash
 * Check 29: Payout balance validation: requesting payout exceeding available returns 409 INSUFFICIENT_FUNDS
 * Check 30: Reconcile worker: reconciles stale UNKNOWN payment to PayPal status and records audit log
 */

import http from "http";
import net from "net";
import crypto from "crypto";
import { app } from "../src/index.js";
import { prisma } from "../src/prisma.js";
import { createSession } from "../src/lib/auth.js";
import {
  Role,
  ProjectState,
  MilestoneWorkStatus,
  AgreementStatus,
  LedgerEntryKind,
  PaymentState,
  PaymentEventSource,
} from "@prisma/client";
import { getPayPalBaseUrl, createPayPalOrder, capturePayPalOrder, getPayPalAccessToken } from "../src/domain/payments/paypal.js";
import { validatePaymentTransition, getEarningsLabel } from "../src/domain/payments/state.js";
import { buildEvidencePacket, computeSha256 } from "../src/domain/payments/evidence.js";
import { reconcileStalePayments } from "../src/jobs/reconcileWorker.js";

interface CheckResult {
  num: number;
  name: string;
  passed: boolean;
  details?: string;
}

const results: CheckResult[] = [];

function record(num: number, name: string, passed: boolean, details?: string) {
  results.push({ num, name, passed, details });
  const icon = passed ? "✅ PASS" : "❌ FAIL";
  console.log(`${icon} — [Check ${num}] ${name}${details ? ` (${details})` : ""}`);
}

async function run() {
  console.log("\n=======================================================");
  console.log("   NEXUM FREELANCER BACKEND — PHASE 7 VERIFICATION");
  console.log("=======================================================\n");

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const port = (server.address() as net.AddressInfo).port;
  const baseUrl = `http://127.0.0.1:${port}`;

  const timestamp = Date.now();
  let freelancerId = "";
  let clientId = "";
  let tokenFreelancer = "";
  let tokenClient = "";

  let testProjectId = "";
  let testAgreementId = "";
  let milestone1Id = "";
  let milestone2Id = "";

  try {
    const dummyReq = {
      headers: { "user-agent": "Phase7Verify" },
      ip: "127.0.0.1",
      socket: { remoteAddress: "127.0.0.1" },
    } as any;

    // 1. Seed Freelancer
    const freelancer = await prisma.user.create({
      data: {
        email: `phase7_freelancer_${timestamp}@test.nexum`,
        name: "Elena Rostova Phase7",
        role: Role.FREELANCER,
        status: "ACTIVE",
        timezone: "America/New_York",
        freelancerProfile: {
          create: {
            title: "Senior Full-Stack Architect",
            skills: ["TypeScript", "PayPal API", "PostgreSQL"],
            timezone: "America/New_York",
            onboardingStatus: "COMPLETE",
          },
        },
      },
    });
    freelancerId = freelancer.id;
    const sessionF = await createSession(freelancer.id, dummyReq);
    tokenFreelancer = sessionF.rawToken;

    // 2. Seed Client
    const client = await prisma.user.create({
      data: {
        email: `phase7_client_${timestamp}@test.nexum`,
        name: "David Sterling Phase7",
        role: Role.CLIENT,
        status: "ACTIVE",
        timezone: "America/New_York",
      },
    });
    clientId = client.id;
    const sessionC = await createSession(client.id, dummyReq);
    tokenClient = sessionC.rawToken;

    // 3. Seed Project & Agreement with requireFunding: true
    const project = await prisma.project.create({
      data: {
        clientId,
        title: `Phase 7 Payment Test Project ${timestamp}`,
        description: "Testing PayPal Sandbox integration, append-only ledger and evidence packets.",
        state: ProjectState.IN_PROGRESS,
        requireFunding: true,
      },
    });
    testProjectId = project.id;

    const agreement = await prisma.agreement.create({
      data: {
        projectId: project.id,
        clientId,
        freelancerId,
        status: AgreementStatus.ACTIVE,
      },
    });
    testAgreementId = agreement.id;

    // 4. Seed Milestone 1 (starts unfunded)
    const m1 = await prisma.milestone.create({
      data: {
        agreementId: agreement.id,
        projectId: project.id,
        milestoneKey: "M1",
        orderIndex: 0,
        sequence: 1,
        title: "Architecture & Infrastructure Design",
        amountMinor: 50000, // $500.00
        currency: "USD",
        workStatus: MilestoneWorkStatus.UPCOMING,
      },
    });
    milestone1Id = m1.id;

    // 5. Seed Milestone 2
    const m2 = await prisma.milestone.create({
      data: {
        agreementId: agreement.id,
        projectId: project.id,
        milestoneKey: "M2",
        orderIndex: 1,
        sequence: 2,
        title: "PayPal Integration & Ledger Storage",
        amountMinor: 75000, // $750.00
        currency: "USD",
        workStatus: MilestoneWorkStatus.UPCOMING,
      },
    });
    milestone2Id = m2.id;

    // -------------------------------------------------------------
    // Check 1: Refusal of live PayPal URL in non-production
    // -------------------------------------------------------------
    try {
      const origUrl = process.env.PAYPAL_BASE_URL;
      const origEnv = process.env.NODE_ENV;
      process.env.PAYPAL_BASE_URL = "https://api-m.paypal.com";
      process.env.NODE_ENV = "development";

      let threw = false;
      try {
        getPayPalBaseUrl();
      } catch (err: any) {
        threw = err.message.includes("CRITICAL SECURITY VIOLATION");
      } finally {
        if (origUrl !== undefined) process.env.PAYPAL_BASE_URL = origUrl;
        else delete process.env.PAYPAL_BASE_URL;
        if (origEnv !== undefined) process.env.NODE_ENV = origEnv;
        else delete process.env.NODE_ENV;
      }
      record(1, "Startup refuses live PAYPAL_BASE_URL when NODE_ENV !== production", threw);
    } catch (err: any) {
      record(1, "Startup refuses live PAYPAL_BASE_URL when NODE_ENV !== production", false, err.message);
    }

    // -------------------------------------------------------------
    // Check 2: PayPal Orders v2 Client: createOrder
    // -------------------------------------------------------------
    let createdOrder: any = null;
    try {
      createdOrder = await createPayPalOrder({
        amountMinor: 50000,
        currency: "USD",
        referenceId: milestone1Id,
        requestId: crypto.randomUUID(),
        description: "Milestone 1 payment",
      });
      const valid = Boolean(createdOrder.orderId && createdOrder.status === "CREATED" && createdOrder.links?.length > 0);
      record(2, "PayPal Orders v2 Client: createOrder returns status CREATED with approve links", valid);
    } catch (err: any) {
      record(2, "PayPal Orders v2 Client: createOrder returns status CREATED with approve links", false, err.message);
    }

    // -------------------------------------------------------------
    // Check 3: PayPal Orders v2 Client: captureOrder
    // -------------------------------------------------------------
    try {
      const captured = await capturePayPalOrder(createdOrder.orderId, crypto.randomUUID());
      const valid = Boolean(captured.captureId && (captured.status === "COMPLETED" || captured.status === "CAPTURED"));
      record(3, "PayPal Orders v2 Client: captureOrder returns captureId and status COMPLETED", valid);
    } catch (err: any) {
      record(3, "PayPal Orders v2 Client: captureOrder returns captureId and status COMPLETED", false, err.message);
    }

    // -------------------------------------------------------------
    // Check 4: PayPal token caching
    // -------------------------------------------------------------
    try {
      const token1 = await getPayPalAccessToken();
      const token2 = await getPayPalAccessToken();
      record(4, "PayPal token caching: subsequent calls reuse cached token without round-trip", token1 === token2 && token1.length > 0);
    } catch (err: any) {
      record(4, "PayPal token caching: subsequent calls reuse cached token without round-trip", false, err.message);
    }

    // -------------------------------------------------------------
    // Check 5: Milestone Funding Gate: Unfunded milestone start -> 409
    // -------------------------------------------------------------
    try {
      const res = await fetch(`${baseUrl}/api/freelancer/milestones/${milestone1Id}/start`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${tokenFreelancer}`, Cookie: `nexum_session=${tokenFreelancer}`,
          "Content-Type": "application/json",
        },
      });
      const json = await res.json();
      const blocked = res.status === 409 && json.error?.code === "PAYMENT_NOT_FUNDED";
      record(5, "Milestone Funding Gate: starting unfunded milestone returns 409 PAYMENT_NOT_FUNDED", blocked);
    } catch (err: any) {
      record(5, "Milestone Funding Gate: starting unfunded milestone returns 409 PAYMENT_NOT_FUNDED", false, err.message);
    }

    // -------------------------------------------------------------
    // Check 6: Milestone Funding Gate: Starting after CAPTURED -> 200
    // -------------------------------------------------------------
    let payment1Id = "";
    try {
      // Create dev order and capture for milestone1
      const orderRes = await fetch(`${baseUrl}/api/dev/payments/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ milestoneId: milestone1Id }),
      });
      const orderJson = await orderRes.json();
      payment1Id = orderJson.payment.id;

      const capRes = await fetch(`${baseUrl}/api/dev/payments/capture`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId: payment1Id }),
      });
      const capJson = await capRes.json();

      // Now attempt start
      const startRes = await fetch(`${baseUrl}/api/freelancer/milestones/${milestone1Id}/start`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${tokenFreelancer}`, Cookie: `nexum_session=${tokenFreelancer}`,
          "Content-Type": "application/json",
        },
      });
      const startJson = await startRes.json();
      const passed = startRes.status === 200 && startJson.milestone?.workStatus === MilestoneWorkStatus.IN_PROGRESS;
      record(6, "Milestone Funding Gate: starting milestone after payment CAPTURED succeeds", passed);
    } catch (err: any) {
      record(6, "Milestone Funding Gate: starting milestone after payment CAPTURED succeeds", false, err.message);
    }

    // -------------------------------------------------------------
    // Check 7: Trigger: direct SQL UPDATE on ledger_entries throws
    // -------------------------------------------------------------
    try {
      // First create a ledger entry to test immutability
      const entry = await prisma.ledgerEntry.create({
        data: {
          userId: freelancerId,
          projectId: testProjectId,
          milestoneId: milestone1Id,
          kind: LedgerEntryKind.FUNDED,
          amountMinor: 50000,
          currency: "USD",
          paymentId: payment1Id,
        },
      });

      let updateBlocked = false;
      try {
        await prisma.$executeRawUnsafe(
          `UPDATE ledger_entries SET "amountMinor" = 99999 WHERE id = '${entry.id}'`
        );
      } catch (err: any) {
        updateBlocked = /append-only/i.test(err.message);
      }
      record(7, "DB trigger immutability: direct SQL UPDATE on ledger_entries is blocked", updateBlocked);
    } catch (err: any) {
      record(7, "DB trigger immutability: direct SQL UPDATE on ledger_entries is blocked", false, err.message);
    }

    // -------------------------------------------------------------
    // Check 8: Trigger: direct SQL DELETE on ledger_entries throws
    // -------------------------------------------------------------
    try {
      const entry = await prisma.ledgerEntry.findFirst({
        where: { userId: freelancerId },
      });

      let deleteBlocked = false;
      try {
        await prisma.$executeRawUnsafe(
          `DELETE FROM ledger_entries WHERE id = '${entry?.id}'`
        );
      } catch (err: any) {
        deleteBlocked = /append-only/i.test(err.message);
      }
      record(8, "DB trigger immutability: direct SQL DELETE on ledger_entries is blocked", deleteBlocked);
    } catch (err: any) {
      record(8, "DB trigger immutability: direct SQL DELETE on ledger_entries is blocked", false, err.message);
    }

    // -------------------------------------------------------------
    // Check 9: Trigger: direct SQL UPDATE on payment_events throws
    // -------------------------------------------------------------
    try {
      const pe = await prisma.paymentEvent.findFirst({
        where: { paymentId: payment1Id },
      });

      let updateBlocked = false;
      try {
        await prisma.$executeRawUnsafe(
          `UPDATE payment_events SET "verified" = false WHERE id = '${pe?.id}'`
        );
      } catch (err: any) {
        updateBlocked = /append-only/i.test(err.message);
      }
      record(9, "DB trigger immutability: direct SQL UPDATE on payment_events is blocked", updateBlocked);
    } catch (err: any) {
      record(9, "DB trigger immutability: direct SQL UPDATE on payment_events is blocked", false, err.message);
    }

    // -------------------------------------------------------------
    // Check 10: Trigger: direct SQL DELETE on payment_events throws
    // -------------------------------------------------------------
    try {
      const pe = await prisma.paymentEvent.findFirst({
        where: { paymentId: payment1Id },
      });

      let deleteBlocked = false;
      try {
        await prisma.$executeRawUnsafe(
          `DELETE FROM payment_events WHERE id = '${pe?.id}'`
        );
      } catch (err: any) {
        deleteBlocked = /append-only/i.test(err.message);
      }
      record(10, "DB trigger immutability: direct SQL DELETE on payment_events is blocked", deleteBlocked);
    } catch (err: any) {
      record(10, "DB trigger immutability: direct SQL DELETE on payment_events is blocked", false, err.message);
    }

    // -------------------------------------------------------------
    // Check 11: Append-Only Ledger: RELEASED entry on milestone acceptance
    // -------------------------------------------------------------
    try {
      // Freelancer submits milestone 1
      const subRes = await fetch(`${baseUrl}/api/freelancer/milestones/${milestone1Id}/submissions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${tokenFreelancer}`,
          Cookie: `nexum_session=${tokenFreelancer}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          completionNote: "Finished milestone 1 deliverables and verified tests.",
          links: [{ label: "GitHub Repository", url: "https://github.com/nexum/proof" }],
        }),
      });

      // Dev client accepts milestone 1
      const acceptRes = await fetch(`${baseUrl}/api/dev/milestones/${milestone1Id}/client`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "accept", feedback: "Excellent architecture document" }),
      });
      const acceptJson = await acceptRes.json();

      const releaseEntry = await prisma.ledgerEntry.findFirst({
        where: {
          milestoneId: milestone1Id,
          kind: LedgerEntryKind.RELEASED,
        },
      });

      const passed = Boolean(releaseEntry && releaseEntry.amountMinor === 50000);
      record(11, "Append-only ledger: RELEASED entry created on milestone acceptance", passed);
    } catch (err: any) {
      record(11, "Append-only ledger: RELEASED entry created on milestone acceptance", false, err.message);
    }

    // -------------------------------------------------------------
    // Check 12: Append-Only Ledger Idempotency: repeating accept
    // -------------------------------------------------------------
    try {
      const countBefore = await prisma.ledgerEntry.count({
        where: { milestoneId: milestone1Id, kind: LedgerEntryKind.RELEASED },
      });

      // Attempt accept again
      await fetch(`${baseUrl}/api/dev/milestones/${milestone1Id}/client`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "accept", feedback: "Repeated accept call" }),
      });

      const countAfter = await prisma.ledgerEntry.count({
        where: { milestoneId: milestone1Id, kind: LedgerEntryKind.RELEASED },
      });

      record(12, "Append-only ledger idempotency: repeating accept does not duplicate RELEASED entry", countBefore === 1 && countAfter === 1);
    } catch (err: any) {
      record(12, "Append-only ledger idempotency: repeating accept does not duplicate RELEASED entry", false, err.message);
    }

    // -------------------------------------------------------------
    // Check 13: Append-Only Ledger: HOLD entry on dispute
    // -------------------------------------------------------------
    try {
      // Open dispute on milestone 2 after funding
      const order2 = await fetch(`${baseUrl}/api/dev/payments/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ milestoneId: milestone2Id }),
      });
      const order2Json = await order2.json();

      await fetch(`${baseUrl}/api/dev/payments/capture`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId: order2Json.payment.id }),
      });

      // Start milestone 2 into IN_PROGRESS so it is active
      await fetch(`${baseUrl}/api/freelancer/milestones/${milestone2Id}/start`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${tokenFreelancer}`,
          Cookie: `nexum_session=${tokenFreelancer}`,
          "Content-Type": "application/json",
        },
      });

      // Client opens dispute on milestone 2
      const disputeRes = await fetch(`${baseUrl}/api/dev/milestones/${milestone2Id}/client`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "dispute", reason: "Scope deliverable disagreement" }),
      });

      const holdEntry = await prisma.ledgerEntry.findFirst({
        where: { milestoneId: milestone2Id, kind: LedgerEntryKind.HOLD },
      });

      record(13, "Append-only ledger: HOLD entry created when dispute opened on funded milestone", Boolean(holdEntry));
    } catch (err: any) {
      record(13, "Append-only ledger: HOLD entry created when dispute opened on funded milestone", false, err.message);
    }

    // -------------------------------------------------------------
    // Check 14: Append-Only Ledger: PAYOUT_SIMULATED on simulated payout
    // -------------------------------------------------------------
    try {
      // Register payout account first
      await fetch(`${baseUrl}/api/freelancer/payout-account`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${tokenFreelancer}`, Cookie: `nexum_session=${tokenFreelancer}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          label: "Elena Bank Account",
          accountEmail: "elena.freelancer@test.nexum",
          last4: "9876",
        }),
      });

      // Milestone 1 released 50000 minor units. Request payout of 20000 minor units.
      const payoutRes = await fetch(`${baseUrl}/api/freelancer/payouts`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${tokenFreelancer}`, Cookie: `nexum_session=${tokenFreelancer}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amountMinor: 20000,
          currency: "USD",
          idempotencyKey: `payout_test_${timestamp}`,
        }),
      });
      const payoutJson = await payoutRes.json();

      const payoutLedger = await prisma.ledgerEntry.findFirst({
        where: {
          userId: freelancerId,
          kind: LedgerEntryKind.PAYOUT_SIMULATED,
          amountMinor: 20000,
        },
      });

      record(14, "Append-only ledger: PAYOUT_SIMULATED entry created on simulated payout", Boolean(payoutLedger));
    } catch (err: any) {
      record(14, "Append-only ledger: PAYOUT_SIMULATED entry created on simulated payout", false, err.message);
    }

    // -------------------------------------------------------------
    // Check 15: State Machine: Valid transitions succeed
    // -------------------------------------------------------------
    try {
      validatePaymentTransition(PaymentState.CREATED, PaymentState.APPROVED);
      validatePaymentTransition(PaymentState.APPROVED, PaymentState.CAPTURED);
      record(15, "State machine: valid transitions CREATED -> APPROVED -> CAPTURED succeed", true);
    } catch (err: any) {
      record(15, "State machine: valid transitions CREATED -> APPROVED -> CAPTURED succeed", false, err.message);
    }

    // -------------------------------------------------------------
    // Check 16: State Machine: Illegal transition throws ConflictError
    // -------------------------------------------------------------
    try {
      let threw = false;
      try {
        validatePaymentTransition(PaymentState.CREATED, PaymentState.CAPTURED);
      } catch (err: any) {
        threw = err.code === "INVALID_TRANSITION";
      }
      record(16, "State machine: illegal transition CREATED -> CAPTURED throws ConflictError", threw);
    } catch (err: any) {
      record(16, "State machine: illegal transition CREATED -> CAPTURED throws ConflictError", false, err.message);
    }

    // -------------------------------------------------------------
    // Check 17: Honest Labels: CREATED maps to "Not funded"
    // -------------------------------------------------------------
    try {
      const label = getEarningsLabel(PaymentState.CREATED);
      record(17, "Honest labels: Payment in CREATED maps to 'Not funded'", label === "Not funded");
    } catch (err: any) {
      record(17, "Honest labels: Payment in CREATED maps to 'Not funded'", false, err.message);
    }

    // -------------------------------------------------------------
    // Check 18: Honest Labels: APPROVED maps to "Funding in progress"
    // -------------------------------------------------------------
    try {
      const label = getEarningsLabel(PaymentState.APPROVED);
      record(18, "Honest labels: Payment in APPROVED maps to 'Funding in progress'", label === "Funding in progress");
    } catch (err: any) {
      record(18, "Honest labels: Payment in APPROVED maps to 'Funding in progress'", false, err.message);
    }

    // -------------------------------------------------------------
    // Check 19: Honest Labels: CAPTURED + IN_PROGRESS maps to "Funded"
    // -------------------------------------------------------------
    try {
      const label = getEarningsLabel(PaymentState.CAPTURED, "IN_PROGRESS");
      record(19, "Honest labels: Payment in CAPTURED (milestone IN_PROGRESS) maps to 'Funded'", label === "Funded");
    } catch (err: any) {
      record(19, "Honest labels: Payment in CAPTURED (milestone IN_PROGRESS) maps to 'Funded'", false, err.message);
    }

    // -------------------------------------------------------------
    // Check 20: Honest Labels: CAPTURED + ACCEPTED maps to "Available"
    // -------------------------------------------------------------
    try {
      const label = getEarningsLabel(PaymentState.CAPTURED, "ACCEPTED");
      record(20, "Honest labels: Payment in CAPTURED (milestone ACCEPTED) maps to 'Available'", label === "Available");
    } catch (err: any) {
      record(20, "Honest labels: Payment in CAPTURED (milestone ACCEPTED) maps to 'Available'", false, err.message);
    }

    // -------------------------------------------------------------
    // Check 21: Honest Labels: Dispute / NEEDS_SUPPORT maps to "On hold"
    // -------------------------------------------------------------
    try {
      const label1 = getEarningsLabel(PaymentState.CAPTURED, "IN_PROGRESS", true);
      const label2 = getEarningsLabel(PaymentState.NEEDS_SUPPORT);
      record(21, "Honest labels: Payment on HOLD / DISPUTED maps to 'On hold'", label1 === "On hold" && label2 === "On hold");
    } catch (err: any) {
      record(21, "Honest labels: Payment on HOLD / DISPUTED maps to 'On hold'", false, err.message);
    }

    // -------------------------------------------------------------
    // Check 22: Honest Labels: UNKNOWN maps to "Checking"
    // -------------------------------------------------------------
    try {
      const label = getEarningsLabel(PaymentState.UNKNOWN);
      record(22, "Honest labels: Payment in UNKNOWN maps to 'Checking'", label === "Checking");
    } catch (err: any) {
      record(22, "Honest labels: Payment in UNKNOWN maps to 'Checking'", false, err.message);
    }

    // -------------------------------------------------------------
    // Check 23: Webhook: Bad signature -> 400 & preserves state
    // -------------------------------------------------------------
    try {
      // Create a test payment in CREATED
      const mTemp = await prisma.milestone.create({
        data: {
          agreementId: testAgreementId,
          projectId: testProjectId,
          title: "Webhook Test Milestone",
          amountMinor: 25000,
          currency: "USD",
          workStatus: MilestoneWorkStatus.UPCOMING,
        },
      });

      const pTemp = await prisma.payment.create({
        data: {
          projectId: testProjectId,
          milestoneId: mTemp.id,
          paypalOrderId: `PAYPAL_TEST_ORD_${timestamp}`,
          status: PaymentState.CREATED,
          amountMinor: 25000,
          currency: "USD",
        },
      });

      const webhookRes = await fetch(`${baseUrl}/api/webhooks/paypal`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "paypal-auth-algo": "SHA256withRSA",
          "paypal-cert-url": "https://api.sandbox.paypal.com/cert",
          "paypal-transmission-id": "trans_123",
          "paypal-transmission-sig": "sig_bad",
          "paypal-transmission-time": new Date().toISOString(),
          "x-test-simulate-bad-signature": "true",
        },
        body: JSON.stringify({
          id: `WH_EVT_BAD_${timestamp}`,
          event_type: "PAYMENT.CAPTURE.COMPLETED",
          resource: {
            supplementary_data: { related_ids: { order_id: pTemp.paypalOrderId } },
          },
        }),
      });

      const paymentAfter = await prisma.payment.findUnique({
        where: { id: pTemp.id },
      });

      const passed = webhookRes.status === 400 && paymentAfter?.status === PaymentState.CREATED;
      record(23, "Webhooks: unverified webhook (bad signature) returns 400 and does NOT transition state", passed);
    } catch (err: any) {
      record(23, "Webhooks: unverified webhook (bad signature) returns 400 and does NOT transition state", false, err.message);
    }

    // -------------------------------------------------------------
    // Check 24: Webhook: CHECKOUT.ORDER.APPROVED -> APPROVED
    // -------------------------------------------------------------
    let webhookOrderId = `PAYPAL_ORD_WH_${timestamp}`;
    let webhookPaymentId = "";
    try {
      const pWh = await prisma.payment.create({
        data: {
          projectId: testProjectId,
          milestoneId: milestone1Id,
          paypalOrderId: webhookOrderId,
          status: PaymentState.CREATED,
          amountMinor: 30000,
          currency: "USD",
        },
      });
      webhookPaymentId = pWh.id;

      const whRes = await fetch(`${baseUrl}/api/webhooks/paypal`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "paypal-auth-algo": "SHA256withRSA",
          "paypal-cert-url": "https://api.sandbox.paypal.com/cert",
          "paypal-transmission-id": "trans_good_1",
          "paypal-transmission-sig": "sig_good_1",
          "paypal-transmission-time": new Date().toISOString(),
          "x-test-simulate-good-signature": "true",
        },
        body: JSON.stringify({
          id: `WH_EVT_APP_${timestamp}`,
          event_type: "CHECKOUT.ORDER.APPROVED",
          resource: {
            intent: "CAPTURE",
            id: webhookOrderId,
          },
        }),
      });

      const updated = await prisma.payment.findUnique({
        where: { id: webhookPaymentId },
      });

      record(24, "Webhooks: valid CHECKOUT.ORDER.APPROVED transitions payment to APPROVED", whRes.status === 200 && updated?.status === PaymentState.APPROVED);
    } catch (err: any) {
      record(24, "Webhooks: valid CHECKOUT.ORDER.APPROVED transitions payment to APPROVED", false, err.message);
    }

    // -------------------------------------------------------------
    // Check 25: Webhook: PAYMENT.CAPTURE.COMPLETED -> CAPTURED
    // -------------------------------------------------------------
    try {
      const whCapRes = await fetch(`${baseUrl}/api/webhooks/paypal`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "paypal-auth-algo": "SHA256withRSA",
          "paypal-cert-url": "https://api.sandbox.paypal.com/cert",
          "paypal-transmission-id": "trans_good_2",
          "paypal-transmission-sig": "sig_good_2",
          "paypal-transmission-time": new Date().toISOString(),
          "x-test-simulate-good-signature": "true",
        },
        body: JSON.stringify({
          id: `WH_EVT_CAP_${timestamp}`,
          event_type: "PAYMENT.CAPTURE.COMPLETED",
          resource: {
            id: `CAPTURE_${timestamp}`,
            supplementary_data: { related_ids: { order_id: webhookOrderId } },
          },
        }),
      });

      const updated = await prisma.payment.findUnique({
        where: { id: webhookPaymentId },
      });

      record(25, "Webhooks: valid PAYMENT.CAPTURE.COMPLETED transitions payment to CAPTURED", whCapRes.status === 200 && updated?.status === PaymentState.CAPTURED);
    } catch (err: any) {
      record(25, "Webhooks: valid PAYMENT.CAPTURE.COMPLETED transitions payment to CAPTURED", false, err.message);
    }

    // -------------------------------------------------------------
    // Check 26: Webhook Deduplication: replayed event
    // -------------------------------------------------------------
    try {
      const replayRes = await fetch(`${baseUrl}/api/webhooks/paypal`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "paypal-auth-algo": "SHA256withRSA",
          "paypal-cert-url": "https://api.sandbox.paypal.com/cert",
          "paypal-transmission-id": "trans_good_2",
          "paypal-transmission-sig": "sig_good_2",
          "paypal-transmission-time": new Date().toISOString(),
          "x-test-simulate-good-signature": "true",
        },
        body: JSON.stringify({
          id: `WH_EVT_CAP_${timestamp}`, // Same event ID as Check 25
          event_type: "PAYMENT.CAPTURE.COMPLETED",
          resource: {
            id: `CAPTURE_${timestamp}`,
            supplementary_data: { related_ids: { order_id: webhookOrderId } },
          },
        }),
      });
      const replayJson = await replayRes.json();
      record(26, "Webhook deduplication: replayed paypalEventId returns 200 deduplicated", replayRes.status === 200 && replayJson.deduplicated === true);
    } catch (err: any) {
      record(26, "Webhook deduplication: replayed paypalEventId returns 200 deduplicated", false, err.message);
    }

    // -------------------------------------------------------------
    // Check 27: Evidence Packet Determinism
    // -------------------------------------------------------------
    try {
      const packet1 = buildEvidencePacket({
        projectId: testProjectId,
        milestoneId: milestone1Id,
        milestoneKey: "M1",
        amountMinor: 50000,
        currency: "USD",
        paypalOrderId: "ORD_ABC",
        paypalCaptureId: "CAP_XYZ",
        eventTimeline: [
          { eventType: "CREATED", source: "API", receivedAt: "2026-11-01T10:00:00Z" },
          { eventType: "CAPTURED", source: "WEBHOOK", receivedAt: "2026-11-01T10:05:00Z" },
        ],
      });

      // Different key order and reversed timeline order
      const packet2 = buildEvidencePacket({
        currency: "USD",
        amountMinor: 50000,
        milestoneId: milestone1Id,
        projectId: testProjectId,
        paypalCaptureId: "CAP_XYZ",
        paypalOrderId: "ORD_ABC",
        milestoneKey: "M1",
        eventTimeline: [
          { eventType: "CAPTURED", source: "WEBHOOK", receivedAt: "2026-11-01T10:05:00Z" },
          { eventType: "CREATED", source: "API", receivedAt: "2026-11-01T10:00:00Z" },
        ],
      });

      record(27, "Evidence packet determinism: identical SHA-256 regardless of JSON key order", packet1.sha256 === packet2.sha256 && packet1.sha256.length === 64);
    } catch (err: any) {
      record(27, "Evidence packet determinism: identical SHA-256 regardless of JSON key order", false, err.message);
    }

    // -------------------------------------------------------------
    // Check 28: Evidence Packet Retrieval
    // -------------------------------------------------------------
    try {
      const evRes = await fetch(`${baseUrl}/api/freelancer/payments/${payment1Id}/evidence`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${tokenFreelancer}`, Cookie: `nexum_session=${tokenFreelancer}`,
        },
      });
      const evJson = await evRes.json();
      const verified = evRes.status === 200 && evJson.evidence?.verified === true && evJson.evidence?.sha256Hash.length === 64;
      record(28, "Evidence packet retrieval: GET /payments/:id/evidence returns verified payload and hash", verified);
    } catch (err: any) {
      record(28, "Evidence packet retrieval: GET /payments/:id/evidence returns verified payload and hash", false, err.message);
    }

    // -------------------------------------------------------------
    // Check 29: Payout Balance Validation: Exceeding available -> 409
    // -------------------------------------------------------------
    try {
      // Total released so far is 50000. Withdrawn is 20000. Available is 30000.
      // Requesting 999999 should fail.
      const overRes = await fetch(`${baseUrl}/api/freelancer/payouts`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${tokenFreelancer}`, Cookie: `nexum_session=${tokenFreelancer}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amountMinor: 999999,
          currency: "USD",
          idempotencyKey: `payout_overdraw_${timestamp}`,
        }),
      });
      const overJson = await overRes.json();
      const blocked = overRes.status === 409 && overJson.error?.code === "INSUFFICIENT_FUNDS";
      record(29, "Payout balance validation: payout exceeding available balance returns 409 INSUFFICIENT_FUNDS", blocked);
    } catch (err: any) {
      record(29, "Payout balance validation: payout exceeding available balance returns 409 INSUFFICIENT_FUNDS", false, err.message);
    }

    // -------------------------------------------------------------
    // Check 30: Reconcile Worker
    // -------------------------------------------------------------
    try {
      // Create a stale UNKNOWN payment
      const stalePayment = await prisma.payment.create({
        data: {
          projectId: testProjectId,
          milestoneId: milestone1Id,
          paypalOrderId: `PAYPAL_STALE_ORD_${timestamp}`,
          status: PaymentState.UNKNOWN,
          amountMinor: 40000,
          currency: "USD",
          updatedAt: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
        },
      });

      // Run reconcile worker
      const reconcileOutcome = await reconcileStalePayments(1000); // Check older than 1s

      const reconciledPayment = await prisma.payment.findUnique({
        where: { id: stalePayment.id },
      });

      const reconcileEvent = await prisma.paymentEvent.findFirst({
        where: {
          paymentId: stalePayment.id,
          source: PaymentEventSource.RECONCILE,
        },
      });

      const passed = Boolean(
        reconcileOutcome.reconciledCount >= 1 &&
        reconciledPayment?.status !== PaymentState.UNKNOWN &&
        reconcileEvent
      );
      record(30, "Reconcile worker: reconciles stale UNKNOWN payment to PayPal status and records audit log", passed);
    } catch (err: any) {
      record(30, "Reconcile worker: reconciles stale UNKNOWN payment to PayPal status and records audit log", false, err.message);
    }

  } finally {
    server.close();
  }

  console.log("\n=======================================================");
  const passedCount = results.filter((r) => r.passed).length;
  console.log(`PHASE 7 SUMMARY: ${passedCount} / ${results.length} PASSED`);
  console.log("=======================================================\n");

  if (passedCount !== results.length) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

run().catch((err) => {
  console.error("Verification crashed:", err);
  process.exit(1);
});
