import { Router, Request, Response } from "express";
import { z } from "zod";
import multer from "multer";
import crypto from "crypto";
import path from "path";
import { FilePurpose, ProjectFileCategory } from "@prisma/client";
import { prisma } from "../prisma.js";
import { workspaceService } from "../services/workspaceService.js";
import { groqService } from "../services/groqService.js";
import { geminiService } from "../services/geminiService.js";
import { defaultStorage } from "../lib/files.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB limit
});

const router = Router();

export interface ProjectParticipantCheck {
  isAuthorized: boolean;
  isClient: boolean;
  isFreelancer: boolean;
  effectiveRole: "CLIENT" | "FREELANCER";
  effectiveUserId: string;
}

export function checkProjectParticipant(
  project: {
    clientId: string;
    client?: { id: string; email: string; name?: string | null } | null;
    agreement?: { freelancerId: string; freelancer?: { id: string; email: string; name?: string | null } | null } | null;
    projectProposals?: Array<{ freelancerId: string; freelancer?: { id: string; email: string; name?: string | null } | null }>;
  },
  requesterId?: string,
  requesterEmail?: string
): ProjectParticipantCheck {
  const normId = (requesterId || "").trim().toLowerCase();
  const normEmail = (requesterEmail || "").trim().toLowerCase();

  const isClient =
    (Boolean(project.clientId) && (project.clientId.toLowerCase() === normId || project.clientId.toLowerCase() === normEmail)) ||
    (Boolean(project.client?.id) && (project.client!.id.toLowerCase() === normId || project.client!.id.toLowerCase() === normEmail)) ||
    (Boolean(project.client?.email) && (project.client!.email.toLowerCase() === normEmail || project.client!.email.toLowerCase() === normId));

  const assignedFreelancerId =
    project.agreement?.freelancerId ||
    project.agreement?.freelancer?.id ||
    project.projectProposals?.[0]?.freelancerId ||
    project.projectProposals?.[0]?.freelancer?.id ||
    "";

  const assignedFreelancerEmail =
    project.agreement?.freelancer?.email ||
    project.projectProposals?.[0]?.freelancer?.email ||
    "";

  const isFreelancer =
    (Boolean(assignedFreelancerId) && (assignedFreelancerId.toLowerCase() === normId || assignedFreelancerId.toLowerCase() === normEmail)) ||
    (Boolean(assignedFreelancerEmail) && (assignedFreelancerEmail.toLowerCase() === normEmail || assignedFreelancerEmail.toLowerCase() === normId));

  const isAuthorized = isClient || isFreelancer;
  const effectiveRole = isClient ? "CLIENT" : "FREELANCER";
  const effectiveUserId = isClient ? project.clientId : assignedFreelancerId;

  return { isAuthorized, isClient, isFreelancer, effectiveRole, effectiveUserId };
}

/**
 * GET /api/workspace/projects
 * Fetches real active projects for the authenticated user (Client or Freelancer).
 * Returns truthful empty list [] when user has no active workspace contracts.
 */
