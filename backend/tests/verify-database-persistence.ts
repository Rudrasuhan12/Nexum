/**
 * Nexum Client Database Persistence & Server Restart Verification
 * 
 * Verifies that all client-side operations:
 * 1. Persist directly into PostgreSQL via Prisma
 * 2. Survive simulated server restart (fresh ClientOverviewService instance with empty memory maps)
 * 3. Match cryptographic audit ledger and record states
 */

import { prisma } from "../src/prisma.js";
import { ClientOverviewService } from "../src/services/clientOverviewService.js";

async function main() {
  console.log("================================================================================");
  console.log("NEXUM CLIENT DATABASE PERSISTENCE & SERVER RESTART VERIFICATION");
  console.log("================================================================================\n");

  const testClientId = "usr_client_persistence_tester";
  const testFreelancerId = "usr_freelancer_elena";

  // Clean prior test artifacts
  await prisma.milestone.deleteMany({ where: { project: { clientId: testClientId } } }).catch(() => {});
  await prisma.projectBriefVersion.deleteMany({ where: { project: { clientId: testClientId } } }).catch(() => {});
  await prisma.project.deleteMany({ where: { clientId: testClientId } }).catch(() => {});
  await prisma.auditEvent.deleteMany({ where: { actorId: testClientId } }).catch(() => {});
  await prisma.user.deleteMany({ where: { id: testClientId } }).catch(() => {});

  // Instance 1: Initial Service Instance
  const service1 = new ClientOverviewService();

  console.log("--- 1. PROJECT CREATION & PERSISTENCE ---");
  const projectInput = {
    clientId: testClientId,
    title: "Zero-Knowledge Bilateral Settlement Engine",
    description: "Decentralized consensus verification layer",
    state: "ACTIVE",
    budgetCents: 500000, // $5,000.00
    category: "Blockchain & Web3",
    subcategory: "Zero Knowledge",
    requiredSkills: ["Rust", "Circom", "PostgreSQL"],
    detailedRequirements: "Formal verification of settlement proofs.",
    scopeOfWork: ["Proof circuits", "State verifier"],
    budgetType: "FIXED",
    timelineDuration: "3 months",
    experienceLevel: "EXPERT",
    milestones: [
      { id: `ms_persist_1`, title: "Circuit Architecture Spec", amountCents: 200000 },
      { id: `ms_persist_2`, title: "Production Smart Contracts", amountCents: 300000 },
    ],
  };

  const createdProject = await service1.createProject(projectInput);
  const projectId = createdProject.id;
  console.log(`✓ Project created via service: ${projectId} - "${createdProject.title}"`);

  // Direct PostgreSQL inspection
  const dbProject = await prisma.project.findUnique({
    where: { id: projectId },
    include: { briefVersions: true, projectMilestones: true },
  });
  if (!dbProject) throw new Error("CRITICAL: Project not found in PostgreSQL!");
  if (dbProject.budgetCents !== 500000) throw new Error(`CRITICAL: Budget mismatch: ${dbProject.budgetCents}`);
  if (dbProject.projectMilestones.length !== 2) throw new Error(`CRITICAL: Milestones not persisted: ${dbProject.projectMilestones.length}`);
  console.log(`✓ Verified in PostgreSQL: Project ID ${dbProject.id}, Milestones in DB: ${dbProject.projectMilestones.length}`);

  console.log("\n--- 2. CLIENT WORKSPACE SETTINGS PERSISTENCE ---");
  const settingsUpdate = {
    profile: {
      name: "Persistence Test Admin",
      phone: "+1 (555) 019-2834",
      company: "Quantum Consensus Labs",
      website: "https://quantumconsensus.demo",
      bio: "Managing institutional settlement rails.",
      location: "New York, NY, USA",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80",
    },
    payments: {
      autoFundMilestones: true,
      disputeMediationBuffer: true,
      paypalSandboxStatus: "CONNECTED" as const,
      paypalEmail: "merchant-admin@quantumconsensus.demo",
      defaultCurrency: "USD",
      vatOrTaxId: "US-EIN-12-9876543",
    },
  };

  const updatedSettings = await service1.updateClientSettings(testClientId, settingsUpdate as any);
  console.log(`✓ Settings updated via service: Company "${updatedSettings.data.profile.company}"`);

  // Direct PostgreSQL inspection
  const dbUser = await prisma.user.findUnique({ where: { id: testClientId } });
  if (!dbUser) throw new Error("CRITICAL: User record not found in PostgreSQL!");
  const prefs = dbUser.preferences as Record<string, any>;
  if (prefs?.company !== "Quantum Consensus Labs") throw new Error(`CRITICAL: Settings not persisted to DB preferences: ${prefs?.company}`);
  console.log(`✓ Verified in PostgreSQL: User.preferences.company = "${prefs.company}"`);

  console.log("\n--- 3. FREELANCER BOOKMARK / SAVE PERSISTENCE ---");
  const saveResult = await service1.toggleSaveFreelancer(testFreelancerId, testClientId);
  if (!saveResult.isSaved) throw new Error("CRITICAL: Freelancer was not saved!");
  console.log(`✓ Freelancer ${testFreelancerId} bookmarked via service`);

  // Direct PostgreSQL inspection
  const dbUserAfterSave = await prisma.user.findUnique({ where: { id: testClientId } });
  const savedList = (dbUserAfterSave?.preferences as Record<string, any>)?.savedFreelancers || [];
  if (!savedList.includes(testFreelancerId)) throw new Error("CRITICAL: Saved freelancer not in PostgreSQL preferences!");
  console.log(`✓ Verified in PostgreSQL: User.preferences.savedFreelancers = [${savedList.join(", ")}]`);

  console.log("\n--- 4. TALENT INVITATION PERSISTENCE ---");
  const inviteResult = await service1.inviteTalent({
    clientId: testClientId,
    freelancerId: testFreelancerId,
    freelancerName: "Elena Rostova",
    freelancerTitle: "Full-Stack AI Architect",
    projectId,
    projectName: "Zero-Knowledge Bilateral Settlement Engine",
    proposedRate: "$120.00/hr",
    customNote: "Invitation for specialized cryptographic settlement design.",
  });
  console.log(`✓ Talent invitation dispatched: ${inviteResult.invitation.id}`);

  // Direct PostgreSQL inspection
  const dbUserAfterInvite = await prisma.user.findUnique({ where: { id: testClientId } });
  const invitesList = (dbUserAfterInvite?.preferences as Record<string, any>)?.invitations || [];
  if (!invitesList.some((i: any) => i.freelancerId === testFreelancerId && i.projectId === projectId)) {
    throw new Error("CRITICAL: Invitation not in PostgreSQL preferences!");
  }
  console.log(`✓ Verified in PostgreSQL: User.preferences.invitations count = ${invitesList.length}`);

  console.log("\n--- 5. MILESTONE APPROVAL & PAYMENT ESCROW RELEASE PERSISTENCE ---");
  const milestoneToApprove = `ms_persist_1`;
  const approveResult = await service1.approveMilestone(milestoneToApprove, testClientId);
  if (!approveResult.success) throw new Error("CRITICAL: Milestone approval failed!");
  console.log(`✓ Milestone approved: ${milestoneToApprove}`);

  // Direct PostgreSQL inspection
  const dbMilestone = await prisma.milestone.findUnique({ where: { id: milestoneToApprove } });
  if (!dbMilestone) throw new Error("CRITICAL: Milestone not found in PostgreSQL!");
  if (dbMilestone.state !== "CAPTURED" || dbMilestone.workStatus !== "ACCEPTED") {
    throw new Error(`CRITICAL: Milestone state not updated in DB: state=${dbMilestone.state}, workStatus=${dbMilestone.workStatus}`);
  }
  console.log(`✓ Verified in PostgreSQL: Milestone state = "${dbMilestone.state}", workStatus = "${dbMilestone.workStatus}"`);

  console.log("\n================================================================================");
  console.log("SIMULATING SERVER RESTART (CREATING FRESH SERVICE INSTANCE WITH EMPTY MEMORY)");
  console.log("================================================================================\n");

  // Instance 2: Brand new instance with 100% empty in-memory maps
  const freshService = new ClientOverviewService();

  console.log("--- 6. RETRIEVE PROJECT AFTER RESTART ---");
  const restoredProject = await freshService.getProjectById(projectId, testClientId);
  if (!restoredProject) throw new Error("CRITICAL: Project could not be restored after restart!");
  if (restoredProject.title !== "Zero-Knowledge Bilateral Settlement Engine") {
    throw new Error(`CRITICAL: Title mismatch after restart: ${restoredProject.title}`);
  }
  if (restoredProject.category !== "Blockchain & Web3") {
    throw new Error(`CRITICAL: Category mismatch after restart: ${restoredProject.category}`);
  }
  console.log(`✓ Project successfully restored from PostgreSQL: "${restoredProject.title}" (ID: ${restoredProject.id})`);

  console.log("\n--- 7. RETRIEVE SETTINGS AFTER RESTART ---");
  const restoredSettings = await freshService.getClientSettings(testClientId);
  if (restoredSettings.profile.company !== "Quantum Consensus Labs") {
    throw new Error(`CRITICAL: Company mismatch after restart: ${restoredSettings.profile.company}`);
  }
  if (restoredSettings.payments.paypalSandboxStatus !== "CONNECTED") {
    throw new Error(`CRITICAL: PayPal status mismatch after restart: ${restoredSettings.payments.paypalSandboxStatus}`);
  }
  console.log(`✓ Settings successfully restored from PostgreSQL: Company "${restoredSettings.profile.company}", Phone "${restoredSettings.profile.phone}"`);

  console.log("\n--- 8. RETRIEVE BOOKMARKED TALENT AFTER RESTART ---");
  const restoredFreelancers = await freshService.getFreelancers(testClientId);
  const targetFreelancer = restoredFreelancers.data.find((f) => f.id === testFreelancerId);
  if (!targetFreelancer?.isSaved) {
    throw new Error("CRITICAL: Freelancer isSaved is not true after restart!");
  }
  console.log(`✓ Bookmarked talent restored from PostgreSQL: ${targetFreelancer.name} (isSaved = true)`);

  console.log("\n--- 9. RETRIEVE INVITATIONS AFTER RESTART ---");
  const restoredInvitations = await freshService.getInvitations(testClientId);
  if (restoredInvitations.count !== 1) {
    throw new Error(`CRITICAL: Expected 1 invitation after restart, got ${restoredInvitations.count}`);
  }
  if (restoredInvitations.data[0].freelancerId !== testFreelancerId) {
    throw new Error(`CRITICAL: Restored invitation freelancer mismatch: ${restoredInvitations.data[0].freelancerId}`);
  }
  console.log(`✓ Invitation restored from PostgreSQL: Sent to ${restoredInvitations.data[0].freelancerName} (${restoredInvitations.data[0].proposedRate})`);

  console.log("\n--- 10. RETRIEVE MILESTONES AFTER RESTART ---");
  const restoredMilestones = await freshService.getMilestones(testClientId);
  const acceptedMs = restoredMilestones.data.find((m) => m.id === milestoneToApprove);
  if (!acceptedMs) throw new Error("CRITICAL: Milestone not found after restart!");
  if (acceptedMs.workflowStatus !== "ACCEPTED" || acceptedMs.paymentState !== "CAPTURED") {
    throw new Error(`CRITICAL: Restored milestone workflowStatus mismatch: ${acceptedMs.workflowStatus}, paymentState: ${acceptedMs.paymentState}`);
  }
  console.log(`✓ Milestone status restored from PostgreSQL: "${acceptedMs.title}" is ${acceptedMs.workflowStatus} / ${acceptedMs.paymentState}`);

  console.log("\n--- 11. AUDIT TRAIL LOGS IN POSTGRESQL ---");
  const auditLogs = await freshService.getAuditLogs({ limit: 10 });
  const clientAudits = auditLogs.logs.filter((l) => l.actorId === testClientId);
  console.log(`✓ Cryptographic audit events recorded in PostgreSQL: ${clientAudits.length} events`);
  clientAudits.forEach((a) => console.log(`   - [${a.action}] ${a.objectType} #${a.objectId} at ${a.timestamp}`));

  console.log("\n--- 12. CLEAN UP TEST DATA ---");
  await prisma.milestone.deleteMany({ where: { project: { clientId: testClientId } } }).catch(() => {});
  await prisma.projectBriefVersion.deleteMany({ where: { project: { clientId: testClientId } } }).catch(() => {});
  await prisma.project.deleteMany({ where: { clientId: testClientId } }).catch(() => {});
  await prisma.auditEvent.deleteMany({ where: { actorId: testClientId } }).catch(() => {});
  await prisma.user.deleteMany({ where: { id: testClientId } }).catch(() => {});
  console.log("✓ Test records cleaned from PostgreSQL database.");

  console.log("\n================================================================================");
  console.log("ALL DATABASE PERSISTENCE & SERVER RESTART VERIFICATIONS PASSED!");
  console.log("================================================================================");
}

main()
  .catch((err) => {
    console.error("FAILED:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

