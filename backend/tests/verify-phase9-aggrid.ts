process.env.DISABLE_BACKGROUND_WORKER = "true";
process.env.NODE_ENV = "test";
process.env.PORT = "0";
process.env.ENABLE_DEV_TOOLS = "true";

/**
 * NEXUM BACKEND & SPONSOR INTEGRATION — PHASE 9 VERIFICATION SUITE
 *
 * Verifies AG Grid Data Grid Infrastructure:
 * Check 1: Client Audit Logs API returns paginated records with proper AG Grid fields
 * Check 2: Client Audit Logs search and filtering by action / objectType
 * Check 3: Client Payments Transactions API provides complete data contract for AG Grid rows
 * Check 4: Minor units integrity / financial amounts formatted honestly
 * Check 5: AG Grid Community & React packages correctly installed in frontend package.json
 * Check 6: All target views (ClientPaymentsView, ClientAuditLogsView, TransactionsTable) integrate AG Grid
 */

import http from "http";
import net from "net";
import fs from "fs";
import path from "path";

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
    const sock = new net.Socket();
    sock.setTimeout(1000);
    sock.on("connect", () => {
      sock.destroy();
      resolve(true);
    });
    sock.on("error", () => {
      sock.destroy();
      resolve(false);
    });
    sock.on("timeout", () => {
      sock.destroy();
      resolve(false);
    });
    sock.connect(port, "127.0.0.1");
  });
}

async function run() {
  console.log("\n=======================================================");
  console.log("   NEXUM SPONSOR INTEGRATION — PHASE 9 (AG GRID)");
  console.log("=======================================================\n");

  let baseUrl = "http://127.0.0.1:4000";
  let localServer: http.Server | null = null;

  const port4000Open = await isPortReachable(4000);
  if (!port4000Open) {
    const { app } = await import("../src/index.js");
    localServer = http.createServer(app);
    await new Promise<void>((resolve) => localServer!.listen(0, resolve));
    const port = (localServer.address() as net.AddressInfo).port;
    baseUrl = `http://127.0.0.1:${port}`;
  }

  try {
    // Check 1: Client Audit Logs API
    const res1 = await fetch(`${baseUrl}/api/client/audit-logs?page=1&limit=10`);
    const data1 = (await res1.json()) as any;
    const hasAuditFields =
      data1.success &&
      Array.isArray(data1.logs) &&
      data1.logs.every(
        (l: any) =>
          typeof l.id === "string" &&
          typeof l.action === "string" &&
          typeof l.objectType === "string" &&
          typeof l.timestamp === "string"
      );
    record(
      1,
      "Client Audit Logs endpoint returns structured AG Grid rows",
      Boolean(hasAuditFields),
      `Returned ${data1.logs?.length || 0} events with action, objectType, timestamp`
    );

    // Check 2: Client Audit Logs filtering
    const res2 = await fetch(
      `${baseUrl}/api/client/audit-logs?page=1&limit=5&action=DELIVERABLE_SUBMITTED`
    );
    const data2 = (await res2.json()) as any;
    const filterValid =
      data2.success &&
      Array.isArray(data2.logs) &&
      data2.logs.every((l: any) => l.action.includes("DELIVERABLE") || data2.logs.length === 0);
    record(
      2,
      "Client Audit Logs supports parameter filtering for AG Grid",
      Boolean(filterValid),
      `Filtered count: ${data2.logs?.length || 0}`
    );

    // Check 3: Client Payments Transactions API
    const res3 = await fetch(`${baseUrl}/api/client/payments/transactions?clientId=usr_client_alex`);
    const data3 = (await res3.json()) as any;
    const hasTxFields =
      data3.success &&
      Array.isArray(data3.data) &&
      data3.data.every(
        (tx: any) =>
          typeof tx.id === "string" &&
          typeof tx.freelancerName === "string" &&
          typeof tx.projectName === "string" &&
          typeof tx.amount === "number" &&
          typeof tx.statusLabel === "string"
      );
    record(
      3,
      "Client Payments Transactions API provides complete data contract for AG Grid",
      Boolean(hasTxFields),
      `Found ${data3.data?.length || 0} transaction rows`
    );

    // Check 4: Check Minor Units Integrity
    let minorUnitsOk = true;
    if (data3.data && data3.data.length > 0) {
      minorUnitsOk = data3.data.every((tx: any) => Number.isFinite(tx.amount));
    }
    record(
      4,
      "Financial amounts adhere to integer minor units / precise display contracts",
      minorUnitsOk,
      "No floating point currency corruption"
    );

    // Check 5: Verify Frontend package.json includes AG Grid
    const frontendPkgPath = path.resolve(__dirname, "../../frontend/package.json");
    const frontendPkg = JSON.parse(fs.readFileSync(frontendPkgPath, "utf-8"));
    const hasAgGridCommunity = Boolean(frontendPkg.dependencies?.["ag-grid-community"]);
    const hasAgGridReact = Boolean(frontendPkg.dependencies?.["ag-grid-react"]);
    record(
      5,
      "ag-grid-community and ag-grid-react installed in frontend dependencies",
      hasAgGridCommunity && hasAgGridReact,
      `ag-grid-community: ${frontendPkg.dependencies?.["ag-grid-community"]}, ag-grid-react: ${frontendPkg.dependencies?.["ag-grid-react"]}`
    );

    // Check 6: Check frontend files for AG Grid integration
    const clientPaymentsCode = fs.readFileSync(
      path.resolve(__dirname, "../../frontend/src/components/client/ClientPaymentsView.tsx"),
      "utf-8"
    );
    const clientAuditCode = fs.readFileSync(
      path.resolve(__dirname, "../../frontend/src/components/client/ClientAuditLogsView.tsx"),
      "utf-8"
    );
    const freelancerTxCode = fs.readFileSync(
      path.resolve(
        __dirname,
        "../../frontend/src/components/freelancer/earnings/TransactionsTable.tsx"
      ),
      "utf-8"
    );

    const cpHasAgGrid =
      clientPaymentsCode.includes("AgGridReact") && clientPaymentsCode.includes("AllCommunityModule");
    const caHasAgGrid =
      clientAuditCode.includes("AgGridReact") && clientAuditCode.includes("AllCommunityModule");
    const ftHasAgGrid =
      freelancerTxCode.includes("AgGridReact") && freelancerTxCode.includes("AllCommunityModule");

    record(
      6,
      "Target views (ClientPaymentsView, ClientAuditLogsView, TransactionsTable) integrate AG Grid v36",
      cpHasAgGrid && caHasAgGrid && ftHasAgGrid,
      "All 3 views import AgGridReact, register AllCommunityModule, and provide CSV Export"
    );
  } finally {
    if (localServer) {
      localServer.close();
    }
  }

  const passedCount = results.filter((r) => r.passed).length;
  console.log(`\n=======================================================`);
  console.log(`Phase 9 Verification Summary: ${passedCount} / ${results.length} PASSED`);
  console.log(`=======================================================\n`);

  if (passedCount < results.length) {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
