import type { FastifyInstance } from "fastify";
import { prisma } from "../../../db";
import { getAuth } from "../auth";
import { addVersioning } from "../../../heroJsonValidator";
import { registerPkSessionRoutes } from "./pk";
import { registerTvtRoutes } from "./tvt/routes";

/**
 * Дії з персонажем (PK/арена винесені в ./pk/*).
 */
export async function characterActionsRoutes(app: FastifyInstance) {
  await registerPkSessionRoutes(app);
  await registerTvtRoutes(app);

  // POST /characters/:id/colorize-nick - зміна кольору ніка (50 Coin of Luck)
  app.post("/characters/:id/colorize-nick", async (req, reply) => {
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });

    const targetId = (req.params as any).id;
    const body = req.body as { nickColor?: string; expectedRevision?: number };

    if (!body.nickColor || typeof body.nickColor !== "string") {
      return reply.code(400).send({ error: "nickColor required" });
    }
    const nickColor = body.nickColor.trim();
    if (!/^#[0-9A-Fa-f]{6}$/.test(nickColor)) {
      return reply.code(400).send({ error: "invalid nickColor (expected #RRGGBB)" });
    }
    const expectedRevision = Number(body.expectedRevision);
    if (!Number.isFinite(expectedRevision) || expectedRevision < 0) {
      return reply.code(400).send({ error: "expectedRevision required" });
    }

    const PRICE = 50;

    try {
      const txRes = await prisma.$transaction(async (tx) => {
        const locked = await tx.$queryRaw<
          Array<{ id: string; coinLuck: bigint; heroJson: any }>
        >`
          SELECT "id", "coinLuck", "heroJson"
          FROM "Character"
          WHERE "id" = ${targetId} AND "accountId" = ${auth.accountId}
          FOR UPDATE
        `;
        if (locked.length === 0) return { ok: false as const, reason: "not_found" as const };

        const ch = locked[0];
        const heroJson = (ch.heroJson ?? {}) as any;
        const oldRevision = Number(heroJson.heroRevision ?? 0);
        if (oldRevision !== expectedRevision) {
          return { ok: false as const, reason: "revision_conflict" as const, revision: oldRevision };
        }

        const currentCoinLuck = Number(ch.coinLuck ?? 0n);
        if (currentCoinLuck < PRICE) {
          return { ok: false as const, reason: "not_enough" as const, coinLuck: currentCoinLuck };
        }

        const updatedHeroJson = addVersioning({ ...heroJson, nickColor }, oldRevision);
        const updated = await tx.character.update({
          where: { id: ch.id },
          data: {
            coinLuck: { decrement: PRICE },
            nickColor,
            heroJson: updatedHeroJson,
          },
          select: { id: true, coinLuck: true, nickColor: true, heroJson: true, name: true, level: true, exp: true, sp: true, adena: true, aa: true, updatedAt: true },
        });
        return { ok: true as const, updated };
      });

      if (!txRes.ok) {
        if (txRes.reason === "not_found") return reply.code(404).send({ error: "character not found" });
        if (txRes.reason === "revision_conflict") return reply.code(409).send({ error: "revision_conflict", revision: txRes.revision });
        return reply.code(400).send({ error: "not enough coinLuck", coinLuck: txRes.coinLuck });
      }

      return reply.send({ ok: true, character: { ...txRes.updated, exp: Number(txRes.updated.exp) } });
    } catch (error) {
      app.log.error(error, "Error colorize-nick:");
      return reply.code(500).send({
        error: "Internal Server Error",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // POST /characters/:id/rename-nick - зміна ніка (50 Coin of Luck)
  app.post("/characters/:id/rename-nick", async (req, reply) => {
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });

    const targetId = (req.params as any).id;
    const body = req.body as { name?: string; expectedRevision?: number };

    const newName = (body.name ?? "").trim();
    if (newName.length < 2) return reply.code(400).send({ error: "name too short" });
    if (!/^[A-Za-z0-9_\- ]+$/.test(newName)) {
      return reply.code(400).send({ error: "invalid name (use only A-Z, a-z, 0-9, _, -, space)" });
    }
    const expectedRevision = Number(body.expectedRevision);
    if (!Number.isFinite(expectedRevision) || expectedRevision < 0) {
      return reply.code(400).send({ error: "expectedRevision required" });
    }

    const PRICE = 50;

    try {
      const txRes = await prisma.$transaction(async (tx) => {
        const locked = await tx.$queryRaw<
          Array<{ id: string; coinLuck: bigint; heroJson: any }>
        >`
          SELECT "id", "coinLuck", "heroJson"
          FROM "Character"
          WHERE "id" = ${targetId} AND "accountId" = ${auth.accountId}
          FOR UPDATE
        `;
        if (locked.length === 0) return { ok: false as const, reason: "not_found" as const };

        const ch = locked[0];
        const heroJson = (ch.heroJson ?? {}) as any;
        const oldRevision = Number(heroJson.heroRevision ?? 0);
        if (oldRevision !== expectedRevision) {
          return { ok: false as const, reason: "revision_conflict" as const, revision: oldRevision };
        }

        const currentCoinLuck = Number(ch.coinLuck ?? 0n);
        if (currentCoinLuck < PRICE) {
          return { ok: false as const, reason: "not_enough" as const, coinLuck: currentCoinLuck };
        }

        const updatedHeroJson = addVersioning({ ...heroJson, name: newName, coinOfLuck: currentCoinLuck - PRICE }, oldRevision);
        const updated = await tx.character.update({
          where: { id: ch.id },
          data: {
            coinLuck: { decrement: PRICE },
            name: newName,
            heroJson: updatedHeroJson,
          },
          select: { id: true, coinLuck: true, name: true, heroJson: true, level: true, exp: true, sp: true, adena: true, aa: true, updatedAt: true },
        });
        return { ok: true as const, updated };
      });

      if (!txRes.ok) {
        if (txRes.reason === "not_found") return reply.code(404).send({ error: "character not found" });
        if (txRes.reason === "revision_conflict") return reply.code(409).send({ error: "revision_conflict", revision: txRes.revision });
        return reply.code(400).send({ error: "not enough coinLuck", coinLuck: txRes.coinLuck });
      }

      return reply.send({ ok: true, character: { ...txRes.updated, exp: Number(txRes.updated.exp) } });
    } catch (error) {
      app.log.error(error, "Error rename-nick:");
      return reply.code(500).send({
        error: "Internal Server Error",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // POST /characters/:id/heal - лікування іншого гравця
  app.post("/characters/:id/heal", async (req, reply) => {
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });

    const targetId = (req.params as any).id;
    const body = req.body as { skillId: number; power: number; expectedRevision?: number };

    const expectedRevision = Number(body?.expectedRevision);
    if (!body.skillId || !body.power || !Number.isFinite(expectedRevision) || expectedRevision < 0) {
      return reply.code(400).send({ error: "skillId, power and expectedRevision are required" });
    }

    try {
      const result = await prisma.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT id FROM "Character" WHERE id = ${targetId} AND "accountId" = ${auth.accountId} FOR UPDATE`;

        const targetChar = await tx.character.findFirst({
          where: { id: targetId, accountId: auth.accountId },
          select: { id: true, level: true, heroJson: true },
        });
        if (!targetChar) throw new Error("target character not found");

        const heroJson = (targetChar.heroJson as any) || {};
        const currentRevision = Number(heroJson.heroRevision ?? 0) || 0;
        if (currentRevision !== expectedRevision) {
          return { revisionConflict: true as const, currentRevision };
        }
        const rawMaxHp = Number(
          heroJson.maxHp ?? heroJson.maxHP ?? heroJson.max_hp ??
          heroJson?.resources?.maxHp ?? heroJson?.battleStats?.maxHp ?? 0
        );
        const level = Number(targetChar.level ?? 1);
        const maxHp = rawMaxHp > 100 ? rawMaxHp : Math.max(100, 150 + level * 12);
        const rawHp = Number(heroJson.hp ?? 0);
        const currentHp = rawHp > 0 ? Math.min(rawHp, maxHp) : maxHp;
        const newHp = Math.min(maxHp, currentHp + body.power);

        const oldRevision = Number(heroJson.heroRevision ?? 0) || 0;
        const updatedHeroJson = addVersioning({ ...heroJson, hp: newHp, maxHp }, oldRevision);

        await tx.character.update({
          where: { id: targetChar.id },
          data: { heroJson: updatedHeroJson },
        });

        return { revisionConflict: false as const, healedHp: newHp - currentHp, currentHp: newHp };
      });

      if (result.revisionConflict) {
        return reply.code(409).send({
          error: "revision_conflict",
          message: "Character was modified by another session. Please reload and try again.",
          currentRevision: result.currentRevision ?? 0,
          serverState: { heroRevision: result.currentRevision ?? 0 },
        });
      }

      return reply.send({ ok: true, healedHp: result.healedHp, currentHp: result.currentHp });
    } catch (error) {
      if (error instanceof Error && error.message === "target character not found") {
        return reply.code(404).send({ error: "target character not found" });
      }
      app.log.error(error, "Error healing character:");
      return reply.code(500).send({
        error: "Internal Server Error",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // POST /characters/:id/buff - застосування бафу до іншого гравця
  app.post("/characters/:id/buff", async (req, reply) => {
    app.log.info(`[POST /characters/:id/buff] Request received: ${req.url}`);
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });

    const targetId = (req.params as any).id;
    const body = req.body as { skillId: number; buffData: any; expectedRevision?: number };

    app.log.info(`[POST /characters/:id/buff] targetId: ${targetId}, skillId: ${body?.skillId}`);

    const expectedRevision = Number(body?.expectedRevision);
    if (!body.skillId || !body.buffData || !Number.isFinite(expectedRevision) || expectedRevision < 0) {
      return reply.code(400).send({ error: "skillId, buffData and expectedRevision are required" });
    }

    try {
      const result = await prisma.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT id FROM "Character" WHERE id = ${targetId} AND "accountId" = ${auth.accountId} FOR UPDATE`;

        const targetChar = await tx.character.findFirst({
          where: { id: targetId, accountId: auth.accountId },
          select: { id: true, heroJson: true },
        });
        if (!targetChar) throw new Error("target character not found");

        const heroJson = (targetChar.heroJson as any) || {};
        const currentRevision = Number(heroJson.heroRevision ?? 0) || 0;
        if (currentRevision !== expectedRevision) {
          return { skipped: false, revisionConflict: true as const, currentRevision };
        }
        const currentBuffs = Array.isArray(heroJson.heroBuffs) ? heroJson.heroBuffs : [];

        const newBuff = {
          id: body.skillId,
          name: body.buffData.name || "",
          icon: body.buffData.icon || "",
          effects: body.buffData.effects || [],
          expiresAt: body.buffData.expiresAt || (Date.now() + (body.buffData.duration || 0) * 1000),
          startedAt: Date.now(),
          durationMs: (body.buffData.duration || 0) * 1000,
          source: "skill" as const,
          buffGroup: body.buffData.buffGroup,
          stackType: body.buffData.stackType,
        };

        let filteredBuffs = currentBuffs.filter((b: any) => {
          if (b.id === body.skillId) return false;
          if (newBuff.buffGroup && b.buffGroup === newBuff.buffGroup) {
            return false;
          }
          return true;
        });

        const existingBuff = currentBuffs.find((b: any) => b.id === body.skillId);
        if (existingBuff) {
          const newTotalPower = (newBuff.effects || []).reduce((sum: number, eff: any) => {
            if (eff.mode === "multiplier") {
              return sum + (eff.multiplier || 1);
            } else if (eff.mode === "percent") {
              return sum + Math.abs(eff.value || 0);
            } else {
              return sum + Math.abs(eff.value || 0);
            }
          }, 0);

          const oldTotalPower = (existingBuff.effects || []).reduce((sum: number, eff: any) => {
            if (eff.mode === "multiplier") {
              return sum + (eff.multiplier || 1);
            } else if (eff.mode === "percent") {
              return sum + Math.abs(eff.value || 0);
            } else {
              return sum + Math.abs(eff.value || 0);
            }
          }, 0);

          if (oldTotalPower >= newTotalPower) {
            app.log.info(
              {
                targetId,
                skillId: body.skillId,
                reason: "existing_buff_better",
                oldPower: oldTotalPower,
                newPower: newTotalPower,
              },
              "[POST /characters/:id/buff] Keeping existing buff (better than new)"
            );
            return { skipped: true, revisionConflict: false as const };
          }

          app.log.info(
            {
              targetId,
              skillId: body.skillId,
              reason: "replacing_with_better",
              oldPower: oldTotalPower,
              newPower: newTotalPower,
            },
            "[POST /characters/:id/buff] Replacing buff with better version"
          );
        }

        const updatedBuffs = [...filteredBuffs, newBuff];
        const oldRevision = Number(heroJson.heroRevision ?? 0) || 0;
        const updatedHeroJson = addVersioning({ ...heroJson, heroBuffs: updatedBuffs }, oldRevision);

        await tx.character.update({
          where: { id: targetChar.id },
          data: { heroJson: updatedHeroJson },
        });

        return { skipped: false, revisionConflict: false as const, updatedBuffs, newBuff };
      });

      if (result.revisionConflict) {
        return reply.code(409).send({
          error: "revision_conflict",
          message: "Character was modified by another session. Please reload and try again.",
          currentRevision: result.currentRevision ?? 0,
          serverState: { heroRevision: result.currentRevision ?? 0 },
        });
      }

      if (result.skipped) {
        return reply.code(200).send({ ok: true, message: "Existing buff is better, keeping it" });
      }

      const updatedBuffs = result.updatedBuffs ?? [];
      const skillId = body.skillId;
      const buffName = result.newBuff?.name || "";
      const totalBuffs = updatedBuffs.length;
      app.log.info(
        {
          targetId,
          skillId,
          buffName,
          totalBuffs,
          buffs: updatedBuffs.map((b: any) => ({
            id: b.id,
            name: b.name,
            expiresAt: b.expiresAt,
          })),
        },
        "[POST /characters/:id/buff] Buff applied"
      );

      return reply.send({ ok: true, message: "Buff applied successfully" });
    } catch (error) {
      if (error instanceof Error && error.message === "target character not found") {
        return reply.code(404).send({ error: "target character not found" });
      }
      app.log.error(error, "Error buffing character:");
      return reply.code(500).send({
        error: "Internal Server Error",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // POST /characters/:id/resurrect — атомарно скидає смерть, ставить ресурси (ratio 1=100%, 0.7=70% тощо)
  app.post("/characters/:id/resurrect", async (req, reply) => {
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });

    const targetId = (req.params as any).id;
    if (!targetId) return reply.code(400).send({ error: "character id required" });

    const body = (req.body as any) || {};
    const ratio = Math.max(0, Math.min(1, Number(body.ratio) ?? 1));
    const expectedRevision = Number(body.expectedRevision);
    if (!Number.isFinite(expectedRevision) || expectedRevision < 0) {
      return reply.code(400).send({ error: "expectedRevision required" });
    }

    try {
      const txRes = await prisma.$transaction(async (tx) => {
        const locked = await tx.$queryRaw<
          Array<{ id: string; heroJson: any }>
        >`
          SELECT "id", "heroJson"
          FROM "Character"
          WHERE "id" = ${targetId} AND "accountId" = ${auth.accountId}
          FOR UPDATE
        `;
        if (locked.length === 0) return { ok: false as const, reason: "not_found" as const };

        const ch = locked[0];
        const heroJson = (ch.heroJson ?? {}) as any;
        const currentRevision = Number(heroJson.heroRevision ?? 0);
        if (currentRevision !== expectedRevision) {
          return {
            ok: false as const,
            reason: "revision_conflict" as const,
            currentRevision,
          };
        }
        const maxHp = Math.max(1, Number(heroJson.maxHp) || 100);
        const maxMp = Math.max(1, Number(heroJson.maxMp) || 50);
        const maxCp = Math.max(1, Number(heroJson.maxCp) || Math.round(maxHp * 0.6));

        const hp = Math.max(1, Math.round(maxHp * ratio));
        const mp = Math.max(0, Math.round(maxMp * ratio));
        const cp = Math.max(0, Math.round(maxCp * ratio));
        const hpFull = ratio >= 1;
        const mpFull = ratio >= 1;
        const cpFull = ratio >= 1;
        const pct = Math.max(0, Math.min(1, ratio));

        const patchedHeroJson = {
          ...heroJson,
          isDead: false,
          deadAt: 0,
          hp,
          mp,
          cp,
          hpFull,
          mpFull,
          cpFull,
          hpPercent: pct,
          mpPercent: pct,
          cpPercent: pct,
          heroBuffs: [],
        };

        const oldRevision = heroJson.heroRevision || 0;
        const versionedHeroJson = addVersioning(patchedHeroJson, oldRevision);
        const updated = await tx.character.update({
          where: { id: ch.id },
          data: { heroJson: versionedHeroJson, lastActivityAt: new Date() },
          select: { id: true, name: true, race: true, classId: true, sex: true, level: true, exp: true, sp: true, adena: true, aa: true, coinLuck: true, coinsSilver: true, heroJson: true, updatedAt: true },
        });
        return { ok: true as const, updated };
      });

      if (!txRes.ok) {
        if (txRes.reason === "revision_conflict") {
          return reply.code(409).send({ error: "revision_conflict", revision: txRes.currentRevision ?? 0 });
        }
        return reply.code(404).send({ error: "character not found" });
      }
      return reply.send({ ok: true, character: { ...txRes.updated, exp: Number(txRes.updated.exp) } });
    } catch (error) {
      app.log.error(error, "Error resurrect character:");
      return reply.code(500).send({
        error: "Internal Server Error",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  const VIEW_STATS_COST = 1_000_000;

  // POST /characters/:targetId/pay-view-stats - сплатити 1M аден для перегляду характеристик іншого гравця
  app.post("/characters/:targetId/pay-view-stats", async (req, reply) => {
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });
    const targetId = (req.params as { targetId?: string }).targetId;
    if (!targetId) return reply.code(400).send({ error: "targetId required" });
    const body = req.body as { expectedRevision?: number };
    const expectedRevision = Number(body?.expectedRevision);
    if (!Number.isFinite(expectedRevision) || expectedRevision < 0) {
      return reply.code(400).send({ error: "expectedRevision required" });
    }

    try {
      const txRes = await prisma.$transaction(async (tx) => {
        const locked = await tx.$queryRaw<
          Array<{ id: string; adena: bigint; heroJson: any; updatedAt: Date }>
        >`
          SELECT "id", "adena", "heroJson", "updatedAt"
          FROM "Character"
          WHERE "accountId" = ${auth.accountId}
          ORDER BY "createdAt" ASC
          LIMIT 1
          FOR UPDATE
        `;
        if (locked.length === 0) return { ok: false as const, reason: "not_found" as const };
        const myChar = locked[0];
        const heroJson = (myChar.heroJson ?? {}) as any;
        const currentRevision = Number(heroJson.heroRevision ?? 0);
        if (currentRevision !== expectedRevision) {
          return {
            ok: false as const,
            reason: "revision_conflict" as const,
            currentRevision,
            updatedAt: myChar.updatedAt,
          };
        }
        const currentAdena = Number(myChar.adena ?? 0n);
        if (currentAdena < VIEW_STATS_COST) {
          return {
            ok: false as const,
            reason: "not_enough" as const,
            currentAdena,
          };
        }
        const nextAdena = Math.max(0, currentAdena - VIEW_STATS_COST);
        const versionedHeroJson = addVersioning({ ...heroJson, adena: nextAdena }, currentRevision);
        await tx.character.update({
          where: { id: myChar.id },
          data: { adena: BigInt(nextAdena), heroJson: versionedHeroJson as any },
        });
        return { ok: true as const, nextAdena };
      });

      if (!txRes.ok) {
        if (txRes.reason === "not_found") return reply.code(404).send({ error: "character not found" });
        if (txRes.reason === "revision_conflict") {
          return reply.code(409).send({
            error: "revision_conflict",
            currentRevision: txRes.currentRevision ?? 0,
            updatedAt: txRes.updatedAt?.toISOString(),
            serverState: { heroRevision: txRes.currentRevision ?? 0, updatedAt: txRes.updatedAt?.toISOString() },
          });
        }
        return reply.code(400).send({ error: "not enough adena", needed: VIEW_STATS_COST, have: txRes.currentAdena ?? 0 });
      }
      return reply.send({ ok: true, newAdena: txRes.nextAdena });
    } catch (error) {
      app.log.error(error, "POST /characters/:targetId/pay-view-stats");
      return reply.code(500).send({ error: "Internal Server Error" });
    }
  });

  const QUEST_SHOP_EXCHANGE_SILVER_PER_UNIT = 10;
  const QUEST_SHOP_EXCHANGE_MAX_QTY = 10_000;

  // POST /characters/:id/quest-shop/exchange — обмін срібла квест-шопу (адена / exp / sp / coin of luck); суми лише на сервері.
  app.post("/characters/:id/quest-shop/exchange", async (req, reply) => {
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });

    const targetId = (req.params as { id?: string }).id;
    if (!targetId) return reply.code(400).send({ error: "invalid input" });

    const body = req.body as { kind?: string; quantity?: unknown; expectedRevision?: number };
    const kind = body.kind;
    const qtyRaw = body.quantity;
    const qty = typeof qtyRaw === "number" ? Math.floor(qtyRaw) : Math.floor(Number(qtyRaw));
    const expectedRevision = Number(body.expectedRevision);

    if (kind !== "adena" && kind !== "exp" && kind !== "sp" && kind !== "coinOfLuck") {
      return reply.code(400).send({ error: "invalid input" });
    }
    if (!Number.isFinite(qty) || qty < 1 || qty > QUEST_SHOP_EXCHANGE_MAX_QTY) {
      return reply.code(400).send({ error: "invalid input" });
    }
    if (!Number.isFinite(expectedRevision) || expectedRevision < 0) {
      return reply.code(400).send({ error: "expectedRevision required" });
    }

    try {
      const txRes = await prisma.$transaction(async (tx) => {
        const locked = await tx.$queryRaw<
          Array<{
            id: string;
            adena: bigint;
            exp: bigint;
            sp: number;
            coinLuck: bigint;
            coinsSilver: bigint;
            heroJson: any;
            updatedAt: Date;
          }>
        >`
          SELECT "id", "adena", "exp", "sp", "coinLuck", "coinsSilver", "heroJson", "updatedAt"
          FROM "Character"
          WHERE "id" = ${targetId} AND "accountId" = ${auth.accountId}
          FOR UPDATE
        `;
        if (locked.length === 0) return { ok: false as const, reason: "not_found" as const };

        const ch = locked[0];
        const heroJson = (ch.heroJson && typeof ch.heroJson === "object" ? ch.heroJson : {}) as Record<string, unknown>;
        const oldRevision = Number(heroJson.heroRevision ?? 0);
        if (expectedRevision !== oldRevision) {
          return { ok: false as const, reason: "revision_conflict" as const, revision: oldRevision };
        }

        const silverCost = BigInt(QUEST_SHOP_EXCHANGE_SILVER_PER_UNIT * qty);
        const curSilver = BigInt(ch.coinsSilver ?? 0n);
        if (curSilver < silverCost) {
          return { ok: false as const, reason: "forbidden" as const };
        }

        const newSilver = curSilver - silverCost;
        let newAdena = BigInt(ch.adena ?? 0n);
        let newExp = BigInt(ch.exp ?? 0n);
        let newSp = Number(ch.sp ?? 0);
        let newCoinLuck = BigInt(ch.coinLuck ?? 0n);

        if (kind === "adena") newAdena += BigInt(50_000 * qty);
        if (kind === "exp") newExp += BigInt(100_000 * qty);
        if (kind === "sp") newSp += 50_000 * qty;
        if (kind === "coinOfLuck") newCoinLuck += BigInt(qty);

        const mergedHj: Record<string, unknown> = {
          ...heroJson,
          adena: Number(newAdena),
          exp: Number(newExp),
          sp: newSp,
          coinOfLuck: Number(newCoinLuck),
          coins_silver: Number(newSilver),
        };
        const prevDq =
          typeof mergedHj.dailyQuestsProgress === "object" && mergedHj.dailyQuestsProgress !== null
            ? (mergedHj.dailyQuestsProgress as Record<string, unknown>)
            : {};
        const dq = { ...prevDq };
        const prevEx = typeof dq.daily_exchange === "number" ? dq.daily_exchange : 0;
        dq.daily_exchange = prevEx + qty;
        mergedHj.dailyQuestsProgress = dq;

        const versioned = addVersioning(mergedHj, oldRevision);
        const updated = await tx.character.update({
          where: { id: ch.id },
          data: {
            coinsSilver: newSilver,
            adena: newAdena,
            exp: newExp,
            sp: newSp,
            coinLuck: newCoinLuck,
            heroJson: versioned,
            lastActivityAt: new Date(),
          },
          select: {
            id: true,
            name: true,
            race: true,
            classId: true,
            sex: true,
            level: true,
            exp: true,
            sp: true,
            adena: true,
            aa: true,
            coinLuck: true,
            coinsSilver: true,
            heroJson: true,
            updatedAt: true,
          },
        });
        return { ok: true as const, updated };
      });
      if (!txRes.ok) {
        if (txRes.reason === "not_found") return reply.code(404).send({ error: "character not found" });
        if (txRes.reason === "revision_conflict") return reply.code(409).send({ error: "revision_conflict", revision: txRes.revision ?? 0 });
        if (txRes.reason === "forbidden") return reply.code(400).send({ error: "forbidden" });
        return reply.code(400).send({ error: "invalid input" });
      }
      const updated = txRes.updated;

      return reply.send({
        ok: true,
        character: {
          ...updated,
          exp: Number(updated.exp),
          adena: Number(updated.adena),
          coinLuck: Number(updated.coinLuck),
          coinsSilver: Number(updated.coinsSilver),
        },
      });
    } catch (error) {
      app.log.error(error, "POST /characters/:id/quest-shop/exchange");
      return reply.code(500).send({ error: "Internal Server Error" });
    }
  });
}