router.get("/projects", async (req: Request, res: Response) => {
  try {
    const sessionUser = (req as any).user;
    const requestedUserId = (req.query.userId as string) || (req.headers["x-user-id"] as string) || sessionUser?.id || sessionUser?.email;
    const role = (req.query.role as string) || sessionUser?.role || "CLIENT";
    const explicitEmpty = req.query.empty === "true";

    if (explicitEmpty || !requestedUserId) {
      return res.json({ success: true, count: 0, data: [] });
    }

    // Resolve user if exists in DB to support querying by either ID or Email
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { id: requestedUserId },
          { email: requestedUserId },
        ],
      },
      select: { id: true, email: true },
    });

    const candidateIds = user ? [user.id, requestedUserId] : [requestedUserId];
    const candidateEmails = user ? [user.email, requestedUserId] : [requestedUserId];

    const clientCondition = {
      OR: [
        { clientId: { in: candidateIds } },
        { client: { id: { in: candidateIds } } },
        { client: { email: { in: candidateEmails } } },
      ],
    };

    const freelancerCondition = {
      OR: [
        { agreement: { freelancerId: { in: candidateIds }, status: { in: ["PENDING_APPROVAL", "ACTIVE", "COMPLETED"] } } },
        { agreement: { freelancer: { id: { in: candidateIds } }, status: { in: ["PENDING_APPROVAL", "ACTIVE", "COMPLETED"] } } },
        { agreement: { freelancer: { email: { in: candidateEmails } }, status: { in: ["PENDING_APPROVAL", "ACTIVE", "COMPLETED"] } } },
        { projectProposals: { some: { freelancerId: { in: candidateIds }, status: "ACCEPTED" } } },
        { projectProposals: { some: { freelancer: { email: { in: candidateEmails } }, status: "ACCEPTED" } } },
      ],
    };

    const statusCondition = {
      OR: [
        { agreement: { status: { in: ["PENDING_APPROVAL", "ACTIVE", "COMPLETED"] } } },
        { projectProposals: { some: { status: "ACCEPTED" } } },
      ],
    };

    // Query Prisma database - strictly only projects with an accepted proposal or agreement
    const dbProjects = await prisma.project.findMany({
      where: (role === "FREELANCER"
        ? { AND: [freelancerCondition, statusCondition] }
        : { AND: [clientCondition, statusCondition] }) as any,
      include: {
        client: { select: { id: true, name: true, email: true } },
        projectMilestones: { orderBy: { orderIndex: "asc" } },
        agreement: {
          include: {
            freelancer: { select: { id: true, name: true, email: true } },
            milestones: { orderBy: { orderIndex: "asc" } },
          },
        },
        projectProposals: {
          where: { status: "ACCEPTED" },
          include: {
            freelancer: { select: { id: true, name: true, email: true } },
          },
        },
        workspaceConversation: {
          include: {
            messages: { orderBy: { createdAt: "desc" }, take: 1 },
            meetings: { orderBy: { createdAt: "desc" }, take: 1 },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    // Map projects into WorkspaceProject format - only projects with connected freelancer
    const mapped = dbProjects
      .map((p) => {
        const activeProposal = p.projectProposals?.[0];
        const freelancer = p.agreement?.freelancer || activeProposal?.freelancer || null;
        if (!freelancer) return null;

        const lastMsg = p.workspaceConversation?.messages?.[0];
        const nextMeeting = p.workspaceConversation?.meetings?.[0];

        const rawMilestones = (p.agreement?.milestones && p.agreement.milestones.length > 0)
          ? p.agreement.milestones
          : (p.projectMilestones && p.projectMilestones.length > 0)
          ? p.projectMilestones
          : [];

        return {
          id: p.id,
          name: p.title,
          shortName: p.title.split('–')[0].split('-')[0].trim(),
          iconType: p.title.toLowerCase().includes('cart') ? 'cart' : p.title.toLowerCase().includes('fit') ? 'phone' : 'chart',
          freelancerName: freelancer?.name || 'Assigned Freelancer',
          freelancerAvatar: (freelancer as any)?.avatar || '',
          clientName: p.client?.name || 'Client',
          clientAvatar: (p.client as any)?.avatar || '',
          status: p.state === 'ACTIVE' ? 'Active project' : p.state,
          statusColor: p.state === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80' : 'bg-slate-100 text-slate-700 border-slate-200',
          budget: '$' + (p.budgetCents / 100).toLocaleString(),
          duration: p.deadline ? (Math.max(1, Math.round((new Date(p.deadline).getTime() - new Date(p.createdAt).getTime()) / (7 * 24 * 3600 * 1000))) + ' weeks') : 'Flexible',
          startDate: new Date(p.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }),
          agreementVersion: 'v' + ((activeProposal as any)?.version || 1),
          unreadCount: 0,
          lastMessagePreview: lastMsg?.mediatedContent || lastMsg?.originalContent || 'Workspace ready for collaboration',
          lastActivityTime: lastMsg ? new Date(lastMsg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Active',
          canSee: true,
          paymentNote: 'Milestone funds secured via PayPal Orders REST v2 Escrow.',
          upcomingMeeting: nextMeeting ? {
            title: nextMeeting.title,
            time: nextMeeting.confirmedSlot
              ? new Date(nextMeeting.confirmedSlot).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
              : Array.isArray(nextMeeting.proposedSlots) && nextMeeting.proposedSlots.length > 0
                ? typeof nextMeeting.proposedSlots[0] === 'object' && nextMeeting.proposedSlots[0] !== null
                  ? (nextMeeting.proposedSlots[0] as any).startTime
                    ? new Date((nextMeeting.proposedSlots[0] as any).startTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
                    : String((nextMeeting.proposedSlots[0] as any).id || 'Upcoming')
                  : String(nextMeeting.proposedSlots[0])
                : 'Upcoming',
          } : undefined,
          milestones: rawMilestones.map((m: any, idx: number) => ({
            id: m.id,
            number: idx + 1,
            title: m.title,
            amount: '$' + (((m.amountCents || m.amountMinor || 0) / 100).toLocaleString()),
            dueDate: m.deadline ? new Date(m.deadline).toLocaleDateString() : (m.dueDate ? new Date(m.dueDate).toLocaleDateString() : 'Scheduled'),
            status: m.state,
            statusColor: m.state === 'APPROVED' || m.state === 'CAPTURED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-blue-50 text-blue-700 border-blue-200',
          })),
        };
      })
      .filter(Boolean);

    res.json({
      success: true,
      count: mapped.length,
      data: mapped,
    });
  } catch (err) {
    console.error("Fetch workspace projects error:", err);
    res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : "Failed to fetch workspace projects",
    });
  }
});

/**
 * GET /api/workspace/projects/:projectId/timeline
 * Fetches the complete bilateral workspace state:
 * - Conversation messages & interactive cards
 * - ADR Decisions
 * - Scheduled & completed meetings
 * - Tasks Kanban board
 * - Active cryptographic agreement hash
 */
router.get("/projects/:projectId/timeline", async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;

    const sessionUser = (req as any).user;
    const reqUserId =
      (req.query.userId as string) ||
      (req.headers["x-user-id"] as string) ||
      sessionUser?.id ||
      sessionUser?.email;
    const reqUserEmail = sessionUser?.email || (req.headers["x-user-email"] as string);

    // Verify whether this project has an accepted proposal or agreement
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        client: { select: { id: true, name: true, email: true } },
        agreement: {
          include: {
            freelancer: { select: { id: true, name: true, email: true } },
          },
        },
        projectProposals: {
          where: { status: "ACCEPTED" },
          include: {
            freelancer: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "Project not found",
          details: { projectId },
        },
      });
    }

    // Strict bilateral workspace participant enforcement
    if (reqUserId) {
      const participant = checkProjectParticipant(project, reqUserId, reqUserEmail);
      if (!participant.isAuthorized) {
        return res.status(403).json({
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "Access denied. Only the client and assigned freelancer of this project can access this workspace.",
            details: { projectId, userId: reqUserId },
          },
        });
      }
    }

    const hasAcceptedProposalOrAgreement =
      Boolean(project.agreement) || project.projectProposals.length > 0;

    const existingConv = await prisma.workspaceConversation.findUnique({
      where: { projectId },
      include: {
        messages: {
          select: { id: true, senderRole: true },
          take: 5,
        },
      },
    });

    const hasClientInitiated = (existingConv?.messages || []).some(
      (m) => m.senderRole === "CLIENT"
    );

    const isClientRequester =
      req.headers["x-user-id"] === project.clientId ||
      (req as any).user?.id === project.clientId ||
      (req as any).user?.role === "CLIENT";

    const isUnlocked =
      hasAcceptedProposalOrAgreement ||
      isClientRequester ||
      hasClientInitiated;

    if (!isUnlocked) {
      return res.status(403).json({
        success: false,
        error: {
          code: "FORBIDDEN",
          message: "Workspace connection and chat unlock once the client starts a discussion or accepts your proposal.",
          details: { projectId },
        },
      });
    }

    const conversation = await workspaceService.getOrCreateWorkspaceConversation(projectId);
    res.json({
      success: true,
      data: conversation,
    });
  } catch (err) {
    console.error("Fetch workspace timeline error:", err);
    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: err instanceof Error ? err.message : "Failed to fetch workspace timeline",
        details: null,
      },
    });
  }
});

