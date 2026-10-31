import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchClientAuditLogs } from "../src/lib/api-client";

describe("Client Audit Logs & Pagination System", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should fetch audit logs with default pagination parameters", async () => {
    const mockResponse = {
      success: true,
      logs: [
        {
          id: "log_1",
          action: "USER_LOGGED_IN",
          objectType: "USER",
          objectId: "usr_client_1",
          timestamp: new Date().toISOString(),
          versionHash: "0x123456",
        },
      ],
      total: 1,
      page: 1,
      totalPages: 1,
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    } as any);

    const result = await fetchClientAuditLogs({ page: 1, limit: 10 });
    expect(result.success).toBe(true);
    expect(result.logs).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(result.page).toBe(1);
    expect(result.totalPages).toBe(1);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/client/audit-logs?page=1&limit=10"),
      expect.any(Object)
    );
  });

  it("should correctly serialize search query, action, and objectType filters", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, logs: [], total: 0, page: 1, totalPages: 1 }),
    } as any);

    await fetchClientAuditLogs({
      page: 2,
      limit: 25,
      search: "Milestone",
      action: "DELIVERABLE_SUBMITTED",
      objectType: "MILESTONE",
    });

    const callUrl = (global.fetch as any).mock.calls[0][0];
    expect(callUrl).toContain("page=2");
    expect(callUrl).toContain("limit=25");
    expect(callUrl).toContain("search=Milestone");
    expect(callUrl).toContain("action=DELIVERABLE_SUBMITTED");
    expect(callUrl).toContain("objectType=MILESTONE");
  });

  it("should omit ALL filters from query string", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, logs: [], total: 0, page: 1, totalPages: 1 }),
    } as any);

    await fetchClientAuditLogs({
      page: 1,
      limit: 10,
      action: "ALL",
      objectType: "ALL",
    });

    const callUrl = (global.fetch as any).mock.calls[0][0];
    expect(callUrl).not.toContain("action=ALL");
    expect(callUrl).not.toContain("objectType=ALL");
  });

  it("should handle network failure gracefully without throwing", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("Network disconnect"));

    const result = await fetchClientAuditLogs();
    expect(result.success).toBe(false);
    expect(result.logs).toEqual([]);
    expect(result.error).toBe("Network disconnect");
  });
});
