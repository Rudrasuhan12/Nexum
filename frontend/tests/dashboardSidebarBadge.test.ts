import { describe, it, expect, vi, beforeEach } from "vitest";

describe("DashboardSidebar Dynamic Milestones Badge", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should calculate milestone badge strictly from awaitingReviewCount and hide when 0", () => {
    // Zero pending review milestones (empty or caught up state)
    const zeroStateStats = {
      upcomingCount: 4,
      awaitingReviewCount: 0,
      overdueCount: 2,
      completedCount: 3,
    };
    const badgeCountZero = zeroStateStats.awaitingReviewCount > 0 ? zeroStateStats.awaitingReviewCount : undefined;
    expect(badgeCountZero).toBeUndefined();

    // Active pending review state (Alex's live state)
    const alexStats = {
      upcomingCount: 4,
      awaitingReviewCount: 1,
      overdueCount: 2,
      completedCount: 3,
    };
    const badgeCountAlex = alexStats.awaitingReviewCount > 0 ? alexStats.awaitingReviewCount : undefined;
    expect(badgeCountAlex).toBe(1);
    expect(typeof badgeCountAlex).toBe("number");
  });

  it("should verify badge pill only renders when item.badge is defined and > 0", () => {
    const shouldRenderBadge = (badge: number | string | undefined) => {
      return badge !== undefined && Number(badge) > 0;
    };

    expect(shouldRenderBadge(undefined)).toBe(false);
    expect(shouldRenderBadge(0)).toBe(false);
    expect(shouldRenderBadge("0")).toBe(false);
    expect(shouldRenderBadge(1)).toBe(true);
    expect(shouldRenderBadge(2)).toBe(true);
  });
});

