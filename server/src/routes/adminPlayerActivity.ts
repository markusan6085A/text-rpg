import type { FastifyPluginAsync } from "fastify";
import { prisma } from "../db";
import { requireAdmin } from "./adminGuard";

function parseDateOrNull(v: unknown): Date | null {
  if (typeof v !== "string" || !v.trim()) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

export const adminPlayerActivityRoutes: FastifyPluginAsync = async (app) => {
  // GET /admin/activity?characterId=&characterName=&action=&from=&to=&page=&limit=
  app.get("/", { preHandler: [requireAdmin] }, async (req) => {
    const q = (req.query || {}) as Record<string, string | undefined>;
    const characterId = String(q.characterId || "").trim();
    const characterName = String(q.characterName || "").trim();
    const action = String(q.action || "").trim();
    const from = parseDateOrNull(q.from);
    const to = parseDateOrNull(q.to);
    const page = Math.max(1, Number.parseInt(String(q.page || "1"), 10) || 1);
    const limit = Math.min(200, Math.max(1, Number.parseInt(String(q.limit || "40"), 10) || 40));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (characterId) where.characterId = characterId;
    if (characterName) {
      where.characterName = { contains: characterName, mode: "insensitive" };
    }
    if (action) where.action = action;
    if (from || to) {
      const createdAt: Record<string, Date> = {};
      if (from) createdAt.gte = from;
      if (to) createdAt.lte = to;
      where.createdAt = createdAt;
    }

    const [logs, total] = await Promise.all([
      prisma.playerActivityLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.playerActivityLog.count({ where }),
    ]);

    return { ok: true, logs, total, page, limit };
  });

  // GET /admin/activity/rhythm?characterId=&limit= — інтервали між синками з mobsKilledDelta > 0
  app.get("/rhythm", { preHandler: [requireAdmin] }, async (req, reply) => {
    const q = (req.query || {}) as Record<string, string | undefined>;
    const characterId = String(q.characterId || "").trim();
    if (!characterId) {
      return reply.code(400).send({ error: "characterId required" });
    }
    const take = Math.min(500, Math.max(10, Number.parseInt(String(q.limit || "120"), 10) || 120));

    const rows = await prisma.playerActivityLog.findMany({
      where: {
        characterId,
        action: "character.sync",
      },
      orderBy: { createdAt: "desc" },
      take,
      select: { id: true, createdAt: true, metadata: true },
    });

    const kills = rows
      .map((r) => {
        const m = r.metadata as Record<string, unknown> | null;
        const d = Number(m?.mobsKilledDelta ?? 0);
        return { at: r.createdAt.getTime(), delta: d };
      })
      .filter((x) => x.delta > 0)
      .sort((a, b) => a.at - b.at);

    const intervalsMs: number[] = [];
    for (let i = 1; i < kills.length; i++) {
      intervalsMs.push(kills[i].at - kills[i - 1].at);
    }

    const fmt = (ms: number) => {
      if (!Number.isFinite(ms) || ms < 0) return "—";
      const s = Math.round(ms / 1000);
      if (s < 120) return `${s} с`;
      const m = Math.floor(s / 60);
      return `${m} хв ${s % 60} с`;
    };

    const summary =
      intervalsMs.length === 0
        ? null
        : {
            count: intervalsMs.length,
            minMs: Math.min(...intervalsMs),
            maxMs: Math.max(...intervalsMs),
            avgMs: Math.round(intervalsMs.reduce((a, b) => a + b, 0) / intervalsMs.length),
            minLabel: fmt(Math.min(...intervalsMs)),
            maxLabel: fmt(Math.max(...intervalsMs)),
            avgLabel: fmt(Math.round(intervalsMs.reduce((a, b) => a + b, 0) / intervalsMs.length)),
          };

    return {
      ok: true,
      characterId,
      syncEventsWithMobProgress: kills.length,
      intervalsBetweenMobSyncs: intervalsMs,
      summary,
      recent: rows.slice(0, 30).map((r) => ({
        id: r.id,
        createdAt: r.createdAt.toISOString(),
        mobsKilledDelta: Number((r.metadata as any)?.mobsKilledDelta ?? 0),
      })),
    };
  });
};
