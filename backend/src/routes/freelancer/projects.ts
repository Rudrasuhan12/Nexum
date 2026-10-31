import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { prisma } from "../../prisma.js";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import { Role, ProjectState, ExperienceLevel, Prisma } from "@prisma/client";
import { ValidationError, NotFoundError } from "../../lib/errors.js";
import { appendAuditEvent } from "../../lib/audit.js";

const router = Router();

// Enforce authentication & freelancer role boundary across all routes
router.use(requireAuth);
router.use(requireRole(Role.FREELANCER));

// Validation Schemas
const searchProjectsSchema = z.object({
  q: z.string().optional(),
  location: z.string().optional(),
  category: z.string().optional(),
  experienceLevel: z.enum(["BEGINNER", "JUNIOR", "MID", "SENIOR", "EXPERT"]).optional(),
  budgetType: z.enum(["HOURLY", "FIXED_PRICE", "ALL"]).optional(),
  minBudgetCents: z.coerce.number().int().nonnegative().optional(),
  maxBudgetCents: z.coerce.number().int().positive().optional(),
  skills: z.string().optional(),
  sortBy: z.enum(["newest", "budget_high", "budget_low", "match_high", "fewest_proposals"]).default("newest"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

/**
 * GET /api/freelancer/projects/search
 * Search and filter open projects with real database records & proposal counts.
 */
router.get("/search", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parsed = searchProjectsSchema.safeParse(req.query);
    if (!parsed.success) {
      throw new ValidationError(
        "Invalid search parameters",
        parsed.error.flatten().fieldErrors
      );
    }

    const {
      q,
      location,
      category,
      experienceLevel,
      budgetType,
      minBudgetCents,
      maxBudgetCents,
      skills,
      sortBy,
      page,
      limit,
    } = parsed.data;

    const freelancerId = req.user!.id;

    // Filter projects that are visible and in matching/active intake state
    const where: Prisma.ProjectWhereInput = {
      visibility: { in: ["PUBLIC", "MATCHING"] },
      state: { in: [ProjectState.MATCHING, ProjectState.ACTIVE, ProjectState.INTAKE] },
    };

    // Text search (matches title, description, skills, or client name)
    if (q && q.trim()) {
      const term = q.trim();
      where.OR = [
        { title: { contains: term, mode: "insensitive" } },
        { description: { contains: term, mode: "insensitive" } },
        { client: { name: { contains: term, mode: "insensitive" } } },
        { skills: { hasSome: [term] } },
      ];
    }

    // Location filter
    if (location && location.trim() && location.toLowerCase() !== "any") {
      where.location = { contains: location.trim(), mode: "insensitive" };
    }

    // Category filter
    if (category && category.trim() && category !== "All Categories" && category !== "All") {
      where.category = { equals: category.trim(), mode: "insensitive" };
    }

    // Experience Level filter
    if (experienceLevel) {
      where.experienceLevel = experienceLevel as ExperienceLevel;
    }

    // Budget Type filter
    if (budgetType && budgetType !== "ALL") {
      where.budgetType = budgetType;
    }

    // Budget range filter (in minor units / cents)
    if (minBudgetCents !== undefined || maxBudgetCents !== undefined) {
      where.budgetCents = {};
      if (minBudgetCents !== undefined) {
        where.budgetCents.gte = minBudgetCents;
      }
      if (maxBudgetCents !== undefined) {
        where.budgetCents.lte = maxBudgetCents;
      }
    }

    // Skills filter (comma-separated list)
    if (skills && skills.trim()) {
      const skillList = skills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      if (skillList.length > 0) {
        where.skills = { hasSome: skillList };
      }
    }

    // Sorting
    let orderBy: Prisma.ProjectOrderByWithRelationInput = { createdAt: "desc" };
    if (sortBy === "budget_high") {
      orderBy = { budgetCents: "desc" };
    } else if (sortBy === "budget_low") {
      orderBy = { budgetCents: "asc" };
    } else if (sortBy === "fewest_proposals") {
      orderBy = { proposals: { _count: "asc" } };
    }

    const skip = (page - 1) * limit;

    // Parallel query: fetch projects and total matching count
    const [rawProjects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          client: {
            select: {
              id: true,
              name: true,
              locale: true,
              status: true,
              preferences: true,
            },
          },
          _count: {
            select: { proposals: true },
          },
        },
      }),
      prisma.project.count({ where }),
    ]);

    // Query freelancer's saved bookmarks to annotate isSaved
    const savedProjects = await prisma.savedProject.findMany({
      where: { freelancerId },
      select: { projectId: true },
    });
    const savedProjectIds = new Set(savedProjects.map((s) => s.projectId));

    // Format response without fabricating trust badges or ratings
    const formattedProjects = rawProjects.map((proj) => {
      const prefs = (proj.client.preferences as Record<string, unknown>) || {};
      const company = (prefs.company as string) || (prefs.companyOrHandle as string) || "Independent Buyer";

      return {
        id: proj.id,
        title: proj.title,
        description: proj.description,
        category: proj.category || "General",
        skills: proj.skills || [],
        experienceLevel: proj.experienceLevel || "MID",
        budgetType: proj.budgetType === "HOURLY" ? "Hourly" : "Fixed Price",
        budgetAmount: proj.budgetCents / 100,
        budgetCents: proj.budgetCents,
        currency: proj.currency,
        location: proj.location || "Remote",
        postedAt: proj.createdAt.toISOString(),
        proposalsCount: proj._count.proposals,
        isSaved: savedProjectIds.has(proj.id),
        client: {
          id: proj.client.id,
          name: proj.client.name,
          company,
          location: proj.location || "Remote",
          // Strictly show verified true ONLY if account status is ACTIVE, zero fabricated badges
          isVerified: proj.client.status === "ACTIVE",
        },
      };
    });

    res.json({
      success: true,
      projects: formattedProjects,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/freelancer/projects/saved
 * Retrieve all projects bookmarked by the authenticated freelancer.
 */
router.get("/saved", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const freelancerId = req.user!.id;

    const savedBookmarks = await prisma.savedProject.findMany({
      where: { freelancerId },
      orderBy: { createdAt: "desc" },
      include: {
        project: {
          include: {
            client: {
              select: {
                id: true,
                name: true,
                locale: true,
                status: true,
                preferences: true,
              },
            },
            _count: {
              select: { proposals: true },
            },
          },
        },
      },
    });

    const projects = savedBookmarks.map((item) => {
      const proj = item.project;
      const prefs = (proj.client.preferences as Record<string, unknown>) || {};
      const company = (prefs.company as string) || (prefs.companyOrHandle as string) || "Independent Buyer";

      return {
        id: proj.id,
        savedAt: item.createdAt.toISOString(),
        title: proj.title,
        description: proj.description,
        category: proj.category || "General",
        skills: proj.skills || [],
        experienceLevel: proj.experienceLevel || "MID",
        budgetType: proj.budgetType === "HOURLY" ? "Hourly" : "Fixed Price",
        budgetAmount: proj.budgetCents / 100,
        budgetCents: proj.budgetCents,
        currency: proj.currency,
        location: proj.location || "Remote",
        postedAt: proj.createdAt.toISOString(),
        proposalsCount: proj._count.proposals,
        isSaved: true,
        client: {
          id: proj.client.id,
          name: proj.client.name,
          company,
          location: proj.location || "Remote",
          isVerified: proj.client.status === "ACTIVE",
        },
      };
    });

    res.json({
      success: true,
      savedProjects: projects,
      total: projects.length,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/freelancer/projects/:id
 * Retrieve details for a specific project opportunity.
 */
router.get("/:id", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const freelancerId = req.user!.id;

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            locale: true,
            timezone: true,
            status: true,
            createdAt: true,
            preferences: true,
          },
        },
        briefVersions: {
          where: { status: "CURRENT" },
          take: 1,
        },
        _count: {
          select: { proposals: true },
        },
      },
    });

    if (!project) {
      throw new NotFoundError("Project not found");
    }

    const savedRecord = await prisma.savedProject.findUnique({
      where: {
        freelancerId_projectId: {
          freelancerId,
          projectId: id,
        },
      },
    });

    const prefs = (project.client.preferences as Record<string, unknown>) || {};
    const company = (prefs.company as string) || (prefs.companyOrHandle as string) || "Independent Buyer";

    res.json({
      success: true,
      project: {
        id: project.id,
        title: project.title,
        description: project.description,
        goals: project.goals,
        category: project.category || "General",
        skills: project.skills || [],
        experienceLevel: project.experienceLevel || "MID",
        budgetType: project.budgetType === "HOURLY" ? "Hourly" : "Fixed Price",
        budgetAmount: project.budgetCents / 100,
        budgetCents: project.budgetCents,
        currency: project.currency,
        location: project.location || "Remote",
        state: project.state,
        postedAt: project.createdAt.toISOString(),
        proposalsCount: project._count.proposals,
        isSaved: Boolean(savedRecord),
        brief: project.briefVersions[0]?.structuredBrief || null,
        client: {
          id: project.client.id,
          name: project.client.name,
          company,
          location: project.location || "Remote",
          timezone: project.client.timezone,
          memberSince: project.client.createdAt.toISOString(),
          isVerified: project.client.status === "ACTIVE",
        },
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/freelancer/projects/:id/save
 * Bookmark a project idempotently and record an append-only AuditEvent.
 */
router.post("/:id/save", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id: projectId } = req.params;
    const freelancerId = req.user!.id;

    // Check project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, title: true },
    });

    if (!project) {
      throw new NotFoundError("Project not found");
    }

    // Idempotent upsert
    await prisma.savedProject.upsert({
      where: {
        freelancerId_projectId: {
          freelancerId,
          projectId,
        },
      },
      update: {},
      create: {
        freelancerId,
        projectId,
      },
    });

    // Append-only audit logging
    await appendAuditEvent({
      actorId: freelancerId,
      action: "PROJECT_SAVED",
      objectType: "PROJECT",
      objectId: projectId,
      metadata: { projectTitle: project.title, savedAt: new Date().toISOString() },
    });

    res.status(200).json({
      success: true,
      isSaved: true,
      projectId,
      message: "Project saved to bookmarks",
    });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/freelancer/projects/:id/save
 * Remove a project bookmark and record an append-only AuditEvent.
 */
router.delete("/:id/save", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id: projectId } = req.params;
    const freelancerId = req.user!.id;

    const existing = await prisma.savedProject.findUnique({
      where: {
        freelancerId_projectId: {
          freelancerId,
          projectId,
        },
      },
    });

    if (existing) {
      await prisma.savedProject.delete({
        where: { id: existing.id },
      });

      // Append-only audit logging
      await appendAuditEvent({
        actorId: freelancerId,
        action: "PROJECT_UNSAVED",
        objectType: "PROJECT",
        objectId: projectId,
        metadata: { unsavedAt: new Date().toISOString() },
      });
    }

    res.status(200).json({
      success: true,
      isSaved: false,
      projectId,
      message: "Project removed from bookmarks",
    });
  } catch (err) {
    next(err);
  }
});

export { router as freelancerProjectsRouter };
export default router;
