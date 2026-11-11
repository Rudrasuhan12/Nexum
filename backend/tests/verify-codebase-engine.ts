import { autonomousVerifierService } from "../src/services/autonomousVerifierService.js";
import { analyzeSourceCode } from "../src/lib/astAnalyzer.js";
import { generateMutantsForCode, evaluateMutationTesting } from "../src/lib/mutationEngine.js";
import { runAdversarialAudit } from "../src/lib/adversarialScanner.js";
import { runVisualVerification } from "../src/lib/visualVerificationAdapter.js";
import { generateSignedSlsaAttestation, verifySlsaAttestation } from "../src/lib/cryptoAttestation.js";
import crypto from "crypto";

// Helper to create a minimal in-memory zip archive with test files
function createTestZip(files: Record<string, string>): Buffer {
  const buffers: Buffer[] = [];
  const centralDirectoryEntries: Buffer[] = [];
  let offset = 0;

  for (const [filename, content] of Object.entries(files)) {
    const filenameBuf = Buffer.from(filename, "utf-8");
    const contentBuf = Buffer.from(content, "utf-8");
    const crc = 0;

    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(0, 6);
    localHeader.writeUInt16LE(0, 8);
    localHeader.writeUInt16LE(0, 10);
    localHeader.writeUInt16LE(0, 12);
    localHeader.writeUInt32LE(crc, 14);
    localHeader.writeUInt32LE(contentBuf.length, 18);
    localHeader.writeUInt32LE(contentBuf.length, 22);
    localHeader.writeUInt16LE(filenameBuf.length, 26);
    localHeader.writeUInt16LE(0, 28);

    buffers.push(localHeader, filenameBuf, contentBuf);

    const cdHeader = Buffer.alloc(46);
    cdHeader.writeUInt32LE(0x02014b50, 0);
    cdHeader.writeUInt16LE(20, 4);
    cdHeader.writeUInt16LE(20, 6);
    cdHeader.writeUInt16LE(0, 8);
    cdHeader.writeUInt16LE(0, 10);
    cdHeader.writeUInt16LE(0, 12);
    cdHeader.writeUInt16LE(0, 14);
    cdHeader.writeUInt32LE(crc, 16);
    cdHeader.writeUInt32LE(contentBuf.length, 20);
    cdHeader.writeUInt32LE(contentBuf.length, 24);
    cdHeader.writeUInt16LE(filenameBuf.length, 28);
    cdHeader.writeUInt16LE(0, 30);
    cdHeader.writeUInt16LE(0, 32);
    cdHeader.writeUInt16LE(0, 34);
    cdHeader.writeUInt16LE(0, 36);
    cdHeader.writeUInt32LE(0, 38);
    cdHeader.writeUInt32LE(offset, 42);

    centralDirectoryEntries.push(cdHeader, filenameBuf);
    offset += 30 + filenameBuf.length + contentBuf.length;
  }

  const cdStart = offset;
  let cdSize = 0;
  for (const b of centralDirectoryEntries) cdSize += b.length;

  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(Object.keys(files).length, 8);
  eocd.writeUInt16LE(Object.keys(files).length, 10);
  eocd.writeUInt32LE(cdSize, 12);
  eocd.writeUInt32LE(cdStart, 16);
  eocd.writeUInt16LE(0, 20);

  return Buffer.concat([...buffers, ...centralDirectoryEntries, eocd]);
}

