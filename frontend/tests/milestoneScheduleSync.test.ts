import { describe, it, expect } from "vitest";

// Pure synchronization utility functions matching post-project logic
export function calculateBudgetStatus(totalBudget: number, milestones: { amount: string }[]) {
  const allocated = milestones.reduce((sum, m) => sum + (parseFloat(m.amount) || 0), 0);
  const remaining = totalBudget - allocated;
  const isOver = remaining < -0.01;
  const isUnder = remaining > 0.01;
  const isBalanced = Math.abs(remaining) <= 0.01;
  return { allocated, remaining, isOver, isUnder, isBalanced };
}

export function calculateTimelineStatus(timelineDuration: string, milestones: { days: string }[]) {
  const totalDays = milestones.reduce((sum, m) => sum + (parseInt(m.days, 10) || 0), 0);
  let targetDays = 90;
  if (timelineDuration.includes("< 1") || timelineDuration.includes("1 month")) targetDays = 30;
  else if (timelineDuration.includes("1 - 2") || timelineDuration.includes("2 months")) targetDays = 60;
  else if (timelineDuration.includes("3 - 6") || timelineDuration.includes("6 months")) targetDays = 90;
  else if (timelineDuration.includes("6+")) targetDays = 180;
  else {
    const match = timelineDuration.match(/(\d+)/);
    if (match) targetDays = parseInt(match[1], 10);
  }

  const isExceeded = totalDays > targetDays;
  const overDays = Math.max(0, totalDays - targetDays);
  const unallocatedDays = Math.max(0, targetDays - totalDays);

  return { totalDays, targetDays, isExceeded, overDays, unallocatedDays };
}

export function autoBalanceBudget(totalBudget: number, milestones: { title: string; amount: string }[]) {
  if (milestones.length === 0 || totalBudget <= 0) return milestones;
  const count = milestones.length;
  const base = Math.floor(totalBudget / count);
  return milestones.map((m, idx) => {
    const isLast = idx === count - 1;
    const amt = isLast ? totalBudget - base * (count - 1) : base;
    return { ...m, amount: String(Math.max(amt, 0)) };
  });
}

export function autoDistributeTimelineDays(targetTimelineDays: number, milestones: { title: string; days: string }[]) {
  if (milestones.length === 0 || targetTimelineDays <= 0) return milestones;
  const count = milestones.length;
  const baseDays = Math.floor(targetTimelineDays / count);
  return milestones.map((m, idx) => {
    const isLast = idx === count - 1;
    const days = isLast ? targetTimelineDays - baseDays * (count - 1) : baseDays;
    return { ...m, days: String(Math.max(days, 1)) };
  });
}

describe("Milestone Budget & Timeline Synchronization", () => {
  it("accurately calculates remaining budget when milestone amounts are partial", () => {
    const totalBudget = 3500;
    const milestones = [
      { amount: "1500" },
      { amount: "1000" },
      { amount: "" }, // incomplete 3rd milestone from user screenshot
    ];

    const status = calculateBudgetStatus(totalBudget, milestones);
    expect(status.allocated).toBe(2500);
    expect(status.remaining).toBe(1000);
    expect(status.isUnder).toBe(true);
    expect(status.isBalanced).toBe(false);
  });

  it("auto-balances milestones so their sum exactly equals the project budget", () => {
    const totalBudget = 3500;
    const milestones = [
      { title: "M1", amount: "1500" },
      { title: "M2", amount: "1000" },
      { title: "M3", amount: "" },
    ];

    const balanced = autoBalanceBudget(totalBudget, milestones);
    const sum = balanced.reduce((acc, m) => acc + parseFloat(m.amount), 0);
    expect(sum).toBe(3500);
    expect(balanced[0].amount).toBe("1166");
    expect(balanced[1].amount).toBe("1166");
    expect(balanced[2].amount).toBe("1168");
  });

  it("detects timeline mismatch when milestones (14d + 14d + 14d = 42d) don't match 3-6 months (90d)", () => {
    const timeline = "3 - 6 months";
    const milestones = [
      { days: "14" },
      { days: "14" },
      { days: "14" },
    ];

    const status = calculateTimelineStatus(timeline, milestones);
    expect(status.totalDays).toBe(42);
    expect(status.targetDays).toBe(90);
    expect(status.unallocatedDays).toBe(48);
    expect(status.isExceeded).toBe(false);
  });

  it("auto-distributes 90 timeline days across 3 milestones evenly", () => {
    const milestones = [
      { title: "M1", days: "14" },
      { title: "M2", days: "14" },
      { title: "M3", days: "14" },
    ];

    const distributed = autoDistributeTimelineDays(90, milestones);
    expect(distributed[0].days).toBe("30");
    expect(distributed[1].days).toBe("30");
    expect(distributed[2].days).toBe("30");
    const sumDays = distributed.reduce((acc, m) => acc + parseInt(m.days, 10), 0);
    expect(sumDays).toBe(90);
  });

  it("detects over-deadline timeline exceedance and computes over-days", () => {
    const timeline = "3 - 6 months"; // 90 days
    const milestones = [
      { days: "35" },
      { days: "35" },
      { days: "25" }, // total = 95 days
    ];

    const status = calculateTimelineStatus(timeline, milestones);
    expect(status.totalDays).toBe(95);
    expect(status.targetDays).toBe(90);
    expect(status.isExceeded).toBe(true);
    expect(status.overDays).toBe(5); // "you are 5 days beyond deadline"
  });
});

