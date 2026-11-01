import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { prisma } from "../../prisma.js";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import { NotFoundError, ValidationError, ForbiddenError } from "../../lib/errors.js";
import { appendAuditEvent } from "../../lib/audit.js";
import { Role, ProjectFileCategory } from "@prisma/client";
import { verifyProjectAccess } from "../../domain/mediation/access.js";

const router = Router();
router.use(requireAuth);
router.use(requireRole(Role.FREELANCER));

const uploadFileSchema = z.object({
  fileId: z.string().min(1, "fileId is required"),
  category: z.nativeEnum(ProjectFileCategory).default(ProjectFileCategory.REFERENCE),
  name: z.string().min(1).max(255),
  note: z.string().max(1000).optional(),
  versionOf: z.string().optional(), // versionGroupId
});

/**
 * GET /api/freelancer/projects/:projectId/files
 * List files for a project. Non-members receive 404.
 */
export async function getProjectFiles(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { projectId } = req.params;
    const freelancerId = req.user!.id;

    const access = await verifyProjectAccess(projectId, freelancerId, prisma);
    if (!access.allowed) {
      throw new NotFoundError("Project files not found");
    }

    const files = await prisma.projectFile.findMany({
      where: { projectId },
      include: {
        file: true,
        uploader: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json({
      success: true,
      files: files.map((pf) => ({
        id: pf.id,
        fileId: pf.fileId,
        projectId: pf.projectId,
        name: pf.name,
        category: pf.category,
        versionGroupId: pf.versionGroupId,
        versionNumber: pf.versionNumber,
        note: pf.note,
        sizeBytes: pf.file.sizeBytes,
        mime: pf.file.mime,
        uploader: pf.uploader,
        createdAt: pf.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/freelancer/projects/:projectId/files
 * Register a project file.
 */
export async function uploadProjectFile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { projectId } = req.params;
    const freelancerId = req.user!.id;

    const access = await verifyProjectAccess(projectId, freelancerId, prisma);
    if (!access.allowed) {
      throw new NotFoundError("Project not found");
    }

    const parsed = uploadFileSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError("Invalid file parameters", parsed.error.flatten().fieldErrors, 422);
    }

    const { fileId, category, name, note, versionOf } = parsed.data;

    // Verify file exists
    const file = await prisma.file.findUnique({ where: { id: fileId } });
    if (!file) throw new NotFoundError("File not found");

    let versionGroupId = versionOf;
    let versionNumber = 1;

    if (versionOf) {
      const latestInGroup = await prisma.projectFile.findFirst({
        where: { projectId, versionGroupId: versionOf },
        orderBy: { versionNumber: "desc" },
      });
      if (latestInGroup) {
        versionNumber = latestInGroup.versionNumber + 1;
      }
    }

    const pf = await prisma.projectFile.create({
      data: {
        projectId,
        fileId,
        uploadedBy: freelancerId,
        category,
        name,
        versionGroupId: versionGroupId || undefined,
        versionNumber,
        note: note || null,
      },
      include: {
        file: true,
      },
    });

    await appendAuditEvent({
      actorId: freelancerId,
      action: "PROJECT_FILE_UPLOADED",
      objectType: "PROJECT_FILE",
      objectId: pf.id,
      metadata: { projectId, fileId, category, versionNumber },
    });

    res.status(201).json({ success: true, projectFile: pf });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/freelancer/project-files/:id/download
 * Download project file content. Non-members receive 404.
 */
router.get("/:id/download", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const freelancerId = req.user!.id;

    const pf = await prisma.projectFile.findUnique({
      where: { id },
      include: {
        project: { include: { agreement: true } },
        file: true,
      },
    });

    if (!pf) throw new NotFoundError("Project file not found");

    const access = await verifyProjectAccess(pf.projectId, freelancerId, prisma);
    if (!access.allowed && pf.uploadedBy !== freelancerId) {
      throw new NotFoundError("File not found");
    }

    // In a production setup, read from local disk or S3. Here return JSON metadata or mock buffer.
    res.setHeader("Content-Type", pf.file.mime);
    res.setHeader("Content-Disposition", `attachment; filename="${pf.name}"`);
    res.status(200).send(Buffer.from(`Nexum File: ${pf.name}\nSize: ${pf.file.sizeBytes} bytes`));
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/freelancer/project-files/:id/versions
 * List all versions for this file group.
 */
router.get("/:id/versions", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const freelancerId = req.user!.id;

    const pf = await prisma.projectFile.findUnique({
      where: { id },
      include: { project: true },
    });

    if (!pf) throw new NotFoundError("File not found");

    const access = await verifyProjectAccess(pf.projectId, freelancerId, prisma);
    if (!access.allowed && pf.uploadedBy !== freelancerId) {
      throw new NotFoundError("File not found");
    }

    const versions = await prisma.projectFile.findMany({
      where: {
        projectId: pf.projectId,
        versionGroupId: pf.versionGroupId,
      },
      include: { file: true, uploader: { select: { id: true, name: true } } },
      orderBy: { versionNumber: "desc" },
    });

    res.status(200).json({ success: true, versions });
  } catch (err) {
    next(err);
  }
});

export default router;
