import { prisma } from "../../../../db";
import type { PkSession } from "./types";

export const PK_SESSION_TTL_MS = 10 * 60 * 1000;
export const pkSessions = new Map<string, PkSession>();

let pkStoreInit: Promise<void> | null = null;

async function ensurePkStore(): Promise<void> {
  if (pkStoreInit) return pkStoreInit;
  pkStoreInit = (async () => {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "PkSessionStore" (
        "id" TEXT PRIMARY KEY,
        "payload" JSONB NOT NULL,
        "updatedAt" BIGINT NOT NULL,
        "expiresAt" BIGINT NOT NULL
      )
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "PkSessionStore_expiresAt_idx"
      ON "PkSessionStore" ("expiresAt")
    `);
  })();
  return pkStoreInit;
}

export async function cleanupPkSessionsDb(now = Date.now()): Promise<void> {
  await ensurePkStore();
  await prisma.$executeRawUnsafe(`DELETE FROM "PkSessionStore" WHERE "expiresAt" < $1`, now);
}

export async function savePkSessionToDb(session: PkSession): Promise<void> {
  await ensurePkStore();
  const updatedAt = session.updatedAt || Date.now();
  const expiresAt = updatedAt + PK_SESSION_TTL_MS;
  await prisma.$executeRawUnsafe(
    `
      INSERT INTO "PkSessionStore" ("id", "payload", "updatedAt", "expiresAt")
      VALUES ($1, $2::jsonb, $3, $4)
      ON CONFLICT ("id")
      DO UPDATE SET
        "payload" = EXCLUDED."payload",
        "updatedAt" = EXCLUDED."updatedAt",
        "expiresAt" = EXCLUDED."expiresAt"
    `,
    session.id,
    JSON.stringify(session),
    updatedAt,
    expiresAt
  );
}

export async function loadPkSessionFromDb(sessionId: string, now = Date.now()): Promise<PkSession | undefined> {
  await ensurePkStore();
  const rows = await prisma.$queryRawUnsafe<Array<{ payload: unknown }>>(
    `SELECT "payload" FROM "PkSessionStore" WHERE "id" = $1 AND "expiresAt" >= $2 LIMIT 1`,
    sessionId,
    now
  );
  if (!rows[0]?.payload) return undefined;
  try {
    const parsed = typeof rows[0].payload === "string" ? JSON.parse(rows[0].payload) : rows[0].payload;
    return parsed as PkSession;
  } catch {
    return undefined;
  }
}

export async function cleanupPkSessions(now = Date.now()) {
  for (const [id, s] of pkSessions.entries()) {
    if (now - s.updatedAt > PK_SESSION_TTL_MS) pkSessions.delete(id);
  }
  await cleanupPkSessionsDb(now);
}
