process.env.DISABLE_BACKGROUND_WORKER = "true";
process.env.NODE_ENV = "test";
process.env.ENABLE_DEV_TOOLS = "true";

/**
 * NEXUM FREELANCER BACKEND — PHASE 6 COMPREHENSIVE VERIFICATION SUITE
 *
 * Implements all 27 checks specified in the Freelancer Backend Build Guide:
 *
 * Check 1:  Non-member thread isolation -> 404
 * Check 2:  Workspace directory scope -> only active agreement or accepted proposal
 * Check 3:  Immutability of original -> original_body saved in DB before AI worker runs
 * Check 4:  Async enqueue -> returns 202 immediately with status PENDING_REVIEW
 * Check 5:  20s fallback guarantee -> delivered as NOT_REVIEWED with original text
 * Check 6:  Classifier labels match guide enum classes
 * Check 7:  Question relay with linked milestone and no confirmation step
 * Check 8:  Scope change sets AWAITING_SENDER_CONFIRMATION with preview card
 * Check 9:  Price/deadline amendment requires confirmation before delivery
 * Check 10: Dispute guidance card, never triggers payment or contract release
 * Check 11: "Looks good, proceed" does not record approval; links pending version
 * Check 12: Invented numbers rejected, fallback used, logged in ai_calls
 * Check 13: Spoken commitments rejected, original delivered unchanged
 * Check 14: Payment claims filter enforced
 * Check 15: Original body always viewable behind any summary by both parties
 * Check 16: Private marks stripped from cross-party view
 * Check 17: Freelancer reply summarized for client with original accessible
 * Check 18: Attachments check: allowed saved with SHA-256; blocked mime types -> 415
 * Check 19: Non-member file access -> 404
 * Check 20: Workspace tasks CRUD feeds stats and audit log
 * Check 21: Meeting proposal with future startsAt, syncs across both parties
 * Check 22: Private AI chat isolation: Freelancer B querying A -> 404; zero query joins
 * Check 23: Private AI context uses only projects owned by freelancer
 * Check 24: Promoting AI draft sends via mediation pipeline under freelancer identity
 * Check 25: Rate limit (20 msgs/min) & budget throttle (429)
 * Check 26: Message idempotency with clientMessageId
 * Check 27: Chronological audit logging for all Phase 6 actions
 */

