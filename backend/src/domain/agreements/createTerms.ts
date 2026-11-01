import crypto from "crypto";
import { canonicalJson } from "../proposals/canonicalJson.js";

export interface AgreementMilestoneTerm {
  key: string;
  sequence: number;
  title: string;
  description?: string;
  criteria: Array<{ id: string; text: string }>;
  amountMinor: number;
  dueDate?: string | null;
}

export interface AgreementTerms {
  scope: string;
  deliverables: any[];
  exclusions: any[];
  assumptions: any[];
  paymentModel: "FIXED_PRICE" | "HOURLY";
  currency: string;
  totalAmountMinor: number;
  durationWeeks: number;
  milestones: AgreementMilestoneTerm[];
}

export function createAgreementTermsFromProposalVersion(version: any): {
  terms: AgreementTerms;
  contentHash: string;
} {
  const rawMilestones = Array.isArray(version.milestonesJson) ? version.milestonesJson : [];

  const milestones: AgreementMilestoneTerm[] = rawMilestones.map((m: any, idx: number) => {
    const rawCriteria = Array.isArray(m.criteria) ? m.criteria : [];
    const criteria = rawCriteria.map((c: any, cIdx: number) => {
      if (typeof c === "string") {
        return { id: `crit_${idx + 1}_${cIdx + 1}`, text: c };
      }
      return {
        id: c.id || `crit_${idx + 1}_${cIdx + 1}`,
        text: c.text || c.title || "Deliverable acceptance criterion",
      };
    });

    return {
      key: m.key || `m_${idx + 1}`,
      sequence: m.sequence ?? idx + 1,
      title: m.title || `Milestone ${idx + 1}`,
      description: m.description || "",
      criteria,
      amountMinor: m.amountMinor ?? m.amountCents ?? 0,
      dueDate: m.dueDate ? new Date(m.dueDate).toISOString() : null,
    };
  });

  const totalAmountMinor =
    version.totalAmountMinor ??
    version.amountCents ??
    milestones.reduce((acc, m) => acc + m.amountMinor, 0);

  const terms: AgreementTerms = {
    scope: version.scopeText || version.scope || "Project agreement execution scope",
    deliverables: Array.isArray(version.deliverables) ? version.deliverables : [],
    exclusions: Array.isArray(version.exclusions) ? version.exclusions : [],
    assumptions: Array.isArray(version.assumptions) ? version.assumptions : [],
    paymentModel: version.paymentModel === "HOURLY" ? "HOURLY" : "FIXED_PRICE",
    currency: version.currency || "USD",
    totalAmountMinor,
    durationWeeks: version.estimatedDurationWeeks || 4,
    milestones,
  };

  const contentHash = crypto
    .createHash("sha256")
    .update(canonicalJson(terms))
    .digest("hex");

  return { terms, contentHash };
}
