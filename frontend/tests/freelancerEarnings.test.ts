import { describe, it, expect } from "vitest";
import {
  INITIAL_FREELANCER_KPIS,
  MONTHLY_EARNINGS_SERIES,
  PROJECT_CATEGORY_DISTRIBUTION,
  INITIAL_PAYOUT_SETTINGS,
  INITIAL_PAYOUT_PREFERENCES,
  VERIFICATION_CHECKLIST,
  INITIAL_FREELANCER_TRANSACTIONS,
} from "../src/lib/freelancer-earnings-data";

describe("Freelancer Earnings & Payments Data & Calculations", () => {
  it("validates financial KPI values match expected accounting invariants", () => {
    expect(INITIAL_FREELANCER_KPIS.totalEarnings).toBe(248000);
    expect(INITIAL_FREELANCER_KPIS.pendingAmount).toBe(48000);
    expect(INITIAL_FREELANCER_KPIS.availableForPayout).toBe(75000);
    expect(INITIAL_FREELANCER_KPIS.totalWithdrawn).toBe(125000);
    expect(INITIAL_FREELANCER_KPIS.currency).toBe("INR");
    expect(INITIAL_FREELANCER_KPIS.completedProjectsCount).toBe(8);
  });

  it("verifies monthly earnings series covers 6 months with accurate received and pending values", () => {
    expect(MONTHLY_EARNINGS_SERIES).toHaveLength(6);
    MONTHLY_EARNINGS_SERIES.forEach((pt) => {
      expect(pt.received + pt.pending).toBe(pt.total);
      expect(pt.month).toBeDefined();
    });
    // Check specific months from reference
    expect(MONTHLY_EARNINGS_SERIES[0].month).toBe("May 2026");
    expect(MONTHLY_EARNINGS_SERIES[5].month).toBe("Oct 2026");
  });

  it("verifies project category shares sum up to exactly 100 percent", () => {
    const totalPercentage = PROJECT_CATEGORY_DISTRIBUTION.reduce(
      (acc, cat) => acc + cat.percentage,
      0
    );
    expect(totalPercentage).toBe(100);

    const webDev = PROJECT_CATEGORY_DISTRIBUTION.find((c) => c.name === "Web Development");
    expect(webDev?.percentage).toBe(38);

    const aiData = PROJECT_CATEGORY_DISTRIBUTION.find((c) => c.name === "AI & Data");
    expect(aiData?.percentage).toBe(22);
  });

  it("ensures all transactions have valid hashes, formatted amounts, and legitimate statuses", () => {
    expect(INITIAL_FREELANCER_TRANSACTIONS.length).toBeGreaterThanOrEqual(8);

    const validStatuses = ["Received", "Under Review", "Pending", "Completed", "Failed"];
    const validTypes = ["Milestone", "Project", "Payout", "Fee"];

    INITIAL_FREELANCER_TRANSACTIONS.forEach((tx) => {
      expect(validStatuses).toContain(tx.status);
      expect(validTypes).toContain(tx.type);
      expect(tx.proofHash.startsWith("0x")).toBe(true);
      expect(tx.formattedAmount).toBeDefined();
    });
  });

  it("filters transactions correctly by type and status", () => {
    const payouts = INITIAL_FREELANCER_TRANSACTIONS.filter((t) => t.type === "Payout");
    expect(payouts.length).toBe(2);
    expect(payouts[0].amount).toBeLessThan(0); // Payouts are negative deductions

    const milestones = INITIAL_FREELANCER_TRANSACTIONS.filter((t) => t.type === "Milestone");
    expect(milestones.length).toBe(4);

    const underReview = INITIAL_FREELANCER_TRANSACTIONS.filter((t) => t.status === "Under Review");
    expect(underReview.length).toBe(1);
    expect(underReview[0].description).toBe("Milestone 2");
  });

  it("verifies payout settings and sandbox safety configuration", () => {
    expect(INITIAL_PAYOUT_SETTINGS.provider).toBe("PayPal");
    expect(INITIAL_PAYOUT_SETTINGS.environment).toBe("Sandbox");
    expect(INITIAL_PAYOUT_SETTINGS.connectionStatus).toBe("Connected");

    expect(INITIAL_PAYOUT_PREFERENCES.minimumPayoutAmount).toBe(5000);
    expect(INITIAL_PAYOUT_PREFERENCES.autoPayoutEnabled).toBe(true);
    expect(INITIAL_PAYOUT_PREFERENCES.payoutFrequency).toBe("Weekly");

    expect(VERIFICATION_CHECKLIST).toHaveLength(3);
    VERIFICATION_CHECKLIST.forEach((v) => expect(v.isVerified).toBe(true));
  });
});

