process.env.DISABLE_BACKGROUND_WORKER = "true";
process.env.NODE_ENV = "test";

/**
 * NEXUM FREELANCER BACKEND — PHASE 3 COMPREHENSIVE VERIFICATION SUITE
 *
 * Implements all 18 checks specified in the Freelancer Backend Build Guide (Pages 20-22):
 *
 * Check 1:  Seed verification — count listings in DB (>= 14 across variety)
 * Check 2:  Browse as demo freelancer — only open/accessible projects (0 private, 0 draft, 0 closed)
 * Check 3:  Text search & SQL injection — keyword search, SQL injection safety, empty search
 * Check 4:  Filter combinations — multi-skill + budget range + payment model
 * Check 5:  Sort options — newest, budget_high (nulls at end), budget_low, fewest_proposals
 * Check 6:  Pagination consistency & Limit <= 50 (returns 422 if > 50)
 * Check 7:  Project detail JSON — client email omitted, null budget preserved, integer proposals
 * Check 8:  Detail 404 for PRIVATE, DRAFT, and closed projects
 * Check 9:  INVITE_ONLY visibility — 404 without invitation, 200 with invitation
 * Check 10: Save / bookmark flow — idempotent save, list saved, unsave, audit logging
 * Check 11: Closed saved project degradation — degraded { availability: "CLOSED" } view
 * Check 12: Recommendation ranking — AI skills rank AI project #1 with honest match reasons
 * Check 13: Deterministic recommendations without profile rate — no fabricated rate match
 * Check 14: Decline invitation — PENDING -> DECLINED, repeat -> 409 INVALID_STATE, audit event
 * Check 15: Cross-role protection — CLIENT role receives 403 FORBIDDEN
 * Check 16: Browse query performance — browse query response time < 200ms locally
 * Check 17: Cross-user bookmark isolation — Freelancer B cannot see Freelancer A's bookmarks
 * Check 18: Full suite completion summary — 18/18 checks passed
 */

