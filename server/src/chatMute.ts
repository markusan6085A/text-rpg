import { prisma } from "./db";

const mutedUntil = new Map<string, number>();
let muteStoreInit: Promise<void> | null = null;

async function ensureMuteStore(): Promise<void> {
  if (muteStoreInit) return muteStoreInit;
  muteStoreInit = (async () => {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "ChatMuteStore" (
        "characterId" TEXT PRIMARY KEY,
        "untilMs" BIGINT NOT NULL
      )
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "ChatMuteStore_untilMs_idx"
      ON "ChatMuteStore" ("untilMs")
    `);
  })();
  return muteStoreInit;
}

export async function getMutedUntil(characterId: string): Promise<number | null> {
  await ensureMuteStore();
  const now = Date.now();
  const cached = mutedUntil.get(characterId);
  if (cached != null) {
    if (cached > now) return cached;
    mutedUntil.delete(characterId);
  }

  const rows = await prisma.$queryRawUnsafe<Array<{ untilMs: bigint | number | string }>>(
    `SELECT "untilMs" FROM "ChatMuteStore" WHERE "characterId" = $1 LIMIT 1`,
    characterId
  );
  if (!rows[0]) return null;
  const until = Number(rows[0].untilMs);
  if (!Number.isFinite(until) || until <= now) {
    await prisma.$executeRawUnsafe(`DELETE FROM "ChatMuteStore" WHERE "characterId" = $1`, characterId);
    return null;
  }
  mutedUntil.set(characterId, until);
  return until;
}

export async function setMuted(characterId: string, durationMinutes: number): Promise<void> {
  await ensureMuteStore();
  const until = Date.now() + durationMinutes * 60 * 1000;
  mutedUntil.set(characterId, until);
  await prisma.$executeRawUnsafe(
    `
      INSERT INTO "ChatMuteStore" ("characterId", "untilMs")
      VALUES ($1, $2)
      ON CONFLICT ("characterId")
      DO UPDATE SET "untilMs" = EXCLUDED."untilMs"
    `,
    characterId,
    until
  );
}
