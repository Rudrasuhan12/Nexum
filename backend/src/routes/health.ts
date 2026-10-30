import { Router, Request, Response } from "express";
import { prisma } from "../prisma.js";

const router = Router();

router.get("/", async (_req: Request, res: Response) => {
  let dbStatus = "DISCONNECTED";
  let dbLatencyMs: number | null = null;

  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = "CONNECTED";
    dbLatencyMs = Date.now() - start;
  } catch (err: unknown) {
    console.error("Database health check error:", err);
    dbStatus = "ERROR";
  }

  res.json({
    status: "ok",
    service: "nexum-backend",
    version: "0.1.0",
    timestamp: new Date().toISOString(),
    database: {
      provider: "postgresql",
      status: dbStatus,
      latencyMs: dbLatencyMs,
    },
    truthStatement: "AI drafts, humans approve, PayPal proves.",
  });
});

export default router;

