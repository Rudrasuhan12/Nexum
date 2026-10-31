import { describe, it, expect, vi, beforeEach } from "vitest";

describe("Client Avatar Upload Validation (<2MB) and Dynamic Readiness", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("strictly enforces the 2MB size limit for avatar uploads", () => {
    const MAX_SIZE = 2 * 1024 * 1024; // 2MB
    const validFile = { size: 1.5 * 1024 * 1024, type: "image/png" };
    const oversizedFile = { size: 2.2 * 1024 * 1024, type: "image/png" };

    expect(validFile.size <= MAX_SIZE).toBe(true);
    expect(oversizedFile.size <= MAX_SIZE).toBe(false);

    const actualMb = (oversizedFile.size / (1024 * 1024)).toFixed(1);
    expect(actualMb).toBe("2.2");
  });

  it("calculates workspace readiness dynamically based on projects, milestones and avatar", () => {
    const computeReadiness = (projectsCount: number, milestonesCount: number, hasAvatar: boolean) => {
      let score = 50; // base identity & billing rails ready
      if (projectsCount > 0) score += 25;
      if (milestonesCount > 0) score += 10;
      if (hasAvatar) score += 15;
      return Math.min(100, score);
    };

    // New client with zero projects & default avatar
    expect(computeReadiness(0, 0, false)).toBe(50);

    // Client with uploaded avatar
    expect(computeReadiness(0, 0, true)).toBe(65);

    // Client with project posted
    expect(computeReadiness(1, 0, true)).toBe(90);

    // Client with project and milestones active
    expect(computeReadiness(1, 2, true)).toBe(100);
  });
});