/**
 * POST /api/workspace/projects/:projectId/messages
 * Sends a message through Tier 1 Bot triage, computes SHA-256 seal, and broadcasts.
 */
router.post("/projects/:projectId/messages", async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { senderId, senderRole, content, type, origin, metadata } = req.body;

    if (!senderId || !content) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "senderId and content are required",
          details: null,
        },
      });
    }

    const sessionUser = (req as any).user;
    const effectiveSenderId =
      senderId ||
      (req.headers["x-user-id"] as string) ||
      sessionUser?.id ||
      sessionUser?.email;
    const senderEmail = sessionUser?.email || (req.headers["x-user-email"] as string);

    // Verify whether this project has an accepted proposal or active agreement
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        client: { select: { id: true, name: true, email: true } },
        agreement: {
          include: {
            freelancer: { select: { id: true, name: true, email: true } },
          },
        },
        projectProposals: {
          where: { status: "ACCEPTED" },
          include: {
            freelancer: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "Project not found",
          details: { projectId },
        },
      });
    }

    // Strict bilateral workspace participant enforcement
    const participant = checkProjectParticipant(project, effectiveSenderId, senderEmail);
    if (!participant.isAuthorized) {
      return res.status(403).json({
        success: false,
        error: {
          code: "FORBIDDEN",
          message: "Only the project client and assigned freelancer are authorized to send messages in this workspace.",
          details: { projectId, senderId: effectiveSenderId },
        },
      });
    }

    const result = await workspaceService.sendMessage({
      projectId,
      senderId: effectiveSenderId,
      senderRole: participant.effectiveRole,
      content,
      type,
      origin: origin || "WEB",
      metadata,
    });

    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (err) {
    console.error("Send workspace message error:", err);
    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: err instanceof Error ? err.message : "Failed to send message",
        details: null,
      },
    });
  }
});

