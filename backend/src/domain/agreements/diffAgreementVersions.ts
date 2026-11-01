import { AgreementTerms } from "./createTerms.js";

export interface AgreementDiff {
  amountDelta: number;
  priceDeltaMinor: number;
  newTotalAmountMinor: number;
  durationDeltaWeeks: number;
  milestonesAdded: any[];
  milestonesModified: any[];
  milestonesRemoved: any[];
  scopeChanged: boolean;
}

export function diffAgreementVersions(termsA: AgreementTerms, termsB: AgreementTerms): AgreementDiff {
  const mapA = new Map(termsA.milestones.map((m) => [m.key, m]));
  const mapB = new Map(termsB.milestones.map((m) => [m.key, m]));

  const milestonesAdded: any[] = [];
  const milestonesModified: any[] = [];
  const milestonesRemoved: any[] = [];

  for (const [key, mB] of mapB.entries()) {
    if (!mapA.has(key)) {
      milestonesAdded.push(mB);
    } else {
      const mA = mapA.get(key)!;
      if (
        mA.amountMinor !== mB.amountMinor ||
        mA.title !== mB.title ||
        mA.description !== mB.description ||
        JSON.stringify(mA.criteria) !== JSON.stringify(mB.criteria)
      ) {
        milestonesModified.push({
          key,
          previous: mA,
          current: mB,
          amountDelta: mB.amountMinor - mA.amountMinor,
        });
      }
    }
  }

  for (const [key, mA] of mapA.entries()) {
    if (!mapB.has(key)) {
      milestonesRemoved.push(mA);
    }
  }

  return {
    amountDelta: termsB.totalAmountMinor - termsA.totalAmountMinor,
    priceDeltaMinor: termsB.totalAmountMinor - termsA.totalAmountMinor,
    newTotalAmountMinor: termsB.totalAmountMinor,
    durationDeltaWeeks: (termsB.durationWeeks || 0) - (termsA.durationWeeks || 0),
    milestonesAdded,
    milestonesModified,
    milestonesRemoved,
    scopeChanged: termsA.scope !== termsB.scope,
  };
}
