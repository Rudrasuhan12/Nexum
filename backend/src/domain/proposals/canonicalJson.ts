import crypto from "crypto";

/**
 * Pure function: Canonical JSON serialization.
 * Produces deterministic, sorted-key, whitespace-free JSON representation.
 */
export function canonicalJson(obj: any): string {
  if (obj === null || obj === undefined) {
    return "null";
  }

  if (typeof obj !== "object") {
    return JSON.stringify(obj);
  }

  if (Array.isArray(obj)) {
    return `[${obj.map((item) => canonicalJson(item)).join(",")}]`;
  }

  const sortedKeys = Object.keys(obj).sort();
  const pairs = sortedKeys.map((key) => {
    const valStr = canonicalJson(obj[key]);
    return `${JSON.stringify(key)}:${valStr}`;
  });

  return `{${pairs.join(",")}}`;
}

/**
 * Fixed field set extracted from a version for cryptographic immutability hashing.
 */
export interface ProposalVersionHashInput {
  projectId: string;
  freelancerId: string;
  versionNumber: number;
  paymentModel?: string | null;
  totalAmountMinor?: number | null;
  hourlyRateMinor?: number | null;
  estimatedHours?: number | null;
  currency: string;
  scopeText?: string | null;
  deliverables?: any[];
  milestones?: any[];
  exclusions?: any;
  assumptions?: any;
  dependencies?: string | null;
  estimatedDurationWeeks?: number | null;
  startAvailableOn?: string | Date | null;
}

/**
 * Pure function: Deterministic SHA-256 version hash.
 * Given the same content, always computes the exact same hex digest.
 */
export function hashVersion(input: ProposalVersionHashInput): string {
  const normalizedMilestones = (input.milestones || []).map((m: any) => ({
    title: m.title?.trim() || "",
    description: m.description?.trim() || "",
    criteria: Array.isArray(m.criteria) ? m.criteria.map((c: any) => String(c).trim()).sort() : [],
    amountMinor: Number(m.amountMinor || m.amountCents || 0),
    durationDays: m.durationDays ? Number(m.durationDays) : null,
  }));

  const normalizedDeliverables = (input.deliverables || []).map((d: any) => ({
    title: d.title?.trim() || "",
    description: d.description?.trim() || "",
  }));

  const fixedPayload = {
    projectId: input.projectId,
    freelancerId: input.freelancerId,
    versionNumber: Number(input.versionNumber),
    paymentModel: input.paymentModel || "FIXED_PRICE",
    totalAmountMinor: input.totalAmountMinor ?? null,
    hourlyRateMinor: input.hourlyRateMinor ?? null,
    estimatedHours: input.estimatedHours ?? null,
    currency: input.currency || "USD",
    scopeText: input.scopeText?.trim() || "",
    deliverables: normalizedDeliverables,
    milestones: normalizedMilestones,
    exclusions: input.exclusions ?? null,
    assumptions: input.assumptions ?? null,
    dependencies: input.dependencies?.trim() || null,
    estimatedDurationWeeks: input.estimatedDurationWeeks ?? null,
    startAvailableOn: input.startAvailableOn
      ? typeof input.startAvailableOn === "string"
        ? input.startAvailableOn.split("T")[0]
        : input.startAvailableOn.toISOString().split("T")[0]
      : null,
  };

  const canonicalString = canonicalJson(fixedPayload);
  return crypto.createHash("sha256").update(canonicalString, "utf8").digest("hex");
}
