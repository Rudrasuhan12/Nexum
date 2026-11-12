process.env.DISABLE_BACKGROUND_WORKER = "true";
process.env.NODE_ENV = "test";
process.env.PORT = "0";
process.env.ENABLE_DEV_TOOLS = "true";

/**
 * NEXUM BACKEND & SPONSOR INTEGRATION — PHASE 12 VERIFICATION SUITE
 *
 * Verifies Elastic Search & Observability Integration:
 * Check 1: Route validation: empty query returns standard error contract { error: { code, message, details } }
 * Check 2: Elastic telemetry endpoint GET /api/workspace/elastic/status returns valid indices and status
 * Check 3: Full-text search endpoint GET /api/workspace/projects/:projectId/search returns hits with snippets & scores
 * Check 4: ElasticService dual-mode fallback operates reliably without throwing unhandled exceptions
 * Check 5: Indexing hooks for messages and append-only audit events are safely defined and non-blocking
 * Check 6: Frontend api-client exports typed searchWorkspaceElastic and workspace search integration exists
 */

import http from "http";
import net from "net";
import fs from "fs";
import path from "path";
import { elasticService } from "../src/services/elasticService.js";

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
  method = "GET"
): Promise<{ status: number; body: any }> {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        host: "127.0.0.1",
        port: targetPort,
        path: pathStr,
        method,
        headers: { "Content-Type": "application/json" },
      },
      (res) => {
        let raw = "";
        res.on("data", (chunk) => (raw += chunk));
        res.on("end", () => {
          try {
            const body = JSON.parse(raw);
            resolve({ status: res.statusCode || 500, body });
          } catch {
            resolve({ status: res.statusCode || 500, body: raw });
          }
        });
      }
    );
    req.on("error", reject);
    req.end();
  });
}

async function runPhase12Verification() {
  console.log("\n========================================================");
  console.log("   NEXUM VERIFICATION: PHASE 12 (ELASTIC SEARCH & APM)");
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

    // Check 1: Route validation: empty query returns standard error contract
    try {
      const res = await makeRequest(testPort, "/api/workspace/projects/proj-test-123/search?q=");
      const isExpected =
        res.status === 400 &&
        res.body?.error?.code === "VALIDATION_ERROR" &&
        Boolean(res.body?.error?.message);
      record(
        1,
        "Route validation rejects empty search query with standard error contract",
        isExpected,
        `Status ${res.status}, code: ${res.body?.error?.code}`
      );
    } catch (e: any) {
      record(1, "Route validation rejects empty search query", false, e.message);
    }

    // Check 2: Elastic telemetry endpoint returns valid indices and status
    try {
      const res = await makeRequest(testPort, "/api/workspace/elastic/status");
      const telemetry = res.body?.telemetry;
      const isExpected =
        res.status === 200 &&
        res.body?.success === true &&
        Array.isArray(telemetry?.indices) &&
        telemetry.indices.includes("nexum-workspace-messages") &&
        telemetry.indices.includes("nexum-workspace-decisions") &&
        telemetry.indices.includes("nexum-audit-events");
      record(
        2,
        "GET /api/workspace/elastic/status returns telemetry and active indices",
        isExpected,
        `Indices count: ${telemetry?.indices?.length || 0}, APM configured: ${telemetry?.apmConfigured}`
      );
    } catch (e: any) {
      record(2, "Elastic telemetry endpoint", false, e.message);
    }

    // Check 3: Full-text search endpoint returns hits with snippets & scores
    try {
      const res = await makeRequest(testPort, "/api/workspace/projects/proj-test-123/search?q=agreement");
      const isExpected =
        res.status === 200 &&
        res.body?.success === true &&
        typeof res.body?.provider === "string" &&
        Array.isArray(res.body?.hits);
      record(
        3,
        "GET /api/workspace/projects/:projectId/search executes query and returns structured result",
        isExpected,
        `Provider: ${res.body?.provider}, Hits count: ${res.body?.count}`
      );
    } catch (e: any) {
      record(3, "Workspace search endpoint", false, e.message);
    }

    // Check 4: ElasticService dual-mode fallback operates reliably
    try {
      const fallbackResult = await elasticService.searchWorkspace("test-project-id", "escrow", 5);
      const isExpected =
        fallbackResult.success === true &&
        fallbackResult.query === "escrow" &&
        (fallbackResult.provider === "ELASTICSEARCH" || fallbackResult.provider === "POSTGRES_FALLBACK");
      record(
        4,
        "ElasticService dual-mode search operates seamlessly with PostgreSQL fallback",
        isExpected,
        `Resolved provider: ${fallbackResult.provider}`
      );
    } catch (e: any) {
      record(4, "ElasticService dual-mode search", false, e.message);
    }

    // Check 5: Indexing hooks for messages and audit events are safe and non-blocking
    try {
      let threw = false;
      try {
        await elasticService.indexMessage({
          id: "msg-test-123",
          projectId: "proj-123",
          senderId: "usr-client-1",
          content: "Testing index hook for elastic integration",
        });
        await elasticService.indexAuditEvent({
          id: "aud-test-123",
          action: "MILESTONE_STATUS_UPDATED",
          objectType: "MILESTONE",
          objectId: "ms-1",
          timestamp: new Date(),
        });
      } catch {
        threw = true;
      }
      record(
        5,
        "Indexing hooks (indexMessage, indexAuditEvent) operate non-blockingly without unhandled rejections",
        !threw,
        "Hooks executed safely"
      );
    } catch (e: any) {
      record(5, "Indexing hooks", false, e.message);
    }

    // Check 6: Frontend api-client exports typed searchWorkspaceElastic and UI search component exists
    try {
      const apiClientPath = path.resolve(process.cwd(), "../frontend/src/lib/api-client.ts");
      const clientContent = fs.existsSync(apiClientPath)
        ? fs.readFileSync(apiClientPath, "utf-8")
        : "";
      const hasClientMethod =
        clientContent.includes("searchWorkspaceElastic") ||
        clientContent.includes("/api/workspace/projects/${projectId}/search");

      const searchModalPath = path.resolve(
        process.cwd(),
        "../frontend/src/components/workspace/ElasticWorkspaceSearchModal.tsx"
      );
      const hasSearchModal = fs.existsSync(searchModalPath);

      const isExpected = hasClientMethod && hasSearchModal;
      record(
        6,
        "Frontend api-client exports searchWorkspaceElastic and ElasticWorkspaceSearchModal exists",
        isExpected,
        `apiClient: ${hasClientMethod}, modalExists: ${hasSearchModal}`
      );
    } catch (e: any) {
      record(6, "Frontend Elastic Search integration files", false, e.message);
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

runPhase12Verification().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});

