process.env.DISABLE_BACKGROUND_WORKER = "true";
process.env.NODE_ENV = "test";
process.env.ENABLE_DEV_TOOLS = "true";

import http from "http";
import { app } from "../src/index.js";
import { prisma } from "../src/prisma.js";

interface VerificationCheck {
  name: string;
  passed: boolean;
  details?: string;
}

const checks: VerificationCheck[] = [];

async function runVerification() {
  console.log("===============================================================");
  console.log(" NEXUM VERIFICATION: WORKSPACE ISOLATION & ASSIGNEE INVIOLABILITY");
  console.log("===============================================================\n");

  let server: http.Server | null = null;
  let baseUrl = "";

  try {
    // 1. Start ephemeral express test server
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const addr = server!.address() as any;
        baseUrl = `http://127.0.0.1:${addr.port}`;
        resolve();
      });
    });

    console.log(`Ephemeral test server running at ${baseUrl}\n`);

    // 2. Fetch the real active TerraShield project with ratified agreement
    const terraShield = await prisma.project.findFirst({
      where: {
        id: "prj_1794041467889_g05q",
      },
      include: {
        client: true,
        agreement: { include: { freelancer: true } },
      },
    });

    if (!terraShield) {
      throw new Error("TerraShield project not found in database to verify!");
    }

    const projectId = terraShield.id;
    const clientId = terraShield.clientId;
    const assignedFreelancerId = terraShield.agreement?.freelancerId;
    const assignedFreelancerName = terraShield.agreement?.freelancer?.name || "Assigned Freelancer";

    console.log(`Target Contract: ${terraShield.title} (${projectId})`);
    console.log(`Client: ${terraShield.client?.name} (${clientId})`);
    console.log(`Assigned Freelancer: ${assignedFreelancerName} (${assignedFreelancerId})\n`);

    // Find Rudra (third-party freelancer) in DB
    const rudra = await prisma.user.findFirst({
      where: {
        OR: [
          { name: { contains: "Rudra", mode: "insensitive" } },
          { id: "cmw2fjqpo0003ay2dvpni6o9h" },
        ],
      },
    });

    const thirdPartyFreelancerId = rudra?.id || "usr_unauthorized_rudra";
    console.log(`Third-Party Freelancer under test: ${rudra?.name || "Rudra"} (${thirdPartyFreelancerId})\n`);

    // -------------------------------------------------------------
    // CHECK 1: Workspace Project Isolation (GET /api/workspace/projects)
    // -------------------------------------------------------------
    try {
      const res = await fetch(`${baseUrl}/api/workspace/projects?role=FREELANCER&userId=${thirdPartyFreelancerId}`, {
        headers: { "x-nexum-internal": "true", "x-user-id": thirdPartyFreelancerId },
      });
      const json = await res.json();
      const leaked = (json.data || []).some((p: any) => p.id === projectId);

      if (res.status === 200 && !leaked) {
        checks.push({
          name: "Check 1: Workspace project listing strictly isolates contracts (Rudra does NOT see TerraShield)",
          passed: true,
          details: `Returned ${json.data?.length || 0} projects for Rudra; TerraShield excluded.`,
        });
      } else {
        checks.push({
          name: "Check 1: Workspace project listing strictly isolates contracts (Rudra does NOT see TerraShield)",
          passed: false,
          details: leaked ? "LEAK DETECTED: TerraShield appeared in Rudra's projects!" : `Status ${res.status}`,
        });
      }
    } catch (e: any) {
      checks.push({ name: "Check 1", passed: false, details: e.message });
    }

    // -------------------------------------------------------------
    // CHECK 2: Legitimate Assigned Freelancer Sees Project
    // -------------------------------------------------------------
    try {
      const res = await fetch(`${baseUrl}/api/workspace/projects?role=FREELANCER&userId=${assignedFreelancerId}`, {
        headers: { "x-nexum-internal": "true", "x-user-id": assignedFreelancerId! },
      });
      const json = await res.json();
      const hasProject = (json.data || []).some((p: any) => p.id === projectId);

      if (res.status === 200 && hasProject) {
        checks.push({
          name: "Check 2: Legitimate assigned freelancer successfully receives their project contract",
          passed: true,
          details: `TerraShield returned in ${assignedFreelancerName}'s active workspace list.`,
        });
      } else {
        checks.push({
          name: "Check 2: Legitimate assigned freelancer successfully receives their project contract",
          passed: false,
          details: `Expected TerraShield in project list for ${assignedFreelancerId}, but found: ${hasProject}`,
        });
      }
    } catch (e: any) {
      checks.push({ name: "Check 2", passed: false, details: e.message });
    }

    // -------------------------------------------------------------
    // CHECK 3: Workspace Timeline Authorization Gate (403 for Third Party)
    // -------------------------------------------------------------
    try {
      const res = await fetch(`${baseUrl}/api/workspace/projects/${projectId}/timeline?userId=${thirdPartyFreelancerId}`, {
        headers: { "x-nexum-internal": "true", "x-user-id": thirdPartyFreelancerId },
      });
      const json = await res.json();

      if (res.status === 403 && json.error?.code === "FORBIDDEN") {
        checks.push({
          name: "Check 3: Timeline access is blocked for third-party freelancer with 403 FORBIDDEN",
          passed: true,
          details: `Rejected with code: ${json.error.code} - "${json.error.message}"`,
        });
      } else {
        checks.push({
          name: "Check 3: Timeline access is blocked for third-party freelancer with 403 FORBIDDEN",
          passed: false,
          details: `Unexpected response status ${res.status}: ${JSON.stringify(json)}`,
        });
      }
    } catch (e: any) {
      checks.push({ name: "Check 3", passed: false, details: e.message });
    }

    // -------------------------------------------------------------
    // CHECK 4: Workspace Timeline Access Granted to Legitimate Participants
    // -------------------------------------------------------------
    try {
      const res = await fetch(`${baseUrl}/api/workspace/projects/${projectId}/timeline?userId=${assignedFreelancerId}`, {
        headers: { "x-nexum-internal": "true", "x-user-id": assignedFreelancerId! },
      });
      const json = await res.json();

      if (res.status === 200 && json.success) {
        checks.push({
          name: "Check 4: Timeline access granted to assigned freelancer with 200 OK",
          passed: true,
          details: `Retrieved conversation messages for ${assignedFreelancerName}.`,
        });
      } else {
        checks.push({
          name: "Check 4: Timeline access granted to assigned freelancer with 200 OK",
          passed: false,
          details: `Failed with status ${res.status}: ${JSON.stringify(json)}`,
        });
      }
    } catch (e: any) {
      checks.push({ name: "Check 4", passed: false, details: e.message });
    }

    // -------------------------------------------------------------
    // CHECK 5: Message Dispatch Blocked for Unauthorized Freelancer (403)
    // -------------------------------------------------------------
    try {
      const res = await fetch(`${baseUrl}/api/workspace/projects/${projectId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-nexum-internal": "true",
          "x-user-id": thirdPartyFreelancerId,
        },
        body: JSON.stringify({
          senderId: thirdPartyFreelancerId,
          senderRole: "FREELANCER",
          content: "Intrusion test message from unauthorized freelancer",
        }),
      });
      const json = await res.json();

      if (res.status === 403 && json.error?.code === "FORBIDDEN") {
        checks.push({
          name: "Check 5: Sending messages into workspace is strictly rejected for third parties (403 FORBIDDEN)",
          passed: true,
          details: `Blocked message injection with error code: ${json.error.code}`,
        });
      } else {
        checks.push({
          name: "Check 5: Sending messages into workspace is strictly rejected for third parties (403 FORBIDDEN)",
          passed: false,
          details: `Expected 403 but got ${res.status}: ${JSON.stringify(json)}`,
        });
      }
    } catch (e: any) {
      checks.push({ name: "Check 5", passed: false, details: e.message });
    }

    // -------------------------------------------------------------
    // CHECK 6: Project Assignee Inviolability on Invites (409 Conflict)
    // -------------------------------------------------------------
    try {
      const res = await fetch(`${baseUrl}/api/client/talent/invite`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-nexum-internal": "true",
          "x-user-id": clientId,
        },
        body: JSON.stringify({
          clientId,
          projectId,
          freelancerId: thirdPartyFreelancerId,
          freelancerName: "Chandrasekhar Mishra",
          proposedRate: "$65.00/hr",
          customNote: "Invitation to take over an already assigned contract",
        }),
      });
      const json = await res.json();

      if (res.status === 409 && json.error?.code === "PROJECT_ALREADY_ASSIGNED") {
        checks.push({
          name: "Check 6: Sending invitation to another freelancer for an assigned project is blocked (409 CONFLICT)",
          passed: true,
          details: `Rejected with code: ${json.error.code} - "${json.error.message}"`,
        });
      } else {
        checks.push({
          name: "Check 6: Sending invitation to another freelancer for an assigned project is blocked (409 CONFLICT)",
          passed: false,
          details: `Expected 409 Conflict but got ${res.status}: ${JSON.stringify(json)}`,
        });
      }
    } catch (e: any) {
      checks.push({ name: "Check 6", passed: false, details: e.message });
    }

  } finally {
    if (server) {
      await new Promise<void>((resolve) => server!.close(() => resolve()));
    }
    await prisma.$disconnect();
  }

  // Report Summary
  console.log("---------------------------------------------------------------");
  let passedCount = 0;
  for (const c of checks) {
    const statusIcon = c.passed ? "✅ PASS" : "❌ FAIL";
    console.log(`${statusIcon} | ${c.name}`);
    if (c.details) {
      console.log(`       ↳ ${c.details}`);
    }
    if (c.passed) passedCount++;
  }
  console.log("---------------------------------------------------------------");
  console.log(`TOTAL: ${passedCount} / ${checks.length} assertions passed.\n`);

  if (passedCount !== checks.length) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runVerification().catch((err) => {
  console.error("Verification crashed:", err);
  process.exit(1);
});
