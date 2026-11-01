import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  fetchClientFreelancers,
  toggleSaveFreelancer,
  fetchClientInvitations,
  inviteClientTalent,
} from "../src/lib/api-client";

describe("Frontend Client Talent & Invitations API Client", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should fetch client freelancers with fallback or live data", async () => {
    const mockTalent = [
      { id: "usr_rohan", name: "Rohan Verma", fitScore: 98, isSaved: false },
      { id: "usr_priya", name: "Priya Sharma", fitScore: 95, isSaved: true },
    ];

    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, count: 2, data: mockTalent }),
    } as Response);

    const res = await fetchClientFreelancers("usr_client_alex");
    expect(res.success).toBe(true);
    expect(res.data.length).toBe(2);
    expect(res.data[0].name).toBe("Rohan Verma");
    expect(res.data[1].isSaved).toBe(true);
  });

  it("should toggle freelancer bookmark status via API", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        isSaved: true,
        message: "Candidate bookmarked",
      }),
    } as Response);

    const res = await toggleSaveFreelancer("usr_marcus", "usr_client_alex");
    expect(res.success).toBe(true);
    expect(res.isSaved).toBe(true);
  });

  it("should fetch client invitations list", async () => {
    const mockInvites = [
      {
        id: "inv_1",
        freelancerName: "Rohan Verma",
        projectName: "Bilateral E-Commerce Payment Rails",
        status: "ACCEPTED",
      },
    ];

    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, count: 1, data: mockInvites }),
    } as Response);

    const res = await fetchClientInvitations("usr_client_alex");
    expect(res.success).toBe(true);
    expect(res.count).toBe(1);
    expect(res.data[0].status).toBe("ACCEPTED");
  });

  it("should dispatch a formal invitation via inviteClientTalent with payload object", async () => {
    const mockCreated = {
      id: "inv_test_99",
      freelancerName: "Elena Rostova",
      projectName: "Cryptographic Audit Trail Engine",
      status: "PENDING",
    };

    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        invitation: mockCreated,
        message: "Invitation sent successfully.",
      }),
    } as Response);

    const res = await inviteClientTalent({
      clientId: "usr_client_alex",
      freelancerId: "usr_elena",
      freelancerName: "Elena Rostova",
      projectId: "proj_crypto",
      projectName: "Cryptographic Audit Trail Engine",
      proposedRate: "$90.00/hr",
      customNote: "Invitation note",
    });

    expect(res.success).toBe(true);
    expect(res.invitation?.id).toBe("inv_test_99");
    expect(res.invitation?.freelancerName).toBe("Elena Rostova");
  });
});

