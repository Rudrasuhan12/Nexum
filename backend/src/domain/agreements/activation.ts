import { PrismaClient, AgreementVersionStatus, AgreementStatus, MilestoneWorkStatus, ProjectState } from "@prisma/client";
import { appendAuditEvent } from "../../lib/audit.js";

export async function tryActivateAgreementVersion(
  versionId: string,
  prismaClient: PrismaClient
): Promise<{ activated: boolean; agreementId: string }> {
  return await prismaClient.$transaction(async (tx) => {
    // 1. Fetch version with approvals and agreement
    const version = await tx.agreementVersion.findUnique({
      where: { id: versionId },
      include: {
        approvals: true,
        agreement: {
          include: {
            project: true,
          },
        },
      },
    });

    if (!version) {
      throw new Error(`AgreementVersion ${versionId} not found`);
    }

    const agreement = version.agreement;

    // Check if already active or superseded
    if (version.status === AgreementVersionStatus.ACTIVE) {
      return { activated: false, agreementId: agreement.id };
    }

    // Check both client and freelancer approved
    const clientApproved = version.approvals.some(
      (a) => a.partyRole === "CLIENT" && a.decision === "APPROVED"
    );
    const freelancerApproved = version.approvals.some(
      (a) => a.partyRole === "FREELANCER" && a.decision === "APPROVED"
    );

    if (!clientApproved || !freelancerApproved) {
      return { activated: false, agreementId: agreement.id };
    }

    // 2. Mark any currently ACTIVE version as SUPERSEDED
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
    const versionKeys = new Set(versionMilestones.map((m) => m.key));

    // Existing milestones for this agreement
    const existingMilestones = await tx.milestone.findMany({
      where: { agreementId: agreement.id },
    });
    const existingKeyMap = new Map(existingMilestones.map((m) => [m.milestoneKey || m.id, m]));

    // Soft-delete removed milestones
    for (const em of existingMilestones) {
      const key = em.milestoneKey || em.id;
      if (!versionKeys.has(key) && !em.removedAt) {
        await tx.milestone.update({
          where: { id: em.id },
          data: { removedAt: activatedAt },
        });
      }
    }

    // Upsert version milestones
    for (const vm of versionMilestones) {
      const key = vm.key;
      const existing = existingKeyMap.get(key);

      if (!existing) {
        // Insert new milestone as UPCOMING
        await tx.milestone.create({
          data: {
            projectId: agreement.projectId,
            agreementId: agreement.id,
            milestoneKey: key,
            sequence: vm.sequence,
            title: vm.title,
            description: vm.description || "",
            criteria: vm.criteria || [],
            amountMinor: vm.amountMinor,
            amountCents: vm.amountMinor,
            currency: terms.currency || "USD",
            workStatus: MilestoneWorkStatus.UPCOMING,
            dueDate: vm.dueDate ? new Date(vm.dueDate) : null,
            lastAgreementVersionId: versionId,
          },
        });
      } else {
        // An ACCEPTED milestone is NEVER modified
        if (existing.workStatus !== MilestoneWorkStatus.ACCEPTED) {
          await tx.milestone.update({
            where: { id: existing.id },
            data: {
              sequence: vm.sequence,
              title: vm.title,
              description: vm.description || existing.description,
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

    // 7. If this version was from a ChangeRequest, mark it APPROVED
    if (version.source === "CHANGE_REQUEST" && version.sourceRefId) {
      await tx.changeRequest.updateMany({
        where: { id: version.sourceRefId },
        data: {
          status: "APPROVED",
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
