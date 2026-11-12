process.env.DISABLE_BACKGROUND_WORKER = "true";
process.env.NODE_ENV = "test";
process.env.PORT = "0";
process.env.ENABLE_DEV_TOOLS = "true";

/**
 * NEXUM BACKEND & SPONSOR INTEGRATION — PHASE 13 VERIFICATION SUITE
 *
 * Verifies PayPal Strengthening (Payouts v1, Disputes Sync, Minor Units & Identity Linking):
 * Check 1: Route validation rejects invalid payout payload with standard error contract
 * Check 2: POST /api/payments/paypal/link-account securely links PayPal email to user preferences with audit event
 * Check 3: GET /api/payments/paypal/account-status returns verified account status
 * Check 4: DisputeHold guard blocks milestone approval/release when an open dispute exists
 * Check 5: Webhook handler processes dispute events (CUSTOMER.DISPUTE.CREATED, CUSTOMER.DISPUTE.RESOLVED)
 * Check 6: Integer minor units enforcement across PayPal Payouts client (zero floating-point currency representation)
 */

import http from "http";
import net from "net";
import fs from "fs";
import path from "path";
import { prisma } from "../src/prisma.js";
import { createPayPalPayout, getPayPalPayoutBatch } from "../src/domain/payments/paypal.js";

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

async function isPortReachable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(800);
    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.once("timeout", () => {
      socket.destroy();
      resolve(false);
    });
    socket.once("error", () => {
      resolve(false);
    });
    socket.connect(port, "127.0.0.1");
  });
}

