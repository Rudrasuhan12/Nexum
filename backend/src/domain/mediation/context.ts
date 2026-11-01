import { PrismaClient, AgreementStatus, AgreementVersionStatus } from "@prisma/client";
import { ProjectContextSummary } from "./classify.js";

/**
 * Builds safe project context strictly from shared project records.
 * NEVER accesses private AI chats, private tasks, or budget ceilings.
 */
export async function buildSafeProjectContext(
  projectId: string,
  prisma: PrismaClient
): Promise<ProjectContextSummary> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      agreement: {
        include: {
          versions: {
            where: { status: { in: [AgreementVersionStatus.ACTIVE, AgreementVersionStatus.PENDING_APPROVAL] } },
            orderBy: { versionNumber: "desc" },
          },
        },
      },
      projectMilestones: {
        where: { removedAt: null },
        orderBy: { sequence: "asc" },
      },
    },
  });

  if (!project) {
    return {
      projectId,
      hasActiveAgreement: false,
      milestones: [],
    };
  }

  const activeVersion = project.agreement?.versions.find(
    (v) => v.status === AgreementVersionStatus.ACTIVE
  );
  const pendingVersion = project.agreement?.versions.find(
    (v) => v.status === AgreementVersionStatus.PENDING_APPROVAL
  );

  return {
    projectId,
    hasActiveAgreement: Boolean(project.agreement?.status === AgreementStatus.ACTIVE && activeVersion),
    activeAgreementVersion: activeVersion?.versionNumber,
    pendingVersionId: pendingVersion?.id,
    pendingVersionNumber: pendingVersion?.versionNumber,
    milestones: project.projectMilestones.map((m) => ({
      id: m.id,
      title: m.title,
      sequence: m.sequence ?? 1,
    })),
  };
}
