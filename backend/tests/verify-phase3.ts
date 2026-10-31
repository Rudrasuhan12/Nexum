/**
 * NEXUM FREELANCER BACKEND — PHASE 3 VERIFICATION SUITE
 *
 * Verifies:
 * 1. Full-text search over title, description, and skills
 * 2. Multi-tag skill filtering
 * 3. Budget range filtering in integer minor units (cents)
 * 4. Category and experience level filtering
 * 5. Pagination with real proposal count queries
 * 6. Single project details inspection
 * 7. Idempotent project bookmarking with AuditEvent logging
 * 8. Bookmark removal with AuditEvent logging
 * 9. Cross-user isolation: Freelancer B cannot see Freelancer A's bookmarks
 * 10. 404 NOT_FOUND on non-existent project save/read
 * 11. Role boundary isolation: CLIENT calling freelancer projects receives 403 FORBIDDEN
 */

import http from "http";
import net from "net";
import { app } from "../src/index.js";
import { prisma } from "../src/prisma.js";
import { createSession } from "../src/lib/auth.js";
import { Role } from "@prisma/client";

interface CheckResult {
  name: string;
  passed: boolean;
  details?: string;
}

const results: CheckResult[] = [];

function record(name: string, passed: boolean, details?: string) {
  results.push({ name, passed, details });
  const icon = passed ? "✅ PASS" : "❌ FAIL";
  console.log(`${icon} — ${name}${details ? ` (${details})` : ""}`);
}