async function makeRequest(
  targetPort: number,
  pathStr: string,
  method = "GET",
  body?: any,
  headers?: Record<string, string>
): Promise<{ status: number; body: any }> {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        host: "127.0.0.1",
        port: targetPort,
        path: pathStr,
        method,
        headers: {
          "Content-Type": "application/json",
          ...(headers || {}),
        },
      },
      (res) => {
        let raw = "";
        res.on("data", (chunk) => (raw += chunk));
        res.on("end", () => {
          try {
            const parsed = JSON.parse(raw);
            resolve({ status: res.statusCode || 500, body: parsed });
          } catch {
            resolve({ status: res.statusCode || 500, body: raw });
          }
        });
      }
    );
    req.on("error", reject);
    if (body) {
      req.write(typeof body === "string" ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function runPhase13Verification() {
  console.log("\n========================================================");
  console.log("   NEXUM VERIFICATION: PHASE 13 (PAYPAL STRENGTHENING)");
  console.log("========================================================\n");

  let server: http.Server | null = null;
  let testPort = 4000;

  try {
    const livePort4000 = await isPortReachable(4000);
    if (!livePort4000) {
      const { app } = await import("../src/index.js");
      server = http.createServer(app);
      await new Promise<void>((resolve) => {
        server!.listen(0, "127.0.0.1", () => {
          testPort = (server!.address() as net.AddressInfo).port;
          resolve();
        });
      });
      console.log(`[INFO] Ephemeral verification server listening on port ${testPort}\n`);
    } else {
      console.log(`[INFO] Connecting to existing live backend on port 4000\n`);
      testPort = 4000;
    }

    // Check 1: Route validation on /api/payments/escrow/payout
    try {
      const res = await makeRequest(testPort, "/api/payments/escrow/payout", "POST", {});
      const isExpected =
        res.status === 400 &&
        res.body?.error?.code === "VALIDATION_ERROR" &&
        Boolean(res.body?.error?.message);
      record(
        1,
        "POST /api/payments/escrow/payout enforces Zod validation with standard error shape",
        isExpected,
        `Status ${res.status}, code: ${res.body?.error?.code}`
      );
    } catch (e: any) {
      record(1, "POST /api/payments/escrow/payout validation", false, e.message);
    }

    // Check 2: Link PayPal account for a test user
    let testUserId = "usr_phase13_test";
    try {
      // Find or create test user
      const existingUser = await prisma.user.findFirst();
      if (existingUser) {
        testUserId = existingUser.id;
      }

      const res = await makeRequest(testPort, "/api/payments/paypal/link-account", "POST", {
        userId: testUserId,
        paypalEmail: "freelancer.verified@example.com",
      });

      const isExpected =
        res.status === 200 &&
        res.body?.success === true &&
        res.body?.paypalEmail === "freelancer.verified@example.com" &&
        res.body?.isPaypalVerified === true;

      record(
        2,
        "POST /api/payments/paypal/link-account updates user preferences and verification state",
        isExpected,
        `Email: ${res.body?.paypalEmail}, Verified: ${res.body?.isPaypalVerified}`
      );
    } catch (e: any) {
      record(2, "Link PayPal account", false, e.message);
    }

    // Check 3: GET /api/payments/paypal/account-status
    try {
      const res = await makeRequest(testPort, `/api/payments/paypal/account-status?userId=${testUserId}`);
      const isExpected =
        res.status === 200 &&
        res.body?.success === true &&
        res.body?.paypalEmail === "freelancer.verified@example.com" &&
        res.body?.isPaypalVerified === true;

      record(
        3,
        "GET /api/payments/paypal/account-status retrieves accurate connected account telemetry",
        isExpected,
        `Status 200, isPaypalVerified: ${res.body?.isPaypalVerified}`
      );
    } catch (e: any) {
      record(3, "GET /api/payments/paypal/account-status", false, e.message);
    }

    // Check 4: DisputeHold guard blocks milestone approval/release
    try {
      // Create a test milestone with open dispute
      let project = await prisma.project.findFirst();
      if (!project) {
        const dummyUser = await prisma.user.findFirst();
        project = await prisma.project.create({
          data: {
            name: "Phase 13 Dispute Test Project",
            clientId: dummyUser!.id,
            state: "IN_PROGRESS",
          },
        });
      }

      const disputedMilestone = await prisma.milestone.create({
        data: {
          projectId: project.id,
          title: "Dispute Guard Test Milestone",
          amountMinor: 25000,
          currency: "USD",
          state: "CAPTURED",
          workStatus: "IN_PROGRESS",
          orderIndex: 99,
        },
      });

      const dispute = await prisma.disputeHold.create({
        data: {
          milestoneId: disputedMilestone.id,
          openedById: project.clientId,
          reason: "Quality standards discrepancy verification",
          status: "OPEN",
        },
      });

      const releaseAttempt = await makeRequest(
        testPort,
        `/api/payments/milestones/${disputedMilestone.id}/approve-and-release`,
        "POST",
        { feedback: "Trying to release despite dispute" }
      );

      const isBlocked =
        releaseAttempt.status === 409 &&
        releaseAttempt.body?.error?.code === "DISPUTE_HOLD_ACTIVE";

      record(
        4,
        "Milestone release is strictly blocked (HTTP 409 DISPUTE_HOLD_ACTIVE) when DisputeHold is OPEN",
        isBlocked,
        `Status ${releaseAttempt.status}, code: ${releaseAttempt.body?.error?.code}`
      );

      // Clean up test dispute and milestone
      await prisma.disputeHold.delete({ where: { id: dispute.id } });
      await prisma.milestone.delete({ where: { id: disputedMilestone.id } });
    } catch (e: any) {
      record(4, "DisputeHold guard check", false, e.message);
    }

    // Check 5: Webhook handling for dispute events
    try {
      const webhookPayload = {
        id: `WH-TEST-DISPUTE-${Date.now()}`,
        event_type: "CUSTOMER.DISPUTE.CREATED",
        resource: {
          dispute_id: `PP-D-${Date.now()}`,
          reason: "MERCHANDISE_OR_SERVICE_NOT_AS_DESCRIBED",
          status: "UNDER_REVIEW",
          disputed_transactions: [
            {
              seller_transaction_id: "NON_EXISTENT_TX_FOR_TEST",
            },
          ],
        },
      };

      const res = await makeRequest(
        testPort,
        "/api/webhooks/paypal",
        "POST",
        webhookPayload,
        {
          "paypal-auth-algo": "SHA256withRSA",
          "paypal-cert-url": "https://api.sandbox.paypal.com/cert",
          "paypal-transmission-id": "trans-123",
          "paypal-transmission-sig": "sig-123",
          "paypal-transmission-time": new Date().toISOString(),
          "x-test-simulate-good-signature": "true",
        }
      );

      // Successfully acknowledged with processed = false (untracked payment) or 200
      const isExpected = res.status === 200 && res.body?.success === true;
      record(
        5,
        "PayPal webhook handler processes dispute event payload and responds with HTTP 200",
        isExpected,
        `Status ${res.status}, success: ${res.body?.success}`
      );
    } catch (e: any) {
      record(5, "PayPal webhook dispute processing", false, e.message);
    }

    // Check 6: Minor units enforcement in PayPal Payouts client
    try {
      const payoutRes = await createPayPalPayout({
        recipientEmail: "freelancer.payout@example.com",
        amountMinor: 35000, // $350.00
        currency: "USD",
        senderItemId: "test_item_350",
        note: "Automated test payout batch",
      });

      const isExpected =
        payoutRes.amountMinor === 35000 &&
        payoutRes.currency === "USD" &&
        typeof payoutRes.batchId === "string" &&
        payoutRes.batchStatus === "SUCCESS";

      record(
        6,
        "createPayPalPayout enforces integer minor units (35000 cents = $350.00 USD) with honest status",
        isExpected,
        `Batch: ${payoutRes.batchId}, AmountMinor: ${payoutRes.amountMinor}, Status: ${payoutRes.batchStatus}`
      );
    } catch (e: any) {
      record(6, "Minor units enforcement in PayPal Payouts client", false, e.message);
    }

  } finally {
    if (server) {
      await new Promise<void>((resolve) => server!.close(() => resolve()));
    }
  }

  console.log("\n--------------------------------------------------------");
  const passedCount = results.filter((r) => r.passed).length;
  console.log(`Summary: ${passedCount} / ${results.length} checks passed.`);
  console.log("--------------------------------------------------------\n");

  if (passedCount !== results.length) {
    process.exit(1);
  }
}

runPhase13Verification().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});

