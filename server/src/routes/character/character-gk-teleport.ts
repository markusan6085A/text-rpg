import type { FastifyInstance } from "fastify";
import { prisma } from "../../db";
import { getAuth } from "./auth";
import { addVersioning } from "../../heroJsonValidator";
import { resolveGkTeleportAdenaCharge } from "../../gkTeleportResolve";

/**
 * POST /characters/:id/gk-teleport
 * Знімає адену за телепорт GK за рівнем персонажа в БД; до 40 lvl включно — 0.
 * kind=city також оновлює heroJson.currentCityId.
 */
export async function characterGkTeleportRoutes(app: FastifyInstance) {
  app.post("/characters/:id/gk-teleport", async (req, reply) => {
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });

    const id = (req.params as { id?: string }).id;
    if (!id) return reply.code(400).send({ error: "character id required" });

    const body = req.body as { kind?: string; targetId?: string };
    const kind = body?.kind === "zone" ? "zone" : body?.kind === "city" ? "city" : null;
    const targetId = typeof body?.targetId === "string" ? body.targetId.trim() : "";
    if (!kind || !targetId) {
      return reply.code(400).send({ error: "kind (city|zone) and targetId required" });
    }

    try {
      const char = await prisma.character.findFirst({
        where: { id, accountId: auth.accountId },
        select: { id: true, level: true, adena: true, heroJson: true },
      });
      if (!char) return reply.code(404).send({ error: "character not found" });

      const level = Math.max(1, Math.floor(Number(char.level ?? 1)));
      const charge = resolveGkTeleportAdenaCharge({ heroLevel: level, kind, targetId });
      if (charge === null) {
        return reply.code(400).send({ error: "unknown teleport target" });
      }

      const currentAdena = Number(char.adena ?? 0);
      if (charge > currentAdena) {
        return reply.code(400).send({
          error: "not enough adena",
          needed: charge,
          have: currentAdena,
        });
      }

      const heroJson = (char.heroJson ?? {}) as Record<string, unknown>;
      const oldRevision = Number(heroJson.heroRevision ?? 0) || 0;

      const data: {
        adena?: { decrement: number };
        heroJson?: object;
        lastActivityAt: Date;
      } = { lastActivityAt: new Date() };

      if (charge > 0) {
        data.adena = { decrement: charge };
      }

      if (kind === "city") {
        const patchedHeroJson = { ...heroJson, currentCityId: targetId };
        data.heroJson = addVersioning(patchedHeroJson, oldRevision) as object;
      }

      const updated = await prisma.character.update({
        where: { id: char.id },
        data: data as any,
        select: { adena: true, heroJson: true },
      });

      const newAdena = Number(updated.adena ?? 0);

      return {
        ok: true,
        charge,
        newAdena,
        ...(kind === "city" ? { currentCityId: targetId } : {}),
      };
    } catch (e) {
      app.log.error(e, "POST /characters/:id/gk-teleport");
      return reply.code(500).send({ error: "Internal Server Error" });
    }
  });
}
