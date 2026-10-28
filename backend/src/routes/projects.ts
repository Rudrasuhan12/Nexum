import { Router, Request, Response } from "express";
import { prisma } from "../prisma.js";

const router = Router();

// GET /api/projects - list projects with active proposals and milestones
router.get("/", async (_req: Request, res: Response) => {
  try {
    const projects = await prisma.project.findMany({
      include: {
        client: {
          select: { id: true, name: true, email: true },
        },
        proposals: {
          include: {
            milestones: true,
            freelancer: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({ success: true, count: projects.length, data: projects });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to fetch projects";
    res.status(500).json({ success: false, error: msg });
  }
});

// GET /api/projects/:id - get single project
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
      include: {
        client: { select: { id: true, name: true, email: true } },
        proposals: {
          include: {
            milestones: {
              include: {
                paymentAttempts: true,
              },
            },
            freelancer: { select: { id: true, name: true, email: true } },
          },
        },
        prdVersions: true,
        briefVersions: true,
      },
    });

    if (!project) {
      return res.status(404).json({ success: false, error: "Project not found" });
    }

    res.json({ success: true, data: project });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to fetch project";
    res.status(500).json({ success: false, error: msg });
  }
});

export default router;