/**
 * POST /api/workspace/projects/:projectId/files
 * Uploads a file, saves to persistent storage, creates File + ProjectFile records,
 * and posts a file_card message into the workspace timeline.
 */
router.post(
  "/projects/:projectId/files",
  upload.single("file"),
  async (req: Request, res: Response) => {
    try {
      const { projectId } = req.params;
      const file = req.file;

      if (!file || !file.buffer) {
        return res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "A file must be uploaded",
            details: null,
          },
        });
      }

      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
          client: { select: { id: true, name: true, email: true } },
          agreement: {
            include: {
              freelancer: { select: { id: true, name: true, email: true } },
            },
          },
          projectProposals: {
            where: { status: "ACCEPTED" },
            include: {
              freelancer: { select: { id: true, name: true, email: true } },
            },
          },
        },
      });

      if (!project) {
        return res.status(404).json({
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "Project not found",
            details: { projectId },
          },
        });
      }

      const sessionUser = (req as any).user;
      const requestedSenderId = (req.body.senderId as string) || (req.headers["x-user-id"] as string) || sessionUser?.id;
      const uploaderEmail = sessionUser?.email || (req.headers["x-user-email"] as string);

      // Strict bilateral workspace participant enforcement
      const participant = checkProjectParticipant(project, requestedSenderId, uploaderEmail);
      if (!participant.isAuthorized) {
        return res.status(403).json({
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "Only the project client and assigned freelancer are authorized to upload files in this workspace.",
            details: { projectId, uploaderId: requestedSenderId },
          },
        });
      }

      const requestedRole = participant.effectiveRole;
      const note = (req.body.note as string) || "";

      let uploaderId = participant.effectiveUserId;
      let validUser = uploaderId ? await prisma.user.findUnique({ where: { id: uploaderId } }) : null;
      if (!validUser) {
        uploaderId = participant.isClient ? project.clientId : (project.agreement?.freelancerId || project.clientId);
      }

      const sha256 = crypto.createHash("sha256").update(file.buffer).digest("hex");
      const ext = path.extname(file.originalname).toLowerCase();
      const safeKey = `uploads/projects/${projectId}/${Date.now()}-${crypto.randomUUID()}${ext}`;

      // Persist to storage adapter
      await defaultStorage.save(safeKey, file.buffer);

      // Create File record
      const fileRecord = await prisma.file.create({
        data: {
          ownerId: uploaderId,
          purpose: FilePurpose.PROJECT_FILE,
          storageKey: safeKey,
          originalName: file.originalname,
          mime: file.mimetype || "application/octet-stream",
          sizeBytes: file.size,
          sha256,
        },
      });

      // Create ProjectFile record in the project's files vault
      const projectFile = await prisma.projectFile.create({
        data: {
          projectId,
          fileId: fileRecord.id,
          uploadedBy: uploaderId,
          category: ProjectFileCategory.ATTACHMENT,
          name: file.originalname,
          note: note || null,
        },
      });

      // Extract text content if text, md, json, csv, etc.
      let docText = "";
      const isTextDoc =
        file.mimetype.startsWith("text/") ||
        Boolean(file.originalname.match(/\.(md|txt|json|csv|yaml|yml|ts|js|jsx|tsx|html|py|sql)$/i));
      if (isTextDoc && file.buffer) {
        docText = file.buffer.toString("utf-8");
      }

      // Generate AI document summary & key targets
      let docSummary: { summary: string; keyTargets: string[] } | null = null;
      try {
        if (docText || file.mimetype === "application/pdf" || file.originalname.endsWith(".pdf")) {
          docSummary = await geminiService.summarizeDocument(docText || file.originalname, file.originalname);
        }
      } catch (err) {
        console.warn("[Workspace] AI document summarization failed:", err);
      }

      // Send a file_card into the workspace timeline
      const senderDisplayName = requestedRole === "FREELANCER" ? "You (Freelancer)" : (project.client?.name || "Client");
      const sendResult = await workspaceService.sendMessage({
        projectId,
        senderId: uploaderId,
        senderRole: requestedRole as any,
        content: note ? `Shared file: ${file.originalname} — "${note}"` : `Shared file: ${file.originalname}`,
        type: "file_card",
        origin: "WEB",
        metadata: {
          fileId: fileRecord.id,
          projectFileId: projectFile.id,
          fileName: file.originalname,
          fileSize: `${Math.round(file.size / 1024)} KB`,
          sizeBytes: file.size,
          mime: file.mimetype || "application/octet-stream",
          downloadUrl: `/api/files/${fileRecord.id}?download=1`,
          streamUrl: `/api/files/${fileRecord.id}`,
          sha256Seal: sha256,
          note: note || undefined,
          senderDisplayName,
          aiSummary: docSummary?.summary || undefined,
          keyTargets: docSummary?.keyTargets || undefined,
        },
      });

      res.status(201).json({
        success: true,
        data: {
          file: {
            id: projectFile.id,
            fileId: fileRecord.id,
            name: file.originalname,
            size: `${Math.round(file.size / 1024)} KB`,
            sizeBytes: file.size,
            date: new Date().toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" }),
            type: file.originalname.endsWith(".md")
              ? "MD"
              : file.originalname.endsWith(".pdf")
              ? "PDF"
              : file.mimetype.includes("image")
              ? "IMG"
              : "DOC",
            downloadUrl: `/api/files/${fileRecord.id}?download=1`,
            sha256,
          },
          message: sendResult.message,
          botInsights: sendResult.botInsights,
        },
      });
    } catch (err) {
      console.error("Project file upload error:", err);
      res.status(500).json({
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: err instanceof Error ? err.message : "Failed to upload file",
          details: null,
        },
      });
    }
  }
);