async function runEnterpriseEngineTests() {
  console.log("=================================================================");
  console.log("   NEXUM TIER-1 ENTERPRISE VERIFIER - FULL PIPELINE TEST SUITE   ");
  console.log("=================================================================\n");

  // TEST 1: Semantic AST Anti-Stub & Hardcoded Token Detection
  console.log(">>> TEST 1: Semantic AST Anti-Stub & Insecure Hardcoded Token Detector");
  const insecureCode = `
    export function isAuthenticated(token: string) {
      return token === "valid-token";
    }
  `;
  const astResult1 = analyzeSourceCode(insecureCode, "authController.ts");
  console.log(`Functions Detected: ${astResult1.functions.length}`);
  console.log(`Hardcoded Auth Token Detected: ${astResult1.isHardcodedAuthDetected}`);
  console.log(`Stub Reason: ${astResult1.functions[0]?.stubReason}`);
  if (!astResult1.isHardcodedAuthDetected) {
    throw new Error("FAIL: AST failed to detect hardcoded token vulnerability");
  }
  console.log("✓ TEST 1 PASSED: Hardcoded token correctly flagged and rejected.\n");

  // TEST 2: Legitimate Simple Function (Not penalized for low cyclomatic complexity)
  console.log(">>> TEST 2: Legitimate Simple Function Handling (Low Cyclomatic Complexity)");
  const validOneLiner = `
    export function isValidPort(port: number) {
      return Number.isInteger(port) && port > 0 && port <= 65535;
    }
  `;
  const astResult2 = analyzeSourceCode(validOneLiner, "netUtils.ts");
  console.log(`Function: ${astResult2.functions[0]?.name}`);
  console.log(`Is Trivial Stub: ${astResult2.functions[0]?.isTrivialStub}`);
  console.log(`Complexity: ${astResult2.functions[0]?.cyclomaticComplexity}`);
  if (astResult2.functions[0]?.isTrivialStub) {
    throw new Error("FAIL: Legitimate simple function was wrongly flagged as a stub");
  }
  console.log("✓ TEST 2 PASSED: Legitimate clean function passed without false positive.\n");

  // TEST 3: Critical-Path Weighted Mutation Engine
  console.log(">>> TEST 3: Critical-Path Weighted Mutation Engine & Fault Injection");
  const escrowCode = `
    export function releaseEscrow(balance: number, isApproved: boolean) {
      if (isApproved === true && balance > 0) {
        return true;
      }
      return false;
    }
  `;
  const mutants = generateMutantsForCode(escrowCode, "escrowService.ts");
  console.log(`Mutants Generated: ${mutants.length}`);
  const goodTestSuite = `
    describe("escrow", () => {
      it("tests release condition", () => {
        expect(releaseEscrow(500, true)).toBe(true);
        expect(releaseEscrow(500, false)).toBe(false);
        expect(releaseEscrow(0, true)).toBe(false);
      });
    });
  `;
  const mutationReport = evaluateMutationTesting(mutants, goodTestSuite);
  console.log(`Mutants Killed: ${mutationReport.killedMutants}/${mutationReport.totalMutants}`);
  console.log(`Weighted Mutation Score: ${mutationReport.weightedScore}%`);
  console.log(`Has Critical Surviving Mutants: ${mutationReport.hasCriticalSurvivingMutants}`);
  if (mutationReport.hasCriticalSurvivingMutants || mutationReport.weightedScore < 75) {
    throw new Error("FAIL: Mutation engine did not kill critical mutants");
  }
  console.log("✓ TEST 3 PASSED: Mutation engine caught logic inversions.\n");

  // TEST 4: 6-Vector Adversarial Auth & Multi-Tenant BOLA Isolation
  console.log(">>> TEST 4: 6-Vector Adversarial Auth Probes & Multi-Tenant BOLA Isolation");
  const advResult = await runAdversarialAudit({
    milestoneId: "ms_bola_test",
    projectId: "prj_eval_1",
    codeContext: "const session = requireAuth(req); const tenantId = session.user.id;",
  });
  console.log(`Auth Attack Vectors Evaluated: ${advResult.authVectors.length}`);
  console.log(`All Vectors Rejected (401/403): ${advResult.authVectors.every((v) => v.passed)}`);
  console.log(`BOLA Cross-Tenant Access Blocked: ${advResult.bolaResult.crossTenantAccessBlocked}`);
  if (!advResult.passed) {
    throw new Error("FAIL: Adversarial auth / BOLA isolation failed");
  }
  console.log("✓ TEST 4 PASSED: All 6 attack vectors rejected and BOLA isolation verified.\n");

  // TEST 5: Playwright Visual & UI Acceptance Verification Adapter
  console.log(">>> TEST 5: Playwright Visual & UI Acceptance Verification Adapter");
  const visualResult = await runVisualVerification({
    targetUrl: "https://staging.shopkart.nexum.dev",
    milestoneTitle: "Milestone 1: Client Analytics Dashboard UI",
    milestoneId: "ms_vis_test",
    requiredSelectors: ["nav", "main", "footer"],
  });
  console.log(`Visual Status: ${visualResult.status}`);
  console.log(`Viewports Verified: ${visualResult.viewports.map((v) => v.viewport).join(", ")}`);
  console.log(`Accessibility Score: ${visualResult.accessibility.score}% (${visualResult.accessibility.wcagLevel})`);
  console.log(`Visual Proof Hash: ${visualResult.sha256ProofHash}`);
  if (visualResult.status !== "PASSED") {
    throw new Error("FAIL: Visual verification adapter did not return PASSED");
  }
  console.log("✓ TEST 5 PASSED: Multi-viewport, accessibility, and DOM assertions verified.\n");

  // TEST 6: SLSA v1.0 Provenance & RFC 8785 Ed25519 Cryptographic Attestation
  console.log(">>> TEST 6: SLSA v1.0 Provenance & Ed25519 Cryptographic Verification");
  const attestation = generateSignedSlsaAttestation({
    subjectName: "production-build.zip",
    subjectSha256: crypto.createHash("sha256").update("sample_payload").digest("hex"),
    milestoneId: "ms_slsa_101",
    projectId: "prj_slsa_101",
    sourceReference: "github.com/nexum/platform",
    builderInstanceId: "builder_hermetic_worker_1",
  });
  const verification = verifySlsaAttestation(attestation);
  console.log(`Attestation Key ID: ${verification.keyId}`);
  console.log(`Signature Cryptographically Verified: ${verification.isValid}`);
  if (!verification.isValid) {
    throw new Error("FAIL: SLSA Ed25519 signature verification failed");
  }

  // Test Tamper Proofing: Mutating 1 character in payload must invalidate signature
  const tamperedPayload = Buffer.from(attestation.payload, "base64").toString("utf-8").replace("production", "corrupted");
  const tamperedAttestation = {
    ...attestation,
    payload: Buffer.from(tamperedPayload, "utf-8").toString("base64"),
  };
  const tamperedCheck = verifySlsaAttestation(tamperedAttestation);
  console.log(`Tampered Payload Verification Rejected: ${!tamperedCheck.isValid}`);
  if (tamperedCheck.isValid) {
    throw new Error("FAIL: Tampered payload was not rejected by Ed25519 verification");
  }
  console.log("✓ TEST 6 PASSED: RFC 8785 canonical attestation and Ed25519 signature tamper-proofing verified.\n");

  // TEST 7: End-to-End Autonomous Verifier Service with 4-State Qualification Matrix
  console.log(">>> TEST 7A: Inconclusive Gate (Protected Dashboard UI with Missing Demo Credentials)");
  const inconclusiveResult = await autonomousVerifierService.runAutomatedChecks({
    milestoneId: "ms_e2e_inconclusive",
    projectId: "prj_e2e_eval",
    milestoneTitle: "Milestone 1: Vercel AI Integration & Protected Dashboard UI",
    githubPrUrl: "https://github.com/vercel/ai",
    deliverablesList: [
      "Core monorepo packages configured with pnpm workspace",
      "Interactive code examples provided in examples directory",
      "Automated turbo build pipeline configured with turbo.json",
    ],
    completionNote: "Integrated packages and examples. Protected dashboard view mounted.",
  });

  console.log(`Qualification State: ${inconclusiveResult.qualificationState}`);
  console.log(`RCA Forensics: ${inconclusiveResult.rcaForensics?.join("; ")}`);
  if (inconclusiveResult.qualificationState !== "INCONCLUSIVE") {
    throw new Error(`FAIL: Expected INCONCLUSIVE state when credentials missing, but got ${inconclusiveResult.qualificationState}`);
  }
  console.log("✓ TEST 7A PASSED: Inconclusive state correctly held escrow without penalizing freelancer.\n");

  console.log(">>> TEST 7B: Full Passed Qualification (Valid Deliverables + Demo Credentials Provided)");
  const passedResult = await autonomousVerifierService.runAutomatedChecks({
    milestoneId: "ms_e2e_passed",
    projectId: "prj_e2e_eval",
    milestoneTitle: "Milestone 1: Vercel AI Integration & Protected Dashboard UI",
    githubPrUrl: "https://github.com/vercel/ai",
    demoCredentialsText: "Client: demo@shopkart.com / DemoPass2026!",
    deliverablesList: [
      "Core monorepo packages configured with pnpm workspace",
      "Interactive code examples provided in examples directory",
      "Automated turbo build pipeline configured with turbo.json",
    ],
    completionNote: "Integrated packages, examples, and turbo pipeline. Verified with requireAuth middleware.",
  });

  console.log(`Qualification State: ${passedResult.qualificationState}`);
  console.log(`Audit Record Status: ${passedResult.status}`);
  console.log(`Total Checks Executed: ${passedResult.checks.length}`);
  for (const c of passedResult.checks) {
    console.log(`  [${c.status}] ${c.name}`);
    console.log(`     Summary: ${c.summary}`);
  }

  if (passedResult.qualificationState !== "PASSED") {
    throw new Error(`FAIL: Expected PASSED qualification state but got ${passedResult.qualificationState}`);
  }
  console.log("\n✓ TEST 7B PASSED: Complete 8-tier verification pipeline qualified deliverable as PASSED.");

  console.log("\n=================================================================");
  console.log("   ALL ENTERPRISE TIER-1 TESTS PASSED WITH 100% SUCCESS          ");
  console.log("=================================================================");
}

runEnterpriseEngineTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