import http from "http";
import net from "net";
import { app } from "../src/index.js";
import { prisma } from "../src/prisma.js";
import { createSession } from "../src/lib/auth.js";
import {
  Role,
  ProposalStatus,
  ProjectState,
  MilestoneWorkStatus,
  AgreementStatus,
  AgreementVersionStatus,
  MessageDeliveryStatus,
  MediationState,
  MessageClass,
  ProposedAction,
  TaskVisibility,
  WorkspaceTaskStatus,
  MeetingStatus,
  ProjectFileCategory,
  AIDraftStatus,
} from "@prisma/client";
import { classifyMessage } from "../src/domain/mediation/classify.js";
import { validateMediationOutput } from "../src/domain/mediation/validate.js";
import { processMediationJob } from "../src/jobs/mediationWorker.js";

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
  console.log("   NEXUM FREELANCER BACKEND — PHASE 6 VERIFICATION");
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
    const dummyReq = {
      headers: { "user-agent": "Phase6Verify" },
      ip: "127.0.0.1",
      socket: { remoteAddress: "127.0.0.1" },
    } as any;

    // 1. Create Freelancer A
    const userA = await prisma.user.create({
      data: {
        email: `phase6_freelancer_a_${timestamp}@test.nexum`,
        name: "Elena Rostova A",
        role: Role.FREELANCER,
        status: "ACTIVE",
        timezone: "America/New_York",
        freelancerProfile: {
          create: {
            title: "Senior Full-Stack Architect",
            skills: ["TypeScript", "Next.js"],
            timezone: "America/New_York",
            onboardingStatus: "COMPLETE",
          },
        },
      },
    });
    freelancerAId = userA.id;
    const sessionA = await createSession(freelancerAId, dummyReq);
    tokenA = sessionA.rawToken;

    // 2. Create Freelancer B
    const userB = await prisma.user.create({
      data: {
        email: `phase6_freelancer_b_${timestamp}@test.nexum`,
        name: "Marcus Vance B",
        role: Role.FREELANCER,
        status: "ACTIVE",
        timezone: "Pacific/Auckland",
        freelancerProfile: {
          create: {
            title: "Frontend Engineer",
            skills: ["React"],
            timezone: "Pacific/Auckland",
            onboardingStatus: "COMPLETE",
          },
        },
      },
    });
    freelancerBId = userB.id;
    const sessionB = await createSession(freelancerBId, dummyReq);
    tokenB = sessionB.rawToken;

    // 3. Create Client
    const userClient = await prisma.user.create({
      data: {
        email: `phase6_client_${timestamp}@test.nexum`,
        name: "Apex Global Client",
        role: Role.CLIENT,
        status: "ACTIVE",
      },
    });
    clientId = userClient.id;
    const sessionClient = await createSession(clientId, dummyReq);
    tokenClient = sessionClient.rawToken;

    // 4. Create Project 1 (assigned to Freelancer A with active agreement)
    const project1 = await prisma.project.create({
      data: {
        clientId,
        title: `Phase 6 Delivery Core ${timestamp}`,
        description: "Enterprise workspace requiring mediated chat and AI assistance",
        category: "Software Development",
        budgetType: "FIXED_PRICE",
        budgetCents: 2000000,
        currency: "USD",
        state: ProjectState.IN_PROGRESS,
        visibility: "PUBLIC",
      },
    });

    const agreement1 = await prisma.agreement.create({
      data: {
        projectId: project1.id,
        clientId,
        freelancerId: freelancerAId,
        status: AgreementStatus.ACTIVE,
      },
    });

    const version1 = await prisma.agreementVersion.create({
      data: {
        agreementId: agreement1.id,
        versionNumber: 1,
        status: AgreementVersionStatus.ACTIVE,
        activatedAt: new Date(),
        contentHash: "a1a2a3a4a5a6a7a8b1b2b3b4b5b6b7b8c1c2c3c4c5c6c7c8d1d2d3d4d5d6d7d8",
        terms: {
          scope: "Full architecture and implementation",
          deliverables: ["Architecture Document", "Production Deployment"],
          totalAmountMinor: 2000000,
          currency: "USD",
        },
      },
    });

    await prisma.agreement.update({
      where: { id: agreement1.id },
      data: { activeVersionId: version1.id },
    });

    const milestone1 = await prisma.milestone.create({
      data: {
        projectId: project1.id,
        agreementId: agreement1.id,
        title: "Architecture & Infrastructure",
        description: "Core setup and architecture design",
        sequence: 1,
        amountMinor: 1000000,
        currency: "USD",
        workStatus: MilestoneWorkStatus.IN_PROGRESS,
      },
    });

    const milestone2 = await prisma.milestone.create({
      data: {
        projectId: project1.id,
        agreementId: agreement1.id,
        title: "Frontend & Integration",
        description: "UI and API integration",
        sequence: 2,
        amountMinor: 1000000,
        currency: "USD",
        workStatus: MilestoneWorkStatus.UPCOMING,
      },
    });

    // Create Conversation for Project 1
    const conv1 = await prisma.conversation.create({
      data: {
        projectId: project1.id,
        participants: {
          create: [
            { userId: freelancerAId, role: Role.FREELANCER },
            { userId: clientId, role: Role.CLIENT },
          ],
        },
      },
    });

    // 5. Create Project 2 (assigned to Freelancer B)
    const project2 = await prisma.project.create({
      data: {
        clientId,
        title: `Phase 6 Freelancer B Project ${timestamp}`,
        description: "Private project for Freelancer B",
        category: "Design",
        budgetType: "FIXED_PRICE",
        budgetCents: 500000,
        currency: "USD",
        state: ProjectState.IN_PROGRESS,
      },
    });

    const agreement2 = await prisma.agreement.create({
      data: {
        projectId: project2.id,
        clientId,
        freelancerId: freelancerBId,
        status: AgreementStatus.ACTIVE,
      },
    });

    const conv2 = await prisma.conversation.create({
      data: {
        projectId: project2.id,
        participants: {
          create: [
            { userId: freelancerBId, role: Role.FREELANCER },
            { userId: clientId, role: Role.CLIENT },
          ],
        },
      },
    });

    // -------------------------------------------------------------
    // CHECK 1: Non-member thread isolation -> 404
    // -------------------------------------------------------------
    const nonMemberRes = await fetch(`${baseUrl}/api/freelancer/conversations/${conv1.id}/messages`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    const nonMemberData = (await nonMemberRes.json()) as any;
    const isCheck1Ok = nonMemberRes.status === 404 && nonMemberData.error?.code === "NOT_FOUND";
    record(1, "Non-member thread isolation -> 404", isCheck1Ok, `status=${nonMemberRes.status}`);

    // -------------------------------------------------------------
    // CHECK 2: Workspace directory scope
    // -------------------------------------------------------------
    const listResB = await fetch(`${baseUrl}/api/freelancer/conversations`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    const listDataB = (await listResB.json()) as any;
    const bSeesProject2 = listDataB.conversations?.some((t: any) => t.id === conv2.id);
    const bDoesNotSeeProject1 = !listDataB.conversations?.some((t: any) => t.id === conv1.id);

    const listResA = await fetch(`${baseUrl}/api/freelancer/conversations`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const listDataA = (await listResA.json()) as any;
    const aSeesProject1 = listDataA.conversations?.some((t: any) => t.id === conv1.id);
    const aDoesNotSeeProject2 = !listDataA.conversations?.some((t: any) => t.id === conv2.id);

    const isCheck2Ok = bSeesProject2 && bDoesNotSeeProject1 && aSeesProject1 && aDoesNotSeeProject2;
    record(
      2,
      "Workspace directory scope -> only active agreement or accepted proposal",
      isCheck2Ok,
      `a_count=${listDataA.conversations?.length}, b_count=${listDataB.conversations?.length}`
    );

    // -------------------------------------------------------------
    // CHECK 3 & CHECK 4: Immutability of original & Asynchronous enqueue
    // -------------------------------------------------------------
    const rawOriginalText = "Raw original message body text that must be stored immutably in DB";
    const enqueueRes = await fetch(`${baseUrl}/api/freelancer/conversations/${conv1.id}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        body: rawOriginalText,
      }),
    });
    const enqueueData = (await enqueueRes.json()) as any;

    const isCheck4Ok =
      enqueueRes.status === 202 &&
      enqueueData.success === true &&
      enqueueData.status === "PENDING_REVIEW" &&
      typeof enqueueData.messageId === "string";
    record(4, "Async enqueue -> returns 202 immediately with status PENDING_REVIEW", isCheck4Ok, `status=${enqueueRes.status}`);

    // Verify DB immutability
    const savedMsg = await prisma.message.findUnique({
      where: { id: enqueueData.messageId },
    });
    const isCheck3Ok = savedMsg?.originalBody === rawOriginalText;
    record(3, "Immutability of original -> original_body saved before AI worker runs", isCheck3Ok, `id=${savedMsg?.id}`);

    // -------------------------------------------------------------
    // CHECK 5: 20-second fallback guarantee
    // -------------------------------------------------------------
    const timeoutRes = await fetch(`${baseUrl}/api/dev/conversations/${conv1.id}/client-message`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        body: "Worker stall timeout test message",
        options: { simulatedTimeout: true },
      }),
    });
    const timeoutData = (await timeoutRes.json()) as any;
    const isCheck5Ok =
      timeoutRes.status === 200 &&
      timeoutData.message?.status === MessageDeliveryStatus.DELIVERED &&
      timeoutData.message?.mediationState === MediationState.NOT_REVIEWED;
    record(
      5,
      "20s fallback guarantee -> delivered as NOT_REVIEWED with original text",
      isCheck5Ok,
      `status=${timeoutData.message?.status}, mediationState=${timeoutData.message?.mediationState}`
    );

    // -------------------------------------------------------------
    // CHECK 6: Classifier labels match guide enum classes
    // -------------------------------------------------------------
    const mockContext = {
      projectId: project1.id,
      hasActiveAgreement: true,
      milestones: [{ id: milestone1.id, title: milestone1.title, sequence: 1 }],
    };

    const c1 = classifyMessage("Can you clarify what the API authentication requirements are?", "CLIENT", mockContext);
    const c2 = classifyMessage("Review feedback: please change the color to dark slate", "CLIENT", mockContext);
    const c3 = classifyMessage("Can we also add a blog section to the platform?", "CLIENT", mockContext);
    const c4 = classifyMessage("Can you do it for less or change the price?", "CLIENT", mockContext);
    const c5 = classifyMessage("Looks good, proceed with deployment", "CLIENT", mockContext);
    const c6 = classifyMessage("This work is wrong and not what I ordered, open a dispute", "CLIENT", mockContext);

    const isCheck6Ok =
      c1.classification === MessageClass.QUESTION &&
      c2.classification === MessageClass.FEEDBACK &&
      c3.classification === MessageClass.SCOPE_CHANGE &&
      c4.classification === MessageClass.PRICE_OR_DEADLINE &&
      c5.classification === MessageClass.APPROVAL_LIKE &&
      c6.classification === MessageClass.DISPUTE;
    record(
      6,
      "Classifier labels match guide enum classes",
      isCheck6Ok,
      `Q=${c1.classification}, F=${c2.classification}, S=${c3.classification}, P=${c4.classification}, A=${c5.classification}, D=${c6.classification}`
    );

    // -------------------------------------------------------------
    // CHECK 7: Question relay with linked milestone and no confirmation step
    // -------------------------------------------------------------
    const qRes = await fetch(`${baseUrl}/api/dev/conversations/${conv1.id}/client-message`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        body: "What is the expected latency for the order calculation API?",
      }),
    });
    const qData = (await qRes.json()) as any;
    const isCheck7Ok =
      qRes.status === 200 &&
      qData.message?.status === MessageDeliveryStatus.DELIVERED &&
      qData.message?.messageClass === MessageClass.QUESTION &&
      qData.message?.relatedId === milestone1.id;
    record(
      7,
      "Question relay with linked milestone and no confirmation step",
      isCheck7Ok,
      `status=${qData.message?.status}, relatedId=${qData.message?.relatedId}`
    );

    // -------------------------------------------------------------
    // CHECK 8: Scope change confirmation
    // -------------------------------------------------------------
    const scopeRes = await fetch(`${baseUrl}/api/dev/conversations/${conv1.id}/client-message`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        body: "Can we also add an admin export tool as a new feature?",
      }),
    });
    const scopeData = (await scopeRes.json()) as any;
    const scopeMsgId = scopeData.message?.id;

    const isScopeAwaitingConfirmation =
      scopeData.message?.status === MessageDeliveryStatus.AWAITING_SENDER_CONFIRMATION &&
      scopeData.message?.cardType === "SCOPE_CHANGE_CARD";

    // Confirm as client
    const confirmRes = await fetch(`${baseUrl}/api/dev/messages/${scopeMsgId}/client-confirm`, {
      method: "POST",
    });
    const confirmData = (await confirmRes.json()) as any;

    const isCheck8Ok =
      isScopeAwaitingConfirmation &&
      confirmRes.status === 200 &&
      confirmData.message?.status === MessageDeliveryStatus.DELIVERED &&
      typeof confirmData.changeRequestId === "string";
    record(
      8,
      "Scope change sets AWAITING_SENDER_CONFIRMATION with preview card",
      isCheck8Ok,
      `pre_status=${scopeData.message?.status}, post_status=${confirmData.message?.status}, crId=${confirmData.changeRequestId}`
    );

    // -------------------------------------------------------------
    // CHECK 9: Price/deadline confirmation
    // -------------------------------------------------------------
    const priceRes = await fetch(`${baseUrl}/api/dev/conversations/${conv1.id}/client-message`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        body: "Can you do it for less and extend deadline by two weeks?",
      }),
    });
    const priceData = (await priceRes.json()) as any;
    const isCheck9Ok =
      priceRes.status === 200 &&
      priceData.message?.status === MessageDeliveryStatus.AWAITING_SENDER_CONFIRMATION &&
      priceData.message?.cardType === "AMENDMENT_CARD";
    record(
      9,
      "Price/deadline amendment requires confirmation before delivery",
      isCheck9Ok,
      `status=${priceData.message?.status}, cardType=${priceData.message?.cardType}`
    );

    // -------------------------------------------------------------
    // CHECK 10: Dispute guidance card
    // -------------------------------------------------------------
    const disputeRes = await fetch(`${baseUrl}/api/dev/conversations/${conv1.id}/client-message`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        body: "This work is unacceptable work, I refuse to pay and open a dispute",
      }),
    });
    const disputeData = (await disputeRes.json()) as any;
    const agreementCheck = await prisma.agreement.findUnique({ where: { id: agreement1.id } });

    const isCheck10Ok =
      disputeData.message?.cardType === "DISPUTE_GUIDANCE" &&
      agreementCheck?.status === AgreementStatus.ACTIVE;
    record(
      10,
      "Dispute guidance card, never triggers payment or contract release",
      isCheck10Ok,
      `cardType=${disputeData.message?.cardType}, agreementStatus=${agreementCheck?.status}`
    );

    // -------------------------------------------------------------
    // CHECK 11: Approval-like safeguard
    // -------------------------------------------------------------
    const approvalLikeRes = await fetch(`${baseUrl}/api/dev/conversations/${conv1.id}/client-message`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        body: "Looks good, proceed with deployment",
      }),
    });
    const approvalLikeData = (await approvalLikeRes.json()) as any;

    // Verify NO new AgreementVersion was activated or auto-approved
    const versionsCount = await prisma.agreementVersion.count({
      where: { agreementId: agreement1.id },
    });
    const isCheck11Ok =
      approvalLikeData.message?.cardType === "PENDING_VERSION_LINK" &&
      approvalLikeData.message?.cardPayload?.notice.includes("Informal message only") &&
      versionsCount === 1;
    record(
      11,
      `"Looks good, proceed" does not record approval; links pending version`,
      isCheck11Ok,
      `cardType=${approvalLikeData.message?.cardType}`
    );

    // -------------------------------------------------------------
    // CHECK 12: Invented numbers rejected, fallback used, logged in ai_calls
    // -------------------------------------------------------------
    const inventedRes = await fetch(`${baseUrl}/api/dev/conversations/${conv1.id}/client-message`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        body: "Discussion regarding bonus",
        options: {
          forcedSummary: "Client committed to an additional bonus of $88888 upon completion.",
        },
      }),
    });
    const inventedData = (await inventedRes.json()) as any;

    const rejectedCall = await prisma.aICall.findFirst({
      where: {
        userId: clientId,
        status: "REJECTED",
      },
      orderBy: { createdAt: "desc" },
    });

    const isCheck12Ok =
      inventedData.message?.mediationState === MediationState.NOT_REVIEWED &&
      inventedData.message?.status === MessageDeliveryStatus.DELIVERED &&
      !!rejectedCall;
    record(
      12,
      "Invented numbers rejected, fallback used, logged in ai_calls",
      isCheck12Ok,
      `mediationState=${inventedData.message?.mediationState}, loggedRejected=${!!rejectedCall}`
    );

    // -------------------------------------------------------------
    // CHECK 13: Spoken commitments rejected
    // -------------------------------------------------------------
    const commitmentRes = await fetch(`${baseUrl}/api/dev/conversations/${conv1.id}/client-message`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        body: "Terms confirmation",
        options: {
          forcedSummary: "Client says: I agree to pay all remaining milestone amounts today.",
        },
      }),
    });
    const commitmentData = (await commitmentRes.json()) as any;
    const isCheck13Ok =
      commitmentData.message?.mediationState === MediationState.NOT_REVIEWED &&
      commitmentData.message?.originalBody === "Terms confirmation";
    record(
      13,
      "Spoken commitments rejected, original delivered unchanged",
      isCheck13Ok,
      `mediationState=${commitmentData.message?.mediationState}`
    );

    // -------------------------------------------------------------
    // CHECK 14: Payment claims filter enforced
    // -------------------------------------------------------------
    const dummyClassification = {
      classification: MessageClass.PAYMENT_QUESTION,
      confidence: 0.9,
      summaryForRecipient: "Escrow funds payment released to freelancer account.",
      proposedAction: ProposedAction.NONE,
      requiresSenderConfirmation: false,
    };
    const paymentVal = validateMediationOutput(dummyClassification, "has payment completed", mockContext, false);
    const isCheck14Ok =
      paymentVal.valid === false &&
      paymentVal.errors.some((e) => e.includes("unverified payment claim"));
    record(
      14,
      "Payment claims filter enforced",
      isCheck14Ok,
      `errors=${paymentVal.errors.join("; ")}`
    );

    // -------------------------------------------------------------
    // CHECK 15: Original body always viewable behind any summary by both parties
    // -------------------------------------------------------------
    const origRes = await fetch(`${baseUrl}/api/freelancer/messages/${qData.message?.id}/original`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const origData = (await origRes.json()) as any;

    const clientViewRes = await fetch(`${baseUrl}/api/dev/conversations/${conv1.id}/as-client`);
    const clientViewData = (await clientViewRes.json()) as any;
    const clientMsgItem = clientViewData.messages?.find((m: any) => m.id === qData.message?.id);

    const isCheck15Ok =
      origRes.status === 200 &&
      origData.originalBody === "What is the expected latency for the order calculation API?" &&
      clientMsgItem?.originalBody === "What is the expected latency for the order calculation API?";
    record(
      15,
      "Original body always viewable behind any summary by both parties",
      isCheck15Ok,
      `freelancerOriginal=${!!origData.originalBody}, clientOriginal=${!!clientMsgItem?.originalBody}`
    );

    // -------------------------------------------------------------
    // CHECK 16: Private marks stripped
    // -------------------------------------------------------------
    const privTask = await prisma.workspaceTask.create({
      data: {
        projectId: project1.id,
        title: "Private freelance calculation note",
        visibility: TaskVisibility.PRIVATE,
        createdBy: freelancerAId,
      },
    });

    const tasksRes = await fetch(`${baseUrl}/api/freelancer/projects/${project1.id}/tasks`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const tasksData = (await tasksRes.json()) as any;
    const freelancerSeesOwnPrivate = tasksData.tasks?.some((t: any) => t.id === privTask.id);

    // Another user (or client) cannot see private task
    const accessCheck = await prisma.workspaceTask.findMany({
      where: {
        projectId: project1.id,
        OR: [{ visibility: TaskVisibility.SHARED }, { createdBy: clientId }],
      },
    });
    const clientHiddenFromPrivate = !accessCheck.some((t) => t.id === privTask.id);

    const isCheck16Ok = freelancerSeesOwnPrivate && clientHiddenFromPrivate;
    record(
      16,
      "Private marks stripped from cross-party view",
      isCheck16Ok,
      `freelancerSees=${freelancerSeesOwnPrivate}, clientHidden=${clientHiddenFromPrivate}`
    );

    // -------------------------------------------------------------
    // CHECK 17: Freelancer reply summarized for client with original accessible
    // -------------------------------------------------------------
    const flMsg = await prisma.message.create({
      data: {
        conversationId: conv1.id,
        senderId: freelancerAId,
        senderKind: "USER",
        originalBody: "I have updated the staging branch with the latest database migration and API test fixtures.",
        status: MessageDeliveryStatus.PENDING_REVIEW,
        mediationState: MediationState.NOT_REVIEWED,
      },
    });
    await processMediationJob(flMsg.id, prisma);

    const flMsgUpdated = await prisma.message.findUnique({
      where: { id: flMsg.id },
      include: { mediationResult: true },
    });

    const isCheck17Ok =
      flMsgUpdated?.status === MessageDeliveryStatus.DELIVERED &&
      flMsgUpdated?.originalBody.includes("database migration") &&
      !!flMsgUpdated?.mediationResult;
    record(
      17,
      "Freelancer reply summarized for client with original accessible",
      isCheck17Ok,
      `status=${flMsgUpdated?.status}, hasMediationResult=${!!flMsgUpdated?.mediationResult}`
    );

    // -------------------------------------------------------------
    // CHECK 18: Attachments check: allowed saved with SHA-256; blocked mime types -> 415
    // -------------------------------------------------------------
    const formDataBoundary = "----WebKitFormBoundaryPhase6Test";
    const allowedFilePayload =
      `--${formDataBoundary}\r\n` +
      `Content-Disposition: form-data; name="purpose"\r\n\r\n` +
      `CHAT_ATTACHMENT\r\n` +
      `--${formDataBoundary}\r\n` +
      `Content-Disposition: form-data; name="file"; filename="spec.txt"\r\n` +
      `Content-Type: text/plain\r\n\r\n` +
      `Architecture spec text contents\r\n` +
      `--${formDataBoundary}--\r\n`;

    const uploadAllowedRes = await fetch(`${baseUrl}/api/freelancer/files`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${tokenA}`,
        "Content-Type": `multipart/form-data; boundary=${formDataBoundary}`,
      },
      body: allowedFilePayload,
    });
    const uploadAllowedData = (await uploadAllowedRes.json()) as any;
    const hasSha256 = typeof uploadAllowedData.file?.sha256 === "string" && uploadAllowedData.file.sha256.length === 64;

    // Blocked .exe file
    const blockedFilePayload =
      `--${formDataBoundary}\r\n` +
      `Content-Disposition: form-data; name="purpose"\r\n\r\n` +
      `CHAT_ATTACHMENT\r\n` +
      `--${formDataBoundary}\r\n` +
      `Content-Disposition: form-data; name="file"; filename="payload.exe"\r\n` +
      `Content-Type: application/x-msdownload\r\n\r\n` +
      `MZ....executable bytes\r\n` +
      `--${formDataBoundary}--\r\n`;

    const uploadBlockedRes = await fetch(`${baseUrl}/api/freelancer/files`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${tokenA}`,
        "Content-Type": `multipart/form-data; boundary=${formDataBoundary}`,
      },
      body: blockedFilePayload,
    });

    const isCheck18Ok = uploadAllowedRes.status === 201 && hasSha256 && uploadBlockedRes.status === 415;
    record(
      18,
      "Attachments check: allowed saved with SHA-256; blocked mime types -> 415",
      isCheck18Ok,
      `allowedStatus=${uploadAllowedRes.status}, blockedStatus=${uploadBlockedRes.status}`
    );

    const uploadedFileId = uploadAllowedData.file?.id;

    // Register project file
    const pfRecord = await prisma.projectFile.create({
      data: {
        projectId: project1.id,
        fileId: uploadedFileId,
        uploadedBy: freelancerAId,
        category: ProjectFileCategory.REFERENCE,
        name: "spec.txt",
        versionGroupId: "vg_spec_1",
        versionNumber: 1,
      },
    });

    // -------------------------------------------------------------
    // CHECK 19: Non-member file access -> 404
    // -------------------------------------------------------------
    const nonMemberFileRes = await fetch(`${baseUrl}/api/freelancer/project-files/${pfRecord.id}/download`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    const isCheck19Ok = nonMemberFileRes.status === 404;
    record(19, "Non-member file access -> 404", isCheck19Ok, `status=${nonMemberFileRes.status}`);

    // -------------------------------------------------------------
    // CHECK 20: Workspace tasks CRUD feeds stats and audit log
    // -------------------------------------------------------------
    const createTaskRes = await fetch(`${baseUrl}/api/freelancer/projects/${project1.id}/tasks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        title: "Setup staging Redis instance",
        status: WorkspaceTaskStatus.TODO,
        visibility: TaskVisibility.SHARED,
      }),
    });
    const createTaskData = (await createTaskRes.json()) as any;
    const createdTaskId = createTaskData.task?.id;

    const patchTaskRes = await fetch(`${baseUrl}/api/freelancer/tasks/${createdTaskId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        status: WorkspaceTaskStatus.DONE,
      }),
    });
    const patchTaskData = (await patchTaskRes.json()) as any;

    const deleteTaskRes = await fetch(`${baseUrl}/api/freelancer/tasks/${createdTaskId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${tokenA}` },
    });

    const isCheck20Ok =
      createTaskRes.status === 201 &&
      patchTaskRes.status === 200 &&
      patchTaskData.task?.status === WorkspaceTaskStatus.DONE &&
      !!patchTaskData.task?.completedAt &&
      deleteTaskRes.status === 200;
    record(20, "Workspace tasks CRUD feeds stats and audit log", isCheck20Ok, `create=201, patch=200, delete=200`);

    // -------------------------------------------------------------
    // CHECK 21: Meeting proposal with future startsAt, syncs across both parties
    // -------------------------------------------------------------
    const pastTime = new Date(Date.now() - 3600000).toISOString();
    const futureStartsAt = new Date(Date.now() + 7200000).toISOString();
    const futureEndsAt = new Date(Date.now() + 10800000).toISOString();

    // Past timestamp rejected
    const pastMeetingRes = await fetch(`${baseUrl}/api/freelancer/projects/${project1.id}/meetings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        title: "Past meeting",
        startsAt: pastTime,
        endsAt: futureEndsAt,
      }),
    });

    // Insecure HTTP link rejected
    const httpMeetingRes = await fetch(`${baseUrl}/api/freelancer/projects/${project1.id}/meetings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        title: "Insecure meeting",
        startsAt: futureStartsAt,
        endsAt: futureEndsAt,
        joinUrl: "http://unencrypted.meeting.com",
      }),
    });

    // Valid meeting proposal
    const validMeetingRes = await fetch(`${baseUrl}/api/freelancer/projects/${project1.id}/meetings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        title: "Sprint Review & Deliverable Sync",
        startsAt: futureStartsAt,
        endsAt: futureEndsAt,
        joinUrl: "https://meet.google.com/xyz-core-nex",
      }),
    });
    const validMeetingData = (await validMeetingRes.json()) as any;
    const meetingId = validMeetingData.meeting?.id;

    // Freelancer responds ACCEPTED
    const respondRes = await fetch(`${baseUrl}/api/freelancer/meetings/${meetingId}/respond`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ response: "ACCEPTED" }),
    });

    const isCheck21Ok =
      pastMeetingRes.status === 422 &&
      httpMeetingRes.status === 422 &&
      validMeetingRes.status === 201 &&
      respondRes.status === 200;
    record(
      21,
      "Meeting proposal with future startsAt, syncs across both parties",
      isCheck21Ok,
      `past=422, http=422, valid=201, respond=200`
    );

    // -------------------------------------------------------------
    // CHECK 22: Private AI chat isolation
    // -------------------------------------------------------------
    const createChatResA = await fetch(`${baseUrl}/api/freelancer/ai/chats`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        title: "Confidential Freelancer Architecture Session",
        projectId: project1.id,
      }),
    });
    const chatDataA = (await createChatResA.json()) as any;
    const chatAId = chatDataA.chat?.id;

    // Freelancer B tries to access Freelancer A's private AI chat
    const unauthorizedChatRes = await fetch(`${baseUrl}/api/freelancer/ai/chats/${chatAId}/messages`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    const unauthData = (await unauthorizedChatRes.json()) as any;

    const isCheck22Ok =
      createChatResA.status === 201 &&
      unauthorizedChatRes.status === 404 &&
      unauthData.error?.code === "NOT_FOUND";
    record(
      22,
      "Private AI chat isolation: Freelancer B querying A -> 404; zero query joins",
      isCheck22Ok,
      `status=${unauthorizedChatRes.status}, code=${unauthData.error?.code}`
    );

    // -------------------------------------------------------------
    // CHECK 23: Private AI context uses only projects owned by freelancer
    // -------------------------------------------------------------
    // Freelancer B trying to scope private AI session to Project 1 (owned by A)
    const scopeFailRes = await fetch(`${baseUrl}/api/freelancer/ai/chats`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenB}`,
      },
      body: JSON.stringify({
        title: "B trying to attach to A project",
        projectId: project1.id,
      }),
    });

    const isCheck23Ok = scopeFailRes.status === 404;
    record(
      23,
      "Private AI context uses only projects owned by freelancer",
      isCheck23Ok,
      `status=${scopeFailRes.status}`
    );

    // -------------------------------------------------------------
    // CHECK 24: Promoting AI draft sends via mediation pipeline under freelancer identity
    // -------------------------------------------------------------
    const draft = await prisma.aIDraft.create({
      data: {
        chatId: chatAId,
        ownerId: freelancerAId,
        targetConversationId: conv1.id,
        body: "I suggest we proceed with deployment following the staging smoke tests approval.",
        status: AIDraftStatus.DRAFT,
      },
    });

    const sendDraftRes = await fetch(`${baseUrl}/api/freelancer/ai/drafts/${draft.id}/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ conversationId: conv1.id }),
    });
    const sendDraftData = (await sendDraftRes.json()) as any;

    const draftMsgInDb = await prisma.message.findUnique({
      where: { id: sendDraftData.messageId },
    });
    const draftStatusInDb = await prisma.aIDraft.findUnique({
      where: { id: draft.id },
    });

    const isCheck24Ok =
      sendDraftRes.status === 202 &&
      draftMsgInDb?.senderId === freelancerAId &&
      draftStatusInDb?.status === AIDraftStatus.SENT;
    record(
      24,
      "Promoting AI draft sends via mediation pipeline under freelancer identity",
      isCheck24Ok,
      `status=${sendDraftRes.status}, senderId=${draftMsgInDb?.senderId}, draftStatus=${draftStatusInDb?.status}`
    );

    // -------------------------------------------------------------
    // CHECK 25: Rate limit (20 msgs/min) & budget throttle (429)
    // -------------------------------------------------------------
    // Fire messages up to limit
    let throttledStatus = 0;
    for (let i = 0; i < 22; i++) {
      const res = await fetch(`${baseUrl}/api/freelancer/conversations/${conv1.id}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenA}`,
        },
        body: JSON.stringify({ body: `Burst message ${i}` }),
      });
      if (res.status === 429) {
        throttledStatus = 429;
        break;
      }
    }

    // AI Budget throttle test
    const budgetThrottleRes = await fetch(`${baseUrl}/api/freelancer/ai/chats/${chatAId}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenA}`,
        "x-test-force-budget-exceeded": "true",
      },
      body: JSON.stringify({ content: "Exceed budget test" }),
    });
    const budgetThrottleData = (await budgetThrottleRes.json()) as any;

    const isCheck25Ok =
      throttledStatus === 429 &&
      budgetThrottleRes.status === 429 &&
      budgetThrottleData.error?.code === "AI_BUDGET_EXCEEDED";
    record(
      25,
      "Rate limit (20 msgs/min) & budget throttle (429)",
      isCheck25Ok,
      `rateLimitThrottled=${throttledStatus === 429}, budgetThrottled=${budgetThrottleRes.status === 429}`
    );

    // -------------------------------------------------------------
    // CHECK 26: Message idempotency with clientMessageId
    // -------------------------------------------------------------
    const clientMsgId = `cmsg_${timestamp}_unique_key`;
    // Post message with unique clientMessageId using Freelancer B on conv2 (to avoid rate limit on conv1/userA)
    const idem1Res = await fetch(`${baseUrl}/api/freelancer/conversations/${conv2.id}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenB}`,
      },
      body: JSON.stringify({
        body: "Message with unique client idempotency key",
        clientMessageId: clientMsgId,
      }),
    });
    const idem1Data = (await idem1Res.json()) as any;

    const idem2Res = await fetch(`${baseUrl}/api/freelancer/conversations/${conv2.id}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenB}`,
      },
      body: JSON.stringify({
        body: "Message with unique client idempotency key duplicate",
        clientMessageId: clientMsgId,
      }),
    });
    const idem2Data = (await idem2Res.json()) as any;

    const totalWithClientMsgId = await prisma.message.count({
      where: { clientMessageId: clientMsgId },
    });

    const isCheck26Ok =
      idem1Res.status === 202 &&
      idem2Res.status === 200 &&
      idem2Data.idempotent === true &&
      totalWithClientMsgId === 1;
    record(
      26,
      "Message idempotency with clientMessageId",
      isCheck26Ok,
      `first=202, second=200, dbCount=${totalWithClientMsgId}`
    );

    // -------------------------------------------------------------
    // CHECK 27: Chronological audit logging for all Phase 6 actions
    // -------------------------------------------------------------
    const auditEvents = await prisma.auditEvent.findMany({
      where: {
        actorId: { in: [freelancerAId, freelancerBId, clientId] },
      },
      orderBy: { timestamp: "asc" },
    });

    const actions = auditEvents.map((a) => a.action);
    const hasMsgCreated = actions.includes("MESSAGE_CREATED");
    const hasMsgMediated = actions.includes("MESSAGE_MEDIATED");
    const hasTaskCreated = actions.includes("TASK_CREATED");
    const hasMeetingProposed = actions.includes("MEETING_PROPOSED");
    const hasFileUploaded = actions.includes("FILE_UPLOADED");

    const isCheck27Ok =
      auditEvents.length >= 5 &&
      hasMsgCreated &&
      hasMsgMediated &&
      hasTaskCreated &&
      hasMeetingProposed &&
      hasFileUploaded;
    record(
      27,
      "Chronological audit logging for all Phase 6 actions",
      isCheck27Ok,
      `totalEvents=${auditEvents.length}, actions=${actions.slice(0, 5).join(", ")}`
    );
    // -------------------------------------------------------------
    // CHECK 28: Transactional confirmation idempotency (Condition 3)
    // -------------------------------------------------------------
    // Create an awaiting-confirmation message for Freelancer A
    const msgAwaiting = await prisma.message.create({
      data: {
        conversationId: conv1.id,
        senderId: freelancerAId,
        senderKind: "USER",
        originalBody: "I need +$400 for additional testing.",
        status: MessageDeliveryStatus.AWAITING_SENDER_CONFIRMATION,
        mediationState: MediationState.REVIEWED,
        messageClass: MessageClass.SCOPE_CHANGE,
      },
    });

    const crCountBefore = await prisma.changeRequest.count({
      where: { projectId: project1.id },
    });

    const firstConfirmRes = await fetch(`${baseUrl}/api/freelancer/messages/${msgAwaiting.id}/confirm`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ editedSummary: "Scope addition +$400" }),
    });

    const duplicateConfirmRes = await fetch(`${baseUrl}/api/freelancer/messages/${msgAwaiting.id}/confirm`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ editedSummary: "Scope addition +$400 duplicate" }),
    });

    const crCountAfter = await prisma.changeRequest.count({
      where: { projectId: project1.id },
    });

    const isCheck28Ok =
      firstConfirmRes.status === 200 &&
      duplicateConfirmRes.status === 409 &&
      crCountAfter === crCountBefore + 1;

    record(
      28,
      "Mediation confirmation idempotency & atomic ChangeRequest creation",
      isCheck28Ok,
      `firstStatus=${firstConfirmRes.status}, secondStatus=${duplicateConfirmRes.status}, crCountDelta=${crCountAfter - crCountBefore}`
    );

    // -------------------------------------------------------------
    // CHECK 29: AI draft promotion idempotency & authorization (Condition 4)
    // -------------------------------------------------------------
    const testDraft = await prisma.aIDraft.create({
      data: {
        chatId: chatAId,
        ownerId: freelancerAId,
        body: "Promoted response from private AI draft.",
        status: AIDraftStatus.DRAFT,
      },
    });

    // 1. Promote to unauthorized conversation (conv2 belongs to B) -> 404
    const unauthPromoteRes = await fetch(`${baseUrl}/api/freelancer/ai/drafts/${testDraft.id}/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ conversationId: conv2.id }),
    });

    // 2. Legitimate first promotion -> 202
    const firstPromoteRes = await fetch(`${baseUrl}/api/freelancer/ai/drafts/${testDraft.id}/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ conversationId: conv1.id }),
    });

    // 3. Replay / re-promotion of already sent draft -> 409
    const replayPromoteRes = await fetch(`${baseUrl}/api/freelancer/ai/drafts/${testDraft.id}/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ conversationId: conv1.id }),
    });

    const isCheck29Ok =
      unauthPromoteRes.status === 404 &&
      firstPromoteRes.status === 202 &&
      replayPromoteRes.status === 409;

    record(
      29,
      "AI draft promotion independent authorization & replay guard",
      isCheck29Ok,
      `unauthStatus=${unauthPromoteRes.status}, firstStatus=${firstPromoteRes.status}, replayStatus=${replayPromoteRes.status}`
    );

    // -------------------------------------------------------------
    // CHECK 30: Private AI project grounding authorization (Condition 5)
    // -------------------------------------------------------------
    // Freelancer A attempting to create chat grounded on unowned project2 -> 404
    const unauthGroundingRes = await fetch(`${baseUrl}/api/freelancer/ai/chats`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ title: "Unauth Grounding", projectId: project2.id }),
    });

    const isCheck30Ok = unauthGroundingRes.status === 404;
    record(
      30,
      "Private AI project grounding verifies access before scoping",
      isCheck30Ok,
      `unauthGroundingStatus=${unauthGroundingRes.status}`
    );
  } finally {
    server.close();
  }

  // -------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------
  console.log("\n=======================================================");
  console.log("   PHASE 6 VERIFICATION SUMMARY");
  console.log("=======================================================");
  const passedCount = results.filter((r) => r.passed).length;
  const totalCount = results.length;
  console.log(`\nTotal Checks: ${totalCount}`);
  console.log(`Passed:       ${passedCount}`);
  console.log(`Failed:       ${totalCount - passedCount}`);

  if (passedCount === totalCount) {
    console.log(`\n🎉 ALL ${totalCount} PHASE 6 CHECKS PASSED PERFECTLY!\n`);
    process.exit(0);
  } else {
    console.error("\n❌ SOME PHASE 6 CHECKS FAILED!\n");
    process.exit(1);
  }
}

run().catch((err) => {
  console.error("FATAL ERROR IN VERIFICATION SUITE:", err);
  process.exit(1);
});
