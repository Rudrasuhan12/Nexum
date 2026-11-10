import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { clientPaymentsService } from "../services/clientPaymentsService.js";
import { ValidationError, UnauthorizedError, ForbiddenError } from "../lib/errors.js";
import { Role } from "@prisma/client";
import { SESSION_COOKIE_NAME, validateSession } from "../lib/auth.js";

const router = Router();

// Middleware: get validated client ID from session or fallback to seed client
async function getClientId(req: Request): Promise<string> {
  if (req.user) {
    return req.user.id;
  }

  // 1. Support dev/test clientId query/header or internal proxy header
  const headerOrQueryId =
    (req.query.clientId as string) ||
    (req.headers["x-client-id"] as string) ||
    (req.headers["x-user-id"] as string);

  if (headerOrQueryId && headerOrQueryId.trim().length > 0) {
    return headerOrQueryId.trim();
  }

  // 2. Validate session cookie if available
  const cookieToken = req.cookies?.[SESSION_COOKIE_NAME];
  if (cookieToken) {
    try {
      const sessionRecord = await validateSession(cookieToken);
      if (sessionRecord?.user?.id) {
        return sessionRecord.user.id;
      }
    } catch {
      // Continue to fallback
    }
  }

  return "usr_client_alex";
}

// GET /api/client/payments/summary
router.get("/summary", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const clientId = await getClientId(req);
    const summary = await clientPaymentsService.getSummary(clientId);
    res.json({ success: true, data: summary });
  } catch (err) {
    next(err);
  }
});

// GET /api/client/payments/transactions
router.get("/transactions", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const clientId = await getClientId(req);
    const status = req.query.status as string | undefined;
    const search = req.query.search as string | undefined;

    const txs = await clientPaymentsService.getTransactions(clientId, { status, search });
    res.json({ success: true, count: txs.length, data: txs });
  } catch (err) {
    next(err);
  }
});

// GET /api/client/payments/cash-flow
router.get("/cash-flow", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const clientId = await getClientId(req);
    const timeframe = (req.query.timeframe as string) || "1M";
    const points = await clientPaymentsService.getCashFlow(clientId, timeframe);
    res.json({ success: true, data: points });
  } catch (err) {
    next(err);
  }
});

// GET /api/client/payments/action-required
router.get("/action-required", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const clientId = await getClientId(req);
    const item = await clientPaymentsService.getActionRequired(clientId);
    res.json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
});

// GET /api/client/payments/upcoming
router.get("/upcoming", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const clientId = await getClientId(req);
    const upcoming = await clientPaymentsService.getUpcomingDeliverable(clientId);
    res.json({ success: true, data: upcoming });
  } catch (err) {
    next(err);
  }
});

const releaseSchema = z.object({
  milestoneId: z.string().min(1, "milestoneId is required"),
});

// POST /api/client/payments/release
router.post("/release", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const clientId = await getClientId(req);
    const parsed = releaseSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError("Invalid release payload", parsed.error.flatten().fieldErrors);
    }

    const result = await clientPaymentsService.authorizeAndRelease(clientId, parsed.data.milestoneId);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;

