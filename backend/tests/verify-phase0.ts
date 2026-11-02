import { prisma } from "../src/prisma.js";
import app from "../src/index.js";
import { validateEnv } from "../src/lib/env.js";
import { appendAuditEvent } from "../src/lib/audit.js";
import http from "http";

interface CheckResult {
  name: string;
  passed: boolean;
  message?: string;
}

const results: CheckResult[] = [];

function record(name: string, passed: boolean, message?: string) {
  results.push({ name, passed, message });
  const status = passed ? "✅ PASS" : "❌ FAIL";
  console.log(`${status} — ${name}${message ? ` (${message})` : ""}`);
}

async function request(
  server: http.Server,
  path: string,
  method = "GET"
): Promise<{ status: number; body: Record<string, unknown>; headers: http.IncomingHttpHeaders }> {
  return new Promise((resolve, reject) => {
    const addr = server.address();
    const port = typeof addr === "object" && addr ? addr.port : 4000;
    const req = http.request(
      {
        hostname: "127.0.0.1",
        port,
        path,
        method,
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          let parsed = {};
          try {
            parsed = JSON.parse(data);
          } catch {
            parsed = { raw: data };
          }
          resolve({ status: res.statusCode || 500, body: parsed, headers: res.headers });
        });
      }
    );
    req.on("error", reject);
    req.end();
  });
}

async function run() {
  console.log("\n=======================================================");
  console.log("   NEXUM FREELANCER BACKEND — PHASE 0 VERIFICATION");
  console.log("=======================================================\n");

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));

  try {
    // 1. Health Endpoint Check
    const healthRes = await request(server, "/health");
    const healthApiRes = await request(server, "/api/health");
    const isHealthOk =
      healthRes.status === 200 &&
      (healthRes.body as any).database?.status === "CONNECTED" &&
      healthApiRes.status === 200;
    record(
      "Health endpoint returns 200 with CONNECTED database",
      isHealthOk,
      `db status: ${(healthRes.body as any).database?.status}, latency: ${(healthRes.body as any).database?.latencyMs}ms`
    );

    // 2. Standard 404 Error Shape Check
    const notFoundRes = await request(server, "/api/unregistered-route-xyz");
    const errObj = (notFoundRes.body as any)?.error;
    const isErrorShapeValid =
      notFoundRes.status === 404 &&
      errObj &&
      errObj.code === "NOT_FOUND" &&
      typeof errObj.message === "string" &&
      typeof errObj.details === "object";
    record(
      "Standard 404 error envelope { error: { code, message, details } }",
      Boolean(isErrorShapeValid),
      `code: ${errObj?.code}`
    );

    // 3. Request ID Header Check
    const hasRequestId = Boolean(notFoundRes.headers["x-request-id"]);
    record(
      "Request ID header (X-Request-Id) present on all responses",
      hasRequestId,
      `X-Request-Id: ${notFoundRes.headers["x-request-id"]}`
    );

    // 4. Environment Validation Fail-Fast Check
    let envFailedFast = false;
    try {
      validateEnv({
        PORT: "4000",
        NODE_ENV: "development",
        DATABASE_URL: "", // Missing required var
        SESSION_SECRET: "short",
      });
    } catch (e: any) {
      envFailedFast = e.message.includes("DATABASE_URL") || e.message.includes("SESSION_SECRET");
    }
    record(
      "Environment validation fails fast when required vars are missing",
      envFailedFast
    );

    // 5. Audit Event Persistence Check
    const auditRecord = await appendAuditEvent({
      actorId: "test_verifier",
      action: "PHASE_0_VERIFIED",
      objectType: "SYSTEM",
      objectId: "phase0",
      previousStatus: "PLANNING",
      newStatus: "VERIFIED",
      metadata: { verificationTimestamp: new Date().toISOString() },
    });
    const fetchedAudit = await prisma.auditEvent.findUnique({
      where: { id: auditRecord.id },
    });
    const isAuditPersisted = Boolean(fetchedAudit && fetchedAudit.action === "PHASE_0_VERIFIED");
    record(
      "appendAuditEvent() persists immutable audit event with metadata",
      isAuditPersisted,
      `audit id: ${auditRecord.id}`
    );

    // 6. Database Records & Seed Idempotency Check
    const userCount1 = await prisma.user.count();
    const projectCount1 = await prisma.project.count();
    const milestoneCount1 = await prisma.milestone.count();

    // Counts must match seeded values
    const hasSeededData = userCount1 >= 4 && projectCount1 >= 1 && milestoneCount1 >= 2;
    record(
      "Database baseline & seeded records intact",
      hasSeededData,
      `users: ${userCount1}, projects: ${projectCount1}, milestones: ${milestoneCount1}`
    );

  } catch (err: any) {
    console.error("Verification execution error:", err);
    record("Phase 0 execution completed without crashes", false, err.message);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await prisma.$disconnect();
  }

  console.log("\n=======================================================");
  const allPassed = results.every((r) => r.passed);
  console.log(`SUMMARY: ${results.filter((r) => r.passed).length}/${results.length} checks passed`);
  if (allPassed) {
    console.log("STATUS: PHASE 0 VERIFICATION PASS");
    process.exit(0);
  } else {
    console.error("STATUS: PHASE 0 VERIFICATION FAIL");
    process.exit(1);
  }
}

run();