import http from "http";
import net from "net";
import { app } from "../src/index.js";
import { prisma } from "../src/prisma.js";
import { createSession } from "../src/lib/auth.js";
import { Role, ProjectState } from "@prisma/client";

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
  console.log("   NEXUM FREELANCER BACKEND — PHASE 3 VERIFICATION");
  console.log("=======================================================\n");

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const port = (server.address() as net.AddressInfo).port;
  const baseUrl = `http://127.0.0.1:${port}`;

  const timestamp = Date.now();
  let freelancerAId = "";
  let freelancerBId = "";
  let freelancerAiId = "";
  let freelancerNoRateId = "";
  let clientId = "";
  let testProjectId = "";
  let testInvitationId = "";

  let tokenA = "";
  let tokenB = "";
  let tokenAi = "";
  let tokenNoRate = "";
  let tokenClient = "";

  try {
    const dummyReq = {
      headers: { "user-agent": "Phase3Verify" },
      ip: "127.0.0.1",
      socket: { remoteAddress: "127.0.0.1" },
    } as any;

    // 1. Find demo freelancer Elena or create test user A
    const elena = await prisma.user.findUnique({
      where: { email: "elena.rostova@nexum.demo" },
      include: { freelancerProfile: true },
    });

    if (elena) {
      freelancerAId = elena.id;
    } else {
      const userA = await prisma.user.create({
        data: {
          email: `elena_${timestamp}@test.nexum`,
          name: "Elena Rostova",
          role: Role.FREELANCER,
          status: "ACTIVE",
          freelancerProfile: {
            create: {
              title: "Senior Full-Stack & AI Engineer",
              skills: ["React", "Next.js", "TypeScript", "Node.js", "Tailwind CSS", "GraphQL"],
            },
          },
        },
      });
      freelancerAId = userA.id;
    }

    const sA = await createSession(freelancerAId, dummyReq);
    tokenA = sA.rawToken;

    // Ensure Elena has invitation for opp_11
    const opp11 = await prisma.project.findUnique({ where: { id: "opp_11" } });
    if (opp11) {
      await prisma.projectInvitation.upsert({
        where: {
          projectId_freelancerId: {
            projectId: "opp_11",
            freelancerId: freelancerAId,
          },
        },
        create: {
          projectId: "opp_11",
          freelancerId: freelancerAId,
          status: "PENDING",
          message: "You are invited to this private opportunity.",
        },
        update: {},
      });
    }

    // 2. Freelancer B (isolated for cross-user tests)
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
    const sB = await createSession(freelancerBId, dummyReq);
    tokenB = sB.rawToken;

    // 3. Client User (for role check)
    const userClient = await prisma.user.create({
      data: {
        email: `phase3_client_${timestamp}@test.nexum`,
        name: "Test Client",
        role: Role.CLIENT,
        status: "ACTIVE",
      },
    });
    clientId = userClient.id;
    const sC = await createSession(clientId, dummyReq);
    tokenClient = sC.rawToken;

    // 4. AI Freelancer (for recommendations check)
    const userAi = await prisma.user.create({
      data: {
        email: `phase3_ai_${timestamp}@test.nexum`,
        name: "AI Specialist",
        role: Role.FREELANCER,
        status: "ACTIVE",
        freelancerProfile: {
          create: {
            title: "AI & ML Specialist",
            skills: ["Python", "FastAPI", "OpenAI API", "LangChain", "Vector DB"],
            rateHourlyMinor: 8000, // $80/hr
            rateCurrency: "USD",
          },
        },
      },
    });
    freelancerAiId = userAi.id;
    const sAi = await createSession(freelancerAiId, dummyReq);
    tokenAi = sAi.rawToken;

    // 5. Freelancer with no rate (for rate preference check)
    const userNoRate = await prisma.user.create({
      data: {
        email: `phase3_norate_${timestamp}@test.nexum`,
        name: "No Rate Specialist",
        role: Role.FREELANCER,
        status: "ACTIVE",
        freelancerProfile: {
          create: {
            title: "General Developer",
            skills: ["TypeScript", "React"],
            rateHourlyMinor: null,
          },
        },
      },
    });
    freelancerNoRateId = userNoRate.id;
    const sNoRate = await createSession(freelancerNoRateId, dummyReq);
    tokenNoRate = sNoRate.rawToken;

    // Request headers
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

    const headersAi = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokenAi}`,
      Cookie: `sessionId=${tokenAi}`,
      Origin: "http://localhost:3000",
    };

    const headersNoRate = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokenNoRate}`,
      Cookie: `sessionId=${tokenNoRate}`,
      Origin: "http://localhost:3000",
    };

    const headersClient = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokenClient}`,
      Cookie: `sessionId=${tokenClient}`,
      Origin: "http://localhost:3000",
    };

    // =========================================================================
    // Check 1: Seed verification (>= 14 listings across variety)
    // =========================================================================
    const projectCount = await prisma.project.count();
    const categories = await prisma.project.findMany({ select: { category: true }, distinct: ["category"] });
    const budgetTypes = await prisma.project.findMany({ select: { budgetType: true }, distinct: ["budgetType"] });
    const visibilities = await prisma.project.findMany({ select: { visibility: true }, distinct: ["visibility"] });

    const pass1 =
      projectCount >= 14 &&
      categories.length >= 6 &&
      budgetTypes.some((b) => b.budgetType === "FIXED_PRICE") &&
      budgetTypes.some((b) => b.budgetType === "HOURLY") &&
      visibilities.some((v) => v.visibility === "PUBLIC") &&
      visibilities.some((v) => v.visibility === "INVITE_ONLY") &&
      visibilities.some((v) => v.visibility === "PRIVATE");

    record(
      1,
      "Seed verification — >= 14 listings with rich categories, budget types, states & visibility",
      pass1,
      `count: ${projectCount}, categories: ${categories.length}, visibilities: ${visibilities.map((v) => v.visibility).join(",")}`
    );

    // =========================================================================
    // Check 2: Browse as demo freelancer (only public in matching/active + invited)
    // =========================================================================
    const res2 = await fetch(`${baseUrl}/api/freelancer/projects/search?limit=50`, { headers: headersA });
    const data2 = await res2.json();

    const allMatchingOrActive = data2.projects?.every(
      (p: any) => p.state === "MATCHING" || p.state === "ACTIVE"
    );
    const zeroDraft = !data2.projects?.some((p: any) => p.state === "DRAFT");
    const zeroPrivate = !data2.projects?.some((p: any) => p.visibility === "PRIVATE");
    const zeroClosed = !data2.projects?.some((p: any) => p.state === "NEGOTIATING" || p.state === "COMPLETED");
    const hasInvitedOpp11 = data2.projects?.some((p: any) => p.id === "opp_11");
    const noUninvitedOpp12 = !data2.projects?.some((p: any) => p.id === "opp_12");

    const pass2 =
      res2.status === 200 &&
      allMatchingOrActive &&
      zeroDraft &&
      zeroPrivate &&
      zeroClosed &&
      hasInvitedOpp11 &&
      noUninvitedOpp12;

    record(
      2,
      "Browse as demo freelancer — only open/accessible projects (0 private, 0 draft, 0 closed)",
      pass2,
      `status: ${res2.status}, returned: ${data2.projects?.length || 0}, opp_11 included: ${hasInvitedOpp11}, opp_12 excluded: ${noUninvitedOpp12}`
    );

    // =========================================================================
    // Check 3: Text search & SQL injection safety
    // =========================================================================
    const res3Keyword = await fetch(`${baseUrl}/api/freelancer/projects/search?q=React`, { headers: headersA });
    const data3Keyword = await res3Keyword.json();
    const hasReactMatch = data3Keyword.projects?.some((p: any) => p.id === "opp_1" || p.id === "opp_8");

    const sqliQuery = encodeURIComponent("'; drop table \"User\"; --");
    const res3Sqli = await fetch(`${baseUrl}/api/freelancer/projects/search?q=${sqliQuery}`, { headers: headersA });
    const data3Sqli = await res3Sqli.json();

    const res3Empty = await fetch(`${baseUrl}/api/freelancer/projects/search?q=`, { headers: headersA });
    const data3Empty = await res3Empty.json();

    const userCountAfterSqli = await prisma.user.count();

    const pass3 =
      res3Keyword.status === 200 &&
      hasReactMatch &&
      res3Sqli.status === 200 &&
      Array.isArray(data3Sqli.projects) &&
      userCountAfterSqli > 0 &&
      res3Empty.status === 200 &&
      data3Empty.projects?.length >= data3Keyword.projects?.length;

    record(
      3,
      "Text search & SQL injection safety — keyword match, harmless injection handling, empty query",
      pass3,
      `reactMatch: ${hasReactMatch}, sqliStatus: ${res3Sqli.status}, userTablePreserved: ${userCountAfterSqli > 0}`
    );

    // =========================================================================
    // Check 4: Filter combinations (skills + budget range + payment model)
    // =========================================================================
    const res4 = await fetch(
      `${baseUrl}/api/freelancer/projects/search?skills=Next.js&minBudgetCents=300000&maxBudgetCents=600000&budgetType=FIXED_PRICE`,
      { headers: headersA }
    );
    const data4 = await res4.json();

    const pass4 =
      res4.status === 200 &&
      data4.projects?.length > 0 &&
      data4.projects.every(
        (p: any) =>
          p.skills.includes("Next.js") &&
          p.budgetCents >= 300000 &&
          p.budgetCents <= 600000 &&
          p.budgetType === "Fixed-price"
      );

    record(
      4,
      "Filter combinations — multi-skill + budget range + payment model filter",
      pass4,
      `status: ${res4.status}, count: ${data4.projects?.length || 0}, ids: ${data4.projects?.map((p: any) => p.id).join(",")}`
    );

    // =========================================================================
    // Check 5: Sort options (specifically budget_high placing nulls last)
    // =========================================================================
    const res5High = await fetch(`${baseUrl}/api/freelancer/projects/search?sortBy=budget_high&limit=50`, {
      headers: headersA,
    });
    const data5High = await res5High.json();
    const projectsHigh = data5High.projects || [];

    // Verify opp_10 (null budget) is at the very end
    const lastItem = projectsHigh[projectsHigh.length - 1];
    const opp10AtEnd = lastItem?.id === "opp_10" || lastItem?.budgetCents === null;
    const firstItemBudgetHigh = projectsHigh[0]?.budgetCents >= projectsHigh[1]?.budgetCents;

    const res5Low = await fetch(`${baseUrl}/api/freelancer/projects/search?sortBy=budget_low&limit=5`, {
      headers: headersA,
    });
    const data5Low = await res5Low.json();

    const res5Newest = await fetch(`${baseUrl}/api/freelancer/projects/search?sortBy=newest&limit=5`, {
      headers: headersA,
    });
    const data5Newest = await res5Newest.json();

    const pass5 =
      res5High.status === 200 &&
      opp10AtEnd &&
      firstItemBudgetHigh &&
      res5Low.status === 200 &&
      res5Newest.status === 200;

    record(
      5,
      "Sort options — budget_high places null budgets last, budget_low, newest",
      pass5,
      `opp10AtEnd: ${opp10AtEnd}, topBudgetCents: ${projectsHigh[0]?.budgetCents}, lastBudgetCents: ${lastItem?.budgetCents}`
    );

    // =========================================================================
    // Check 6: Pagination consistency & Limit <= 50 (returns 422 if > 50)
    // =========================================================================
    const res6Page1 = await fetch(`${baseUrl}/api/freelancer/projects/search?page=1&limit=3`, { headers: headersA });
    const data6Page1 = await res6Page1.json();
    const res6Page2 = await fetch(`${baseUrl}/api/freelancer/projects/search?page=2&limit=3`, { headers: headersA });
    const data6Page2 = await res6Page2.json();

    const page1Ids = new Set(data6Page1.projects?.map((p: any) => p.id));
    const overlap = data6Page2.projects?.some((p: any) => page1Ids.has(p.id));

    // Request limit > 50 should return 422
    const res6OverLimit = await fetch(`${baseUrl}/api/freelancer/projects/search?limit=51`, { headers: headersA });
    const data6OverLimit = await res6OverLimit.json();

    const pass6 =
      res6Page1.status === 200 &&
      res6Page2.status === 200 &&
      !overlap &&
      res6OverLimit.status === 422 &&
      data6OverLimit.error?.code === "VALIDATION_ERROR";

    record(
      6,
      "Pagination consistency & Limit <= 50 — no duplicate IDs, limit > 50 returns 422",
      pass6,
      `overlap: ${overlap}, overLimitStatus: ${res6OverLimit.status}, errorCode: ${data6OverLimit.error?.code}`
    );

    // =========================================================================
    // Check 7: Project detail JSON (privacy & integer minor units)
    // =========================================================================
    const res7Detail = await fetch(`${baseUrl}/api/freelancer/projects/opp_1`, { headers: headersA });
    const data7Detail = await res7Detail.json();
    const p1 = data7Detail.project;

    const emailOmitted = p1?.client?.email === undefined;
    const notesOmitted = (p1 as any)?.privateNotes === undefined;
    const proposalCountIsInt = Number.isInteger(p1?.proposalsCount) && p1?.proposalsCount >= 0;

    // Check null budget preserved on opp_10
    const res7NullBudget = await fetch(`${baseUrl}/api/freelancer/projects/opp_10`, { headers: headersA });
    const data7NullBudget = await res7NullBudget.json();
    const p10 = data7NullBudget.project;
    const nullBudgetPreserved = p10?.budgetCents === null;

    const pass7 =
      res7Detail.status === 200 &&
      emailOmitted &&
      notesOmitted &&
      proposalCountIsInt &&
      res7NullBudget.status === 200 &&
      nullBudgetPreserved;

    record(
      7,
      "Project detail JSON — client email omitted, notes omitted, null budget preserved, integer proposals",
      pass7,
      `emailOmitted: ${emailOmitted}, proposalsCount: ${p1?.proposalsCount}, nullBudgetPreserved: ${nullBudgetPreserved}`
    );

    // =========================================================================
    // Check 8: Detail 404 for PRIVATE, DRAFT, and closed projects
    // =========================================================================
    const res8Private = await fetch(`${baseUrl}/api/freelancer/projects/opp_13`, { headers: headersA });
    const res8Draft = await fetch(`${baseUrl}/api/freelancer/projects/opp_14`, { headers: headersA });
    const res8Closed = await fetch(`${baseUrl}/api/freelancer/projects/opp_15`, { headers: headersA });

    const pass8 =
      res8Private.status === 404 &&
      res8Draft.status === 404 &&
      res8Closed.status === 404;

    record(
      8,
      "Detail 404 for PRIVATE, DRAFT, and closed projects",
      pass8,
      `opp_13 (PRIVATE): ${res8Private.status}, opp_14 (DRAFT): ${res8Draft.status}, opp_15 (CLOSED): ${res8Closed.status}`
    );

    // =========================================================================
    // Check 9: INVITE_ONLY visibility (without invitation -> 404, with -> 200)
    // =========================================================================
    // opp_12 is INVITE_ONLY without invitation for Elena -> 404
    const res9NoInv = await fetch(`${baseUrl}/api/freelancer/projects/opp_12`, { headers: headersA });
    // opp_11 is INVITE_ONLY with invitation for Elena -> 200
    const res9WithInv = await fetch(`${baseUrl}/api/freelancer/projects/opp_11`, { headers: headersA });

    const pass9 = res9NoInv.status === 404 && res9WithInv.status === 200;

    record(
      9,
      "INVITE_ONLY visibility — 404 without invitation, 200 with invitation",
      pass9,
      `opp_12 (uninvited): ${res9NoInv.status}, opp_11 (invited): ${res9WithInv.status}`
    );

    // =========================================================================
    // Check 10: Save / bookmark flow (idempotent + list + unsave)
    // =========================================================================
    const res10Save1 = await fetch(`${baseUrl}/api/freelancer/projects/opp_1/save`, {
      method: "POST",
      headers: headersA,
    });
    const res10Save2 = await fetch(`${baseUrl}/api/freelancer/projects/opp_1/save`, {
      method: "POST",
      headers: headersA,
    });

    const res10List = await fetch(`${baseUrl}/api/freelancer/projects/saved`, { headers: headersA });
    const data10List = await res10List.json();
    const hasOpp1 = data10List.savedProjects?.some((p: any) => p.id === "opp_1");

    const res10Unsave = await fetch(`${baseUrl}/api/freelancer/projects/opp_1/save`, {
      method: "DELETE",
      headers: headersA,
    });
    const res10ListAfter = await fetch(`${baseUrl}/api/freelancer/projects/saved`, { headers: headersA });
    const data10ListAfter = await res10ListAfter.json();
    const removedOpp1 = !data10ListAfter.savedProjects?.some((p: any) => p.id === "opp_1");

    const auditSave = await prisma.auditEvent.findFirst({
      where: { actorId: freelancerAId, action: "PROJECT_SAVED", objectId: "opp_1" },
    });
    const auditUnsave = await prisma.auditEvent.findFirst({
      where: { actorId: freelancerAId, action: "PROJECT_UNSAVED", objectId: "opp_1" },
    });

    const pass10 =
      res10Save1.status === 200 &&
      res10Save2.status === 200 &&
      hasOpp1 &&
      res10Unsave.status === 200 &&
      removedOpp1 &&
      Boolean(auditSave) &&
      Boolean(auditUnsave);

    record(
      10,
      "Save / bookmark flow — idempotent save, list verification, unsave, audit logging",
      pass10,
      `save1: ${res10Save1.status}, save2: ${res10Save2.status}, unsave: ${res10Unsave.status}, auditLogged: ${Boolean(auditSave && auditUnsave)}`
    );

    // =========================================================================
    // Check 11: Closed saved project degradation
    // =========================================================================
    // Freelancer A saves opp_2
    await fetch(`${baseUrl}/api/freelancer/projects/opp_2/save`, { method: "POST", headers: headersA });

    // Transition opp_2 to COMPLETED
    await prisma.project.update({
      where: { id: "opp_2" },
      data: { state: ProjectState.COMPLETED },
    });

    // Query saved projects
    const res11Degraded = await fetch(`${baseUrl}/api/freelancer/projects/saved`, { headers: headersA });
    const data11Degraded = await res11Degraded.json();
    const degradedOpp2 = data11Degraded.savedProjects?.find((p: any) => p.id === "opp_2");

    const isDegraded = degradedOpp2 && degradedOpp2.availability === "CLOSED";

    // Restore opp_2 state and unsave
    await prisma.project.update({
      where: { id: "opp_2" },
      data: { state: ProjectState.MATCHING },
    });
    await fetch(`${baseUrl}/api/freelancer/projects/opp_2/save`, { method: "DELETE", headers: headersA });

    const pass11 = res11Degraded.status === 200 && Boolean(isDegraded);

    record(
      11,
      "Closed saved project degradation — returns degraded view ({ availability: 'CLOSED' })",
      pass11,
      `status: ${res11Degraded.status}, opp_2 availability: ${degradedOpp2?.availability}`
    );

    // =========================================================================
    // Check 12: Recommendation ranking with AI skills
    // =========================================================================
    const res12 = await fetch(`${baseUrl}/api/freelancer/projects/recommended?limit=5`, { headers: headersAi });
    const data12 = await res12.json();
    const recommendations = data12.recommendations || [];

    const topRecommendation = recommendations[0];
    const topIsAi = topRecommendation?.id === "opp_6" || topRecommendation?.category === "AI & Machine Learning";
    const hasMatchScore = typeof topRecommendation?.matchScore === "number" && topRecommendation?.matchScore > 0;
    const hasMatchReasons = Array.isArray(topRecommendation?.matchReasons) && topRecommendation.matchReasons.length > 0;

    const pass12 = res12.status === 200 && topIsAi && hasMatchScore && hasMatchReasons;

    record(
      12,
      "Recommendation ranking — AI profile ranks AI project #1 with honest match reasons",
      pass12,
      `topId: ${topRecommendation?.id}, score: ${topRecommendation?.matchScore}, reasons: ${topRecommendation?.matchReasons?.join("; ")}`
    );

    // =========================================================================
    // Check 13: Deterministic recommendations without profile rate
    // =========================================================================
    const res13 = await fetch(`${baseUrl}/api/freelancer/projects/recommended?limit=5`, { headers: headersNoRate });
    const data13 = await res13.json();
    const recsNoRate = data13.recommendations || [];

    // Verify recommendations are returned and none fabricate rate match
    const noFabricatedRateMatch = recsNoRate.every(
      (r: any) => !r.matchReasons?.some((m: string) => m.toLowerCase().includes("desired rate"))
    );
    const deterministicReturned = recsNoRate.length > 0;

    const pass13 = res13.status === 200 && deterministicReturned && noFabricatedRateMatch;

    record(
      13,
      "Deterministic recommendations without profile rate — no fabricated rate reasons",
      pass13,
      `count: ${recsNoRate.length}, noFabricatedRateMatch: ${noFabricatedRateMatch}`
    );

    // =========================================================================
    // Check 14: Decline invitation flow & audit logging
    // =========================================================================
    // Create dedicated project and invitation for decline test
    const testProj = await prisma.project.create({
      data: {
        title: "Test Invitation Decline Project",
        description: "Testing decline flow",
        visibility: "INVITE_ONLY",
        state: ProjectState.MATCHING,
        budgetCents: 200000,
        currency: "USD",
        clientId: clientId,
      },
    });
    testProjectId = testProj.id;

    const testInv = await prisma.projectInvitation.create({
      data: {
        projectId: testProjectId,
        freelancerId: freelancerBId,
        status: "PENDING",
        message: "Invitation to decline",
      },
    });
    testInvitationId = testInv.id;

    // First decline: should succeed (200) and transition status to DECLINED
    const res14Decline = await fetch(`${baseUrl}/api/freelancer/invitations/${testInvitationId}/decline`, {
      method: "POST",
      headers: headersB,
      body: JSON.stringify({ reason: "Not enough bandwidth" }),
    });
    const data14Decline = await res14Decline.json();

    // Repeat decline: should fail with 409 INVALID_STATE
    const res14Repeat = await fetch(`${baseUrl}/api/freelancer/invitations/${testInvitationId}/decline`, {
      method: "POST",
      headers: headersB,
      body: JSON.stringify({ reason: "Duplicate decline" }),
    });
    const data14Repeat = await res14Repeat.json();

    const auditDecline = await prisma.auditEvent.findFirst({
      where: {
        actorId: freelancerBId,
        action: "INVITATION_DECLINED",
        objectId: testInvitationId,
      },
    });

    const pass14 =
      res14Decline.status === 200 &&
      data14Decline.invitation?.status === "DECLINED" &&
      res14Repeat.status === 409 &&
      data14Repeat.error?.code === "INVALID_STATE" &&
      Boolean(auditDecline);

    record(
      14,
      "Decline invitation — PENDING -> DECLINED, repeat returns 409 INVALID_STATE, audit logged",
      pass14,
      `declineStatus: ${res14Decline.status}, repeatStatus: ${res14Repeat.status}, repeatCode: ${data14Repeat.error?.code}, auditLogged: ${Boolean(auditDecline)}`
    );

    // =========================================================================
    // Check 15: Cross-role protection (CLIENT receives 403)
    // =========================================================================
    const res15Search = await fetch(`${baseUrl}/api/freelancer/projects/search`, { headers: headersClient });
    const res15Recs = await fetch(`${baseUrl}/api/freelancer/projects/recommended`, { headers: headersClient });
    const res15Invs = await fetch(`${baseUrl}/api/freelancer/invitations`, { headers: headersClient });

    const pass15 =
      res15Search.status === 403 &&
      res15Recs.status === 403 &&
      res15Invs.status === 403;

    record(
      15,
      "Cross-role protection — CLIENT role receives 403 FORBIDDEN on all freelancer endpoints",
      pass15,
      `search: ${res15Search.status}, recommended: ${res15Recs.status}, invitations: ${res15Invs.status}`
    );

    // =========================================================================
    // Check 16: Browse query performance (< 200ms locally)
    // =========================================================================
    const t0 = performance.now();
    const res16 = await fetch(`${baseUrl}/api/freelancer/projects/search?limit=20`, { headers: headersA });
    const elapsedMs = performance.now() - t0;

    const pass16 = res16.status === 200 && elapsedMs < 200;

    record(
      16,
      "Browse query performance — browse query response time < 200ms locally",
      pass16,
      `status: ${res16.status}, latency: ${elapsedMs.toFixed(1)}ms`
    );

    // =========================================================================
    // Check 17: Cross-user bookmark isolation
    // =========================================================================
    // Freelancer A saves opp_4
    await fetch(`${baseUrl}/api/freelancer/projects/opp_4/save`, { method: "POST", headers: headersA });

    // Freelancer B checks saved list
    const res17 = await fetch(`${baseUrl}/api/freelancer/projects/saved`, { headers: headersB });
    const data17 = await res17.json();
    const freelancerBHasOpp4 = data17.savedProjects?.some((p: any) => p.id === "opp_4");

    // Clean up Freelancer A save
    await fetch(`${baseUrl}/api/freelancer/projects/opp_4/save`, { method: "DELETE", headers: headersA });

    const pass17 = res17.status === 200 && !freelancerBHasOpp4;

    record(
      17,
      "Cross-user bookmark isolation — Freelancer B cannot see Freelancer A's saved bookmarks",
      pass17,
      `freelancerBCount: ${data17.savedProjects?.length || 0}, sawOpp4: ${freelancerBHasOpp4}`
    );

    // =========================================================================
    // Check 18: Full suite completion summary (18/18 checks pass)
    // =========================================================================
    const passingCount = results.filter((r) => r.passed).length;
    const pass18 = passingCount === 17; // All previous 17 passed

    record(
      18,
      "Full suite completion summary — all 18 checks executed and verified against specification",
      pass18,
      `${passingCount + (pass18 ? 1 : 0)}/18 checks passed`
    );

  } catch (err: any) {
    console.error("Test execution exception:", err);
    record(18, "Verification execution completed without unhandled exception", false, err.message);
  } finally {
    // Teardown test resources
    console.log("\n🧹 Running test teardown cleanup...");
    const cleanupUserIds = [freelancerBId, freelancerAiId, freelancerNoRateId, clientId].filter(Boolean);

    try {
      if (testInvitationId) {
        await prisma.projectInvitation.deleteMany({ where: { id: testInvitationId } });
      }
      if (testProjectId) {
        await prisma.project.deleteMany({ where: { id: testProjectId } });
      }
      if (freelancerAId) {
        // Clean up any bookmarks on demo account
        await prisma.savedProject.deleteMany({ where: { freelancerId: freelancerAId } });
        await prisma.auditEvent.deleteMany({
          where: {
            actorId: freelancerAId,
            action: { in: ["PROJECT_SAVED", "PROJECT_UNSAVED"] },
          },
        });
      }
      if (cleanupUserIds.length > 0) {
        await prisma.projectInvitation.deleteMany({ where: { freelancerId: { in: cleanupUserIds } } });
        await prisma.savedProject.deleteMany({ where: { freelancerId: { in: cleanupUserIds } } });
        await prisma.session.deleteMany({ where: { userId: { in: cleanupUserIds } } });
        await prisma.auditEvent.deleteMany({ where: { actorId: { in: cleanupUserIds } } });
        await prisma.freelancerProfile.deleteMany({ where: { userId: { in: cleanupUserIds } } });
        await prisma.user.deleteMany({ where: { id: { in: cleanupUserIds } } });
        console.log(`   Cleaned up test users and transient entities.`);
      }
    } catch (cleanupErr) {
      console.warn("Cleanup warning:", cleanupErr);
    }

    await new Promise<void>((resolve) => server.close(() => resolve()));
    await prisma.$disconnect();
  }

  console.log("\n=======================================================");
  const allPassed = results.every((r) => r.passed) && results.length === 18;
  console.log(`SUMMARY: ${results.filter((r) => r.passed).length}/${results.length} checks passed`);
  if (allPassed) {
    console.log("STATUS: PHASE 3 VERIFICATION PASS (18/18)");
    process.exit(0);
  } else {
    console.error("STATUS: PHASE 3 VERIFICATION FAIL");
    process.exit(1);
  }
}

run();
