import { Router, Request, Response, NextFunction } from "express";
import multer from "multer";
import crypto from "crypto";
import { z } from "zod";
import { prisma } from "../../prisma.js";
import { requireAuth, requireRole, requireOnboarded } from "../../middleware/auth.js";
import { Role, FilePurpose, ResumeVisibility } from "@prisma/client";
import {
  ValidationError,
  NotFoundError,
} from "../../lib/errors.js";
import { appendAuditEvent } from "../../lib/audit.js";
import {
  defaultStorage,
  sanitizeAndProcessImage,
  isPdfBuffer,
  RESUME_SIZE_LIMIT,
  UnsupportedMediaTypeError,
  PayloadTooLargeError,
} from "../../lib/files.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB memory limit before validation
});

// Router for freelancer endpoints: mounted at /api/freelancer
export const freelancerFilesRouter = Router();

// Router for file streaming endpoints: mounted at /api/files
export const publicFilesRouter = Router();

// Router for public freelancer access: mounted at /api/public/freelancers
export const publicFreelancersRouter = Router();

// ---------------------------------------------------------------------------
// 1. POST /api/freelancer/files - Upload photo, cover, or portfolio image
// ---------------------------------------------------------------------------
freelancerFilesRouter.post(
  "/files",
  requireAuth,
  requireRole(Role.FREELANCER),
  requireOnboarded,
  upload.single("file"),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    let savedStorageKey: string | null = null;
    try {
      if (!req.file || !req.file.buffer) {
        throw new ValidationError("An image file is required");
      }

      const purposeRaw = req.body.purpose;
      if (!purposeRaw || !["PROFILE_PHOTO", "PROFILE_COVER", "PORTFOLIO_IMAGE"].includes(purposeRaw)) {
        throw new ValidationError("Purpose must be PROFILE_PHOTO, PROFILE_COVER, or PORTFOLIO_IMAGE");
      }
      const purpose = purposeRaw as FilePurpose;

      // 1. Validate magic bytes, auto-orient, re-encode and strip EXIF
      const processed = await sanitizeAndProcessImage(req.file.buffer, purpose);
      savedStorageKey = processed.storageKey;

      // 2. Persist to storage
      await defaultStorage.save(processed.storageKey, processed.sanitizedBuffer);

      // 3. Persist file metadata to database
      const user = req.user!;
      const fileRecord = await prisma.$transaction(async (tx) => {
        const file = await tx.file.create({
          data: {
            ownerId: user.id,
            purpose,
            storageKey: processed.storageKey,
            originalName: req.file!.originalname,
            mime: processed.mime,
            sizeBytes: processed.sizeBytes,
            sha256: processed.sha256,
          },
        });

        await appendAuditEvent(
          {
            actorId: user.id,
            action: "FILE_UPLOADED",
            objectType: "FILE",
            objectId: file.id,
            metadata: { purpose, sizeBytes: processed.sizeBytes, mime: processed.mime },
          },
          tx
        );

        return file;
      });

      res.status(201).json({
        success: true,
        file: {
          id: fileRecord.id,
          originalName: fileRecord.originalName,
          sizeBytes: fileRecord.sizeBytes,
          mime: fileRecord.mime,
        },
      });
    } catch (err) {
      // Cleanup orphan file on storage if DB transaction failed
      if (savedStorageKey) {
        await defaultStorage.delete(savedStorageKey).catch(() => {});
      }
      next(err);
    }
  }
);

// ---------------------------------------------------------------------------
// 2. GET /api/files/:id - Authorized file streaming / download
// ---------------------------------------------------------------------------
publicFilesRouter.get(
  "/:id",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const file = await prisma.file.findUnique({
        where: { id },
        include: {
          photoProfiles: { select: { searchVisibility: true } },
          coverProfiles: { select: { searchVisibility: true } },
          portfolioProjects: { select: { id: true } },
        },
      });

      if (!file) {
        throw new NotFoundError("File", id);
      }

      // Check access permission:
      // A. Owner access
      const authenticatedUserId = req.user?.id;
      const isOwner = Boolean(authenticatedUserId && authenticatedUserId === file.ownerId);

      // B. Public access:
      // - PORTFOLIO_IMAGE is always publicly accessible
      // - PROFILE_PHOTO and PROFILE_COVER are publicly accessible if the profile has searchVisibility = VISIBLE
      let isPubliclyAccessible = false;
      if (file.purpose === "PORTFOLIO_IMAGE") {
        isPubliclyAccessible = true;
      } else if (file.purpose === "PROFILE_PHOTO") {
        const isVisible = file.photoProfiles.some((p) => p.searchVisibility === "VISIBLE");
        isPubliclyAccessible = isVisible;
      } else if (file.purpose === "PROFILE_COVER") {
        const isVisible = file.coverProfiles.some((p) => p.searchVisibility === "VISIBLE");
        isPubliclyAccessible = isVisible;
      }

      if (!isOwner && !isPubliclyAccessible) {
        // Return 404 to prevent resource enumeration
        throw new NotFoundError("File", id);
      }

      const fileStream = await defaultStorage.getStream(file.storageKey);
      res.setHeader("Content-Type", file.mime);
      res.setHeader("Content-Length", file.sizeBytes);
      res.setHeader("Cache-Control", "public, max-age=86400"); // 1 day
      (fileStream as any).pipe(res);
    } catch (err) {
      next(err);
    }
  }
);

