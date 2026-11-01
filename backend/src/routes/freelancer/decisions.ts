import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { prisma } from "../../prisma.js";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import { NotFoundError, ValidationError, ForbiddenError } from "../../lib/errors.js";
import { appendAuditEvent } from "../../lib/audit.js";
import { Role, DecisionKind } from "@prisma/client";

const router = Router();
router.use(requireAuth);
router.use(requireRole(Role.FREELANCER));

const createDecisionSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().min(1, "Description is required").max(5000),
});

/**
 * GET /api/freelancer/projects/:projectId/decisions
 * List project decisions.
 */
export async function getProjectDecisions(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { projectId } = req.params;
    const freelancerId = req.user!.id;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { agreement: true },
    });

    if (!project || (project.agreement?.freelancerId !== freelancerId)) {
      throw new NotFoundError("Project decisions not found");
    }

    const decisions = await prisma.projectDecision.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json({ success: true, decisions });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/freelancer/projects/:projectId/decisions
 * Record a non-binding PROJECT_NOTE.
 */
export async function createProjectDecision(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { projectId } = req.params;
    const freelancerId = req.user!.id;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { agreement: true },
    });

    if (!project || (project.agreement?.freelancerId !== freelancerId)) {
      throw new NotFoundError("Project not found");
    }

    const parsed = createDecisionSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError("Invalid decision parameters", parsed.error.flatten().fieldErrors, 422);
    }

    // Always non-binding PROJECT_NOTE
    const decision = await prisma.projectDecision.create({
      data: {
        projectId,
        title: parsed.data.title,
        description: parsed.data.description,
        kind: DecisionKind.PROJECT_NOTE,
        binding: false,
        sourceType: "MANUAL_NOTE",
        recordedBy: freelancerId,
      },
    });

    await appendAuditEvent({
      actorId: freelancerId,
      action: "PROJECT_DECISION_RECORDED",
      objectType: "PROJECT_DECISION",
      objectId: decision.id,
      metadata: { projectId, kind: decision.kind, binding: decision.binding },
    });

    res.status(201).json({ success: true, decision });
  } catch (err) {
    next(err);
  }
}

export default router;
