import { Prisma } from "@prisma/client";
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
 * Accepts optional Prisma TransactionClient for atomic commits within transactions.
 */
export async function appendAuditEvent(
  params: AuditEventParams,
  tx?: Prisma.TransactionClient
) {
  const client = tx || prisma;
  return await client.auditEvent.create({
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
