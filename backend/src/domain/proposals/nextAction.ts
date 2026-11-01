import { ProposalStatus } from "@prisma/client";

export interface NextActionInfo {
  code: string;
  label: string;
}

/**
 * Pure function: Implements the exact Next Action per status table from the Build Guide (Page 24).
 */
export function getNextAction(status: ProposalStatus, hasFeedback: boolean = false): NextActionInfo {
  switch (status) {
    case ProposalStatus.DRAFT:
      return { code: "EDIT_SUBMIT", label: "Edit & Submit" };
    case ProposalStatus.SUBMITTED:
      return { code: "VIEW_PROPOSAL", label: "View Proposal" };
    case ProposalStatus.UNDER_REVIEW:
      return { code: "VIEW_DETAILS", label: "View Details" };
    case ProposalStatus.SHORTLISTED:
      return { code: "PREPARE_DISCUSSION", label: "Prepare for Discussion" };
    case ProposalStatus.INTERVIEW_DISCUSSION:
      return { code: "OPEN_CONVERSATION", label: "Open Conversation" };
    case ProposalStatus.COUNTEROFFER_RECEIVED:
      return { code: "REVIEW_COUNTEROFFER", label: "Review Counteroffer" };
    case ProposalStatus.ACCEPTED:
      return { code: "REVIEW_AGREEMENT", label: "Review Agreement" };
    case ProposalStatus.REJECTED:
      return hasFeedback
        ? { code: "VIEW_FEEDBACK", label: "View Feedback" }
        : { code: "VIEW_DETAILS", label: "View Details" };
    case ProposalStatus.WITHDRAWN:
      return { code: "VIEW_DETAILS", label: "View Details" };
    default:
      return { code: "VIEW_DETAILS", label: "View Details" };
  }
}
