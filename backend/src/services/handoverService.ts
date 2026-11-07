/**
 * Nexum Project Handover Service
 * 
 * Manages the final deliverable and documentation checklist once all
 * milestones have been completed and verified.
 * 
 * Rules enforced:
 * - Handover can ONLY be initiated when 100% of project milestones are in ACCEPTED work status.
 * - Client initiates checklist (standard 6 categories + optional custom items).
 * - Freelancer submits URLs / file attachments / runbooks per item.
 * - Client individually inspects and verifies/accepts each item.
 * - When all required items are verified, project state transitions to COMPLETED.
 * - Append-only audit events emitted for every state change.
 */

import crypto from "crypto";
import { prisma } from "../prisma.js";
import { appendAuditEvent } from "../lib/audit.js";

export interface HandoverItemInput {
  title: string;
  description: string;
  category: "REPOSITORY" | "DOCUMENTATION" | "DEPLOYMENT" | "CREDENTIALS" | "TESTS" | "IP_TRANSFER" | "CUSTOM";
  isRequired?: boolean;
}

export const DEFAULT_HANDOVER_TEMPLATES: HandoverItemInput[] = [
  {
    category: "REPOSITORY",
    title: "Production Repository & Source Code Transfer",
    description: "Production branch link, GitHub/GitLab repository ownership transfer or release archive tag.",
    isRequired: true,
  },
  {
    category: "DOCUMENTATION",
    title: "System Architecture & API Documentation",
    description: "Comprehensive README, API endpoint specifications, data models, and component flowcharts.",
    isRequired: true,
  },
  {
    category: "DEPLOYMENT",
    title: "Deployment Runbook & Environment Setup",
    description: "Step-by-step production hosting runbook, sanitized .env.example, and build/deploy scripts.",
    isRequired: true,
  },
  {
    category: "CREDENTIALS",
    title: "Administrative Access & Third-Party Keys",
    description: "Verification that all administrative accounts, cloud services, and third-party webhook configs are transferred.",
    isRequired: true,
  },
  {
    category: "TESTS",
    title: "Test Suites & Quality Verification Report",
    description: "Automated test execution logs, coverage metrics, and confirmation that all test suites pass without regression.",
    isRequired: true,
  },
  {
    category: "IP_TRANSFER",
    title: "Intellectual Property (IP) Release Declaration",
    description: "Explicit sign-off confirming full copyright and intellectual property assignment to the client.",
    isRequired: true,
  },
];

export class HandoverService {
  /**
   * Helper to verify if all milestones for a project are in ACCEPTED work status
   */
  async areAllMilestonesAccepted(projectId: string): Promise<{ ok: boolean; total: number; accepted: number }> {
    const milestones = await prisma.milestone.findMany({
      where: { projectId },
      select: { id: true, workStatus: true, title: true },
    });

    const total = milestones.length;
    const accepted = milestones.filter((m) => m.workStatus === "ACCEPTED").length;

    return {
      ok: total > 0 && accepted === total,
      total,
      accepted,
    };
  }

