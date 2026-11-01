import { Router, Request, Response, NextFunction } from "express";
import { Role } from "@prisma/client";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import { getDashboardSummary } from "../../domain/dashboard/queries.js";

const router = Router();

router.use(requireAuth);
router.use(requireRole(Role.FREELANCER));

/**
 * GET /api/freelancer/dashboard
 * Aggregates all dashboard overview cards in a single round-trip.
 * Each count is computed via the exact same query as the corresponding list view.
 */
router.get("/", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const freelancerId = req.user!.id;
    const summary = await getDashboardSummary(freelancerId);

    res.status(200).json({
      success: true,
      ...summary,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
