import { describe, it, expect } from "vitest";
import { autonomousVerifierService } from "../src/services/autonomousVerifierService.js";

describe("Phase 12: Autonomous Multi-Model Deliverable Verifier Suite", () => {
  const mockMilestoneId = "ms_test_prototype_engine";
  const mockProjectId = "proj_test_techkart";

  it("should retrieve seeded baseline deliverable history for a milestone", () => {
    const history = autonomousVerifierService.getDeliverableHistory(mockMilestoneId);
    expect(Array.isArray(history)).toBe(true);
    expect(history.length).toBeGreaterThanOrEqual(1);

    const first = history[0];
    expect(first.milestoneId).toBe(mockMilestoneId);
    expect(first.revisionNumber).toBe(1);
    expect(first.checks.length).toBe(4);
    expect(first.sha256Seal).toContain("sha256_#");
  });

  it("should run the automated 3-tier pipeline and return 4 GitHub-style checks", async () => {
    const auditRecord = await autonomousVerifierService.runAutomatedChecks({
      milestoneId: mockMilestoneId,
      projectId: mockProjectId,
      acceptanceCriteria: [
        "POST /api/auth/register endpoint returns 201 on valid input",
        "Enforces Dual SHA-256 consensus ledger entry",
        "Rejects duplicate email with canonical 400 error",
      ],
      deliverablesList: ["Authentication routes", "State machine consensus", "Unit test logs"],
      fileName: "prototype-engine-v2.zip",
      completionNote: "Completed milestone deliverables with unit tests and state tracking.",
      githubPrUrl: "https://github.com/shopkart/storefront/pull/16",
      freelancerId: "usr_freelancer_rohan",
    });

    expect(auditRecord).toBeDefined();
    expect(auditRecord.milestoneId).toBe(mockMilestoneId);
    expect(auditRecord.revisionNumber).toBeGreaterThanOrEqual(2);
    expect(auditRecord.status).toBe("PASSED");
    expect(auditRecord.checks.length).toBe(4);

    // Verify all 4 checks exist
    const checkNames = auditRecord.checks.map((c) => c.name);
    expect(checkNames.some((n) => n.includes("Contract Acceptance"))).toBe(true);
    expect(checkNames.some((n) => n.includes("Autonomous Sandboxed Test Runner"))).toBe(true);
    expect(checkNames.some((n) => n.includes("Secret & Credential Audit"))).toBe(true);
    expect(checkNames.some((n) => n.includes("Dual SHA-256 Consensus Seal"))).toBe(true);

    // Terminal test logs
    expect(auditRecord.terminalOutput).toContain("vitest");
    expect(auditRecord.passedTests).toBeGreaterThanOrEqual(3);
    expect(auditRecord.failedTests).toBe(0);
    expect(auditRecord.testPassRate).toBe(100);
  });

  it("should preserve versioned deliverable history across multiple revisions", async () => {
    const history = autonomousVerifierService.getDeliverableHistory(mockMilestoneId);
    expect(history.length).toBeGreaterThanOrEqual(2);

    // Revisions must be descending (newest first)
    expect(history[0].revisionNumber).toBeGreaterThan(history[1].revisionNumber);
    expect(history[0].fileName).toBe("prototype-engine-v2.zip");
  });

  it("should detect leaked credentials in deliverable and flag security check as failed", async () => {
    const failedAudit = await autonomousVerifierService.runAutomatedChecks({
      milestoneId: "ms_test_security_leak",
      projectId: mockProjectId,
      acceptanceCriteria: ["Secure payment gateway"],
      fileName: "leaked_secret_test.zip",
      completionNote: "Test submission with AWS secret: AKIAIOSFODNN7EXAMPLE",
      freelancerId: "usr_freelancer_rohan",
    });

    expect(failedAudit.securityScanPassed).toBe(false);
    expect(failedAudit.status).toBe("FAILED");
    const secCheck = failedAudit.checks.find((c) => c.id === "check_security_secret_audit");
    expect(secCheck?.status).toBe("FAILURE");
    expect(secCheck?.summary).toContain("AWS Access Key");
  });

  it("should parse flexible multi-line credentials for multiple entities", () => {
    const rawCreds = `Client: demo@shopkart.com / DemoPass2026!
Admin: admin@shopkart.com / AdminSecure99#
Vendor: supplier@shopkart.com / VendorTest123`;

    const parsed = autonomousVerifierService.parseDemoCredentials(rawCreds);
    expect(parsed.length).toBe(3);
    expect(parsed[0].entity).toBe("Client");
    expect(parsed[0].login).toBe("demo@shopkart.com");
    expect(parsed[0].password).toBe("DemoPass2026!");

    expect(parsed[1].entity).toBe("Admin");
    expect(parsed[1].login).toBe("admin@shopkart.com");

    expect(parsed[2].entity).toBe("Vendor");
    expect(parsed[2].login).toBe("supplier@shopkart.com");
  });

  it("should detect authentication gate and capture autonomous visual proof with screenshot when credentials provided", async () => {
    const uiMilestoneId = "ms_test_ui_dashboard";
    const auditRecord = await autonomousVerifierService.runAutomatedChecks({
      milestoneId: uiMilestoneId,
      projectId: mockProjectId,
      milestoneTitle: "Client Analytics Dashboard",
      acceptanceCriteria: [
        "Client Dashboard requires authentication",
        "KPI metric cards display real-time revenue and active orders",
        "Responsive data table with pagination controls",
      ],
      demoUrl: "https://staging.shopkart.nexum.dev/client/dashboard",
      demoCredentialsText: "Client: demo@shopkart.com / DemoPass2026!\nAdmin: admin@shopkart.com / MasterPass99",
      fileName: "client-dashboard-v1.zip",
      freelancerId: "usr_freelancer_rohan",
    });

    expect(auditRecord).toBeDefined();
    expect(auditRecord.status).toBe("PASSED");
    expect(auditRecord.visualProof).toBeDefined();
    expect(auditRecord.visualProof?.status).toBe("VERIFIED");
    expect(auditRecord.visualProof?.authenticatedEntity).toContain("Client");
    expect(auditRecord.visualProof?.screenshotUrl).toContain("/uploads/visual-proofs/");
    expect(auditRecord.visualProof?.uiComponentsVerified.length).toBeGreaterThanOrEqual(3);

    // Check 5 (Visual proof inspector) must exist and be SUCCESS
    const visualCheck = auditRecord.checks.find((c) => c.id === "check_visual_inspection");
    expect(visualCheck).toBeDefined();
    expect(visualCheck?.status).toBe("SUCCESS");
  });
});

