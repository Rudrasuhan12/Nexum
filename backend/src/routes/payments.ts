import { Router, Request, Response } from "express";
import { prisma } from "../prisma.js";

const router = Router();

// GET /api/payments/attempts - list payment attempts with evidence
router.get("/attempts", async (_req: Request, res: Response) => {
  try {
    const attempts = await prisma.paymentAttempt.findMany({
      include: {
        milestone: true,
        reconciliationJobs: true,
        paymentIncidents: true,
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({ success: true, count: attempts.length, data: attempts });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to fetch payment attempts";
    res.status(500).json({ success: false, error: msg });
  }
});

// GET /api/payments/timeline - audit log & evidence timeline
router.get("/timeline", async (_req: Request, res: Response) => {
  try {
    const events = await prisma.auditEvent.findMany({
      orderBy: { timestamp: "desc" },
      take: 50,
    });

    res.json({ success: true, count: events.length, data: events });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to fetch timeline";
    res.status(500).json({ success: false, error: msg });
  }
});

export default router;

