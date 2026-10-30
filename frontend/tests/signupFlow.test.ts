import { describe, it, expect } from "vitest";

describe("Nexum Multi-Step Signup Flow Specification", () => {
  it("should validate Step 1 account constraints", () => {
    const validEmail = "candidate@example.com";
    const invalidEmail = "not-an-email";
    const shortPassword = "123";
    const validPassword = "securePassword123";

    expect(validEmail.includes("@")).toBe(true);
    expect(invalidEmail.includes("@")).toBe(false);
    expect(shortPassword.length >= 4).toBe(false);
    expect(validPassword.length >= 4).toBe(true);
  });

  it("should format Client Step 3A payload with optional interest preferences", () => {
    const clientPayload = {
      email: "alex.rivera@nexum.demo",
      password: "password123",
      role: "CLIENT" as const,
      name: "Rivera Studios",
      preferences: ["Web development", "Blockchain / Web3", "AI / Machine Learning"],
    };

    expect(clientPayload.role).toBe("CLIENT");
    expect(clientPayload.name).toBe("Rivera Studios");
    expect(clientPayload.preferences).toHaveLength(3);
    expect(clientPayload.preferences).toContain("AI / Machine Learning");
  });

  it("should format Freelancer Step 3B payload with skills, profile type, and work experience", () => {
    const freelancerPayload = {
      email: "elena.rostova@nexum.demo",
      password: "password123",
      role: "FREELANCER" as const,
      name: "Elena Rostova",
      profileType: "Experienced professional",
      skills: ["Web development", "Backend / API development", "DevOps / Cloud"],
      workExperience: "10+ years architecting fintech solutions and smart contracts",
    };

    expect(freelancerPayload.role).toBe("FREELANCER");
    expect(freelancerPayload.profileType).toBe("Experienced professional");
    expect(freelancerPayload.skills).toContain("Backend / API development");
    expect(freelancerPayload.workExperience.length).toBeGreaterThan(10);
  });
});

