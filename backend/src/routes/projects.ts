import { Router, Request, Response } from "express";
import { requireAuth } from "../middleware/auth.js";
import { clientOverviewService } from "../services/clientOverviewService.js";

const router = Router();

// GET /api/projects - list projects with active proposals and milestones
// clientId is always derived from the authenticated session — the query-string param is ignored.
router.get("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const clientId = (req as any).user?.id as string;
    const status = req.query.status as string;
    const search = req.query.search as string;

    const result = await clientOverviewService.getProjects({
      clientId,
      status,
      search,
    });

    res.json({
      success: true,
      count: result.projects.length,
      data: result.projects,
      stats: result.stats,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to fetch projects";
    res.status(500).json({ success: false, error: msg });
  }
});

// POST /api/projects - create new project or draft with milestones and PRD
// clientId is always taken from the authenticated session — never from the request body.
router.post("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const sessionClientId = (req as any).user?.id as string;
    const {
      id,
      title,
      description,
      state,
      budgetCents = 0,
      currency = "USD",
      deadline,
      goals,
      category,
      subcategory,
      requiredSkills,
      skills,
      detailedRequirements,
      scopeOfWork,
      budgetType,
      timelineDuration,
      experienceLevel,
      englishLevel,
      visibility,
      milestones = [],
    } = req.body || {};

    if (!title) {
      return res.status(400).json({
        success: false,
        error: "Title is required",
      });
    }

    const created = await clientOverviewService.createProject({
      id,
      clientId: sessionClientId,
      title,
      description: description || "",
      state: state || (budgetCents > 0 ? "ACTIVE" : "DRAFT"),
      budgetCents,
      currency,
      deadline: deadline ? new Date(deadline) : undefined,
      goals,
      category,
      subcategory,
      requiredSkills: requiredSkills || skills || [],
      detailedRequirements,
      scopeOfWork,
      budgetType,
      timelineDuration,
      experienceLevel,
      englishLevel,
      visibility,
      milestones,
    });

    res.status(201).json({
      success: true,
      message: state === "DRAFT" ? "Draft saved successfully" : "Project published and registered in consensus engine",
      data: created,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to save project";
    res.status(500).json({ success: false, error: msg });
  }
});

// GET /api/projects/:id - get single project or draft
// Ownership is enforced: the session user must own the project.
router.get("/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const clientId = (req as any).user?.id as string;
    const project = await clientOverviewService.getProjectById(req.params.id, clientId);

    if (!project) {
      return res.status(404).json({ success: false, error: "Project not found" });
    }

    res.json({ success: true, data: project });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to fetch project";
    res.status(500).json({ success: false, error: msg });
  }
});

// PUT /api/projects/:id - update existing project or draft
// clientId is enforced from session; body-supplied clientId is ignored.
router.put("/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const sessionClientId = (req as any).user?.id as string;
    const updated = await clientOverviewService.createProject({
      ...req.body,
      id: req.params.id,
      clientId: sessionClientId,
    });

    res.json({
      success: true,
      message: "Project updated successfully",
      data: updated,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to update project";
    res.status(500).json({ success: false, error: msg });
  }
});

// DELETE /api/projects/:id - delete a project or draft
// Ownership verification is performed inside clientOverviewService.deleteProject.
router.delete("/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const clientId = (req as any).user?.id as string;
    const result = await clientOverviewService.deleteProject(req.params.id, clientId);
    res.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to delete project";
    res.status(500).json({ success: false, error: msg });
  }
});

export default router;
