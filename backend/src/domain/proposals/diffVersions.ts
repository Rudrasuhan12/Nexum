/**
 * Pure function: Implements structured diff between two proposal versions.
 * Compares scope, deliverables, milestones, amounts, dates, assumptions, and exclusions.
 */

export interface FieldDiff<T> {
  from: T;
  to: T;
  changed: boolean;
}

export interface ProposalDiff {
  amount: FieldDiff<number | null>;
  paymentModel: FieldDiff<string | null>;
  hourlyRate: FieldDiff<number | null>;
  estimatedHours: FieldDiff<number | null>;
  durationWeeks: FieldDiff<number | null>;
  startAvailableOn: FieldDiff<string | null>;
  scopeText: FieldDiff<string | null>;
  exclusions: FieldDiff<any>;
  assumptions: FieldDiff<any>;
  deliverables: {
    added: any[];
    removed: any[];
    modified: any[];
    changed: boolean;
  };
  milestones: {
    added: any[];
    removed: any[];
    modified: any[];
    changed: boolean;
  };
  hasChanges: boolean;
}

export function diffVersions(vA: any, vB: any): ProposalDiff {
  const fromAmount = vA?.totalAmountMinor ?? vA?.amountCents ?? null;
  const toAmount = vB?.totalAmountMinor ?? vB?.amountCents ?? null;

  const amountDiff: FieldDiff<number | null> = {
    from: fromAmount,
    to: toAmount,
    changed: fromAmount !== toAmount,
  };

  const paymentModelDiff: FieldDiff<string | null> = {
    from: vA?.paymentModel || null,
    to: vB?.paymentModel || null,
    changed: (vA?.paymentModel || null) !== (vB?.paymentModel || null),
  };

  const hourlyRateDiff: FieldDiff<number | null> = {
    from: vA?.hourlyRateMinor || null,
    to: vB?.hourlyRateMinor || null,
    changed: (vA?.hourlyRateMinor || null) !== (vB?.hourlyRateMinor || null),
  };

  const estimatedHoursDiff: FieldDiff<number | null> = {
    from: vA?.estimatedHours || null,
    to: vB?.estimatedHours || null,
    changed: (vA?.estimatedHours || null) !== (vB?.estimatedHours || null),
  };

  const durationWeeksDiff: FieldDiff<number | null> = {
    from: vA?.estimatedDurationWeeks || null,
    to: vB?.estimatedDurationWeeks || null,
    changed: (vA?.estimatedDurationWeeks || null) !== (vB?.estimatedDurationWeeks || null),
  };

  const startDateA = vA?.startAvailableOn
    ? typeof vA.startAvailableOn === "string"
      ? vA.startAvailableOn.split("T")[0]
      : vA.startAvailableOn.toISOString().split("T")[0]
    : null;
  const startDateB = vB?.startAvailableOn
    ? typeof vB.startAvailableOn === "string"
      ? vB.startAvailableOn.split("T")[0]
      : vB.startAvailableOn.toISOString().split("T")[0]
    : null;

  const startAvailableOnDiff: FieldDiff<string | null> = {
    from: startDateA,
    to: startDateB,
    changed: startDateA !== startDateB,
  };

  const scopeTextA = vA?.scopeText || vA?.scope || "";
  const scopeTextB = vB?.scopeText || vB?.scope || "";
  const scopeTextDiff: FieldDiff<string | null> = {
    from: scopeTextA,
    to: scopeTextB,
    changed: scopeTextA !== scopeTextB,
  };

  const exclusionsA = JSON.stringify(vA?.exclusions ?? []);
  const exclusionsB = JSON.stringify(vB?.exclusions ?? []);
  const exclusionsDiff: FieldDiff<any> = {
    from: vA?.exclusions ?? [],
    to: vB?.exclusions ?? [],
    changed: exclusionsA !== exclusionsB,
  };

  const assumptionsA = JSON.stringify(vA?.assumptions ?? []);
  const assumptionsB = JSON.stringify(vB?.assumptions ?? []);
  const assumptionsDiff: FieldDiff<any> = {
    from: vA?.assumptions ?? [],
    to: vB?.assumptions ?? [],
    changed: assumptionsA !== assumptionsB,
  };

  // Deliverables comparison
  const dListA = Array.isArray(vA?.deliverables) ? vA.deliverables : [];
  const dListB = Array.isArray(vB?.deliverables) ? vB.deliverables : [];
  const dMapA = new Map(dListA.map((d: any) => [d.title?.trim().toLowerCase(), d]));
  const dMapB = new Map(dListB.map((d: any) => [d.title?.trim().toLowerCase(), d]));

  const deliverablesAdded: any[] = [];
  const deliverablesRemoved: any[] = [];
  const deliverablesModified: any[] = [];

  for (const [key, itemB] of dMapB.entries()) {
    if (!dMapA.has(key)) {
      deliverablesAdded.push(itemB);
    } else {
      const itemA = dMapA.get(key)!;
      if (JSON.stringify(itemA) !== JSON.stringify(itemB)) {
        deliverablesModified.push({ from: itemA, to: itemB });
      }
    }
  }

  for (const [key, itemA] of dMapA.entries()) {
    if (!dMapB.has(key)) {
      deliverablesRemoved.push(itemA);
    }
  }

  const deliverablesChanged =
    deliverablesAdded.length > 0 || deliverablesRemoved.length > 0 || deliverablesModified.length > 0;

  // Milestones comparison
  const mListA = Array.isArray(vA?.milestones || vA?.milestonesJson) ? vA.milestones || vA.milestonesJson : [];
  const mListB = Array.isArray(vB?.milestones || vB?.milestonesJson) ? vB.milestones || vB.milestonesJson : [];
  const mMapA = new Map(mListA.map((m: any) => [m.title?.trim().toLowerCase(), m]));
  const mMapB = new Map(mListB.map((m: any) => [m.title?.trim().toLowerCase(), m]));

  const milestonesAdded: any[] = [];
  const milestonesRemoved: any[] = [];
  const milestonesModified: any[] = [];

  for (const [key, itemB] of mMapB.entries()) {
    if (!mMapA.has(key)) {
      milestonesAdded.push(itemB);
    } else {
      const itemA = mMapA.get(key)! as any;
      const bObj = itemB as any;
      const amtA = itemA.amountMinor || itemA.amountCents || 0;
      const amtB = bObj.amountMinor || bObj.amountCents || 0;
      if (amtA !== amtB || JSON.stringify(itemA) !== JSON.stringify(itemB)) {
        milestonesModified.push({ from: itemA, to: itemB });
      }
    }
  }

  for (const [key, itemA] of mMapA.entries()) {
    if (!mMapB.has(key)) {
      milestonesRemoved.push(itemA);
    }
  }

  const milestonesChanged =
    milestonesAdded.length > 0 || milestonesRemoved.length > 0 || milestonesModified.length > 0;

  const hasChanges =
    amountDiff.changed ||
    paymentModelDiff.changed ||
    hourlyRateDiff.changed ||
    estimatedHoursDiff.changed ||
    durationWeeksDiff.changed ||
    startAvailableOnDiff.changed ||
    scopeTextDiff.changed ||
    exclusionsDiff.changed ||
    assumptionsDiff.changed ||
    deliverablesChanged ||
    milestonesChanged;

  return {
    amount: amountDiff,
    paymentModel: paymentModelDiff,
    hourlyRate: hourlyRateDiff,
    estimatedHours: estimatedHoursDiff,
    durationWeeks: durationWeeksDiff,
    startAvailableOn: startAvailableOnDiff,
    scopeText: scopeTextDiff,
    exclusions: exclusionsDiff,
    assumptions: assumptionsDiff,
    deliverables: {
      added: deliverablesAdded,
      removed: deliverablesRemoved,
      modified: deliverablesModified,
      changed: deliverablesChanged,
    },
    milestones: {
      added: milestonesAdded,
      removed: milestonesRemoved,
      modified: milestonesModified,
      changed: milestonesChanged,
    },
    hasChanges,
  };
}
