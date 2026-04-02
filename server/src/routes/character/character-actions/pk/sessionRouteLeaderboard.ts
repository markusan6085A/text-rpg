import type { FastifyInstance } from "fastify";
import { prisma } from "../../../../db";
import { ensureArenaLeaderboardTable } from "./results";
export function registerArenaLeaderboardRoute(app: FastifyInstance): void {
  app.get("/arena/leaderboard", async (_req, reply) => {
    await ensureArenaLeaderboardTable();
    try {
      const rows = await prisma.$queryRawUnsafe<
        Array<{ characterId: string; wins: number; losses: number; name: string | null; level: number | null }>
      >(
        `SELECT l."characterId", l."wins", l."losses", c."name", c."level"
         FROM "ArenaLeaderboard" l
         LEFT JOIN "Character" c ON c."id" = l."characterId"
         ORDER BY l."wins" DESC, l."losses" ASC, l."updatedAt" ASC
         LIMIT 10`
      );
      return reply.send({ ok: true, top: rows });
    } catch {
      return reply.send({ ok: true, top: [] });
    }
  });
}