/**
 * POST /api/workspace/projects/:projectId/amendments/propose
 * Proposes a formal scope amendment (Existing milestone delta or new milestone).
 */
router.post("/projects/:projectId/amendments/propose", async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const {
      proposerId,
      amendmentType,
      milestoneId,
      newMilestoneTitle,
      priceDeltaCents,
      timelineDaysDelta,
      newAcceptanceCriteria,
      justification,
    } = req.body;

    if (!proposerId || !justification) {
      return res.status(400).json({
        success: false,
        error: "proposerId and justification are required",
      });
    }

    const card = await workspaceService.proposeScopeAmendment({
      projectId,
      proposerId,
      amendmentType: amendmentType || "AMEND_EXISTING_MILESTONE",
      milestoneId,
      newMilestoneTitle,
      priceDeltaCents: Number(priceDeltaCents || 0),
      timelineDaysDelta: Number(timelineDaysDelta || 0),
      newAcceptanceCriteria: newAcceptanceCriteria || [],
      justification,
    });

    res.status(201).json({
      success: true,
      data: card,
    });
  } catch (err) {
    console.error("Propose scope amendment error:", err);
    res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : "Failed to propose amendment",
    });
  }
});

/**
 * POST /api/workspace/projects/:projectId/amendments/:messageId/respond
 * Accepts or declines a pending scope amendment with cryptographic consensus.
 */
router.post("/projects/:projectId/amendments/:messageId/respond", async (req: Request, res: Response) => {
  try {
    const { projectId, messageId } = req.params;
    const { responderId, action } = req.body;

    if (!responderId || !["ACCEPT", "DECLINE"].includes(action)) {
      return res.status(400).json({
        success: false,
        error: "responderId and action ('ACCEPT' | 'DECLINE') are required",
      });
    }

    const result = await workspaceService.respondToScopeAmendment(projectId, messageId, responderId, action);
    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    console.error("Respond to scope amendment error:", err);
    res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : "Failed to respond to amendment",
    });
  }
});

