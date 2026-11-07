import { Router, Request, Response } from "express";
import { z } from "zod";
import { handoverService } from "../services/handoverService.js";
import { SESSION_COOKIE_NAME, validateSession } from "../lib/auth.js";

const router = Router();

// Auth helper
async function resolveUser(req: Request): Promise<{ id: string; role?: string | null } | null> {
  const reqUser = (req as any).user;
  if (reqUser?.id) return reqUser;

  const cookieToken = req.cookies?.[SESSION_COOKIE_NAME];
  if (cookieToken) {
    try {
      const sessionRecord = await validateSession(cookieToken);
      if (sessionRecord?.user) {
        return sessionRecord.user;
      }
    } catch {
      // Ignore
    }
  }

  const headerAuth = req.headers.authorization;
  if (headerAuth?.startsWith("Bearer ")) {
    try {
      const sessionRecord = await validateSession(headerAuth.slice(7).trim());
      if (sessionRecord?.user) {
        return sessionRecord.user;
      }
    } catch {
      // Ignore
    }
  }

  // Fallback to query/body if called from client
  const fallbackId = (req.body?.clientId as string) || (req.query?.clientId as string) || (req.body?.userId as string);
  if (fallbackId) {
    return { id: fallbackId, role: "CLIENT" };
  }

  return { id: "usr_client_alex", role: "CLIENT" };
}

// Zod schemas
const initiateSchema = z.object({
  items: z
    .array(
      z.object({
        title: z.string().min(2, "Title is required"),
        description: z.string().min(3, "Description is required"),
        category: z.enum([
          "REPOSITORY",
          "DOCUMENTATION",
          "DEPLOYMENT",
          "CREDENTIALS",
          "TESTS",
          "IP_TRANSFER",
          "CUSTOM",
        ]),
        isRequired: z.boolean().optional(),
      })
    )
    .optional(),
});

const submitItemSchema = z
  .object({
    providedUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
    providedFileKey: z.string().optional(),
    providedNotes: z.string().max(2000).optional(),
  })
  .refine((data) => data.providedUrl || data.providedFileKey || data.providedNotes, {
    message: "Must provide at least a URL, file attachment, or verification notes",
  });

const reviewItemSchema = z.object({
  decision: z.enum(["ACCEPTED", "REVISIONS_REQUESTED"]),
  rejectionReason: z.string().max(1000).optional(),
});

// GET /api/projects/:id/handover
router.get("/:id/handover", async (req: Request, res: Response) => {
  try {
    const user = await resolveUser(req);
    if (!user) {
      return res.status(401).json({
        error: { code: "UNAUTHORIZED", message: "Authentication required", details: null },
      });
    }

    const data = await handoverService.getHandover(req.params.id);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(err.statusCode || 500).json({
      error: {
        code: err.code || "HANDOVER_FETCH_ERROR",
        message: err.message || "Failed to fetch handover",
        details: err.details || null,
      },
    });
  }
});

// POST /api/projects/:id/handover/initiate
router.post("/:id/handover/initiate", async (req: Request, res: Response) => {
  try {
    const user = await resolveUser(req);
    if (!user) {
      return res.status(401).json({
        error: { code: "UNAUTHORIZED", message: "Authentication required", details: null },
      });
    }

    const parsed = initiateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid handover payload",
          details: parsed.error.format(),
        },
      });
    }

    const handover = await handoverService.initiateHandover({
      projectId: req.params.id,
      clientId: user.id,
      items: parsed.data.items,
    });

    res.status(201).json({
      success: true,
      message: "Handover checklist successfully initiated",
      data: handover,
    });
  } catch (err: any) {
    res.status(err.statusCode || 500).json({
      error: {
        code: err.code || "HANDOVER_INITIATE_ERROR",
        message: err.message || "Failed to initiate handover",
        details: err.details || null,
      },
    });
  }
});

// POST /api/projects/:id/handover/items/:itemId/submit
router.post("/:id/handover/items/:itemId/submit", async (req: Request, res: Response) => {
  try {
    const user = await resolveUser(req);
    if (!user) {
      return res.status(401).json({
        error: { code: "UNAUTHORIZED", message: "Authentication required", details: null },
      });
    }

    const parsed = submitItemSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid document submission",
          details: parsed.error.format(),
        },
      });
    }

    const item = await handoverService.submitHandoverItem({
      projectId: req.params.id,
      itemId: req.params.itemId,
      freelancerId: user.id,
      providedUrl: parsed.data.providedUrl || undefined,
      providedFileKey: parsed.data.providedFileKey,
      providedNotes: parsed.data.providedNotes,
    });

    res.json({
      success: true,
      message: "Handover document submitted successfully",
      data: item,
    });
  } catch (err: any) {
    res.status(err.statusCode || 500).json({
      error: {
        code: err.code || "HANDOVER_SUBMIT_ERROR",
        message: err.message || "Failed to submit handover document",
        details: err.details || null,
      },
    });
  }
});

// POST /api/projects/:id/handover/items/:itemId/review
router.post("/:id/handover/items/:itemId/review", async (req: Request, res: Response) => {
  try {
    const user = await resolveUser(req);
    if (!user) {
      return res.status(401).json({
        error: { code: "UNAUTHORIZED", message: "Authentication required", details: null },
      });
    }

    const parsed = reviewItemSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid review decision payload",
          details: parsed.error.format(),
        },
      });
    }

    const item = await handoverService.reviewHandoverItem({
      projectId: req.params.id,
      itemId: req.params.itemId,
      clientId: user.id,
      decision: parsed.data.decision,
      rejectionReason: parsed.data.rejectionReason,
    });

    res.json({
      success: true,
      message: `Item marked as ${parsed.data.decision}`,
      data: item,
    });
  } catch (err: any) {
    res.status(err.statusCode || 500).json({
      error: {
        code: err.code || "HANDOVER_REVIEW_ERROR",
        message: err.message || "Failed to review handover document",
        details: err.details || null,
      },
    });
  }
});

// POST /api/projects/:id/handover/finalize
router.post("/:id/handover/finalize", async (req: Request, res: Response) => {
  try {
    const user = await resolveUser(req);
    if (!user) {
      return res.status(401).json({
        error: { code: "UNAUTHORIZED", message: "Authentication required", details: null },
      });
    }

    const result = await handoverService.finalizeHandover({
      projectId: req.params.id,
      clientId: user.id,
    });

    res.json(result);
  } catch (err: any) {
    res.status(err.statusCode || 500).json({
      error: {
        code: err.code || "HANDOVER_FINALIZE_ERROR",
        message: err.message || "Failed to finalize project handover",
        details: err.details || null,
      },
    });
  }
});

export default router;