// ---------------------------------------------------------------------------
// 3. GET /api/freelancer/resume - Get active resume metadata
// ---------------------------------------------------------------------------
freelancerFilesRouter.get(
  "/resume",
  requireAuth,
  requireRole(Role.FREELANCER),
  requireOnboarded,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user!;
      const resume = await prisma.resumeFile.findFirst({
        where: { userId: user.id, status: "ACTIVE" },
        orderBy: { uploadedAt: "desc" },
      });

      if (!resume) {
        res.json({ success: true, resume: null });
        return;
      }

      res.json({
        success: true,
        resume: {
          id: resume.id,
          originalName: resume.originalName,
          mimeType: resume.mimeType,
          sizeBytes: resume.sizeBytes,
          visibility: resume.visibility,
          uploadedAt: resume.uploadedAt,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

// ---------------------------------------------------------------------------
// 5. GET /api/freelancer/resume/download - Authenticated owner download
// ---------------------------------------------------------------------------
freelancerFilesRouter.get(
  "/resume/download",
  requireAuth,
  requireRole(Role.FREELANCER),
  requireOnboarded,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user!;
      const resume = await prisma.resumeFile.findFirst({
        where: { userId: user.id, status: "ACTIVE" },
        orderBy: { uploadedAt: "desc" },
      });

      if (!resume) {
        throw new NotFoundError("ResumeFile");
      }

      const fileStream = await defaultStorage.getStream(resume.storageKey);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Length", resume.sizeBytes);
      res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(resume.originalName)}"`);
      (fileStream as any).pipe(res);
    } catch (err) {
      next(err);
    }
  }
);

// ---------------------------------------------------------------------------
// 6. PATCH /api/freelancer/resume/visibility - Update visibility
// ---------------------------------------------------------------------------
const visibilitySchema = z.object({
  visibility: z.enum(["PRIVATE", "PROPOSAL_CLIENTS", "PUBLIC"]),
});

freelancerFilesRouter.patch(
  "/resume/visibility",
  requireAuth,
  requireRole(Role.FREELANCER),
  requireOnboarded,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = visibilitySchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ValidationError("Visibility must be PRIVATE, PROPOSAL_CLIENTS, or PUBLIC");
      }

      const user = req.user!;
      const current = await prisma.resumeFile.findFirst({
        where: { userId: user.id, status: "ACTIVE" },
      });

      if (!current) {
        throw new NotFoundError("ResumeFile");
      }

      const updated = await prisma.$transaction(async (tx) => {
        const resFile = await tx.resumeFile.update({
          where: { id: current.id },
          data: { visibility: parsed.data.visibility as ResumeVisibility },
        });

        await appendAuditEvent(
          {
            actorId: user.id,
            action: "RESUME_VISIBILITY_CHANGED",
            objectType: "RESUME_FILE",
            objectId: resFile.id,
            metadata: {
              previousVisibility: current.visibility,
              newVisibility: parsed.data.visibility,
            },
          },
          tx
        );

        return resFile;
      });

      res.json({
        success: true,
        visibility: updated.visibility,
      });
    } catch (err) {
      next(err);
    }
  }
);

// ---------------------------------------------------------------------------
// 7. GET /api/public/freelancers/:userId/resume - Public resume download
// ---------------------------------------------------------------------------
publicFreelancersRouter.get(
  "/:userId/resume",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = req.params;
      const resume = await prisma.resumeFile.findFirst({
        where: { userId, status: "ACTIVE" },
      });

      if (!resume) {
        throw new NotFoundError("ResumeFile", userId);
      }

      // Check authorization:
      // Allow if PUBLIC. If PROPOSAL_CLIENTS, check if authenticated client has received a proposal
      let authorized = resume.visibility === "PUBLIC";

      if (!authorized && resume.visibility === "PROPOSAL_CLIENTS") {
        const viewerId = req.user?.id;
        if (viewerId) {
          if (viewerId === userId) {
            authorized = true;
          } else {
            // Check if there is an active project or proposal between this client and freelancer
            const proposal = await prisma.proposalVersion.findFirst({
              where: {
                freelancerId: userId,
                project: { clientId: viewerId },
              },
            });
            if (proposal) authorized = true;
          }
        }
      }

      if (!authorized) {
        // Return 404 to avoid enumeration
        throw new NotFoundError("ResumeFile", userId);
      }

      const fileStream = await defaultStorage.getStream(resume.storageKey);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Length", resume.sizeBytes);
      res.setHeader("Content-Disposition", `inline; filename="${encodeURIComponent(resume.originalName)}"`);
      (fileStream as any).pipe(res);
    } catch (err) {
      next(err);
    }
  }
);
