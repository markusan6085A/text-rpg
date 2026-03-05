import type { FastifyInstance } from "fastify";
import { prisma } from "./db";
import { getAuth } from "./routes/character/auth";

const TOP_LIMIT = 50;

export async function leaderboardRoutes(app: FastifyInstance) {
  // GET /leaderboard?type=level|sp|clan — топ гравців/кланів (публічний, авторизація не обов'язкова)
  app.get<{ Querystring: { type?: string; limit?: string } }>("/leaderboard", async (req, reply) => {
    const type = String((req.query as any)?.type ?? "level").toLowerCase().trim();
    const limit = Math.min(100, Math.max(1, Number((req.query as any)?.limit ?? TOP_LIMIT) || TOP_LIMIT));

    if (type === "clan") {
      const clans = await prisma.clan.findMany({
        orderBy: [{ level: "desc" }, { reputation: "desc" }, { name: "asc" }],
        take: limit,
        select: {
          id: true,
          name: true,
          level: true,
          reputation: true,
          emblem: true,
          _count: { select: { members: true } },
        },
      });
      return {
        ok: true,
        type: "clan",
        items: clans.map((c, i) => ({
          rank: i + 1,
          id: c.id,
          name: c.name,
          level: c.level,
          reputation: c.reputation,
          emblem: c.emblem,
          memberCount: c._count.members,
        })),
      };
    }

    if (type === "sp") {
      const chars = await prisma.character.findMany({
        orderBy: [{ sp: "desc" }, { level: "desc" }, { name: "asc" }],
        take: limit,
        select: {
          id: true,
          name: true,
          level: true,
          sp: true,
          nickColor: true,
          clanMember: { select: { clan: { select: { id: true, name: true } } } },
        },
      });
      return {
        ok: true,
        type: "sp",
        items: chars.map((c, i) => ({
          rank: i + 1,
          characterId: c.id,
          name: c.name,
          level: c.level,
          sp: c.sp,
          nickColor: c.nickColor,
          clanName: c.clanMember?.clan?.name ?? null,
        })),
      };
    }

    // type === "level" (default)
    const chars = await prisma.character.findMany({
      orderBy: [{ level: "desc" }, { exp: "desc" }, { name: "asc" }],
      take: limit,
      select: {
        id: true,
        name: true,
        level: true,
        exp: true,
        nickColor: true,
        clanMember: { select: { clan: { select: { id: true, name: true } } } },
      },
    });
    return {
      ok: true,
      type: "level",
      items: chars.map((c, i) => ({
        rank: i + 1,
        characterId: c.id,
        name: c.name,
        level: c.level,
        exp: Number(c.exp ?? 0),
        nickColor: c.nickColor,
        clanName: c.clanMember?.clan?.name ?? null,
      })),
    };
  });
}
