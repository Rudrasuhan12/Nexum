import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { prisma } from "../../prisma.js";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import { NotFoundError, ValidationError, ForbiddenError } from "../../lib/errors.js";
import { appendAuditEvent } from "../../lib/audit.js";
import { Role, WorkspaceTaskStatus, TaskVisibility } from "@prisma/client";
import { verifyProjectAccess } from "../../domain/mediation/access.js";

const router = Router();
router.use(requireAuth);
router.use(requireRole(Role.FREELANCER));

const createTaskSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(2000).optional(),
  status: z.nativeEnum(WorkspaceTaskStatus).default(WorkspaceTaskStatus.TODO),
  dueDate: z.string().datetime().optional(),
  visibility: z.nativeEnum(TaskVisibility).default(TaskVisibility.PRIVATE),
  milestoneId: z.string().optional(),
});

const updateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  status: z.nativeEnum(WorkspaceTaskStatus).optional(),
  dueDate: z.string().datetime().nullable().optional(),
  visibility: z.nativeEnum(TaskVisibility).optional(),
});

export async function getProjectTasks(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { projectId } = req.params;
    const freelancerId = req.user!.id;

    const access = await verifyProjectAccess(projectId, freelancerId, prisma);
    if (!access.allowed) {
      throw new NotFoundError("Project not found");
    }

    const tasks = await prisma.workspaceTask.findMany({
      where: {
        projectId,
        OR: [{ visibility: TaskVisibility.SHARED }, { createdBy: freelancerId }],
      },
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json({ success: true, tasks });
  } catch (err) {
    next(err);
  }
}

export async function createProjectTask(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { projectId } = req.params;
    const freelancerId = req.user!.id;

    const access = await verifyProjectAccess(projectId, freelancerId, prisma);
    if (!access.allowed) {
      throw new NotFoundError("Project not found");
    }

    const parsed = createTaskSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError("Invalid task parameters", parsed.error.flatten().fieldErrors, 422);
    }

    const task = await prisma.workspaceTask.create({
      data: {
        projectId,
        title: parsed.data.title,
        description: parsed.data.description || null,
        status: parsed.data.status,
        dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
        visibility: parsed.data.visibility,
        milestoneId: parsed.data.milestoneId || null,
        createdBy: freelancerId,
        completedAt: parsed.data.status === WorkspaceTaskStatus.DONE ? new Date() : null,
      },
    });

    await appendAuditEvent({
      actorId: freelancerId,
      action: "TASK_CREATED",
      objectType: "WORKSPACE_TASK",
      objectId: task.id,
      newStatus: task.status,
      metadata: { projectId, title: task.title, visibility: task.visibility },
    });

    res.status(201).json({ success: true, task });
  } catch (err) {
    next(err);
  }
}

router.patch("/:id", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const freelancerId = req.user!.id;

    const task = await prisma.workspaceTask.findUnique({
      where: { id },
      include: { project: true },
    });

    if (!task) throw new NotFoundError("Task not found");
    if (task.createdBy !== freelancerId) {
      const access = await verifyProjectAccess(task.projectId, freelancerId, prisma);
      if (!access.allowed) throw new ForbiddenError("Not authorized to modify this task");
    }

    const parsed = updateTaskSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError("Invalid update parameters", parsed.error.flatten().fieldErrors, 422);
    }

    const nextStatus = parsed.data.status || task.status;
    const completedAt =
      nextStatus === WorkspaceTaskStatus.DONE
        ? task.completedAt || new Date()
        : null;

    const updated = await prisma.workspaceTask.update({
      where: { id },
      data: {
        title: parsed.data.title || undefined,
        description: parsed.data.description !== undefined ? parsed.data.description : undefined,
        status: parsed.data.status || undefined,
        dueDate: parsed.data.dueDate !== undefined ? (parsed.data.dueDate ? new Date(parsed.data.dueDate) : null) : undefined,
        visibility: parsed.data.visibility || undefined,
        completedAt,
      },
    });

    await appendAuditEvent({
      actorId: freelancerId,
      action: "TASK_UPDATED",
      objectType: "WORKSPACE_TASK",
      objectId: id,
      previousStatus: task.status,
      newStatus: updated.status,
    });

    res.status(200).json({ success: true, task: updated });
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const freelancerId = req.user!.id;

    const task = await prisma.workspaceTask.findUnique({
      where: { id },
    });

    if (!task) throw new NotFoundError("Task not found");
    if (task.createdBy !== freelancerId) {
      throw new ForbiddenError("Not authorized to delete this task");
    }

    await prisma.workspaceTask.delete({ where: { id } });

    await appendAuditEvent({
      actorId: freelancerId,
      action: "TASK_DELETED",
      objectType: "WORKSPACE_TASK",
      objectId: id,
    });

    res.status(200).json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
