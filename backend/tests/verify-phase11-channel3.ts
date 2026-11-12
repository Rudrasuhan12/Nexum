process.env.DISABLE_BACKGROUND_WORKER = "true";
process.env.NODE_ENV = "test";
process.env.PORT = "0";
process.env.ENABLE_DEV_TOOLS = "true";

/**
 * NEXUM BACKEND & SPONSOR INTEGRATION — PHASE 11 VERIFICATION SUITE
 *
 * Verifies Channel 3 AI Product Discovery & Catalog Scoping:
 * Check 1: Route validation rejects empty queries with standard error contract
 * Check 2: GET /api/channel3/products returns structured products with SKUs and pricing
 * Check 3: Category filtering accurately narrows catalog responses
 * Check 4: Minor units compliance (priceCents is integer, no floats)
 * Check 5: AI Mediator Tool definition (search_product_catalog) is complete and callable
 * Check 6: Frontend Channel3ProductExplorerModal exists and is integrated into MilestoneAddendumModal
 */

import http from "http";
import net from "net";
import fs from "fs";
import path from "path";
import { channel3Service } from "../src/services/channel3Service.js";

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
  console.log("   NEXUM SPONSOR INTEGRATION — PHASE 11 (CHANNEL 3)");
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
    // Check 1: Route validation rejects empty queries with standard error contract
    const res1 = await fetch(`${baseUrl}/api/channel3/products?query=`);
    const data1 = (await res1.json()) as any;
    const isValidationErr =
      res1.status === 400 &&
      data1.error &&
      data1.error.code === "VALIDATION_ERROR" &&
      Array.isArray(data1.error.details);

    record(
      1,
      "API rejects invalid queries with standard error shape { error: { code, message, details } }",
      isValidationErr,
      `Status: ${res1.status}, code: ${data1.error?.code}`
    );

    // Check 2: GET /api/channel3/products returns structured products
    const res2 = await fetch(`${baseUrl}/api/channel3/products?query=sensor&limit=5`);
    const data2 = (await res2.json()) as any;
    const hasProducts =
      res2.status === 200 &&
      data2.success &&
      Array.isArray(data2.products) &&
      data2.products.length > 0 &&
      data2.products.every(
        (p: any) =>
          typeof p.id === "string" &&
          typeof p.sku === "string" &&
          typeof p.title === "string" &&
          typeof p.priceCents === "number" &&
          typeof p.priceDisplay === "string"
      );

    record(
      2,
      "GET /api/channel3/products returns structured retail SKUs with pricing & metadata",
      Boolean(hasProducts),
      `Found ${data2.products?.length || 0} products from provider: ${data2.provider}`
    );

    // Check 3: Category filtering
    const res3 = await fetch(`${baseUrl}/api/channel3/products?query=shoes&category=Footwear`);
    const data3 = (await res3.json()) as any;
    const categoryMatches =
      data3.success &&
      Array.isArray(data3.products) &&
      data3.products.every((p: any) => p.category.toLowerCase() === "footwear");

    record(
      3,
      "Category parameter accurately filters Channel 3 catalog items",
      categoryMatches,
      `Matched ${data3.products?.length || 0} footwear items`
    );

    // Check 4: Minor units compliance
    const allCentsIntegers =
      data2.products &&
      data2.products.length > 0 &&
      data2.products.every((p: any) => Number.isInteger(p.priceCents) && p.priceCents >= 0);

    record(
      4,
      "Financial amounts strictly adhere to integer minor units (priceCents)",
      Boolean(allCentsIntegers),
      "Zero floating point money values"
    );

    // Check 5: AI Mediator Tool definition
    const toolDef = channel3Service.getMediatorToolDefinition();
    const toolValid =
      toolDef.name === "search_product_catalog" &&
      toolDef.parameters.type === "object" &&
      typeof toolDef.execute === "function";

    let toolExecutes = false;
    if (toolValid) {
      const toolRes = await toolDef.execute({ query: "drone", limit: 2 });
      toolExecutes = toolRes.success && toolRes.products.length > 0;
    }

    record(
      5,
      "AI Mediator Tool (search_product_catalog) is declared and returns executable catalog data",
      toolValid && toolExecutes,
      `Tool '${toolDef.name}' successfully executed query`
    );

    // Check 6: Frontend components exist and are wired
    const modalPath = path.resolve(
      __dirname,
      "../../frontend/src/components/common/Channel3ProductExplorerModal.tsx"
    );
    const addendumModalPath = path.resolve(
      __dirname,
      "../../frontend/src/components/workspace/MilestoneAddendumModal.tsx"
    );
    const modalCode = fs.readFileSync(modalPath, "utf-8");
    const addendumCode = fs.readFileSync(addendumModalPath, "utf-8");

    const frontendWired =
      modalCode.includes("Channel3ProductExplorerModal") &&
      addendumCode.includes("Channel3ProductExplorerModal") &&
      addendumCode.includes("Channel 3 Catalog");

    record(
      6,
      "Frontend Channel3ProductExplorerModal is wired into milestone addendum scoping",
      frontendWired,
      "Modal provides search, category pills, SKU copy, and milestone deliverable attachment"
    );
  } finally {
    if (localServer) {
      localServer.close();
    }
  }

  const passedCount = results.filter((r) => r.passed).length;
  console.log(`\n=======================================================`);
  console.log(`Phase 11 Verification Summary: ${passedCount} / ${results.length} PASSED`);
  console.log(`=======================================================\n`);

  if (passedCount < results.length) {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});

