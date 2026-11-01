import crypto from "crypto";

/**
 * Deterministically sorts all keys of an object recursively for canonical JSON serialization.
 */
export function canonicalizeJson(obj: any): any {
  if (obj === null || typeof obj !== "object") {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(canonicalizeJson);
  }

  const sortedKeys = Object.keys(obj).sort();
  const sortedObj: Record<string, any> = {};
  for (const key of sortedKeys) {
    sortedObj[key] = canonicalizeJson(obj[key]);
  }
  return sortedObj;
}

export function computeSha256(data: any): string {
  const canonical = canonicalizeJson(data);
  const serialized = JSON.stringify(canonical);
  return crypto.createHash("sha256").update(serialized).digest("hex");
}

export interface EvidencePacketInput {
  projectId: string;
  milestoneId: string;
  milestoneKey?: string | null;
  agreementVersionHash?: string | null;
  submissionHash?: string | null;
  acceptanceRecord?: {
    acceptedAt: string;
    acceptedByRole: string;
    decision: string;
  } | null;
  paypalOrderId?: string | null;
  paypalCaptureId?: string | null;
  amountMinor: number;
  currency: string;
  eventTimeline: Array<{
    eventType: string;
    source: string;
    receivedAt: string;
  }>;
}

export function buildEvidencePacket(input: EvidencePacketInput): {
  payload: Record<string, any>;
  sha256: string;
} {
  const payload = {
    projectId: input.projectId,
    milestoneId: input.milestoneId,
    milestoneKey: input.milestoneKey || null,
    agreementVersionHash: input.agreementVersionHash || null,
    submissionHash: input.submissionHash || null,
    acceptanceRecord: input.acceptanceRecord || null,
    paypalOrderId: input.paypalOrderId || null,
    paypalCaptureId: input.paypalCaptureId || null,
    amountMinor: input.amountMinor,
    currency: input.currency,
    eventTimeline: input.eventTimeline.sort((a, b) =>
      a.receivedAt.localeCompare(b.receivedAt)
    ),
  };

  const sha256 = computeSha256(payload);

  return {
    payload,
    sha256,
  };
}

