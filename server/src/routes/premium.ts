import type { FastifyInstance } from "fastify";
import { prisma } from "../db";
import { addVersioning } from "../heroJsonValidator";
import { addNews } from "../news";
import { getAuth } from "./character/auth";

const PREMIUM_PACKAGES = {
  "3h": { addMs: 3 * 60 * 60 * 1000, price: 3 },
  "7h": { addMs: 7 * 60 * 60 * 1000, price: 5 },
  "12h": { addMs: 12 * 60 * 60 * 1000, price: 8 },
  "24h": { addMs: 24 * 60 * 60 * 1000, price: 16 },
} as const;

type PremiumPack = keyof typeof PREMIUM_PACKAGES;
const VALID_PACKS: PremiumPack[] = ["3h", "7h", "12h", "24h"];

export async function premiumRoutes(app: FastifyInstance) {
  app.post<{
    Body: { characterId: string; pack: string; expectedRevision: number };
  }>("/premium/buy", async (req, reply) => {
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });

    const { characterId, pack, expectedRevision } = req.body || {};
    if (!characterId || !pack) {
      return reply.code(400).send({ error: "characterId and pack required" });
    }
    if (!Number.isFinite(Number(expectedRevision)) || Number(expectedRevision) < 0) {
      return reply.code(400).send({ error: "expectedRevision required" });
    }

    const packKey = pack as PremiumPack;
    if (!VALID_PACKS.includes(packKey)) {
      return reply.code(400).send({ error: "invalid pack", validPacks: VALID_PACKS });
    }
    const cfg = PREMIUM_PACKAGES[packKey];

    const result = await prisma.$transaction(async (tx) => {
      const locked = await tx.$queryRaw<
        Array<{ id: string; coinLuck: bigint; heroJson: any }>
      >`
        SELECT "id", "coinLuck", "heroJson"
        FROM "Character"
        WHERE "id" = ${characterId} AND "accountId" = ${auth.accountId}
        FOR UPDATE
      `;
      if (locked.length === 0) return { kind: "not_found" as const };
      const ch = locked[0];

      const heroJson = (ch.heroJson ?? {}) as any;
      const oldRevision = heroJson.heroRevision ?? 0;
      if (oldRevision !== Number(expectedRevision)) {
        return { kind: "conflict" as const, revision: oldRevision };
      }

      const oldPremiumUntil = Number(heroJson.premiumUntil ?? 0);
      const now = Date.now();
      const base = Math.max(oldPremiumUntil, now);
      const newPremiumUntil = base + cfg.addMs;

      const currentCoinLuck = Number(ch.coinLuck ?? 0n);
      if (currentCoinLuck < cfg.price) {
        return { kind: "no_money" as const, coinLuck: currentCoinLuck };
      }

      const updatedHeroJson = addVersioning(
        { ...heroJson, premiumUntil: newPremiumUntil },
        oldRevision
      );

      const updated = await tx.character.update({
        where: { id: ch.id },
        data: {
          coinLuck: { decrement: cfg.price },
          heroJson: updatedHeroJson,
        },
        select: { id: true, coinLuck: true, heroJson: true, name: true, level: true, exp: true, sp: true, adena: true, aa: true, updatedAt: true },
      });

      return { kind: "ok" as const, character: updated };
    });

    if (result.kind === "not_found") {
      return reply.code(404).send({ error: "character not found" });
    }
    if (result.kind === "conflict") {
      return reply.code(409).send({ error: "revision_conflict", revision: Number(result.revision ?? 0) });
    }
    if (result.kind === "no_money") {
      return reply.code(400).send({ error: "not enough coinLuck", coinLuck: Number(result.coinLuck ?? 0) });
    }

    const hours = Math.round(cfg.addMs / (1000 * 60 * 60));
    await addNews({
      type: "premium_purchase",
      characterId: result.character.id,
      characterName: (result.character as any).name || "",
      metadata: { hours },
    }).catch((err: any) => {
      req.log?.error?.(err, "Error adding premium purchase news");
    });

    return reply.send({ ok: true, character: result.character });
  });
}
