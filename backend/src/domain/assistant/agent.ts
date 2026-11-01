import { prisma } from "../../prisma.js";
import {
  getDashboardSummary,
  getActiveProjects,
  getEarningsSnapshot,
} from "../dashboard/queries.js";
import { getEarningsLabel } from "../payments/state.js";
import { MilestoneWorkStatus } from "@prisma/client";

/**
 * The 7 read-only tool functions for the Nexum AI Assistant.
 * Strictly scoped to `userId` from session in code (NEVER trusting prompt or inputs).
 */
export const assistantTools = {
  /**
   * 1. get_dashboard
   */
  async get_dashboard(userId: string) {
    return await getDashboardSummary(userId);
  },

  /**
   * 2. list_my_projects
   */
  async list_my_projects(userId: string) {
    const res = await getActiveProjects(userId);
    return res.items;
  },

  /**
   * 3. get_project_summary
   * Scoped to projects owned by this freelancer.
   */
  async get_project_summary(userId: string, projectId: string) {
    const agreement = await prisma.agreement.findFirst({
      where: {
        freelancerId: userId,
        projectId,
      },
      include: {
        project: {
          include: {
            client: { select: { id: true, name: true } },
          },
        },
        milestones: { where: { removedAt: null }, orderBy: { sequence: "asc" } },
      },
    });

    if (!agreement || !agreement.project) {
      return null; // Scoping guarantee: returns null if project does not belong to freelancer
    }

    return {
      projectId: agreement.project.id,
      title: agreement.project.title,
      clientName: agreement.project.client.name,
      projectStatus: agreement.project.state,
      agreementStatus: agreement.status,
      milestonesCount: agreement.milestones.length,
      milestones: agreement.milestones.map((m: any) => ({
        id: m.id,
        title: m.title,
        status: m.workStatus,
        dueDate: m.dueDate ? m.dueDate.toISOString() : null,
        amountMinor: m.amountMinor,
      })),
    };
  },

  /**
   * 4. list_my_milestones
   */
  async list_my_milestones(userId: string, filter?: string) {
    const where: any = {
      agreement: { freelancerId: userId },
      removedAt: null,
    };
    if (filter) {
      where.workStatus = filter;
    }

    const milestones = await prisma.milestone.findMany({
      where,
      include: {
        project: { select: { id: true, title: true } },
        payments: { orderBy: { createdAt: "desc" }, take: 1 },
      },
      orderBy: { dueDate: "asc" },
    });

    return milestones.map((m: any) => {
      const payment = m.payments[0];
      const label = payment ? getEarningsLabel(payment.status, m.workStatus) : "Not funded";
      return {
        id: m.id,
        sequence: m.sequence,
        title: m.title,
        projectId: m.project?.id || "",
        projectTitle: m.project?.title || "",
        status: m.workStatus,
        dueDate: m.dueDate ? m.dueDate.toISOString() : null,
        amountMinor: m.amountMinor,
        currency: m.currency,
        honestEarningsLabel: label,
      };
    });
  },

  /**
   * 5. get_earnings_summary
   * Honest numbers with exact Phase 7 status labels.
   */
  async get_earnings_summary(userId: string) {
    return await getEarningsSnapshot(userId);
  },

  /**
   * 6. get_my_proposals
   */
  async get_my_proposals(userId: string, status?: string) {
    const where: any = { freelancerId: userId };
    if (status) {
      where.status = status;
    }

    const proposals = await prisma.proposal.findMany({
      where,
      include: {
        project: { select: { id: true, title: true } },
      },
      orderBy: { updatedAt: "desc" },
    });

    return proposals.map((p: any) => ({
      id: p.id,
      projectId: p.project?.id || "",
      projectTitle: p.project?.title || "",
      status: p.status,
      proposedRateMinor: p.proposedRateMinor,
      updatedAt: p.updatedAt.toISOString(),
    }));
  },

  /**
   * 7. search_open_projects
   */
  async search_open_projects(userId: string, query?: string) {
    const where: any = {
      state: { in: ["MATCHING", "INTAKE", "ACTIVE"] },
    };
    if (query) {
      where.OR = [
        { title: { contains: query, mode: "insensitive" } },
        { description: { contains: query, mode: "insensitive" } },
      ];
    }

    const projects = await prisma.project.findMany({
      where,
      include: {
        client: { select: { name: true } },
      },
      take: 10,
    });

    return projects.map((p: any) => ({
      id: p.id,
      title: p.title,
      category: p.category,
      clientName: p.client.name,
    }));
  },
};

