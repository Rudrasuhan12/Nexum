import { PrismaClient } from "@prisma/client";
import { AgreementStatus, AgreementVersionStatus, ProjectState, MilestoneWorkStatus } from "@prisma/client";
import { appendAuditEvent } from "../../lib/audit.js";

/**
 * Attempts to activate an agreement version if both parties have approved it.
 * Runs atomically inside a transaction.
 */
export async function tryActivateAgreementVersion(
  versionId: string,
  prisma: PrismaClient
): Promise<{ activated: boolean; agreementId?: string }> {
  // 1. Fetch version with approvals and agreement
  const version = await prisma.agreementVersion.findUnique({
    where: { id: versionId },
    include: {
      approvals: true,
      agreement: true,
    },
  });

  if (!version) {
    return { activated: false };
  }

  // Check if both CLIENT and FREELANCER have APPROVED decisions
  const hasClientApproval = version.approvals.some(
    (a) => a.partyRole === "CLIENT" && a.decision === "APPROVED"
  );
  const hasFreelancerApproval = version.approvals.some(
    (a) => a.partyRole === "FREELANCER" && a.decision === "APPROVED"
  );

  if (!hasClientApproval || !hasFreelancerApproval) {
    return { activated: false, agreementId: version.agreementId };
  }

  const agreement = version.agreement;

  // Perform atomic activation transaction
  return await prisma.$transaction(async (tx) => {
    // 2. Supersede any previously active versions for this agreement
    await tx.agreementVersion.updateMany({
      where: {
        agreementId: agreement.id,
        status: AgreementVersionStatus.ACTIVE,
      },
      data: {
        status: AgreementVersionStatus.SUPERSEDED,
      },
    });

    // 3. Mark this version as ACTIVE
    const activatedAt = new Date();
    await tx.agreementVersion.update({
      where: { id: versionId },
      data: {
        status: AgreementVersionStatus.ACTIVE,
        activatedAt,
      },
    });

    // 4. Update agreement status and activeVersionId
    await tx.agreement.update({
      where: { id: agreement.id },
      data: {
        status: AgreementStatus.ACTIVE,
        activeVersionId: versionId,
      },
    });

    // 5. Update Project status to IN_PROGRESS (mapped to ACTIVE)
    await tx.project.update({
      where: { id: agreement.projectId },
      data: {
        state: ProjectState.ACTIVE,
      },
    });

    // 6. Synchronize milestones
    const terms = version.terms as any;
    const versionMilestones: any[] = terms?.milestones || [];

    const existingMilestones = await tx.milestone.findMany({
      where: {
        agreementId: agreement.id,
      },
    });
    const existingMap = new Map(existingMilestones.map((m) => [m.milestoneKey || m.id, m]));

    // Check for removed milestones (not present in new version)
    const newVersionKeys = new Set(versionMilestones.map((vm) => vm.key || vm.id));
    for (const em of existingMilestones) {
      const key = em.milestoneKey || em.id;
      if (!newVersionKeys.has(key) && em.workStatus !== MilestoneWorkStatus.ACCEPTED) {
        await tx.milestone.update({
          where: { id: em.id },
          data: {
            removedAt: new Date(),
          },
        });
      }
    }

    for (let i = 0; i < versionMilestones.length; i++) {
      const vm = versionMilestones[i];
      const key = vm.key || `m_${i + 1}`;
      const existing = existingMap.get(key);

      if (!existing) {
        // Create upcoming milestone
        await tx.milestone.create({
          data: {
            projectId: agreement.projectId,
            agreementId: agreement.id,
            milestoneKey: key,
            sequence: i + 1,
            title: vm.title,
            description: vm.description || null,
            criteria: vm.criteria || [],
            amountMinor: vm.amountMinor,
            currency: terms.currency || "USD",
            dueDate: vm.dueDate ? new Date(vm.dueDate) : null,
            workStatus: MilestoneWorkStatus.UPCOMING,
            lastAgreementVersionId: versionId,
            // Legacy schema compatibility
            amountCents: vm.amountMinor,
            state: "NOT_STARTED",
          },
        });
      } else {
        // Only update if not already ACCEPTED
        if (existing.workStatus !== MilestoneWorkStatus.ACCEPTED) {
          await tx.milestone.update({
            where: { id: existing.id },
            data: {
              sequence: i + 1,
              title: vm.title,
              description: vm.description || null,
              criteria: vm.criteria || existing.criteria,
              amountMinor: vm.amountMinor,
              amountCents: vm.amountMinor,
              dueDate: vm.dueDate ? new Date(vm.dueDate) : existing.dueDate,
              lastAgreementVersionId: versionId,
              removedAt: null,
            },
          });
        }
      }
    }

    // 7. If this version was from a ChangeRequest, mark it APPROVED and record APPROVED_CHANGE decision
    if (version.source === "CHANGE_REQUEST" && version.sourceRefId) {
      await tx.changeRequest.updateMany({
        where: { id: version.sourceRefId },
        data: {
          status: "APPROVED",
        },
      });

      await tx.projectDecision.create({
        data: {
          projectId: agreement.projectId,
          title: `Approved Change: Agreement Version ${version.versionNumber}`,
          description: `Scope and terms amendment activated via Change Request ${version.sourceRefId}`,
          kind: "APPROVED_CHANGE",
          binding: true,
          sourceType: "CHANGE_REQUEST",
          sourceRefId: version.sourceRefId,
          agreementVersionId: versionId,
          recordedBy: agreement.freelancerId,
        },
      });
    }

    // 8. Audit event
    await appendAuditEvent(
      {
        actorId: agreement.freelancerId,
        action: "AGREEMENT_VERSION_ACTIVATED",
        objectType: "AGREEMENT_VERSION",
        objectId: versionId,
        previousStatus: "PENDING_APPROVAL",
        newStatus: "ACTIVE",
        metadata: {
          agreementId: agreement.id,
          versionNumber: version.versionNumber,
          totalAmountMinor: terms.totalAmountMinor,
        },
      },
      tx
    );

    return { activated: true, agreementId: agreement.id };
  });
}
