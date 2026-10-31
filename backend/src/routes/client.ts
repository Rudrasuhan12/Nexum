import { Router, Request, Response } from "express";
import { clientOverviewService } from "../services/clientOverviewService.js";

const router = Router();

// GET /api/client/overview - full overview telemetry, attention items, projects & talent
router.get("/overview", async (req: Request, res: Response) => {
  try {
    const clientId = (req.query.clientId as string) || undefined;
    const data = await clientOverviewService.getOverview(clientId);
    res.json({ success: true, data });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to fetch client overview";
    res.status(500).json({ success: false, error: msg });
  }
});

// POST /api/client/milestones/:id/approve - approve milestone deliverable and release funds
router.post("/milestones/:id/approve", async (req: Request, res: Response) => {
  try {
    const result = await clientOverviewService.approveMilestone(req.params.id);
    res.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to approve milestone";
    res.status(500).json({ success: false, error: msg });
  }
});

// POST /api/client/change-requests/:id/approve - approve scope change request
router.post("/change-requests/:id/approve", async (req: Request, res: Response) => {
  try {
    const result = await clientOverviewService.approveScopeChange(req.params.id);
    res.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to approve scope change";
    res.status(500).json({ success: false, error: msg });
  }
});

// GET /api/client/audit-logs - paginated & filtered audit events
router.get("/audit-logs", async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const search = (req.query.search as string) || undefined;
    const action = (req.query.action as string) || undefined;
    const objectType = (req.query.objectType as string) || undefined;

    const data = await clientOverviewService.getAuditLogs({
      page,
      limit,
      search,
      action,
      objectType,
    });

    res.json({ success: true, ...data });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to fetch audit logs";
    res.status(500).json({ success: false, error: msg });
  }
});

// POST /api/client/talent/invite - invite talent to project
router.post("/talent/invite", async (req: Request, res: Response) => {
  try {
    const { freelancerId, freelancerName, projectId } = req.body || {};
    res.json({
      success: true,
      message: `Invitation successfully sent to ${freelancerName || "talent"}.`,
      invitationId: `inv_${Date.now()}`,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to invite talent";
    res.status(500).json({ success: false, error: msg });
  }
});

// POST /api/client/overview/reset - reset overview state for testing
router.post("/overview/reset", (_req: Request, res: Response) => {
  clientOverviewService.reset();
  res.json({ success: true, message: "Client overview state reset" });
});

export default router;

