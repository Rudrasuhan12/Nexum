import { prisma } from "../prisma.js";
import { createAgreementTermsFromProposalVersion } from "../domain/agreements/createTerms.js";
import { AgreementStatus, AgreementVersionStatus } from "@prisma/client";

export async function backfillAgreements(): Promise<{ createdCount: number; skippedCount: number }> {
  console.log("Starting agreements:backfill...");

  const acceptedProposals = await prisma.proposal.findMany({
    where: { status: "ACCEPTED" },
    include: {
      project: { select: { id: true, clientId: true } },
      versions: {
        orderBy: { version: "desc" },
        take: 1,
      },
    },
  });

  console.log(`Found ${acceptedProposals.length} ACCEPTED proposals.`);
  let createdCount = 0;
  let skippedCount = 0;

  for (const prop of acceptedProposals) {
    const existing = await prisma.agreement.findUnique({
      where: { projectId: prop.projectId },
    });

    if (existing) {
      console.log(`Skipping project ${prop.projectId}: agreement ${existing.id} already exists.`);
      skippedCount++;
      continue;
    }

    const currentVer = prop.versions[0];
    if (!currentVer) {
      console.warn(`Proposal ${prop.id} has no versions; skipping.`);
      continue;
    }

    const { terms, contentHash } = createAgreementTermsFromProposalVersion(currentVer);

    const agreement = await prisma.agreement.create({
      data: {
        projectId: prop.projectId,
        proposalId: prop.id,
        clientId: prop.project.clientId,
        freelancerId: prop.freelancerId,
        status: AgreementStatus.PENDING_APPROVAL,
        versions: {
          create: {
            versionNumber: 1,
            source: "PROPOSAL",
            sourceRefId: prop.id,
            terms: terms as any,
            contentHash,
            status: AgreementVersionStatus.PENDING_APPROVAL,
          },
        },
      },
    });

    console.log(`Created agreement ${agreement.id} (v1 hash: ${contentHash}) for project ${prop.projectId}.`);
    createdCount++;
  }

  console.log(`agreements:backfill finished: ${createdCount} created, ${skippedCount} skipped.`);
  return { createdCount, skippedCount };
}

if (process.argv[1]?.endsWith("backfillAgreements.ts") || process.argv[1]?.endsWith("backfillAgreements.js")) {
  backfillAgreements()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Backfill error:", err);
      process.exit(1);
    });
}
