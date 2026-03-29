import type { FastifyInstance } from "fastify";
import { prisma } from "../db";
import { getAuth } from "./character/auth";
import { RateLimiter, getRateLimitKey } from "../rateLimiter";

const ZONE_ID_RE = /^[a-zA-Z0-9_-]{1,120}$/;
const putLimiter = new RateLimiter(60 * 1000, 180);
const getLimiter = new RateLimiter(60 * 1000, 120);
const killLimiter = new RateLimiter(60 * 1000, 60);

const MAX_HP_CAP = 2_000_000_000;
const MIN_RESPAWN_MS = 1000;
const MAX_RESPAWN_MS = 14 * 24 * 60 * 60 * 1000; // 14 днів

function parseZoneId(raw: string): string | null {
  try {
    const z = decodeURIComponent(raw);
    if (!ZONE_ID_RE.test(z)) return null;
    return z;
  } catch {
    return null;
  }
}

function parseMobIndex(raw: string): number | null {
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 0 || n > 50000) return null;
  return n;
}

export async function worldMobStateRoutes(app: FastifyInstance) {
  // GET /world/zones/:zoneId — HP + активні респавни
  app.get("/world/zones/:zoneId", async (req, reply) => {
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });

    const zoneId = parseZoneId((req.params as { zoneId?: string }).zoneId ?? "");
    if (!zoneId) return reply.code(400).send({ error: "invalid input" });

    const rl = getLimiter.check(getRateLimitKey(req, "world_zone_get"));
    if (!rl.allowed) return reply.code(429).send({ error: "rate limit" });

    const now = new Date();
    await prisma.zoneMobRespawn.deleteMany({
      where: { zoneId, respawnAt: { lte: now } },
    });

    const [hpRows, respawnRows] = await Promise.all([
      prisma.zoneMobHp.findMany({ where: { zoneId } }),
      prisma.zoneMobRespawn.findMany({ where: { zoneId, respawnAt: { gt: now } } }),
    ]);

    const hp: Record<string, { currentHp: number; maxHp: number }> = {};
    for (const r of hpRows) {
      hp[String(r.mobIndex)] = { currentHp: r.currentHp, maxHp: r.maxHp };
    }
    const respawn: Record<string, string> = {};
    for (const r of respawnRows) {
      respawn[String(r.mobIndex)] = r.respawnAt.toISOString();
    }

    return { ok: true, hp, respawn };
  });

  // PUT /world/zones/:zoneId/mobs/:mobIndex/hp — синхронізація поточного HP (не збільшує)
  app.put("/world/zones/:zoneId/mobs/:mobIndex/hp", async (req, reply) => {
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });

    const zoneId = parseZoneId((req.params as { zoneId?: string }).zoneId ?? "");
    const mobIndex = parseMobIndex((req.params as { mobIndex?: string }).mobIndex ?? "");
    if (!zoneId || mobIndex === null) return reply.code(400).send({ error: "invalid input" });

    const rl = putLimiter.check(getRateLimitKey(req, "world_mob_hp_put"));
    if (!rl.allowed) return reply.code(429).send({ error: "rate limit" });

    const body = req.body as { currentHp?: unknown; maxHp?: unknown };
    const currentHp = Math.floor(Number(body?.currentHp));
    const maxHp = Math.floor(Number(body?.maxHp));
    if (
      !Number.isFinite(currentHp) ||
      !Number.isFinite(maxHp) ||
      maxHp < 1 ||
      maxHp > MAX_HP_CAP ||
      currentHp < 1 ||
      currentHp > maxHp
    ) {
      return reply.code(400).send({ error: "invalid input" });
    }

    await prisma.zoneMobRespawn.deleteMany({
      where: { zoneId, mobIndex, respawnAt: { lte: new Date() } },
    });
    const activeRespawn = await prisma.zoneMobRespawn.findUnique({
      where: { zoneId_mobIndex: { zoneId, mobIndex } },
    });
    if (activeRespawn && activeRespawn.respawnAt > new Date()) {
      return reply.code(403).send({ error: "forbidden" });
    }

    const existing = await prisma.zoneMobHp.findUnique({
      where: { zoneId_mobIndex: { zoneId, mobIndex } },
    });

    if (existing) {
      if (existing.maxHp !== maxHp) return reply.code(400).send({ error: "invalid input" });
      if (currentHp > existing.currentHp) return reply.code(400).send({ error: "invalid input" });
    }

    await prisma.zoneMobHp.upsert({
      where: { zoneId_mobIndex: { zoneId, mobIndex } },
      create: { zoneId, mobIndex, currentHp, maxHp },
      update: { currentHp },
    });

    return { ok: true };
  });

  // POST /world/zones/:zoneId/mobs/:mobIndex/kill — вбивство, респавн, очистка HP
  app.post("/world/zones/:zoneId/mobs/:mobIndex/kill", async (req, reply) => {
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });

    const zoneId = parseZoneId((req.params as { zoneId?: string }).zoneId ?? "");
    const mobIndex = parseMobIndex((req.params as { mobIndex?: string }).mobIndex ?? "");
    if (!zoneId || mobIndex === null) return reply.code(400).send({ error: "invalid input" });

    const rl = killLimiter.check(getRateLimitKey(req, "world_mob_kill"));
    if (!rl.allowed) return reply.code(429).send({ error: "rate limit" });

    const body = req.body as { respawnDelayMs?: unknown };
    const respawnDelayMs = Math.floor(Number(body?.respawnDelayMs));
    if (
      !Number.isFinite(respawnDelayMs) ||
      respawnDelayMs < MIN_RESPAWN_MS ||
      respawnDelayMs > MAX_RESPAWN_MS
    ) {
      return reply.code(400).send({ error: "invalid input" });
    }

    const respawnAt = new Date(Date.now() + respawnDelayMs);

    await prisma.$transaction([
      prisma.zoneMobHp.deleteMany({ where: { zoneId, mobIndex } }),
      prisma.zoneMobRespawn.upsert({
        where: { zoneId_mobIndex: { zoneId, mobIndex } },
        create: { zoneId, mobIndex, respawnAt },
        update: { respawnAt },
      }),
    ]);

    return { ok: true, respawnAt: respawnAt.toISOString() };
  });
}