/**
 * Core Assistant Dispatcher:
 * 1. Strictly blocks state-modifying / write operations with clear UI directions.
 * 2. Scopes all data queries to the authenticated user's session in code.
 * 3. Never invents dates, numbers, or third-party project details.
 */
export async function processAssistantMessage(
  userId: string,
  content: string
): Promise<{
  reply: string;
  toolCalled?: string;
  data?: any;
  refusal?: boolean;
}> {
  const normalized = content.toLowerCase();

  // 1. Write protection rule: AI CANNOT approve, pay, accept work, send a commitment or change an agreement.
  const writePatterns = [
    /\b(accept|approve|pay|release|payout|submit|alter|change agreement|sign)\b/i,
  ];

  if (
    writePatterns.some((pattern) => pattern.test(content)) &&
    /\b(milestone|payment|proposal|agreement|work|funds)\b/i.test(content)
  ) {
    return {
      reply:
        "I am a read-only assistant and cannot perform commitments, approvals, milestone acceptances, or payment releases. Please perform this action directly from the Milestones, Proposals, or Payments screen in your dashboard.",
      refusal: true,
    };
  }

  // 2. Query for next due milestone
  if (
    normalized.includes("milestone") &&
    (normalized.includes("due") || normalized.includes("next") || normalized.includes("deadline"))
  ) {
    const milestones = await assistantTools.list_my_milestones(userId);
    const uncompleted = milestones.filter(
      (m: any) => m.status !== MilestoneWorkStatus.ACCEPTED && m.dueDate !== null
    );

    if (uncompleted.length === 0) {
      return {
        reply: "You have no upcoming milestones with pending due dates.",
        toolCalled: "list_my_milestones",
        data: [],
      };
    }

    uncompleted.sort(
      (a: any, b: any) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime()
    );
    const nextM = uncompleted[0];
    const dateFormatted = new Date(nextM.dueDate!).toISOString().split("T")[0];

    return {
      reply: `Your next milestone "${nextM.title}" is due on ${dateFormatted} (Status: ${nextM.status}).`,
      toolCalled: "list_my_milestones",
      data: nextM,
    };
  }

  // 3. Query for payment / earnings / honest label
  if (
    normalized.includes("paid") ||
    normalized.includes("earnings") ||
    normalized.includes("payment for") ||
    normalized.includes("have i been paid")
  ) {
    const milestones = await assistantTools.list_my_milestones(userId);

    // Look for matching milestone sequence or name
    let target = milestones[0];
    if (normalized.includes("milestone 1") || normalized.includes("first milestone")) {
      target = milestones.find((m: any) => m.sequence === 1) || milestones[0];
    } else if (normalized.includes("milestone 2") || normalized.includes("second milestone")) {
      target = milestones.find((m: any) => m.sequence === 2) || milestones[1];
    }

    if (target) {
      return {
        reply: `The current status for "${target.title}" is '${target.honestEarningsLabel}'.`,
        toolCalled: "list_my_milestones",
        data: target,
      };
    }

    const earnings = await assistantTools.get_earnings_summary(userId);
    return {
      reply: `Your available balance is $${(earnings.availableMinor / 100).toFixed(2)} USD, with $${(earnings.fundedMinor / 100).toFixed(2)} USD currently funded in escrow.`,
      toolCalled: "get_earnings_summary",
      data: earnings,
    };
  }

  // 4. Query for foreign or unknown project
  if (normalized.includes("project") && (normalized.includes("foreign") || normalized.includes("secret") || normalized.includes("unknown") || normalized.includes("opp_"))) {
    const match = content.match(/\b(proj_[a-zA-Z0-9]+|opp_[a-zA-Z0-9]+)\b/);
    const projId = match ? match[1] : "unknown_id";
    const project = await assistantTools.get_project_summary(userId, projId);

    if (!project) {
      return {
        reply: "I have no records for that project under your account. I cannot access or discuss projects you are not a party to.",
        toolCalled: "get_project_summary",
        data: null,
      };
    }

    return {
      reply: `Project "${project.title}" has ${project.milestonesCount} milestones and is currently ${project.projectStatus}.`,
      toolCalled: "get_project_summary",
      data: project,
    };
  }

  // 5. Default dashboard query
  const dashboard = await assistantTools.get_dashboard(userId);
  return {
    reply: `You currently have ${dashboard.activeProjects.count} active projects and ${dashboard.allProposals.count} proposals.`,
    toolCalled: "get_dashboard",
    data: dashboard,
  };
}
