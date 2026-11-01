import crypto from "crypto";
import { canonicalJson } from "../proposals/canonicalJson.js";
import { AgreementTerms, AgreementMilestoneTerm } from "./createTerms.js";

export interface ChangeDelta {
  addMilestones?: Array<{
    title: string;
    description?: string;
    amountMinor: number;
    durationWeeks?: number;
    criteria?: Array<{ id?: string; text: string } | string>;
    dueDate?: string | null;
  }>;
  updateMilestones?: Array<{
    key: string;
    changes: Partial<AgreementMilestoneTerm>;
  }>;
  removeMilestoneKeys?: string[];
}

export class MilestoneLockedError extends Error {
  code: string;
  statusCode: number;
  constructor(message: string, code: string = "ACCEPTED_MILESTONE_LOCKED") {
    super(message);
    this.name = "MilestoneLockedError";
    this.code = code;
    this.statusCode = 422;
  }
}

export function applyChangeToTerms(
  activeTerms: AgreementTerms,
  delta: ChangeDelta,
  existingMilestoneStatuses: Map<string, string> = new Map()
): {
  newTerms: AgreementTerms;
  contentHash: string;
} {
  const currentMilestones = [...activeTerms.milestones];

  // 1. Check for negative amounts
  if (delta.addMilestones) {
    for (const m of delta.addMilestones) {
      if (typeof m.amountMinor === "number" && m.amountMinor < 0) {
        throw new MilestoneLockedError("Milestone amount cannot be negative", "VALIDATION_ERROR");
      }
    }
  }
  if (delta.updateMilestones) {
    for (const u of delta.updateMilestones) {
      if (typeof u.changes.amountMinor === "number" && u.changes.amountMinor < 0) {
        throw new MilestoneLockedError("Milestone amount cannot be negative", "VALIDATION_ERROR");
      }
    }
  }

  // 2. Validate updateMilestones: cannot edit ACCEPTED milestone
  if (delta.updateMilestones) {
    for (const u of delta.updateMilestones) {
      const status = existingMilestoneStatuses.get(u.key);
      if (status === "ACCEPTED") {
        throw new MilestoneLockedError(
          `Cannot modify milestone ${u.key} because it is already ACCEPTED`,
          "ACCEPTED_MILESTONE_LOCKED"
        );
      }
    }
  }

  // 3. Validate removeMilestoneKeys: cannot remove ACCEPTED or IN_PROGRESS/active milestone
  if (delta.removeMilestoneKeys) {
    for (const key of delta.removeMilestoneKeys) {
      const status = existingMilestoneStatuses.get(key);
      if (status === "ACCEPTED") {
        throw new MilestoneLockedError(
          `Cannot remove milestone ${key} because it is already ACCEPTED`,
          "ACCEPTED_MILESTONE_LOCKED"
        );
      }
      if (
        status === "IN_PROGRESS" ||
        status === "READY_TO_SUBMIT" ||
        status === "AWAITING_CLIENT_REVIEW" ||
        status === "REVISIONS_REQUESTED"
      ) {
        throw new MilestoneLockedError(
          `Cannot remove milestone ${key} because it currently has work in progress (${status})`,
          "MILESTONE_HAS_WORK"
        );
      }
    }
  }

  // 4. Apply updates
  let updatedList = currentMilestones.map((m) => {
    const update = delta.updateMilestones?.find((u) => u.key === m.key);
    if (!update) return m;
    return {
      ...m,
      ...update.changes,
      criteria: update.changes.criteria ?? m.criteria,
    };
  });

  // 5. Apply removals
  if (delta.removeMilestoneKeys && delta.removeMilestoneKeys.length > 0) {
    const removeSet = new Set(delta.removeMilestoneKeys);
    updatedList = updatedList.filter((m) => !removeSet.has(m.key));
  }

  // 6. Apply additions
  if (delta.addMilestones && delta.addMilestones.length > 0) {
    let nextSeq = updatedList.length + 1;
    for (const add of delta.addMilestones) {
      const key = `m_${Date.now()}_${nextSeq}`;
      const rawCrit = add.criteria || [];
      const criteria = rawCrit.map((c, idx) => {
        if (typeof c === "string") return { id: `crit_new_${nextSeq}_${idx + 1}`, text: c };
        return { id: c.id || `crit_new_${nextSeq}_${idx + 1}`, text: c.text };
      });
      updatedList.push({
        key,
        sequence: nextSeq,
        title: add.title,
        description: add.description || "",
        criteria,
        amountMinor: add.amountMinor,
        dueDate: add.dueDate || null,
      });
      nextSeq++;
    }
  }

  // Recalculate total
  const newTotal = updatedList.reduce((acc, m) => acc + m.amountMinor, 0);

  const newTerms: AgreementTerms = {
    ...activeTerms,
    totalAmountMinor: newTotal,
    milestones: updatedList,
  };

  const contentHash = crypto
    .createHash("sha256")
    .update(canonicalJson(newTerms))
    .digest("hex");

  return { newTerms, contentHash };
}
