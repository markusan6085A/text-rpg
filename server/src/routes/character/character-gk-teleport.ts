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

    const body = req.body as { kind?: string; targetId?: string; expectedRevision?: number };
    const kind = body?.kind === "zone" ? "zone" : body?.kind === "city" ? "city" : null;
    const targetId = typeof body?.targetId === "string" ? body.targetId.trim() : "";
    const expectedRevision = Number(body?.expectedRevision);
    if (!kind || !targetId) {
      return reply.code(400).send({ error: "kind (city|zone) and targetId required" });
    }
    if (!Number.isFinite(expectedRevision) || expectedRevision < 0) {
      return reply.code(400).send({ error: "expectedRevision required" });
    }

    try {
      const txRes = await prisma.$transaction(async (tx) => {
        const locked = await tx.$queryRaw<
          Array<{ id: string; level: number; adena: bigint; heroJson: any; updatedAt: Date }>
        >`
          SELECT "id", "level", "adena", "heroJson", "updatedAt"
          FROM "Character"
          WHERE "id" = ${id} AND "accountId" = ${auth.accountId}
          FOR UPDATE
        `;
        if (locked.length === 0) return { ok: false as const, reason: "not_found" as const };
        const char = locked[0];
        const heroJson = (char.heroJson ?? {}) as Record<string, unknown>;
        const oldRevision = Number(heroJson.heroRevision ?? 0) || 0;
        if (oldRevision !== expectedRevision) {
          return {
            ok: false as const,
            reason: "revision_conflict" as const,
            currentRevision: oldRevision,
            updatedAt: char.updatedAt,
          };
        }

        const level = Math.max(1, Math.floor(Number(char.level ?? 1)));
        const charge = resolveGkTeleportAdenaCharge({ heroLevel: level, kind, targetId });
        if (charge === null) return { ok: false as const, reason: "unknown_target" as const };

        const currentAdena = Number(char.adena ?? 0n);
        if (charge > currentAdena) {
          return { ok: false as const, reason: "not_enough" as const, needed: charge, have: currentAdena };
        }

        const newAdena = Math.max(0, currentAdena - Math.max(0, charge));
        const patchedHeroJson: any = {
          ...heroJson,
          adena: newAdena,
          ...(kind === "city" ? { currentCityId: targetId } : {}),
        };
        const versionedHeroJson = addVersioning(patchedHeroJson, oldRevision);
        await tx.character.update({
          where: { id: char.id },
          data: {
            adena: BigInt(newAdena),
            heroJson: versionedHeroJson as any,
            lastActivityAt: new Date(),
          } as any,
        });

        return {
          ok: true as const,
          charge,
          newAdena,
          currentCityId: kind === "city" ? targetId : undefined,
        };
      });

      if (!txRes.ok) {
        if (txRes.reason === "not_found") return reply.code(404).send({ error: "character not found" });
        if (txRes.reason === "unknown_target") return reply.code(400).send({ error: "unknown teleport target" });
        if (txRes.reason === "not_enough") {
          return reply.code(400).send({ error: "not enough adena", needed: txRes.needed, have: txRes.have });
        }
        return reply.code(409).send({
          error: "revision_conflict",
          currentRevision: txRes.currentRevision ?? 0,
          updatedAt: txRes.updatedAt?.toISOString(),
          serverState: { heroRevision: txRes.currentRevision ?? 0, updatedAt: txRes.updatedAt?.toISOString() },
        });
      }

      return {
        ok: true,
        charge: txRes.charge,
        newAdena: txRes.newAdena,
        ...(txRes.currentCityId ? { currentCityId: txRes.currentCityId } : {}),
      };
    } catch (e) {
      app.log.error(e, "POST /characters/:id/gk-teleport");
      return reply.code(500).send({ error: "Internal Server Error" });
    }
  });
}
