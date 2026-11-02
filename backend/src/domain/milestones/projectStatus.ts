import { MilestoneWorkStatus, ProjectState } from "@prisma/client";

export function deriveProjectStatus(
  milestones: Array<{ workStatus: MilestoneWorkStatus; removedAt?: Date | null }>
): ProjectState {
  const activeMilestones = milestones.filter((m) => !m.removedAt);

  if (activeMilestones.length === 0) {
    return ProjectState.INTAKE;
  }

  // 1. If any milestone is disputed -> DISPUTED
  if (activeMilestones.some((m) => m.workStatus === MilestoneWorkStatus.DISPUTED)) {
    return ProjectState.DISPUTED;
  }

  // 2. If 100% of milestones are accepted -> COMPLETED
  if (activeMilestones.every((m) => m.workStatus === MilestoneWorkStatus.ACCEPTED)) {
    return ProjectState.COMPLETED;
  }

  // 3. Check for IN_REVIEW: only when the last unaccepted milestone is AWAITING_CLIENT_REVIEW
  // and all other milestones are already ACCEPTED.
  const unaccepted = activeMilestones.filter((m) => m.workStatus !== MilestoneWorkStatus.ACCEPTED);
  if (
    unaccepted.length === 1 &&
    unaccepted[0].workStatus === MilestoneWorkStatus.AWAITING_CLIENT_REVIEW
  ) {
    return "IN_REVIEW" as any; // Maps to IN_REVIEW derived status
  }

  // 4. While work remains -> ACTIVE (IN_PROGRESS)
  return ProjectState.ACTIVE;
}
