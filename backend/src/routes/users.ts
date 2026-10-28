import { Router, Request, Response } from "express";
import { prisma } from "../prisma.js";

const router = Router();

// GET /api/users - list demo users and profiles
router.get("/", async (_req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        freelancerProfile: true,
      },
      orderBy: { createdAt: "asc" },
    });
    res.json({ success: true, count: users.length, data: users });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to fetch users";
    res.status(500).json({ success: false, error: msg });
  }
});

// GET /api/users/freelancers - list freelancer directory
router.get("/freelancers", async (_req: Request, res: Response) => {
  try {
    const freelancers = await prisma.user.findMany({
      where: { role: "FREELANCER" },
      include: { freelancerProfile: true },
    });
    res.json({ success: true, count: freelancers.length, data: freelancers });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to fetch freelancers";
    res.status(500).json({ success: false, error: msg });
  }
});

export default router;

