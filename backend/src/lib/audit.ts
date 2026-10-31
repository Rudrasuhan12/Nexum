import { prisma } from "../prisma.js";

export interface AuditEventParams {
  actorId?: string | null;
  action: string;
  objectType: string;
  objectId: string;
  versionHash?: string | null;
  previousStatus?: string | null;
  newStatus?: string | null;
  metadata?: Record<string, unknown> | null;
}

/**
 * Append-only audit logger.
 * Enforces requirement that every state transition records immutable audit evidence.
 */
export async function appendAuditEvent(params: AuditEventParams) {
  return await prisma.auditEvent.create({
    data: {
      actorId: params.actorId || null,
      action: params.action,
      objectType: params.objectType,
      objectId: params.objectId,
      versionHash: params.versionHash || null,
      metadata: {
        ...(params.metadata || {}),
        previousStatus: params.previousStatus || null,
        newStatus: params.newStatus || null,
      },
    },
  });
}