async function run() {
  console.log("\n=======================================================");
  console.log("   NEXUM FREELANCER BACKEND — PHASE 3 VERIFICATION");
  console.log("=======================================================\n");

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const port = (server.address() as net.AddressInfo).port;
  const baseUrl = `http://127.0.0.1:${port}`;

  const timestamp = Date.now();
  let freelancerAId = "";
  let freelancerBId = "";
  let clientId = "";
  let tokenA = "";
  let tokenB = "";
  let tokenClient = "";

  try {
    // Setup isolated test users
    const userA = await prisma.user.create({
      data: {
        email: `phase3_freelancer_a_${timestamp}@test.nexum`,
        name: "Test Freelancer A",
        role: Role.FREELANCER,
        status: "ACTIVE",
        freelancerProfile: {
          create: {
            title: "Phase 3 Tester A",
            skills: ["TypeScript", "Next.js"],
          },
        },
      },
    });
    freelancerAId = userA.id;

    const userB = await prisma.user.create({
      data: {
        email: `phase3_freelancer_b_${timestamp}@test.nexum`,
        name: "Test Freelancer B",
        role: Role.FREELANCER,
        status: "ACTIVE",
        freelancerProfile: {
          create: {
            title: "Phase 3 Tester B",
            skills: ["Python", "Docker"],
          },
        },
      },
    });
    freelancerBId = userB.id;

    const userClient = await prisma.user.create({
      data: {
        email: `phase3_client_${timestamp}@test.nexum`,
        name: "Test Client",
        role: Role.CLIENT,
        status: "ACTIVE",
      },
    });
    clientId = userClient.id;

    const dummyReq = {
      headers: { "user-agent": "Phase3Verify" },
      ip: "127.0.0.1",
      socket: { remoteAddress: "127.0.0.1" },
    } as any;

    const sA = await createSession(freelancerAId, dummyReq);
    tokenA = sA.rawToken;
    const sB = await createSession(freelancerBId, dummyReq);
    tokenB = sB.rawToken;
    const sC = await createSession(clientId, dummyReq);
    tokenClient = sC.rawToken;

    const headersA = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokenA}`,
      Cookie: `sessionId=${tokenA}`,
      Origin: "http://localhost:3000",
    };

    const headersB = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokenB}`,
      Cookie: `sessionId=${tokenB}`,
      Origin: "http://localhost:3000",
    };

    const headersClient = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokenClient}`,
      Cookie: `sessionId=${tokenClient}`,
      Origin: "http://localhost:3000",
    };

    // [Check 1] Full-text search
    const res1 = await fetch(`${baseUrl}/api/freelancer/projects/search?q=Solana`, { headers: headersA });
    const data1 = await res1.json();
    const pass1 = res1.status === 200 && data1.projects?.some((p: any) => p.id === "opp_5");
    record(
      "[Check 1] Full-text keyword search matches title/description",
      pass1,
      `status: ${res1.status}, count: ${data1.projects?.length || 0}`
    );

    // [Check 2] Skill tag filtering
    const res2 = await fetch(`${baseUrl}/api/freelancer/projects/search?skills=Figma`, { headers: headersA });
    const data2 = await res2.json();
    const pass2 = res2.status === 200 && data2.projects?.every((p: any) => p.skills.includes("Figma"));
    record(
      "[Check 2] Multi-tag skill filtering matches required skills",
      pass2,
      `status: ${res2.status}, count: ${data2.projects?.length || 0}`
    );

    // [Check 3] Budget range filtering in minor units
    const res3 = await fetch(`${baseUrl}/api/freelancer/projects/search?minBudgetCents=350000&maxBudgetCents=500000`, { headers: headersA });
    const data3 = await res3.json();
    const pass3 =
      res3.status === 200 &&
      data3.projects?.length > 0 &&
      data3.projects.every((p: any) => p.budgetCents >= 350000 && p.budgetCents <= 500000);
    record(
      "[Check 3] Budget range filtering in minor units (integer cents)",
      pass3,
      `status: ${res3.status}, projects: ${data3.projects?.map((p: any) => p.budgetCents).join(", ")}`
    );

    // [Check 4] Category & Experience Level
    const res4 = await fetch(`${baseUrl}/api/freelancer/projects/search?category=Web%20Design&experienceLevel=EXPERT`, { headers: headersA });
    const data4 = await res4.json();
    const pass4 = res4.status === 200 && data4.projects?.length === 1 && data4.projects[0].id === "opp_4";
    record(
      "[Check 4] Category & Experience Level filtering",
      pass4,
      `status: ${res4.status}, matchId: ${data4.projects?.[0]?.id || "none"}`
    );

    // [Check 5] Pagination & proposals count
    const res5 = await fetch(`${baseUrl}/api/freelancer/projects/search?page=1&limit=2`, { headers: headersA });
    const data5 = await res5.json();
    const pass5 =
      res5.status === 200 &&
      data5.projects?.length === 2 &&
      data5.pagination?.total >= 6 &&
      data5.pagination?.totalPages >= 3 &&
      typeof data5.projects[0].proposalsCount === "number";
    record(
      "[Check 5] Pagination and real proposal counts query",
      pass5,
      `total: ${data5.pagination?.total}, pages: ${data5.pagination?.totalPages}`
    );

    // [Check 6] Single project details
    const res6 = await fetch(`${baseUrl}/api/freelancer/projects/opp_5`, { headers: headersA });
    const data6 = await res6.json();
    const pass6 =
      res6.status === 200 &&
      data6.project?.id === "opp_5" &&
      data6.project?.client?.id !== undefined &&
      data6.project?.isSaved === false;
    record(
      "[Check 6] Single project details endpoint (GET /:id)",
      pass6,
      `status: ${res6.status}, title: ${data6.project?.title?.slice(0, 30)}...`
    );

    // [Check 7] Idempotent project bookmark save
    const res7a = await fetch(`${baseUrl}/api/freelancer/projects/opp_5/save`, {
      method: "POST",
      headers: headersA,
    });
    const data7a = await res7a.json();
    // Repeat save should be idempotent (no 500 duplicate key)
    const res7b = await fetch(`${baseUrl}/api/freelancer/projects/opp_5/save`, {
      method: "POST",
      headers: headersA,
    });
    const data7b = await res7b.json();

    const auditSave = await prisma.auditEvent.findFirst({
      where: {
        actorId: freelancerAId,
        action: "PROJECT_SAVED",
        objectId: "opp_5",
      },
    });

    const pass7 =
      res7a.status === 200 &&
      data7a.isSaved === true &&
      res7b.status === 200 &&
      data7b.isSaved === true &&
      Boolean(auditSave);
    record(
      "[Check 7] Idempotent bookmark save (POST /:id/save) and AuditEvent logging",
      pass7,
      `status: ${res7b.status}, auditId: ${auditSave?.id || "missing"}`
    );

    // [Check 8] Saved list & bookmark removal
    const res8List = await fetch(`${baseUrl}/api/freelancer/projects/saved`, { headers: headersA });
    const data8List = await res8List.json();
    const hasOpp5InList = data8List.savedProjects?.some((p: any) => p.id === "opp_5");

    const res8Del = await fetch(`${baseUrl}/api/freelancer/projects/opp_5/save`, {
      method: "DELETE",
      headers: headersA,
    });
    const data8Del = await res8Del.json();

    const auditUnsave = await prisma.auditEvent.findFirst({
      where: {
        actorId: freelancerAId,
        action: "PROJECT_UNSAVED",
        objectId: "opp_5",
      },
    });

    const res8After = await fetch(`${baseUrl}/api/freelancer/projects/saved`, { headers: headersA });
    const data8After = await res8After.json();
    const removedFromList = !data8After.savedProjects?.some((p: any) => p.id === "opp_5");

    const pass8 =
      hasOpp5InList &&
      res8Del.status === 200 &&
      data8Del.isSaved === false &&
      removedFromList &&
      Boolean(auditUnsave);
    record(
      "[Check 8] Bookmark removal (DELETE /:id/save) and list reconciliation",
      pass8,
      `deletedStatus: ${res8Del.status}, verifiedAbsent: ${removedFromList}`
    );

    // [Check 9] Cross-user saved project isolation
    // Save opp_1 for Freelancer A
    await fetch(`${baseUrl}/api/freelancer/projects/opp_1/save`, {
      method: "POST",
      headers: headersA,
    });

    // Freelancer B checks saved list - should NOT see opp_1
    const res9 = await fetch(`${baseUrl}/api/freelancer/projects/saved`, { headers: headersB });
    const data9 = await res9.json();
    const pass9 = res9.status === 200 && !data9.savedProjects?.some((p: any) => p.id === "opp_1");
    record(
      "[Check 9] Cross-user isolation: Freelancer B cannot see Freelancer A's saved bookmarks",
      pass9,
      `Freelancer B saved count: ${data9.savedProjects?.length || 0}`
    );

    // [Check 10] 404 on non-existent project
    const res10 = await fetch(`${baseUrl}/api/freelancer/projects/non_existent_project_xyz/save`, {
      method: "POST",
      headers: headersA,
    });
    const data10 = await res10.json();
    const pass10 = res10.status === 404 && data10.error?.code === "NOT_FOUND";
    record(
      "[Check 10] Non-existent project save returns 404 NOT_FOUND",
      pass10,
      `status: ${res10.status}, code: ${data10.error?.code}`
    );

    // [Check 11] Role boundary isolation: CLIENT role receives 403
    const res11 = await fetch(`${baseUrl}/api/freelancer/projects/search`, { headers: headersClient });
    const data11 = await res11.json();
    const pass11 = res11.status === 403 && data11.error?.code === "FORBIDDEN";
    record(
      "[Check 11] Role boundary: CLIENT calling /api/freelancer/projects receives 403 FORBIDDEN",
      pass11,
      `status: ${res11.status}, code: ${data11.error?.code}`
    );

  } catch (err: any) {
    console.error("Test execution exception:", err);
    record("Verification execution completed without unhandled exception", false, err.message);
  } finally {
    // Teardown test users
    console.log("\n🧹 Running test teardown cleanup...");
    const cleanupIds = [freelancerAId, freelancerBId, clientId].filter(Boolean);
    if (cleanupIds.length > 0) {
      await prisma.savedProject.deleteMany({ where: { freelancerId: { in: cleanupIds } } });
      await prisma.session.deleteMany({ where: { userId: { in: cleanupIds } } });
      await prisma.auditEvent.deleteMany({ where: { actorId: { in: cleanupIds } } });
      await prisma.freelancerProfile.deleteMany({ where: { userId: { in: cleanupIds } } });
      await prisma.user.deleteMany({ where: { id: { in: cleanupIds } } });
      console.log(`   Cleaned up ${cleanupIds.length} test user account(s).`);
    }

    await new Promise<void>((resolve) => server.close(() => resolve()));
    await prisma.$disconnect();
  }

  console.log("\n=======================================================");
  const allPassed = results.every((r) => r.passed);
  console.log(`SUMMARY: ${results.filter((r) => r.passed).length}/${results.length} checks passed`);
  if (allPassed) {
    console.log("STATUS: PHASE 3 VERIFICATION PASS");
    process.exit(0);
  } else {
    console.error("STATUS: PHASE 3 VERIFICATION FAIL");
    process.exit(1);
  }
}

run();
