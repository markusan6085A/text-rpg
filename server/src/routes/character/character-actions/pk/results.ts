import { prisma } from "../../../../db";
import { addVersioning } from "../../../../heroJsonValidator";
import type { PkSession } from "./types";
import { isArenaSession } from "./types";
import { getEffectivePkNickColor } from "./helpers";

let arenaLbInit: Promise<void> | null = null;

export async function ensureArenaLeaderboardTable(): Promise<void> {
  if (arenaLbInit) return arenaLbInit;
  arenaLbInit = (async () => {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "ArenaLeaderboard" (
        "characterId" TEXT PRIMARY KEY,
        "wins" INTEGER NOT NULL DEFAULT 0,
        "losses" INTEGER NOT NULL DEFAULT 0,
        "updatedAt" BIGINT NOT NULL
      )
    `);
  })();
  return arenaLbInit;
}

export async function saveArenaResultIfNeeded(session: PkSession) {
  if (!session.ended || !session.winnerId || session.saved || !isArenaSession(session)) return;
  const loserId = session.winnerId === session.attackerId ? session.defenderId : session.attackerId;
  const loserFighter = session.winnerId === session.attackerId ? session.defender : session.attacker;

  await ensureArenaLeaderboardTable();
  const now = Date.now();

  await prisma.$transaction(async (tx) => {
    const ids = [session.winnerId as string, loserId].sort();
    await tx.$queryRawUnsafe(`SELECT id FROM "Character" WHERE id IN ($1, $2) FOR UPDATE`, ids[0], ids[1]);

    const chars = await tx.character.findMany({
      where: { id: { in: [session.winnerId as string, loserId] } },
      select: { id: true, heroJson: true, name: true },
    });
    if (chars.length !== 2) return;

    for (const c of chars) {
      const heroJson = ((c.heroJson as any) || {}) as any;
      const isWin = c.id === session.winnerId;
      const aw = Number(heroJson.arenaWins ?? 0);
      const al = Number(heroJson.arenaLosses ?? 0);
      let next: any = {
        ...heroJson,
        arenaWins: isWin ? aw + 1 : aw,
        arenaLosses: isWin ? al : al + 1,
        pkIncoming: null,
        pkSyncUntil: 0,
        arenaSyncUntil: 0,
      };
      if (!isWin) {
        next.hp = Math.max(1, loserFighter.maxHp);
        next.mp = Math.max(0, loserFighter.maxMp);
        next.cp = Math.max(0, Number(heroJson.maxCp ?? heroJson.cp ?? 0));
        next.isDead = false;
        next.deadAt = 0;
        next.heroBuffs = [];
      }
      const versioned = addVersioning(next, Number(heroJson.heroRevision ?? 0) || 0);
      await tx.character.update({
        where: { id: c.id },
        data: { heroJson: versioned, lastActivityAt: new Date() },
      });
    }

    await tx.$executeRawUnsafe(
      `INSERT INTO "ArenaLeaderboard" ("characterId", "wins", "losses", "updatedAt") VALUES ($1, 1, 0, $2)
       ON CONFLICT ("characterId") DO UPDATE SET
         "wins" = "ArenaLeaderboard"."wins" + 1,
         "updatedAt" = EXCLUDED."updatedAt"`,
      session.winnerId,
      now
    );
    await tx.$executeRawUnsafe(
      `INSERT INTO "ArenaLeaderboard" ("characterId", "wins", "losses", "updatedAt") VALUES ($1, 0, 1, $2)
       ON CONFLICT ("characterId") DO UPDATE SET
         "losses" = "ArenaLeaderboard"."losses" + 1,
         "updatedAt" = EXCLUDED."updatedAt"`,
      loserId,
      now
    );
  });

  session.saved = true;
}

export async function savePkResultIfNeeded(session: PkSession) {
  if (!session.ended || !session.winnerId || session.saved) return;
  if (isArenaSession(session)) {
    await saveArenaResultIfNeeded(session);
    return;
  }
  const loserId = session.winnerId === session.attackerId ? session.defenderId : session.attackerId;

  await prisma.$transaction(async (tx) => {
    const ids = [session.winnerId as string, loserId].sort();
    await tx.$queryRawUnsafe(`SELECT id FROM "Character" WHERE id IN ($1, $2) FOR UPDATE`, ids[0], ids[1]);

    const chars = await tx.character.findMany({
      where: { id: { in: [session.winnerId as string, loserId] } },
      select: { id: true, heroJson: true },
    });
    if (chars.length !== 2) return;

    const patchPvp = (heroJson: any, isWin: boolean) => {
      const wins = Number(heroJson?.pvpWins ?? heroJson?.pvp_wins ?? 0);
      const losses = Number(heroJson?.pvpLosses ?? heroJson?.pvp_losses ?? 0);
      const nextWins = isWin ? wins + 1 : wins;
      const nextLosses = isWin ? losses : losses + 1;
      return {
        ...heroJson,
        pvpWins: nextWins,
        pvpLosses: nextLosses,
        pvp_wins: nextWins,
        pvp_losses: nextLosses,
      };
    };

    const winnerChar = chars.find((c) => c.id === session.winnerId);
    const winnerHeroJson = ((winnerChar?.heroJson as any) || {}) as any;
    const winnerNickColor =
      getEffectivePkNickColor(winnerHeroJson) || String(winnerHeroJson?.nickColor ?? "").trim() || undefined;
    const deathLog = Array.isArray(session.log) ? session.log.slice(0, 12) : [];

    for (const c of chars) {
      const heroJson = ((c.heroJson as any) || {}) as any;
      const patched = patchPvp(heroJson, c.id === session.winnerId);
      const isWinner = c.id === session.winnerId;
      const winnerIsAttacker = session.winnerId === session.attackerId;
      const winnerHitBack = winnerIsAttacker ? Boolean(session.defenderHasHit) : Boolean(session.attackerHasHit);
      const now = Date.now();
      const withPkColor = isWinner
        ? !winnerHitBack
          ? {
              ...patched,
              pkForcedNickColor: "#800000",
              pkForcedNickColorUntil: now + 10 * 60 * 1000,
              pkIncoming: null,
              pkSyncUntil: 0,
            }
          : {
              ...patched,
              pkIncoming: null,
              pkSyncUntil: 0,
            }
        : {
            ...patched,
            hp: Math.max(
              1,
              Number(
                (session.winnerId === session.attackerId ? session.defender.maxHp : session.attacker.maxHp) ||
                  heroJson.maxHp ||
                  1
              )
            ),
            mp: Math.max(
              0,
              Number(
                (session.winnerId === session.attackerId ? session.defender.maxMp : session.attacker.maxMp) ||
                  heroJson.maxMp ||
                  0
              )
            ),
            cp: Math.max(0, Number(heroJson.maxCp ?? heroJson.cp ?? 0)),
            isDead: false,
            deadAt: 0,
            pkIncoming: null,
            pkSyncUntil: 0,
            pkDeathNotice: {
              killerId: session.winnerId,
              killerName: winnerChar?.id === session.attackerId ? session.attacker.name : session.defender.name,
              killerNickColor: winnerNickColor || null,
              lastDamage: Number(session.lastHitDamage ?? 0),
              log: deathLog,
              at: now,
              until: now + 20_000,
            },
          };
      const versioned = addVersioning(withPkColor, Number(heroJson.heroRevision ?? 0) || 0);
      await tx.character.update({
        where: { id: c.id },
        data: { heroJson: versioned, lastActivityAt: new Date() },
      });
    }
  });

  session.saved = true;
}
