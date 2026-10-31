/**
 * Nexum Domain Notification Event Emitters
 * Provides strongly-typed helper dispatchers for every state machine event across Nexum:
 * - Milestone Deliverables (PRs, reviews, approvals)
 * - Bilateral PayPal Escrow (pre-funding, captures, disbursements, disputes)
 * - AI Scope Mediation (CRs, counteroffers, ratifications)
 * - Dual SHA-256 State Consensus (hash synchronization, tamper alerts)
 * - Project & Proposal Lifecycles
 */

import { notificationQueue } from "./notificationQueue.js";
import { NotificationJob } from "../types/notification.js";

export const NotificationEvents = {
  // -------------------------------------------------------------------------
  // 1. DELIVERABLES & MILESTONES
  // -------------------------------------------------------------------------

  async deliverableSubmitted(params: {
    clientId: string;
    freelancerName: string;
    milestoneNumber: number;
    projectName: string;
    projectId: string;
    actionUrl?: string;
  }): Promise<NotificationJob> {
    return notificationQueue.enqueue({
      eventName: "DELIVERABLE_SUBMITTED",
      recipientUserId: params.clientId,
      recipientRole: "CLIENT",
      type: "DELIVERABLE",
      priority: "HIGH",
      title: `Milestone ${params.milestoneNumber} Deliverable Submitted`,
      message: `${params.freelancerName} submitted code deliverables and test verification for Milestone ${params.milestoneNumber}.`,
      projectName: params.projectName,
      projectId: params.projectId,
      actionUrl: params.actionUrl || `/client/workspace`,
    });
  },

  async deliverableChangesRequested(params: {
    freelancerId: string;
    milestoneNumber: number;
    clientNotes: string;
    projectName: string;
    projectId: string;
    actionUrl?: string;
  }): Promise<NotificationJob> {
    return notificationQueue.enqueue({
      eventName: "DELIVERABLE_CHANGES_REQUESTED",
      recipientUserId: params.freelancerId,
      recipientRole: "FREELANCER",
      type: "DELIVERABLE",
      priority: "HIGH",
      title: `Changes Requested on Milestone ${params.milestoneNumber}`,
      message: `Client requested revisions: "${params.clientNotes}". Please review and update.`,
      projectName: params.projectName,
      projectId: params.projectId,
      actionUrl: params.actionUrl || `/freelancer/workspace`,
    });
  },

  async milestoneApproved(params: {
    freelancerId: string;
    milestoneNumber: number;
    amount: number;
    projectName: string;
    projectId: string;
    actionUrl?: string;
  }): Promise<NotificationJob> {
    return notificationQueue.enqueue({
      eventName: "MILESTONE_APPROVED",
      recipientUserId: params.freelancerId,
      recipientRole: "FREELANCER",
      type: "MILESTONE",
      priority: "HIGH",
      title: `Milestone ${params.milestoneNumber} Approved & Released`,
      message: `Client approved Milestone ${params.milestoneNumber}. $${params.amount.toLocaleString()} has been unlocked and transferred to your balance.`,
      projectName: params.projectName,
      projectId: params.projectId,
      actionUrl: params.actionUrl || `/freelancer/earnings`,
    });
  },

  // -------------------------------------------------------------------------
  // 2. BILATERAL PAYPAL ESCROW & PAYMENTS
  // -------------------------------------------------------------------------

  async escrowPreFunded(params: {
    clientId: string;
    freelancerId: string;
    amount: number;
    projectName: string;
    projectId: string;
    orderId: string;
  }): Promise<[NotificationJob, NotificationJob]> {
    const notifClient = await notificationQueue.enqueue({
      eventName: "ESCROW_PREFUNDED_CLIENT",
      recipientUserId: params.clientId,
      recipientRole: "CLIENT",
      type: "PAYMENT",
      priority: "HIGH",
      title: "PayPal Escrow Pre-Funding Confirmed",
      message: `Bilateral escrow capture confirmed for $${params.amount.toLocaleString()} USD via PayPal Sandbox Orders v2 (Order #${params.orderId}).`,
      projectName: params.projectName,
      projectId: params.projectId,
      actionUrl: `/client/payments`,
    });

    const notifFreelancer = await notificationQueue.enqueue({
      eventName: "ESCROW_PREFUNDED_FREELANCER",
      recipientUserId: params.freelancerId,
      recipientRole: "FREELANCER",
      type: "PAYMENT",
      priority: "HIGH",
      title: `Escrow Pre-Funded ($${params.amount.toLocaleString()})`,
      message: `Client pre-funded $${params.amount.toLocaleString()} into bilateral escrow. Milestone funds are secured.`,
      projectName: params.projectName,
      projectId: params.projectId,
      actionUrl: `/freelancer/earnings`,
    });

    return [notifClient, notifFreelancer];
  },

  async escrowDisbursed(params: {
    freelancerId: string;
    amount: number;
    txnId: string;
    projectName: string;
    projectId: string;
  }): Promise<NotificationJob> {
    return notificationQueue.enqueue({
      eventName: "ESCROW_DISBURSED",
      recipientUserId: params.freelancerId,
      recipientRole: "FREELANCER",
      type: "PAYMENT",
      priority: "HIGH",
      title: "Withdrawal to PayPal Executed",
      message: `$${params.amount.toLocaleString()} was successfully disbursed to your PayPal account (Txn: ${params.txnId}).`,
      projectName: params.projectName,
      projectId: params.projectId,
      actionUrl: `/freelancer/earnings`,
    });
  },

  async escrowDisputeOpened(params: {
    clientId: string;
    freelancerId: string;
    reason: string;
    projectName: string;
    projectId: string;
  }): Promise<[NotificationJob, NotificationJob]> {
    const notifClient = await notificationQueue.enqueue({
      eventName: "ESCROW_DISPUTE_CLIENT",
      recipientUserId: params.clientId,
      recipientRole: "CLIENT",
      type: "DISPUTE",
      priority: "URGENT",
      title: "Escrow Dispute Escalated to Mediation",
      message: `An escrow hold was requested: "${params.reason}". Nexum AI mediation is reviewing the PRD evidence log.`,
      projectName: params.projectName,
      projectId: params.projectId,
      actionUrl: `/client/workspace?tab=dispute`,
    });

    const notifFreelancer = await notificationQueue.enqueue({
      eventName: "ESCROW_DISPUTE_FREELANCER",
      recipientUserId: params.freelancerId,
      recipientRole: "FREELANCER",
      type: "DISPUTE",
      priority: "URGENT",
      title: "Escrow Dispute Notice",
      message: `Dispute opened regarding milestone deliverables: "${params.reason}". Evidence submission is open.`,
      projectName: params.projectName,
      projectId: params.projectId,
      actionUrl: `/freelancer/workspace?tab=dispute`,
    });

    return [notifClient, notifFreelancer];
  },

  // -------------------------------------------------------------------------
  // 3. AI MEDIATION & CHANGE REQUESTS
  // -------------------------------------------------------------------------

  async changeRequestProposed(params: {
    recipientUserId: string;
    recipientRole: "CLIENT" | "FREELANCER";
    crNumber: string;
    title: string;
    projectName: string;
    projectId: string;
    actionUrl?: string;
  }): Promise<NotificationJob> {
    return notificationQueue.enqueue({
      eventName: "CHANGE_REQUEST_PROPOSED",
      recipientUserId: params.recipientUserId,
      recipientRole: params.recipientRole,
      type: "CHANGE_REQUEST",
      priority: "NORMAL",
      title: `Scope Change Request Proposed (${params.crNumber})`,
      message: `New Change Request proposed: "${params.title}". Nexum AI is analyzing budget and timeline impacts.`,
      projectName: params.projectName,
      projectId: params.projectId,
      actionUrl: params.actionUrl || `/${params.recipientRole.toLowerCase()}/workspace`,
    });
  },

  async aiCounterofferDrafted(params: {
    clientId: string;
    freelancerId: string;
    crNumber: string;
    deltaBudget: number;
    deltaDays: number;
    projectName: string;
    projectId: string;
  }): Promise<[NotificationJob, NotificationJob]> {
    const notifClient = await notificationQueue.enqueue({
      eventName: "AI_COUNTEROFFER_CLIENT",
      recipientUserId: params.clientId,
      recipientRole: "CLIENT",
      type: "CHANGE_REQUEST",
      priority: "NORMAL",
      title: `Counteroffer Drafted by Nexum AI (${params.crNumber})`,
      message: `Nexum AI synthesized a compromise: +$${params.deltaBudget}, +${params.deltaDays} days. Awaiting your approval.`,
      projectName: params.projectName,
      projectId: params.projectId,
      actionUrl: `/client/workspace`,
    });

    const notifFreelancer = await notificationQueue.enqueue({
      eventName: "AI_COUNTEROFFER_FREELANCER",
      recipientUserId: params.freelancerId,
      recipientRole: "FREELANCER",
      type: "CHANGE_REQUEST",
      priority: "NORMAL",
      title: `AI Mediation Counteroffer Ready (${params.crNumber})`,
      message: `Nexum AI proposed +$${params.deltaBudget} budget and +${params.deltaDays} days extension for ${params.crNumber}.`,
      projectName: params.projectName,
      projectId: params.projectId,
      actionUrl: `/freelancer/workspace`,
    });

    return [notifClient, notifFreelancer];
  },

  // -------------------------------------------------------------------------
  // 4. DUAL SHA-256 STATE CONSENSUS
  // -------------------------------------------------------------------------

  async consensusRatified(params: {
    clientId: string;
    freelancerId: string;
    stateHash: string;
    projectName: string;
    projectId: string;
  }): Promise<[NotificationJob, NotificationJob]> {
    const truncatedHash = `${params.stateHash.slice(0, 8)}...${params.stateHash.slice(-6)}`;
    const notifClient = await notificationQueue.enqueue({
      eventName: "CONSENSUS_RATIFIED_CLIENT",
      recipientUserId: params.clientId,
      recipientRole: "CLIENT",
      type: "CONSENSUS",
      priority: "URGENT",
      title: "Dual SHA-256 State Consensus Ratified",
      message: `Bilateral consensus ratified. State hash (${truncatedHash}) cryptographically verified and anchored.`,
      projectName: params.projectName,
      projectId: params.projectId,
      actionUrl: `/client/workspace?tab=activity`,
    });

    const notifFreelancer = await notificationQueue.enqueue({
      eventName: "CONSENSUS_RATIFIED_FREELANCER",
      recipientUserId: params.freelancerId,
      recipientRole: "FREELANCER",
      type: "CONSENSUS",
      priority: "URGENT",
      title: "Dual SHA-256 Consensus Ratified",
      message: `Bilateral consensus ratified. State hash (${truncatedHash}) verified with client signature.`,
      projectName: params.projectName,
      projectId: params.projectId,
      actionUrl: `/freelancer/workspace?tab=activity`,
    });

    return [notifClient, notifFreelancer];
  },

  async consensusBreachAlert(params: {
    clientId: string;
    freelancerId: string;
    clientHash: string;
    freelancerHash: string;
    projectName: string;
    projectId: string;
  }): Promise<[NotificationJob, NotificationJob]> {
    const notifClient = await notificationQueue.enqueue({
      eventName: "CONSENSUS_BREACH_CLIENT",
      recipientUserId: params.clientId,
      recipientRole: "CLIENT",
      type: "CONSENSUS",
      priority: "URGENT",
      title: "Consensus Hash Mismatch Detected",
      message: `CRITICAL: Client state hash does not match freelancer state hash. Execution paused for automated audit.`,
      projectName: params.projectName,
      projectId: params.projectId,
      actionUrl: `/client/workspace?tab=activity`,
    });

    const notifFreelancer = await notificationQueue.enqueue({
      eventName: "CONSENSUS_BREACH_FREELANCER",
      recipientUserId: params.freelancerId,
      recipientRole: "FREELANCER",
      type: "CONSENSUS",
      priority: "URGENT",
      title: "Consensus Hash Mismatch Detected",
      message: `CRITICAL: Freelancer state hash does not match client state hash. Execution paused for audit.`,
      projectName: params.projectName,
      projectId: params.projectId,
      actionUrl: `/freelancer/workspace?tab=activity`,
    });

    return [notifClient, notifFreelancer];
  },

  // -------------------------------------------------------------------------
  // 5. PROPOSALS & INVITATIONS
  // -------------------------------------------------------------------------

  async proposalReceived(params: {
    clientId: string;
    freelancerName: string;
    projectTitle: string;
    projectId: string;
  }): Promise<NotificationJob> {
    return notificationQueue.enqueue({
      eventName: "PROPOSAL_RECEIVED",
      recipientUserId: params.clientId,
      recipientRole: "CLIENT",
      type: "PROPOSAL",
      priority: "NORMAL",
      title: `New Proposal Received for ${params.projectTitle}`,
      message: `${params.freelancerName} submitted a proposal with milestone breakdown and pricing.`,
      projectName: params.projectTitle,
      projectId: params.projectId,
      actionUrl: `/client/projects/${params.projectId}`,
    });
  },

  async proposalShortlisted(params: {
    freelancerId: string;
    projectTitle: string;
    clientName: string;
    projectId: string;
  }): Promise<NotificationJob> {
    return notificationQueue.enqueue({
      eventName: "PROPOSAL_SHORTLISTED",
      recipientUserId: params.freelancerId,
      recipientRole: "FREELANCER",
      type: "PROPOSAL",
      priority: "HIGH",
      title: "Proposal Shortlisted!",
      message: `${params.clientName} shortlisted your proposal for "${params.projectTitle}". Interview or contract drafting pending.`,
      projectName: params.projectTitle,
      projectId: params.projectId,
      actionUrl: `/freelancer/proposals`,
    });
  },
};