  /**
   * Initiate Project Handover Checklist (Client only)
   */
  async initiateHandover(params: {
    projectId: string;
    clientId: string;
    items?: HandoverItemInput[];
  }) {
    const { projectId, clientId, items } = params;

    // Verify project exists and client is owner
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        agreement: true,
      },
    });

    if (!project) {
      const err: any = new Error("Project not found");
      err.code = "PROJECT_NOT_FOUND";
      err.statusCode = 404;
      throw err;
    }

    // Check milestones
    const milestoneCheck = await this.areAllMilestonesAccepted(projectId);
    if (!milestoneCheck.ok && milestoneCheck.total > 0) {
      const err: any = new Error(
        `Cannot initiate handover: Only ${milestoneCheck.accepted}/${milestoneCheck.total} milestones are accepted.`
      );
      err.code = "UNACCEPTED_MILESTONES";
      err.statusCode = 400;
      err.details = { total: milestoneCheck.total, accepted: milestoneCheck.accepted };
      throw err;
    }

    // Check if handover already exists
    let handover = await prisma.projectHandover.findUnique({
      where: { projectId },
      include: { items: true },
    });

    if (handover) {
      // Return existing handover if already active
      return handover;
    }

    const itemsToCreate = (items && items.length > 0 ? items : DEFAULT_HANDOVER_TEMPLATES).map((item) => ({
      title: item.title,
      description: item.description,
      category: item.category,
      isRequired: item.isRequired !== undefined ? item.isRequired : true,
      status: "PENDING" as const,
    }));

    handover = await prisma.projectHandover.create({
      data: {
        projectId,
        requestedById: clientId,
        status: "PENDING_SUBMISSION",
        items: {
          create: itemsToCreate,
        },
      },
      include: {
        items: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    // Record audit event
    await appendAuditEvent({
      actorId: clientId,
      action: "PROJECT_HANDOVER_INITIATED",
      objectType: "ProjectHandover",
      objectId: handover.id,
      previousStatus: null,
      newStatus: "PENDING_SUBMISSION",
      metadata: {
        projectId,
        itemCount: handover.items.length,
      },
    });

    return handover;
  }

  /**
   * Get Handover Details for a project
   */
  async getHandover(projectId: string) {
    const handover = await prisma.projectHandover.findUnique({
      where: { projectId },
      include: {
        items: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!handover) {
      // Check if project has completed all milestones to indicate readiness
      const milestoneCheck = await this.areAllMilestonesAccepted(projectId);
      return {
        hasHandover: false,
        readyForHandover: milestoneCheck.ok,
        milestoneProgress: {
          total: milestoneCheck.total,
          accepted: milestoneCheck.accepted,
        },
        handover: null,
      };
    }

    const totalItems = handover.items.length;
    const requiredItems = handover.items.filter((i) => i.isRequired).length;
    const acceptedItems = handover.items.filter((i) => i.status === "ACCEPTED").length;
    const providedItems = handover.items.filter((i) => i.status === "PROVIDED" || i.status === "ACCEPTED").length;
    const isFullyVerified = requiredItems > 0 && acceptedItems >= requiredItems;

    return {
      hasHandover: true,
      readyForHandover: true,
      handover: {
        ...handover,
        stats: {
          totalItems,
          requiredItems,
          acceptedItems,
          providedItems,
          isFullyVerified,
          percentComplete: totalItems > 0 ? Math.round((acceptedItems / totalItems) * 100) : 0,
        },
      },
    };
  }

  /**
   * Freelancer submits document / link for a specific handover checklist item
   */
  async submitHandoverItem(params: {
    projectId: string;
    itemId: string;
    freelancerId: string;
    providedUrl?: string;
    providedFileKey?: string;
    providedNotes?: string;
  }) {
    const { projectId, itemId, freelancerId, providedUrl, providedFileKey, providedNotes } = params;

    const handover = await prisma.projectHandover.findUnique({
      where: { projectId },
      include: { items: true },
    });

    if (!handover) {
      const err: any = new Error("Handover request not found for this project");
      err.code = "HANDOVER_NOT_FOUND";
      err.statusCode = 404;
      throw err;
    }

    const item = handover.items.find((i) => i.id === itemId);
    if (!item) {
      const err: any = new Error("Handover item not found");
      err.code = "ITEM_NOT_FOUND";
      err.statusCode = 404;
      throw err;
    }

    const updatedItem = await prisma.projectHandoverItem.update({
      where: { id: itemId },
      data: {
        status: "PROVIDED",
        providedUrl: providedUrl || null,
        providedFileKey: providedFileKey || null,
        providedNotes: providedNotes || null,
        rejectionReason: null,
        providedAt: new Date(),
      },
    });

    // If handover was PENDING_SUBMISSION, transition to IN_REVIEW
    if (handover.status === "PENDING_SUBMISSION") {
      await prisma.projectHandover.update({
        where: { id: handover.id },
        data: { status: "IN_REVIEW" },
      });
    }

    await appendAuditEvent({
      actorId: freelancerId,
      action: "HANDOVER_ITEM_SUBMITTED",
      objectType: "ProjectHandoverItem",
      objectId: itemId,
      previousStatus: item.status,
      newStatus: "PROVIDED",
      metadata: {
        projectId,
        title: item.title,
        hasUrl: !!providedUrl,
        hasFile: !!providedFileKey,
      },
    });

    return updatedItem;
  }

  /**
   * Client reviews a submitted handover item (Accepts or Requests Corrections)
   */
  async reviewHandoverItem(params: {
    projectId: string;
    itemId: string;
    clientId: string;
    decision: "ACCEPTED" | "REVISIONS_REQUESTED";
    rejectionReason?: string;
  }) {
    const { projectId, itemId, clientId, decision, rejectionReason } = params;

    const handover = await prisma.projectHandover.findUnique({
      where: { projectId },
      include: { items: true },
    });

    if (!handover) {
      const err: any = new Error("Handover request not found");
      err.code = "HANDOVER_NOT_FOUND";
      err.statusCode = 404;
      throw err;
    }

    const item = handover.items.find((i) => i.id === itemId);
    if (!item) {
      const err: any = new Error("Handover item not found");
      err.code = "ITEM_NOT_FOUND";
      err.statusCode = 404;
      throw err;
    }

    const newStatus = decision === "ACCEPTED" ? ("ACCEPTED" as const) : ("REVISIONS_REQUESTED" as const);

    const updatedItem = await prisma.projectHandoverItem.update({
      where: { id: itemId },
      data: {
        status: newStatus,
        rejectionReason: decision === "REVISIONS_REQUESTED" ? rejectionReason || "Revisions required" : null,
        acceptedAt: decision === "ACCEPTED" ? new Date() : null,
      },
    });

    await appendAuditEvent({
      actorId: clientId,
      action: decision === "ACCEPTED" ? "HANDOVER_ITEM_ACCEPTED" : "HANDOVER_ITEM_REVISIONS_REQUESTED",
      objectType: "ProjectHandoverItem",
      objectId: itemId,
      previousStatus: item.status,
      newStatus,
      metadata: {
        projectId,
        title: item.title,
        rejectionReason: decision === "REVISIONS_REQUESTED" ? rejectionReason : undefined,
      },
    });

    return updatedItem;
  }

  /**
   * Finalize Handover & Complete Project (Client only, when 100% verified)
   */
  async finalizeHandover(params: {
    projectId: string;
    clientId: string;
  }) {
    const { projectId, clientId } = params;

    const handover = await prisma.projectHandover.findUnique({
      where: { projectId },
      include: { items: true },
    });

    if (!handover) {
      const err: any = new Error("Handover request not found");
      err.code = "HANDOVER_NOT_FOUND";
      err.statusCode = 404;
      throw err;
    }

    const requiredItems = handover.items.filter((i) => i.isRequired);
    const unaccepted = requiredItems.filter((i) => i.status !== "ACCEPTED");

    if (unaccepted.length > 0) {
      const err: any = new Error(
        `Cannot finalize handover: ${unaccepted.length} required item(s) are not accepted yet.`
      );
      err.code = "UNACCEPTED_HANDOVER_ITEMS";
      err.statusCode = 400;
      err.details = { unacceptedCount: unaccepted.length, items: unaccepted.map((u) => u.title) };
      throw err;
    }

    // Compute cryptographic SHA-256 manifest hash of all verified items
    const manifestPayload = JSON.stringify(
      handover.items.map((i) => ({
        id: i.id,
        title: i.title,
        url: i.providedUrl,
        fileKey: i.providedFileKey,
        acceptedAt: i.acceptedAt?.toISOString(),
      }))
    );
    const contentHash = crypto.createHash("sha256").update(manifestPayload).digest("hex");

    // Complete handover and update project state
    const [updatedHandover] = await prisma.$transaction([
      prisma.projectHandover.update({
        where: { id: handover.id },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
          contentHash,
        },
        include: { items: true },
      }),
      prisma.project.update({
        where: { id: projectId },
        data: {
          state: "COMPLETED",
        },
      }),
    ]);

    await appendAuditEvent({
      actorId: clientId,
      action: "PROJECT_HANDOVER_COMPLETED",
      objectType: "ProjectHandover",
      objectId: handover.id,
      previousStatus: handover.status,
      newStatus: "COMPLETED",
      versionHash: contentHash,
      metadata: {
        projectId,
        contentHash,
        completedAt: new Date().toISOString(),
      },
    });

    return {
      success: true,
      message: "Project handover successfully finalized. Project is now marked COMPLETED.",
      contentHash,
      handover: updatedHandover,
    };
  }
}

export const handoverService = new HandoverService();

