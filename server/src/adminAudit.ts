import type { FastifyRequest } from "fastify";
import { prisma } from "./db";

export type AdminAuditStatus = "success" | "failed";

export interface WriteAdminAuditParams {
  req?: FastifyRequest;
  adminLogin?: string;
  action: string;
  status: AdminAuditStatus;
  targetCharacterId?: string | null;
  targetCharacterName?: string | null;
  message?: string;
  before?: unknown;
  after?: unknown;
  metadata?: Record<string, unknown>;
}

function normalizeJson(value: unknown): unknown {
  if (value === undefined) return undefined;
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return String(value);
  }
}

export async function writeAdminAuditLog(params: WriteAdminAuditParams): Promise<void> {
  const req = params.req;
  const metadata = {
    requestId: req?.id,
    ip: (req as any)?.ip,
    method: req?.method,
    url: req?.url,
    ...(params.metadata || {}),
  };

  await prisma.adminActionLog.create({
    data: {
      adminLogin: params.adminLogin || String((req as any)?.admin?.login || "unknown"),
      action: params.action,
      status: params.status,
      targetCharacterId: params.targetCharacterId || null,
      targetCharacterName: params.targetCharacterName || null,
      message: params.message || null,
      before: normalizeJson(params.before) as any,
      after: normalizeJson(params.after) as any,
      metadata: normalizeJson(metadata) as any,
    },
  });
}