/**
 * POST /api/workspace/projects/:projectId/deliverables/submit
 * Submits deliverable links and starts the 72-hour inspection clock.
 */
router.post("/projects/:projectId/deliverables/submit", async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { milestoneId, freelancerId, repoUrl, previewUrl, notes } = req.body;

    if (!milestoneId || !freelancerId || !repoUrl) {
      return res.status(400).json({
        success: false,
        error: "milestoneId, freelancerId, and repoUrl are required",
      });
    }

    const result = await workspaceService.submitDeliverable({
      projectId,
      milestoneId,
      freelancerId,
      repoUrl,
      previewUrl,
      notes: notes || "Milestone deliverable submitted for review.",
    });

    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (err) {
    console.error("Submit deliverable error:", err);
    res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : "Failed to submit deliverable",
    });
  }
});

/**
 * POST /api/workspace/projects/:projectId/meetings/propose
 * Proposes a meeting with bilateral time consensus (Section 7.1).
 */
router.post("/projects/:projectId/meetings/propose", async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const proposedByUserId =
      req.body.proposedByUserId ||
      (req.headers["x-user-id"] as string) ||
      (req as any).user?.id;
    const { title, agenda, durationMinutes, proposedSlots } = req.body;

    if (!proposedByUserId || !title || !proposedSlots || !proposedSlots.length) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "proposedByUserId, title, and at least 1 proposedSlot are required",
          details: null,
        },
      });
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        client: { select: { id: true, name: true, email: true } },
        agreement: {
          include: {
            freelancer: { select: { id: true, name: true, email: true } },
          },
        },
        projectProposals: {
          where: { status: "ACCEPTED" },
          include: {
            freelancer: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "Project not found",
          details: { projectId },
        },
      });
    }

    const participant = checkProjectParticipant(project, proposedByUserId);
    if (!participant.isAuthorized) {
      return res.status(403).json({
        success: false,
        error: {
          code: "FORBIDDEN",
          message: "Only the project client and assigned freelancer are authorized to propose meetings.",
          details: { projectId, proposedByUserId },
        },
      });
    }

    const meeting = await workspaceService.proposeMeeting({
      projectId,
      proposedByUserId,
      title,
      agenda: agenda || "Sync meeting on active milestone deliverables",
      durationMinutes: Number(durationMinutes || 30),
      proposedSlots,
    });

    res.status(201).json({
      success: true,
      data: meeting,
    });
  } catch (err) {
    console.error("Propose meeting error:", err);
    res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : "Failed to propose meeting",
    });
  }
});

/**
 * POST /api/workspace/projects/:projectId/meetings/:meetingId/respond
 * Confirms or counters proposed meeting time slot; provisions internal room & Google Calendar link.
 */
router.post("/projects/:projectId/meetings/:meetingId/respond", async (req: Request, res: Response) => {
  try {
    const { meetingId } = req.params;
    const responderId =
      req.body.responderId ||
      (req.headers["x-user-id"] as string) ||
      (req as any).user?.id;
    const { action, selectedSlotTime } = req.body;

    if (!responderId || !["CONFIRM", "DECLINE"].includes(action)) {
      return res.status(400).json({
        success: false,
        error: "responderId and action ('CONFIRM' | 'DECLINE') are required",
      });
    }

    const result = await workspaceService.respondToMeeting(meetingId, responderId, action, selectedSlotTime);
    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    console.error("Respond to meeting error:", err);
    res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : "Failed to respond to meeting",
    });
  }
});

/**
 * POST /api/workspace/projects/:projectId/meetings/:meetingId/notetaker/synthesize
 * Multilingual AI Notetaker post-call synthesis (Groq Whisper v3 + Gemini).
 * Auto-creates Kanban tasks, ADR decisions, and drops summary into timeline.
 */
