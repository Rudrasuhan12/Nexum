import { describe, it, expect } from "vitest";
import {
  INITIAL_WORKSPACE_PROJECTS,
  INITIAL_TIMELINE_TECHKART,
  INITIAL_AI_CHAT_HISTORY,
  BASED_ON_CHIPS,
  MEDIATION_TABLE_DATA,
} from "../src/lib/workspace-data";
import {
  INITIAL_FREELANCER_PROJECTS,
  INITIAL_FREELANCER_TIMELINE_TECHKART,
  INITIAL_FREELANCER_AI_CHAT_HISTORY,
  FREELANCER_BASED_ON_CHIPS,
} from "../src/lib/freelancer-workspace-data";

describe("Nexum AI-Mediated Workspace Suite", () => {
  it("initializes three distinct multi-modal projects matching specification", () => {
    expect(INITIAL_WORKSPACE_PROJECTS.length).toBe(3);
    const techkart = INITIAL_WORKSPACE_PROJECTS.find((p) => p.id === "techkart");
    expect(techkart).toBeDefined();
    expect(techkart?.name).toContain("TechKart");
    expect(techkart?.freelancerName).toBe("Sambit Kumar");
    expect(techkart?.agreementVersion).toBe("v3 active");
    expect(techkart?.milestones.length).toBe(3);

    const horizon = INITIAL_WORKSPACE_PROJECTS.find((p) => p.id === "horizon_loyalty");
    expect(horizon?.freelancerName).toBe("Meera Nair");
    expect(horizon?.status).toBe("Negotiation");

    const analytics = INITIAL_WORKSPACE_PROJECTS.find((p) => p.id === "analytics_dashboard");
    expect(analytics?.freelancerName).toBe("Rohan Das");
    expect(analytics?.status).toBe("Draft brief");
  });

  it("verifies structured mediation cards in the project timeline", () => {
    expect(INITIAL_TIMELINE_TECHKART.length).toBeGreaterThanOrEqual(3);

    // Card A: Reply from Sambit
    const replyCard = INITIAL_TIMELINE_TECHKART.find((t) => t.type === "freelancer_reply_card");
    expect(replyCard).toBeDefined();
    expect(replyCard?.badgeText).toBe("Reply from Sambit");
    expect(replyCard?.metrics?.priceChange).toBe("+$600");
    expect(replyCard?.metrics?.scheduleChange).toBe("+4 days");
    expect(replyCard?.metrics?.agreementVersion).toBe("v3 to v4");
    expect(replyCard?.rawMessage).toBeDefined();

    // Card B: Client bubble
    const clientMsg = INITIAL_TIMELINE_TECHKART.find((t) => t.type === "client_bubble");
    expect(clientMsg).toBeDefined();
    expect(clientMsg?.bubbleText).toContain("Looks good, let's proceed");

    // Card C: Draft counteroffer card
    const draftCard = INITIAL_TIMELINE_TECHKART.find((t) => t.type === "draft_counteroffer_card");
    expect(draftCard).toBeDefined();
    expect(draftCard?.badgeText).toBe("Draft, not sent yet");
    expect(draftCard?.counterofferDetails?.title).toBe("v5 · CR-2 best-selling section");
    expect(draftCard?.counterofferDetails?.priceChange).toBe("+$500 (was +$600)");
  });

  it("enforces private AI session isolation and scope metadata", () => {
    expect(INITIAL_AI_CHAT_HISTORY.length).toBeGreaterThanOrEqual(4);
    const approvalChat = INITIAL_AI_CHAT_HISTORY.find((c) => c.id === "chat_approval");
    expect(approvalChat?.title).toBe("What needs my approval this week?");
    expect(approvalChat?.projectTag).toBe("All projects");
  });

  it("provides verifiable source record chips for AI outputs", () => {
    expect(BASED_ON_CHIPS.length).toBe(5);
    const chipLabels = BASED_ON_CHIPS.map((c) => c.label);
    expect(chipLabels).toContain("Agreement v3");
    expect(chipLabels).toContain("CR-2");
    expect(chipLabels).toContain("Quote v4");
    expect(chipLabels).toContain("Milestones");
    expect(chipLabels).toContain("Shared chat with Sambit");
  });

  it("preserves exact 7-row mediation handling rules without unauthorized automated approvals", () => {
    expect(MEDIATION_TABLE_DATA.length).toBe(7);
    
    // Rule for 'Looks good, proceed'
    const looksGoodRule = MEDIATION_TABLE_DATA.find((r) => r.clientSays === '"Looks good, proceed"');
    expect(looksGoodRule).toBeDefined();
    expect(looksGoodRule?.nexumDoes).toContain("Does not treat it as approval");
    expect(looksGoodRule?.approvalNeeded).toBe("Client approves explicitly");
    expect(looksGoodRule?.whereItLands).toBe("Agreement");

    // Rule for payment question
    const paymentRule = MEDIATION_TABLE_DATA.find((r) => r.clientSays === "A payment question");
    expect(paymentRule?.nexumDoes).toContain("Answers only from verified PayPal records");

    // Rule for scope change
    const scopeRule = MEDIATION_TABLE_DATA.find((r) => r.clientSays === "A new feature or scope change");
    expect(scopeRule?.approvalNeeded).toBe("Client sends, then both approve the same version");
  });

  it("verifies freelancer-perspective workspace projects, clients, and escrow state", () => {
    expect(INITIAL_FREELANCER_PROJECTS.length).toBe(3);
    const techkart = INITIAL_FREELANCER_PROJECTS.find((p) => p.id === "techkart");
    expect(techkart).toBeDefined();
    expect(techkart?.clientName).toBe("Alex Chen");
    expect(techkart?.clientCompany).toBe("TechKart Inc.");
    expect(techkart?.escrowFundedAmount).toContain("in PayPal Escrow");
    expect(techkart?.decisionRequired?.version).toBe("v5");
    expect(techkart?.milestones.length).toBe(3);

    const fitlife = INITIAL_FREELANCER_PROJECTS.find((p) => p.id === "fitlife");
    expect(fitlife?.clientName).toBe("Sarah Jenkins");
    expect(fitlife?.status).toBe("Active project");

    const nexa = INITIAL_FREELANCER_PROJECTS.find((p) => p.id === "nexa_ai");
    expect(nexa?.clientName).toBe("Marcus Vance");
  });

  it("verifies freelancer timeline mediation and deliverable consensus cards", () => {
    expect(INITIAL_FREELANCER_TIMELINE_TECHKART.length).toBeGreaterThanOrEqual(4);

    // Client bubble
    const clientBubble = INITIAL_FREELANCER_TIMELINE_TECHKART.find((t) => t.type === "client_bubble");
    expect(clientBubble?.senderName).toContain("Alex Chen");

    // Freelancer reply quote card
    const quoteCard = INITIAL_FREELANCER_TIMELINE_TECHKART.find((t) => t.type === "freelancer_reply_card");
    expect(quoteCard?.metrics?.priceChange).toBe("+$600");
    expect(quoteCard?.metrics?.scheduleChange).toBe("+4 days");

    // Client counteroffer card
    const counterCard = INITIAL_FREELANCER_TIMELINE_TECHKART.find((t) => t.type === "draft_counteroffer_card");
    expect(counterCard?.counterofferDetails?.priceChange).toContain("$500.00 USD");
    expect(counterCard?.actions?.primaryLabel).toBe("Accept & Update Agreement v5");

    // Milestone 2 deliverable comparison card
    const deliverableCard = INITIAL_FREELANCER_TIMELINE_TECHKART.find((t) => t.type === "agreement_comparison_card");
    expect(deliverableCard?.badgeText).toBe("Milestone 2 Deliverables Active");
    expect(deliverableCard?.rawMessage).toContain("GitHub Pull Request");
  });

  it("verifies freelancer private AI consultations and verified citation chips", () => {
    expect(INITIAL_FREELANCER_AI_CHAT_HISTORY.length).toBeGreaterThanOrEqual(4);
    const scopeConsultation = INITIAL_FREELANCER_AI_CHAT_HISTORY.find((c) => c.id === "fchat_scope_cr2");
    expect(scopeConsultation?.title).toContain("carousel request scope creep");

    expect(FREELANCER_BASED_ON_CHIPS.length).toBe(5);
    const chipLabels = FREELANCER_BASED_ON_CHIPS.map((c) => c.label);
    expect(chipLabels).toContain("Agreement v3 Canonical");
    expect(chipLabels).toContain("CR-2 Scope Spec");
    expect(chipLabels).toContain("GitHub PR #42");
  });
});
