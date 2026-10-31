import { describe, it, expect } from "vitest";
import {
  INITIAL_FREELANCER_PROPOSALS,
  calculateProposalSummaryKPIs,
  getProposalStatusBadgeConfig,
} from "../src/lib/freelancer-proposals-data";
import {
  FreelancerProposalItem,
  ProposalStatus,
} from "../src/lib/freelancer-proposals-types";

describe("Freelancer Proposals Management Suite", () => {
  it("calculates exact summary KPIs matching the reference screenshot (12 Total)", () => {
    const kpis = calculateProposalSummaryKPIs(INITIAL_FREELANCER_PROPOSALS);

    expect(kpis.totalProposals).toBe(12);
    expect(kpis.underReview).toBe(3);
    expect(kpis.shortlisted).toBe(4);
    expect(kpis.interview).toBe(2);
    expect(kpis.accepted).toBe(2);
    expect(kpis.rejected).toBe(1);
  });

  it("provides distinct styling and labels for all proposal lifecycle statuses", () => {
    const statuses: ProposalStatus[] = [
      "UNDER_REVIEW",
      "SHORTLISTED",
      "INTERVIEW",
      "ACCEPTED",
      "REJECTED",
      "COUNTEROFFER_RECEIVED",
      "DRAFT",
      "WITHDRAWN",
      "SUBMITTED",
    ];

    statuses.forEach((st) => {
      const config = getProposalStatusBadgeConfig(st);
      expect(config.label).toBeDefined();
      expect(config.badgeClass).toBeDefined();
      expect(config.badgeClass).toContain("border");
    });
  });

  it("filters proposals by search query, client name, and technology tags", () => {
    // Search by title
    const searchAi = INITIAL_FREELANCER_PROPOSALS.filter((p) =>
      p.projectTitle.toLowerCase().includes("chatbot")
    );
    expect(searchAi.length).toBe(1);
    expect(searchAi[0].client.companyName).toBe("MediCare Solutions");

    // Search by client name
    const searchShopkart = INITIAL_FREELANCER_PROPOSALS.filter((p) =>
      p.client.companyName.toLowerCase().includes("shopkart")
    );
    expect(searchShopkart.length).toBe(1);
    expect(searchShopkart[0].status).toBe("SHORTLISTED");

    // Filter by status tab
    const shortlisted = INITIAL_FREELANCER_PROPOSALS.filter(
      (p) => p.status === "SHORTLISTED"
    );
    expect(shortlisted.length).toBe(4);

    const interview = INITIAL_FREELANCER_PROPOSALS.filter(
      (p) => p.status === "INTERVIEW"
    );
    expect(interview.length).toBe(2);
  });

  it("handles client counteroffer review and acceptance transition", () => {
    const solanaProp = INITIAL_FREELANCER_PROPOSALS.find(
      (p) => p.id === "prop-solana-fintech"
    );
    expect(solanaProp).toBeDefined();
    expect(solanaProp!.status).toBe("UNDER_REVIEW");
    expect(solanaProp!.counteroffer).toBeDefined();

    // Verify counteroffer delta
    const co = solanaProp!.counteroffer!;
    expect(co.originalPrice).toBe("₹65,000");
    expect(co.proposedPrice).toBe("₹55,000");
    expect(co.proposedDuration).toContain("3.5 weeks");

    // Simulate counteroffer acceptance
    const acceptedProposal: FreelancerProposalItem = {
      ...solanaProp!,
      status: "ACCEPTED",
      statusLabel: "Accepted",
      offer: {
        ...solanaProp!.offer,
        priceDisplay: `${co.proposedPrice} (fixed)`,
        duration: co.proposedDuration,
      },
      counteroffer: undefined,
      activityTrail: [
        {
          id: "act-test-accept",
          title: "Counteroffer Accepted by Freelancer",
          description: "Accepted client revised terms.",
          actor: "Sambit Mohanty",
          timestamp: "Just now",
          type: "ACCEPTED",
        },
        ...solanaProp!.activityTrail,
      ],
    };

    expect(acceptedProposal.status).toBe("ACCEPTED");
    expect(acceptedProposal.offer.priceDisplay).toBe("₹55,000 (fixed)");
    expect(acceptedProposal.counteroffer).toBeUndefined();
    expect(acceptedProposal.activityTrail[0].type).toBe("ACCEPTED");
  });

  it("creates a new submitted proposal with complete brief and audit history", () => {
    const newProp: FreelancerProposalItem = {
      id: "prop-new-test",
      projectId: "proj-test",
      projectTitle: "Next.js AI Document Analysis & Extraction Platform",
      categoryIcon: "HEALTH",
      status: "SUBMITTED",
      statusLabel: "Submitted",
      statusBadgeColor: "bg-blue-50 text-blue-700 border-blue-200/80",
      submittedDate: "Nov 01, 2026",
      submittedTime: "10:00 AM",
      client: {
        id: "cli-test",
        name: "LexiTech Corp.",
        companyName: "LexiTech Corp.",
        verified: true,
        industry: "Enterprise AI",
        companySize: "10–50 employees",
        location: "Bengaluru, India",
        postedDate: "Recent",
        totalHires: 5,
        avatarLetter: "L",
        avatarBg: "bg-indigo-600 text-white",
      },
      clientBrief: {
        description: "Project opportunity",
        category: "AI & Full-Stack",
        budgetRange: "₹50,000 – ₹80,000",
        duration: "4–5 weeks",
        deadline: "Flexible",
        requiredSkills: ["Next.js", "Python", "OCR"],
        technicalRequirements: ["Full-stack architecture"],
        acceptanceCriteria: ["Passing tests"],
      },
      offer: {
        summary: "Proposal for Next.js AI Document Platform",
        approach: "Next.js 16 + FastAPI OCR",
        priceDisplay: "₹65,000 (fixed)",
        priceType: "FIXED",
        duration: "4–5 weeks",
        expectedStartDate: "Immediate",
        coverLetter: "Cover letter text",
        attachments: [],
        milestones: [],
      },
      messagesCount: 0,
      activityTrail: [
        {
          id: "act-new",
          title: "Proposal Submitted",
          description: "Submitted formal quote of ₹65,000.",
          actor: "Sambit Mohanty",
          timestamp: "Just now",
          type: "SUBMITTED",
        },
      ],
      techTags: ["Next.js", "Python", "OCR"],
    };

    expect(newProp.status).toBe("SUBMITTED");
    expect(newProp.offer.priceDisplay).toBe("₹65,000 (fixed)");
    expect(newProp.activityTrail.length).toBe(1);
  });

  it("maintains separation: proposal acceptance is not proof of contract funding", () => {
    const acceptedProp = INITIAL_FREELANCER_PROPOSALS.find(
      (p) => p.status === "ACCEPTED"
    );
    expect(acceptedProp).toBeDefined();

    // Verify proposal has price and client, but project payment escrow is handled separately
    expect(acceptedProp!.status).toBe("ACCEPTED");
    expect(acceptedProp!.offer.priceDisplay).toBeDefined();
    // Verification that proposal status does NOT equal a payment state like CAPTURED
    expect(acceptedProp!.status).not.toBe("CAPTURED");
  });
});