router.post("/projects/:projectId/meetings/:meetingId/notetaker/synthesize", async (req: Request, res: Response) => {
  try {
    const { meetingId } = req.params;
    let { executiveSummary, actionItems, decisions, transcriptSegments, verbalScopeAlert, transcript } = req.body;

    // If raw transcript is provided, synthesize via Groq LLaMA 3.3 70B
    if ((!executiveSummary || !actionItems || actionItems.length === 0) && transcript) {
      try {
        const aiSynthesis = await groqService.synthesizeMeeting({ transcript });
        executiveSummary = executiveSummary || aiSynthesis.executiveSummary;
        actionItems = actionItems && actionItems.length > 0 ? actionItems : aiSynthesis.actionItems;
        decisions = decisions && decisions.length > 0 ? decisions : aiSynthesis.decisions;
        verbalScopeAlert = verbalScopeAlert || aiSynthesis.verbalScopeAlert;
      } catch (err) {
        console.warn("[WorkspaceRouter] Groq synthesis fallback:", err);
      }
    }

    if (!executiveSummary) {
      return res.status(400).json({
        success: false,
        error: "executiveSummary or transcript is required",
      });
    }

    const updated = await workspaceService.saveMeetingNotetakerSummary({
      meetingId,
      executiveSummary,
      actionItems: actionItems || [],
      decisions: decisions || [],
      transcriptSegments: transcriptSegments || [],
      verbalScopeAlert,
    });

    res.json({
      success: true,
      data: updated,
    });
  } catch (err) {
    console.error("Meeting notetaker synthesis error:", err);
    res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : "Failed to synthesize meeting notes",
    });
  }
});

/**
 * POST /api/workspace/projects/:projectId/tasks
 * Create a new Kanban task (Subtab 4).
 */
router.post("/projects/:projectId/tasks", async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { title, description, status, priority, assignedToId, dueDate } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "title is required",
          details: null,
        },
      });
    }

    const sessionUser = (req as any).user;
    const creatorId = (req.body.creatorId as string) || (req.headers["x-user-id"] as string) || sessionUser?.id;

    if (creatorId) {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
          client: { select: { id: true, name: true, email: true } },
          agreement: {
            include: {
              freelancer: { select: { id: true, name: true, email: true } },
            },
          },
          projectProposals: {
            where: { status: "ACCEPTED" },
            include: {
              freelancer: { select: { id: true, name: true, email: true } },
            },
          },
        },
      });

      if (!project) {
        return res.status(404).json({
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "Project not found",
            details: { projectId },
          },
        });
      }

      const participant = checkProjectParticipant(project, creatorId);
      if (!participant.isAuthorized) {
        return res.status(403).json({
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "Only the project client and assigned freelancer are authorized to create tasks.",
            details: { projectId, creatorId },
          },
        });
      }
    }

    const task = await workspaceService.createTask({
      projectId,
      title,
      description,
      status,
      priority,
      assignedToId,
      dueDate,
    });

    res.status(201).json({
      success: true,
      data: task,
    });
  } catch (err) {
    console.error("Create task error:", err);
    res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : "Failed to create task",
    });
  }
});

/**
 * PATCH /api/workspace/tasks/:taskId/status
 * Update Kanban task column status (Subtab 4).
 */
router.patch("/tasks/:taskId/status", async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        error: "status is required",
      });
    }

    const task = await workspaceService.updateTaskStatus(taskId, status);
    res.json({
      success: true,
      data: task,
    });
  } catch (err) {
    console.error("Update task status error:", err);
    res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : "Failed to update task status",
    });
  }
});


// ---------------------------------------------------------------------------
// Bilateral Postponement Engine (Meetings & Milestones)
// ---------------------------------------------------------------------------

const postponeMeetingSchema = z.object({
  userId: z.string().min(1, "userId is required"),
  userRole: z.enum(["CLIENT", "FREELANCER", "OPERATOR"]).optional(),
  reasonCategory: z.enum([
    "SUDDEN_EMERGENCY",
    "CLIENT_CONFLICT",
    "HEALTH_EMERGENCY",
    "SCHEDULE_ADJUSTMENT",
    "PREPARATION_DELAY",
    "OTHER"
  ]),
  reasonDetails: z.string().min(1, "reasonDetails is required"),
  newSlots: z.array(z.any()).min(1, "At least one new proposed slot is required"),
});

const respondMeetingPostponeSchema = z.object({
  responderId: z.string().min(1, "responderId is required"),
  responderRole: z.enum(["CLIENT", "FREELANCER", "OPERATOR"]).optional(),
  action: z.enum(["ACCEPT", "DECLINE"]),
  acceptedSlot: z.string().optional(),
});

const postponeMilestoneSchema = z.object({
  requestedById: z.string().min(1, "requestedById is required"),
  requestedByRole: z.enum(["CLIENT", "FREELANCER"]),
  proposedDueDate: z.string().min(1, "proposedDueDate is required"),
  reasonCategory: z.enum([
    "SUDDEN_EMERGENCY",
    "TECHNICAL_BLOCKER",
    "CLIENT_DEPENDENCY",
    "SCOPE_EXPANSION",
    "PERSONAL_LEAVE",
    "OTHER"
  ]),
  reasonDetails: z.string().min(1, "reasonDetails is required"),
});

