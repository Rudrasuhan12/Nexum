import { ProposalStatus, Role } from "@prisma/client";
import { ConflictError } from "../../lib/errors.js";

export type ProposalEventName =
  | "submit"
  | "start_review"
  | "shortlist"
  | "start_discussion"
  | "counteroffer"
  | "revise"
  | "accept"
  | "withdraw"
  | "reject";

/**
 * Pure function: Implements the exact proposal state machine table from the Build Guide.
 * 
 * Rules:
 * - ACCEPTED, REJECTED, and WITHDRAWN are terminal.
 * - Any illegal jump or transition throws ConflictError (409 INVALID_TRANSITION).
 */
export function transitionProposal(
  currentStatus: ProposalStatus,
  event: ProposalEventName,
  actorRole: Role
): ProposalStatus {
  // Terminal states cannot transition to anything
  if (
    currentStatus === ProposalStatus.ACCEPTED ||
    currentStatus === ProposalStatus.REJECTED ||
    currentStatus === ProposalStatus.WITHDRAWN
  ) {
    throw new ConflictError(
      `Cannot transition proposal from terminal status ${currentStatus}`,
      "INVALID_TRANSITION"
    );
  }

  // Event: withdraw (freelancer can withdraw from any status before ACCEPTED or REJECTED)
  if (event === "withdraw") {
    if (actorRole !== Role.FREELANCER) {
      throw new ConflictError("Only freelancer can withdraw a proposal", "INVALID_TRANSITION");
    }
    return ProposalStatus.WITHDRAWN;
  }

  // Event: submit (freelancer submits draft)
  if (event === "submit") {
    if (currentStatus === ProposalStatus.DRAFT && actorRole === Role.FREELANCER) {
      return ProposalStatus.SUBMITTED;
    }
    throw new ConflictError(
      `Invalid transition: submit from ${currentStatus} by ${actorRole}`,
      "INVALID_TRANSITION"
    );
  }

  // Event: start_review (client starts reviewing submitted proposal)
  if (event === "start_review") {
    if (currentStatus === ProposalStatus.SUBMITTED && actorRole === Role.CLIENT) {
      return ProposalStatus.UNDER_REVIEW;
    }
    throw new ConflictError(
      `Invalid transition: start_review from ${currentStatus} by ${actorRole}`,
      "INVALID_TRANSITION"
    );
  }

  // Event: shortlist (client shortlists candidate)
  if (event === "shortlist") {
    if (
      (currentStatus === ProposalStatus.SUBMITTED || currentStatus === ProposalStatus.UNDER_REVIEW) &&
      actorRole === Role.CLIENT
    ) {
      return ProposalStatus.SHORTLISTED;
    }
    throw new ConflictError(
      `Invalid transition: shortlist from ${currentStatus} by ${actorRole}`,
      "INVALID_TRANSITION"
    );
  }

  // Event: start_discussion (client initiates interview / discussion)
  if (event === "start_discussion") {
    if (
      (currentStatus === ProposalStatus.SUBMITTED ||
        currentStatus === ProposalStatus.UNDER_REVIEW ||
        currentStatus === ProposalStatus.SHORTLISTED) &&
      actorRole === Role.CLIENT
    ) {
      return ProposalStatus.INTERVIEW_DISCUSSION;
    }
    throw new ConflictError(
      `Invalid transition: start_discussion from ${currentStatus} by ${actorRole}`,
      "INVALID_TRANSITION"
    );
  }

  // Event: counteroffer (client sends counteroffer terms)
  if (event === "counteroffer") {
    if (
      (currentStatus === ProposalStatus.SUBMITTED ||
        currentStatus === ProposalStatus.UNDER_REVIEW ||
        currentStatus === ProposalStatus.SHORTLISTED ||
        currentStatus === ProposalStatus.INTERVIEW_DISCUSSION) &&
      actorRole === Role.CLIENT
    ) {
      return ProposalStatus.COUNTEROFFER_RECEIVED;
    }
    throw new ConflictError(
      `Invalid transition: counteroffer from ${currentStatus} by ${actorRole}`,
      "INVALID_TRANSITION"
    );
  }

  // Event: revise (freelancer responds to counteroffer with revised version)
  if (event === "revise") {
    if (currentStatus === ProposalStatus.COUNTEROFFER_RECEIVED && actorRole === Role.FREELANCER) {
      return ProposalStatus.INTERVIEW_DISCUSSION;
    }
    throw new ConflictError(
      `Invalid transition: revise from ${currentStatus} by ${actorRole}`,
      "INVALID_TRANSITION"
    );
  }

  // Event: accept (either freelancer accepts counteroffer, or client accepts submitted/reviewed proposal)
  if (event === "accept") {
    if (currentStatus === ProposalStatus.COUNTEROFFER_RECEIVED && actorRole === Role.FREELANCER) {
      return ProposalStatus.ACCEPTED;
    }
    if (
      (currentStatus === ProposalStatus.SUBMITTED ||
        currentStatus === ProposalStatus.UNDER_REVIEW ||
        currentStatus === ProposalStatus.SHORTLISTED ||
        currentStatus === ProposalStatus.INTERVIEW_DISCUSSION) &&
      actorRole === Role.CLIENT
    ) {
      return ProposalStatus.ACCEPTED;
    }
    throw new ConflictError(
      `Invalid transition: accept from ${currentStatus} by ${actorRole}`,
      "INVALID_TRANSITION"
    );
  }

  // Event: reject (client rejects proposal with optional feedback)
  if (event === "reject") {
    if (
      (currentStatus === ProposalStatus.SUBMITTED ||
        currentStatus === ProposalStatus.UNDER_REVIEW ||
        currentStatus === ProposalStatus.SHORTLISTED ||
        currentStatus === ProposalStatus.INTERVIEW_DISCUSSION ||
        currentStatus === ProposalStatus.COUNTEROFFER_RECEIVED) &&
      actorRole === Role.CLIENT
    ) {
      return ProposalStatus.REJECTED;
    }
    throw new ConflictError(
      `Invalid transition: reject from ${currentStatus} by ${actorRole}`,
      "INVALID_TRANSITION"
    );
  }

  throw new ConflictError(
    `Unsupported event ${event} from ${currentStatus} by ${actorRole}`,
    "INVALID_TRANSITION"
  );
}
