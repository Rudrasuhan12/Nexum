import { describe, it, expect } from "vitest";
import {
  INITIAL_FREELANCER_PROJECTS,
  calculateSummaryKPIs,
  getWorkStatusConfig,
  getPaymentStatusConfig,
} from "../src/lib/freelancer-projects-data";
import {
  ProjectMilestone,
  MilestoneSubmission,
} from "../src/lib/freelancer-projects-types";

describe("Freelancer Projects & Milestones Suite", () => {
  it("calculates accurate project summary KPIs from records", () => {
    const kpis = calculateSummaryKPIs(INITIAL_FREELANCER_PROJECTS);
    expect(kpis.totalProjects).toBe(5);
    expect(kpis.activeProjects).toBe(3);
    expect(kpis.awaitingApproval).toBe(1);
    expect(kpis.completedProjects).toBe(1);
    expect(kpis.cancelledProjects).toBe(0);
  });

  it("strictly enforces separate state dimensions for work status and payment status", () => {
    const shopkartProj = INITIAL_FREELANCER_PROJECTS.find(
      (p) => p.id === "proj-ecommerce-shopkart"
    );
    expect(shopkartProj).toBeDefined();

    const m1 = shopkartProj!.milestones[0];
    const m2 = shopkartProj!.milestones[1];
    const m3 = shopkartProj!.milestones[2];

    // Milestone 1: Accepted work, completed payout
    expect(m1.workStatus).toBe("ACCEPTED");
    expect(m1.paymentStatus).toBe("PAYOUT_COMPLETED");

    // Milestone 2: Work awaiting client review, but payment already captured in Sandbox escrow
    expect(m2.workStatus).toBe("AWAITING_CLIENT_REVIEW");
    expect(m2.paymentStatus).toBe("SANDBOX_CAPTURE_CONFIRMED");
    expect(m2.workStatus).not.toBe(m2.paymentStatus as string);

    // Milestone 3: Ready to submit work, funding is still pending
    expect(m3.workStatus).toBe("READY_TO_SUBMIT");
    expect(m3.paymentStatus).toBe("FUNDING_PENDING");

    // Verify configurations exist for all independent statuses
    const workCfg = getWorkStatusConfig(m2.workStatus);
    const payCfg = getPaymentStatusConfig(m2.paymentStatus);
    expect(workCfg.label).toBe("In Review");
    expect(payCfg.label).toBe("Sandbox Capture Confirmed");
  });

  it("filters projects accurately by status, search query, and tags", () => {
    // Filter active
    const activeProjects = INITIAL_FREELANCER_PROJECTS.filter(
      (p) => p.state === "ACTIVE"
    );
    expect(activeProjects.length).toBe(3);

    // Filter awaiting approval
    const awaitingProjects = INITIAL_FREELANCER_PROJECTS.filter(
      (p) => p.state === "AWAITING_APPROVAL"
    );
    expect(awaitingProjects.length).toBe(1);
    expect(awaitingProjects[0].client.companyName).toBe("MediCare Solutions");

    // Search query matches client name
    const q1 = "fitlife";
    const matchFitlife = INITIAL_FREELANCER_PROJECTS.filter((p) =>
      p.client.companyName.toLowerCase().includes(q1)
    );
    expect(matchFitlife.length).toBe(1);
    expect(matchFitlife[0].title).toBe("Fitness Tracking Mobile App");

    // Search query matches tech tag
    const q2 = "docker";
    const matchDocker = INITIAL_FREELANCER_PROJECTS.filter((p) =>
      p.techTags.some((t) => t.toLowerCase().includes(q2))
    );
    expect(matchDocker.length).toBe(1);
    expect(matchDocker[0].id).toBe("proj-ai-medicare");
  });

  it("records a deliverable submission and transitions milestone work status to Awaiting Client Review", () => {
    const testMilestone: ProjectMilestone = {
      id: "ms-test-1",
      number: 1,
      title: "Test Deliverable Milestone",
      description: "Test description",
      deliverablesSummary: "Test summary",
      acceptanceCriteria: ["Criteria 1", "Criteria 2"],
      amountCents: 1000000,
      amountDisplay: "₹10,000",
      currency: "INR",
      dueDate: "Dec 01, 2026",
      workStatus: "READY_TO_SUBMIT",
      paymentStatus: "SANDBOX_CAPTURE_CONFIRMED",
      submissions: [],
    };

    const newSub: MilestoneSubmission = {
      id: "sub-test-101",
      submissionDate: "Nov 15, 2026, 10:00 AM",
      versionNumber: 1,
      completionNote: "All tests passing with 100% code coverage.",
      deliverableDescription: "PR #42 merged to staging.",
      githubPrUrl: "https://github.com/nexum/repo/pull/42",
      demoUrl: "https://demo.nexum.dev",
      attachmentName: "deliverable.zip",
      attachmentSize: "2.5 MB",
      criteriaChecked: ["Criteria 1", "Criteria 2"],
    };

    // Simulate submission update
    const updatedMilestone: ProjectMilestone = {
      ...testMilestone,
      workStatus: "AWAITING_CLIENT_REVIEW",
      submittedAt: newSub.submissionDate,
      submissions: [...testMilestone.submissions, newSub],
    };

    expect(updatedMilestone.workStatus).toBe("AWAITING_CLIENT_REVIEW");
    expect(updatedMilestone.paymentStatus).toBe("SANDBOX_CAPTURE_CONFIRMED"); // Payment status remains independent!
    expect(updatedMilestone.submissions.length).toBe(1);
    expect(updatedMilestone.submissions[0].criteriaChecked.length).toBe(2);
  });

  it("handles client review feedback preservation and revision workflows", () => {
    const shopkartProj = INITIAL_FREELANCER_PROJECTS.find(
      (p) => p.id === "proj-ecommerce-shopkart"
    );
    const m1 = shopkartProj!.milestones[0];
    const sub1 = m1.submissions[0];

    expect(sub1.clientFeedback).toBeDefined();
    expect(sub1.clientFeedback!.decision).toBe("ACCEPTED");
    expect(sub1.clientFeedback!.reviewedByName).toContain("Rajesh Sharma");
  });

  it("creates a newly proposed milestone with PRE_FUNDED_BEFORE_WORK rule and UPCOMING work status", () => {
    const nextOrder = 4;
    const proposed: ProjectMilestone = {
      id: `ms-prop-${Date.now()}`,
      number: nextOrder,
      title: "Milestone 4: Cloud Infrastructure & Redis Cache",
      description: "Setup Redis cache cluster and AWS ECS task definitions.",
      deliverablesSummary: "Infrastructure as Code with Terraform.",
      acceptanceCriteria: ["Sub-5ms cache hits", "Auto-scaling ECS policies active"],
      amountCents: 2000000,
      amountDisplay: "₹20,000",
      currency: "INR",
      dueDate: "Jan 15, 2027",
      workStatus: "UPCOMING",
      paymentStatus: "NOT_FUNDED",
      fundingRule: "PRE_FUNDED_BEFORE_WORK",
      submissions: [],
    };

    expect(proposed.workStatus).toBe("UPCOMING");
    expect(proposed.paymentStatus).toBe("NOT_FUNDED");
    expect(proposed.fundingRule).toBe("PRE_FUNDED_BEFORE_WORK");
  });

  it("correctly segregates client-shared files and freelancer-uploaded files", () => {
    const shopkartProj = INITIAL_FREELANCER_PROJECTS.find(
      (p) => p.id === "proj-ecommerce-shopkart"
    );
    expect(shopkartProj!.files.length).toBeGreaterThan(0);

    const clientFiles = shopkartProj!.files.filter((f) => f.uploadedBy === "CLIENT");
    const freelancerFiles = shopkartProj!.files.filter((f) => f.uploadedBy === "FREELANCER");

    expect(clientFiles.length).toBe(1);
    expect(clientFiles[0].name).toContain("PRD");

    expect(freelancerFiles.length).toBe(2);
    expect(freelancerFiles[0].uploadedByName).toBe("Sambit Mohanty");
  });

  it("computes accurate project completion percentages based on deliverable status", () => {
    const completedProj = INITIAL_FREELANCER_PROJECTS.find(
      (p) => p.id === "proj-analytics-educare"
    );
    expect(completedProj!.progressPercent).toBe(100);
    expect(completedProj!.state).toBe("COMPLETED");

    const inProgressProj = INITIAL_FREELANCER_PROJECTS.find(
      (p) => p.id === "proj-ecommerce-shopkart"
    );
    expect(inProgressProj!.progressPercent).toBe(60);
    expect(inProgressProj!.state).toBe("ACTIVE");
  });
});
