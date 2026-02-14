import type { FastifyInstance } from "fastify";
import jwt from "jsonwebtoken";
import { prisma } from "../db";
import { addVersioning } from "../heroJsonValidator";
import { addNews } from "../news";

const PREMIUM_PACKAGES = {
  "3h": { addMs: 3 * 60 * 60 * 1000, price: 3 },
  "7h": { addMs: 7 * 60 * 60 * 1000, price: 5 },
  "12h": { addMs: 12 * 60 * 60 * 1000, price: 8 },
  "24h": { addMs: 24 * 60 * 60 * 1000, price: 16 },
} as const;

type PremiumPack = keyof typeof PREMIUM_PACKAGES;
const VALID_PACKS: PremiumPack[] = ["3h", "7h", "12h", "24h"];

function getAuth(req: any): { accountId: string; login: string } | null {
  const header = req.headers?.authorization || "";
  const [type, token] = String(header).split(" ");
  if (type !== "Bearer" || !token) return null;
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is missing in .env");
  try {
    const payload = jwt.verify(token, secret) as any;
    if (!payload?.accountId) return null;
    return { accountId: payload.accountId, login: payload.login };
  } catch {
    return null;
  }
}

export async function premiumRoutes(app: FastifyInstance) {
  app.post<{
    Body: { characterId: string; pack: string; expectedRevision?: number };
  }>("/premium/buy", async (req, reply) => {
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });

    const { characterId, pack, expectedRevision } = req.body || {};
    if (!characterId || !pack) {
      return reply.code(400).send({ error: "characterId and pack required" });
    }

    const packKey = pack as PremiumPack;
    if (!VALID_PACKS.includes(packKey)) {
      return reply.code(400).send({ error: "invalid pack", validPacks: VALID_PACKS });
    }
    const cfg = PREMIUM_PACKAGES[packKey];

    const result = await prisma.$transaction(async (tx) => {
      const ch = await tx.character.findFirst({
        where: { id: characterId, accountId: auth!.accountId },
        select: { id: true, coinLuck: true, heroJson: true },
      });
      if (!ch) return { kind: "not_found" as const };

      const heroJson = (ch.heroJson ?? {}) as any;
      const oldRevision = heroJson.heroRevision ?? 0;
      if (expectedRevision !== undefined && oldRevision !== expectedRevision) {
        return { kind: "conflict" as const, revision: oldRevision };
      }

      const oldPremiumUntil = Number(heroJson.premiumUntil ?? 0);
      const now = Date.now();
      const base = Math.max(oldPremiumUntil, now);
      const newPremiumUntil = base + cfg.addMs;

      const currentCoinLuck = ch.coinLuck ?? 0;
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
      return reply.code(409).send({ error: "revision_conflict", revision: result.revision });
    }
    if (result.kind === "no_money") {
      return reply.code(400).send({ error: "not enough coinLuck", coinLuck: result.coinLuck });
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
