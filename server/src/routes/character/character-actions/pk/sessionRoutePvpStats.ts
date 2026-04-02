import type { FastifyInstance } from "fastify";
import { prisma } from "../../../../db";
import { ensureArenaLeaderboardTable } from "./results";
export function registerPvpStatsRoute(app: FastifyInstance): void {
  app.get("/pvp/stats", async (_req, reply) => {
    await ensureArenaLeaderboardTable();
    let arenaTop: Array<{ characterId: string; wins: number; losses: number; name: string | null; level: number | null }> = [];
    try {
      arenaTop = await prisma.$queryRawUnsafe(
        `SELECT l."characterId", l."wins", l."losses", c."name", c."level"
         FROM "ArenaLeaderboard" l
         LEFT JOIN "Character" c ON c."id" = l."characterId"
         ORDER BY l."wins" DESC, l."losses" ASC
         LIMIT 10`
      );
    } catch {
      arenaTop = [];
    }

    let pkTop: Array<{ characterId: string; name: string | null; level: number | null; wins: number; losses: number }> = [];
    try {
      pkTop = await prisma.$queryRawUnsafe(
        `SELECT c."id" as "characterId", c."name", c."level",
          COALESCE(NULLIF(trim(c."heroJson"->>'pvpWins'), '')::int, 0) as wins,
          COALESCE(NULLIF(trim(c."heroJson"->>'pvpLosses'), '')::int, 0) as losses
         FROM "Character" c
         WHERE COALESCE(NULLIF(trim(c."heroJson"->>'pvpWins'), '')::int, 0) > 0
            OR COALESCE(NULLIF(trim(c."heroJson"->>'pvpLosses'), '')::int, 0) > 0
         ORDER BY wins DESC, losses ASC
         LIMIT 10`
      );
    } catch {
      pkTop = [];
    }

    let arenaTotals = { fights: 0, accounts: 0 };
    try {
      const t = await prisma.$queryRawUnsafe<Array<{ fights: bigint; accounts: bigint }>>(
        `SELECT COALESCE(SUM("wins" + "losses"), 0)::bigint as fights, COUNT(*)::bigint as accounts FROM "ArenaLeaderboard"`
      );
      if (t[0]) {
        arenaTotals = { fights: Number(t[0].fights || 0), accounts: Number(t[0].accounts || 0) };
      }
    } catch {
      /* ignore */
    }

    return reply.send({ ok: true, arenaTop, pkTop, arenaTotals });
  });
}