const respondMilestonePostponeSchema = z.object({
  responderId: z.string().min(1, "responderId is required"),
  responderRole: z.enum(["CLIENT", "FREELANCER"]),
  action: z.enum(["ACCEPT", "DECLINE"]),
  declineReason: z.string().optional(),
});

/**
 * POST /api/workspace/projects/:projectId/meetings/:meetingId/postpone
 * Request meeting postponement / reschedule with structured/sudden reason & new proposed slots
 */
router.post("/projects/:projectId/meetings/:meetingId/postpone", async (req: Request, res: Response) => {
  try {
    const { meetingId } = req.params;
    const parsed = postponeMeetingSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid postponement parameters",
          details: parsed.error.issues,
        },
      });
    }

    const result = await workspaceService.postponeMeeting({
      meetingId,
      ...parsed.data,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (err: any) {
    console.error("Meeting postpone error:", err);
    res.status(500).json({
      error: {
        code: "MEETING_POSTPONE_ERROR",
        message: err.message || "Failed to postpone meeting",
      },
    });
  }
});

/**
 * POST /api/workspace/projects/:projectId/meetings/:meetingId/respond-postpone
 * Bilaterally accept or decline meeting postponement proposal
 */
router.post("/projects/:projectId/meetings/:meetingId/respond-postpone", async (req: Request, res: Response) => {
  try {
    const { meetingId } = req.params;
    const parsed = respondMeetingPostponeSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid response parameters",
          details: parsed.error.issues,
        },
      });
    }

    const result = await workspaceService.respondToMeetingPostpone({
      meetingId,
      ...parsed.data,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (err: any) {
    console.error("Respond to meeting postpone error:", err);
    res.status(500).json({
      error: {
        code: "RESPOND_MEETING_POSTPONE_ERROR",
        message: err.message || "Failed to respond to meeting postponement",
      },
    });
  }
});

/**
 * POST /api/workspace/projects/:projectId/milestones/:milestoneId/postpone
 * Formally request milestone deadline postponement with structured reasons
 */
router.post("/projects/:projectId/milestones/:milestoneId/postpone", async (req: Request, res: Response) => {
  try {
    const { projectId, milestoneId } = req.params;
    const parsed = postponeMilestoneSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid milestone postponement parameters",
          details: parsed.error.issues,
        },
      });
    }

    const postponement = await workspaceService.requestMilestonePostponement({
      projectId,
      milestoneId,
      ...parsed.data,
    });

    res.status(201).json({
      success: true,
      data: postponement,
    });
  } catch (err: any) {
    console.error("Milestone postpone error:", err);
    res.status(500).json({
      error: {
        code: "MILESTONE_POSTPONE_ERROR",
        message: err.message || "Failed to request milestone postponement",
      },
    });
  }
});

/**
 * POST /api/workspace/projects/:projectId/milestones/postponements/:postponementId/respond
 * Bilateral consensus response (Accept or Decline) for milestone postponement
 */
router.post("/projects/:projectId/milestones/postponements/:postponementId/respond", async (req: Request, res: Response) => {
  try {
    const { postponementId } = req.params;
    const parsed = respondMilestonePostponeSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid response parameters",
          details: parsed.error.issues,
        },
      });
    }

    const result = await workspaceService.respondToMilestonePostponement({
      postponementId,
      ...parsed.data,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (err: any) {
    console.error("Respond to milestone postpone error:", err);
    res.status(500).json({
      error: {
        code: "RESPOND_MILESTONE_POSTPONE_ERROR",
        message: err.message || "Failed to respond to milestone postponement",
      },
    });
  }
});

/**
 * GET /api/workspace/projects/:projectId/milestones/postponements
 * List milestone postponement requests and consensus history
 */
router.get("/projects/:projectId/milestones/postponements", async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const postponements = await workspaceService.getProjectMilestonePostponements(projectId);
    res.json({
      success: true,
      data: postponements,
    });
  } catch (err: any) {
    console.error("Fetch milestone postponements error:", err);
    res.status(500).json({
      error: {
        code: "FETCH_POSTPONEMENTS_ERROR",
        message: err.message || "Failed to fetch milestone postponements",
      },
    });
  }
});

export default router;

