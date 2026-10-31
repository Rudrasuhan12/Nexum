import { describe, it, expect, beforeEach } from "vitest";
import { clientOverviewService } from "../src/services/clientOverviewService.js";

describe("Client Overview Real Database & Empty State Engine", () => {
  beforeEach(() => {
    clientOverviewService.reset();
  });

  it("should return the truthful clean empty state when a client has zero projects", async () => {
    const data = await clientOverviewService.getOverview("usr_new_client_empty");

    // All mock data should be GONE; clean empty state must be returned
    expect(data.attentionItems.length).toBe(0);
    expect(data.activeProjects.length).toBe(0);
    expect(data.upcomingMilestones.length).toBe(0);

    const activeProjectsCard = data.summaryCards.find((c) => c.id === "active_projects");
    expect(activeProjectsCard?.value).toBe("0");

    const pendingApprovalsCard = data.summaryCards.find((c) => c.id === "pending_approvals");
    expect(pendingApprovalsCard?.value).toBe("0");
    expect(pendingApprovalsCard?.trend).toBe("All caught up");

    const escrowCard = data.summaryCards.find((c) => c.id === "funded_escrow");
    expect(escrowCard?.value).toBe("$0");

    const milestonesCard = data.summaryCards.find((c) => c.id === "milestones_done");
    expect(milestonesCard?.value).toBe("0 / 0");

    // Real talent recommendations should be available to hire
    expect(data.recommendedFreelancers.length).toBeGreaterThan(0);
  });

  it("should dynamically compute real KPIs and project cards when a project is created", async () => {
    const clientId = "usr_client_test_1";

    // Client creates a real project with 3 milestones ($3,500 total)
    await clientOverviewService.createProject({
      clientId,
      title: "AI-Powered Educational Analytics Dashboard",
      description: "Student analytics and dashboard platform",
      budgetCents: 350000, // $3,500.00
      milestones: [
        { title: "Architecture & DB Schema", amountCents: 100000 },
        { title: "Core Dashboard APIs", amountCents: 150000 },
        { title: "Cloud Deployment & QA", amountCents: 100000 },
      ],
    });

    const data = await clientOverviewService.getOverview(clientId);

    // Verify real KPIs computed from created project
    expect(data.activeProjects.length).toBe(1);
    expect(data.activeProjects[0].name).toBe("AI-Powered Educational Analytics Dashboard");
    expect(data.activeProjects[0].budget).toBe("$3,500.00");

    const activeProjectsCard = data.summaryCards.find((c) => c.id === "active_projects");
    expect(activeProjectsCard?.value).toBe("1");

    // Milestone 1 starts in review / approved escrow
    expect(data.attentionItems.length).toBe(1);
    expect(data.attentionItems[0].title).toContain("Architecture & DB Schema Review");
    expect(data.attentionItems[0].amount).toBe("$1,000.00");

    const pendingApprovalsCard = data.summaryCards.find((c) => c.id === "pending_approvals");
    expect(pendingApprovalsCard?.value).toBe("1");

    const escrowCard = data.summaryCards.find((c) => c.id === "funded_escrow");
    expect(escrowCard?.value).toBe("$1,000");

    expect(data.upcomingMilestones.length).toBe(3);
  });

  it("should transition back to empty attention state when deliverable is approved", async () => {
    const clientId = "usr_client_test_2";

    const project = await clientOverviewService.createProject({
      clientId,
      title: "Mobile App Payment Integration",
      description: "PayPal integration",
      budgetCents: 100000,
      milestones: [{ title: "Deliverable Phase 1", amountCents: 100000 }],
    });

    const milestoneId = project.proposals[0].milestones[0].id;

    // Approve milestone
    const result = await clientOverviewService.approveMilestone(milestoneId, clientId);
    expect(result.success).toBe(true);

    const updated = await clientOverviewService.getOverview(clientId);

    // Attention items should be 0 (All caught up!)
    expect(updated.attentionItems.length).toBe(0);

    const pendingApprovalsCard = updated.summaryCards.find((c) => c.id === "pending_approvals");
    expect(pendingApprovalsCard?.value).toBe("0");
    expect(pendingApprovalsCard?.trend).toBe("All caught up");

    const milestonesCard = updated.summaryCards.find((c) => c.id === "milestones_done");
    expect(milestonesCard?.value).toBe("1 / 1");
    expect(milestonesCard?.trend).toBe("100% total progress");
  });
});
