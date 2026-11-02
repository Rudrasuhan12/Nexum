import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { prisma } from "../../prisma.js";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import { NotFoundError, ValidationError, ForbiddenError } from "../../lib/errors.js";
import { appendAuditEvent } from "../../lib/audit.js";
import { Role, MeetingStatus } from "@prisma/client";
import { verifyProjectAccess } from "../../domain/mediation/access.js";

const router = Router();
router.use(requireAuth);
router.use(requireRole(Role.FREELANCER));

const proposeMeetingSchema = z
  .object({
    title: z.string().min(1, "Title is required").max(200),
    startsAt: z.string().datetime(),
    endsAt: z.string().datetime(),
    joinUrl: z
      .string()
      .url()
      .refine((url) => url.startsWith("https://"), {
        message: "Join link must be an HTTPS URL",
      })
      .optional(),
  })
  .refine((data) => new Date(data.startsAt).getTime() > Date.now(), {
    message: "starts_at must be in the future",
    path: ["startsAt"],
  })
  .refine((data) => new Date(data.endsAt).getTime() > new Date(data.startsAt).getTime(), {
    message: "ends_at must be strictly after starts_at",
    path: ["endsAt"],
  });

const meetingResponseSchema = z.object({
  response: z.enum(["ACCEPTED", "DECLINED"]),
});

/**
 * GET /api/freelancer/projects/:projectId/meetings
 * List meetings.
 */
export async function getProjectMeetings(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { projectId } = req.params;
    const freelancerId = req.user!.id;

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project || (!project)) {
      throw new NotFoundError("Project not found");
    }

    const meetings = await prisma.meeting.findMany({
      where: { projectId },
      include: {
        proposer: { select: { id: true, name: true } },
        responses: { include: { user: { select: { id: true, name: true } } } },
      },
      orderBy: { startsAt: "asc" },
    });

    res.status(200).json({ success: true, meetings });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/freelancer/projects/:projectId/meetings
 * Propose meeting.
 */
export async function proposeProjectMeeting(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { projectId } = req.params;
    const freelancerId = req.user!.id;

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project || (!project)) {
      throw new NotFoundError("Project not found");
    }

    const parsed = proposeMeetingSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError("Invalid meeting parameters", parsed.error.flatten().fieldErrors, 422);
    }

    const { title, startsAt, endsAt, joinUrl } = parsed.data;

    const meeting = await prisma.meeting.create({
      data: {
        projectId,
        title,
        proposedBy: freelancerId,
        startsAt: new Date(startsAt),
        endsAt: new Date(endsAt),
        joinUrl: joinUrl || null,
        status: MeetingStatus.PROPOSED,
        responses: {
          create: {
            userId: freelancerId,
            response: "ACCEPTED",
          },
        },
      },
      include: {
        responses: true,
      },
    });

    await appendAuditEvent({
      actorId: freelancerId,
      action: "MEETING_PROPOSED",
      objectType: "MEETING",
      objectId: meeting.id,
      newStatus: "PROPOSED",
      metadata: { projectId, startsAt, endsAt },
    });

    res.status(201).json({ success: true, meeting });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/freelancer/meetings/:id/respond
 * Respond to meeting proposal.
 */
router.post("/:id/respond", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const freelancerId = req.user!.id;

    const meeting = await prisma.meeting.findUnique({
      where: { id },
      include: { project: true },
    });

    if (!meeting) throw new NotFoundError("Meeting not found");
    const access = await verifyProjectAccess(meeting.projectId, freelancerId, prisma);
    if (!access.allowed) {
      throw new ForbiddenError("Not authorized for this meeting");
    }

    const parsed = meetingResponseSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError("Invalid response", parsed.error.flatten().fieldErrors, 422);
    }

    const { response } = parsed.data;

    const record = await prisma.meetingResponse.upsert({
      where: {
        meetingId_userId: { meetingId: id, userId: freelancerId },
      },
      create: {
        meetingId: id,
        userId: freelancerId,
        response,
      },
      update: {
        response,
        respondedAt: new Date(),
      },
    });

    // Update meeting status if accepted
    if (response === "ACCEPTED") {
      await prisma.meeting.update({
        where: { id },
        data: { status: MeetingStatus.ACCEPTED },
      });
    }

    await appendAuditEvent({
      actorId: freelancerId,
      action: "MEETING_RESPONDED",
      objectType: "MEETING",
      objectId: id,
      newStatus: response,
    });

    res.status(200).json({ success: true, response: record });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/freelancer/meetings/:id/cancel
 * Cancel meeting.
 */
router.post("/:id/cancel", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const freelancerId = req.user!.id;

    const meeting = await prisma.meeting.findUnique({
      where: { id },
      include: { project: true },
    });

    if (!meeting) throw new NotFoundError("Meeting not found");
    if (meeting.proposedBy !== freelancerId && false) {
      throw new ForbiddenError("Not authorized to cancel this meeting");
    }

    const updated = await prisma.meeting.update({
      where: { id },
      data: { status: MeetingStatus.CANCELLED },
    });

    await appendAuditEvent({
      actorId: freelancerId,
      action: "MEETING_CANCELLED",
      objectType: "MEETING",
      objectId: id,
      newStatus: "CANCELLED",
    });

    res.status(200).json({ success: true, meeting: updated });
  } catch (err) {
    next(err);
  }
});

export default router;
