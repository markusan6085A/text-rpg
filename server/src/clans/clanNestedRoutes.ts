import type { FastifyInstance } from "fastify";
import { prisma } from "../db";
import { getAuth } from "../routes/character/auth";
import { addVersioning } from "../heroJsonValidator";
import { removeItemFromInventory, addItemToInventory, pickSafeItemFields } from "../utils/inventoryHelpers";
import { enforceCharacterMutationInvariants } from "../utils/characterMutationInvariants";
import { registerClanInviteNestedRoutes } from "../routes/clans/invites";
import { registerClanApplicationNestedRoutes } from "../routes/clans/applications";
import { registerClanMemberNestedRoutes } from "../routes/clans/members";
import { ensureClanWarehouseTable } from "./ensureClanWarehouseTable";

function serializeCharacterSnapshot(character: any) {
  if (!character) return null;
  return {
    id: character.id,
    name: character.name,
    race: character.race,
    classId: character.classId,
    sex: character.sex,
    level: Number(character.level ?? 1),
    exp: Number(character.exp ?? 0),
    sp: Number(character.sp ?? 0),
    adena: Number(character.adena ?? 0),
    aa: Number(character.aa ?? 0),
    coinLuck: Number(character.coinLuck ?? 0),
    coinsSilver: Number(character.coinsSilver ?? 0),
    heroJson: (character.heroJson as any) || {},
    updatedAt: character.updatedAt,
  };
}

export async function clanNestedRoutes(app: FastifyInstance) {
  // POST /clans/:id/adena/deposit - покласти адену в клан
  app.post("/clans/:id/adena/deposit", async (req, reply) => {
    app.log.info({ url: req.url, params: req.params, body: req.body }, "POST /clans/:id/adena/deposit called");
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });

    const { id } = req.params as { id: string };
    const { amount, expectedRevision } = req.body as { amount?: number; expectedRevision?: number };
    const expectedRevNum = Number(expectedRevision);
    
    app.log.info({ id, amount }, "Processing adena deposit");

    if (!amount || amount <= 0) {
      return reply.code(400).send({ error: "amount must be greater than 0" });
    }
    if (!Number.isFinite(expectedRevNum) || expectedRevNum < 0) {
      return reply.code(400).send({ error: "expectedRevision required" });
    }

    const txRes = await prisma.$transaction(async (tx) => {
      const locked = await tx.$queryRaw<Array<{ id: string; name: string; adena: bigint; heroJson: any }>>`
        SELECT "id", "name", "adena", "heroJson"
        FROM "Character"
        WHERE "accountId" = ${auth.accountId}
        ORDER BY "createdAt" ASC
        LIMIT 1
        FOR UPDATE
      `;
      if (locked.length === 0) return { ok: false as const, reason: "character_not_found" as const };
      const character = locked[0];
      const currentRevision = Number((character.heroJson as any)?.heroRevision ?? 0);
      if (currentRevision !== expectedRevNum) {
        return { ok: false as const, reason: "revision_conflict" as const, revision: currentRevision };
      }

      const isMember = await tx.clanMember.findFirst({
        where: { clanId: id, characterId: character.id },
      });
      const isCreator = await tx.clan.findFirst({
        where: { id, creatorId: character.id },
      });
      if (!isMember && !isCreator) return { ok: false as const, reason: "forbidden" as const };

      if (amount > Number(character.adena ?? 0n)) {
        return { ok: false as const, reason: "insufficient_adena" as const };
      }

      const clan = await tx.clan.findUnique({ where: { id }, select: { id: true } });
      if (!clan) return { ok: false as const, reason: "clan_not_found" as const };

      await tx.character.update({
        where: { id: character.id },
        data: { adena: { decrement: amount } },
      });
      await tx.clan.update({
        where: { id },
        data: { adena: { increment: amount } },
      });
      await tx.clanLog.create({
        data: {
          clanId: id,
          type: "adena_deposited",
          characterId: character.id,
          message: `${character.name} положил ${amount} адены в клан`,
          metadata: { amount },
        },
      });
      const updatedCharacter = await tx.character.findUnique({
        where: { id: character.id },
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
      return { ok: true as const, character: serializeCharacterSnapshot(updatedCharacter) };
    });

    if (!txRes.ok) {
      if (txRes.reason === "character_not_found") return reply.code(404).send({ error: "character not found" });
      if (txRes.reason === "clan_not_found") return reply.code(404).send({ error: "clan not found" });
      if (txRes.reason === "revision_conflict") return reply.code(409).send({ error: "revision_conflict", revision: txRes.revision ?? 0 });
      if (txRes.reason === "forbidden") return reply.code(403).send({ error: "you are not a member of this clan" });
      if (txRes.reason === "insufficient_adena") return reply.code(400).send({ error: "insufficient adena" });
      return reply.code(400).send({ error: "invalid input" });
    }

    return { ok: true, character: (txRes as any).character ?? null };
  });

  // POST /clans/:id/adena/withdraw - забрати адену з клану (тільки для глави)
  app.post("/clans/:id/adena/withdraw", async (req, reply) => {
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });

    const { id } = req.params as { id: string };
    const { amount, expectedRevision } = req.body as { amount?: number; expectedRevision?: number };
    const expectedRevNum = Number(expectedRevision);

    if (!amount || amount <= 0) {
      return reply.code(400).send({ error: "amount must be greater than 0" });
    }
    if (!Number.isFinite(expectedRevNum) || expectedRevNum < 0) {
      return reply.code(400).send({ error: "expectedRevision required" });
    }

    const txRes = await prisma.$transaction(async (tx) => {
      const locked = await tx.$queryRaw<Array<{ id: string; name: string; heroJson: any }>>`
        SELECT "id", "name", "heroJson"
        FROM "Character"
        WHERE "accountId" = ${auth.accountId}
        ORDER BY "createdAt" ASC
        LIMIT 1
        FOR UPDATE
      `;
      if (locked.length === 0) return { ok: false as const, reason: "character_not_found" as const };
      const character = locked[0];
      const currentRevision = Number((character.heroJson as any)?.heroRevision ?? 0);
      if (currentRevision !== expectedRevNum) {
        return { ok: false as const, reason: "revision_conflict" as const, revision: currentRevision };
      }

      const clan = await tx.clan.findUnique({ where: { id } });
      if (!clan) return { ok: false as const, reason: "clan_not_found" as const };
      if (clan.creatorId !== character.id) {
        return { ok: false as const, reason: "forbidden" as const };
      }
      if (amount > clan.adena) {
        return { ok: false as const, reason: "insufficient_clan_adena" as const };
      }

      await tx.character.update({
        where: { id: character.id },
        data: { adena: { increment: amount } },
      });
      await tx.clan.update({
        where: { id },
        data: { adena: { decrement: amount } },
      });
      await tx.clanLog.create({
        data: {
          clanId: id,
          type: "adena_withdrawn",
          characterId: character.id,
          message: `${character.name} забрал ${amount} адены из клана`,
          metadata: { amount },
        },
      });
      const updatedCharacter = await tx.character.findUnique({
        where: { id: character.id },
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
      return { ok: true as const, character: serializeCharacterSnapshot(updatedCharacter) };
    });

    if (!txRes.ok) {
      if (txRes.reason === "character_not_found") return reply.code(404).send({ error: "character not found" });
      if (txRes.reason === "clan_not_found") return reply.code(404).send({ error: "clan not found" });
      if (txRes.reason === "revision_conflict") return reply.code(409).send({ error: "revision_conflict", revision: txRes.revision ?? 0 });
      if (txRes.reason === "forbidden") return reply.code(403).send({ error: "only clan leader can withdraw adena" });
      if (txRes.reason === "insufficient_clan_adena") return reply.code(400).send({ error: "insufficient adena in clan" });
      return reply.code(400).send({ error: "invalid input" });
    }

    return { ok: true, character: (txRes as any).character ?? null };
  });

  // POST /clans/:id/coin-luck/deposit - покласти Coin of Luck в клан
  app.post("/clans/:id/coin-luck/deposit", async (req, reply) => {
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });

    const { id } = req.params as { id: string };
    const { amount, expectedRevision } = req.body as { amount?: number; expectedRevision?: number };
    const expectedRevNum = Number(expectedRevision);

    if (!amount || amount <= 0) {
      return reply.code(400).send({ error: "amount must be greater than 0" });
    }
    if (!Number.isFinite(expectedRevNum) || expectedRevNum < 0) {
      return reply.code(400).send({ error: "expectedRevision required" });
    }

    const txRes = await prisma.$transaction(async (tx) => {
      const locked = await tx.$queryRaw<Array<{ id: string; name: string; coinLuck: bigint; heroJson: any }>>`
        SELECT "id", "name", "coinLuck", "heroJson"
        FROM "Character"
        WHERE "accountId" = ${auth.accountId}
        ORDER BY "createdAt" ASC
        LIMIT 1
        FOR UPDATE
      `;
      if (locked.length === 0) return { ok: false as const, reason: "character_not_found" as const };
      const character = locked[0];
      const currentRevision = Number((character.heroJson as any)?.heroRevision ?? 0);
      if (currentRevision !== expectedRevNum) {
        return { ok: false as const, reason: "revision_conflict" as const, revision: currentRevision };
      }

      const isMember = await tx.clanMember.findFirst({
        where: { clanId: id, characterId: character.id },
      });
      const isCreator = await tx.clan.findFirst({
        where: { id, creatorId: character.id },
      });
      if (!isMember && !isCreator) return { ok: false as const, reason: "forbidden" as const };

      if (amount > Number(character.coinLuck ?? 0n)) {
        return { ok: false as const, reason: "insufficient_coin_luck" as const };
      }

      const clan = await tx.clan.findUnique({ where: { id }, select: { id: true } });
      if (!clan) return { ok: false as const, reason: "clan_not_found" as const };

      await tx.character.update({
        where: { id: character.id },
        data: { coinLuck: { decrement: amount } },
      });
      await tx.clan.update({
        where: { id },
        data: { coinLuck: { increment: amount } },
      });
      await tx.clanLog.create({
        data: {
          clanId: id,
          type: "coin_luck_deposited",
          characterId: character.id,
          message: `${character.name} положил ${amount} Coin of Luck в клан`,
          metadata: { amount },
        },
      });
      const updatedCharacter = await tx.character.findUnique({
        where: { id: character.id },
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
      return { ok: true as const, character: serializeCharacterSnapshot(updatedCharacter) };
    });

    if (!txRes.ok) {
      if (txRes.reason === "character_not_found") return reply.code(404).send({ error: "character not found" });
      if (txRes.reason === "clan_not_found") return reply.code(404).send({ error: "clan not found" });
      if (txRes.reason === "revision_conflict") return reply.code(409).send({ error: "revision_conflict", revision: txRes.revision ?? 0 });
      if (txRes.reason === "forbidden") return reply.code(403).send({ error: "you are not a member of this clan" });
      if (txRes.reason === "insufficient_coin_luck") return reply.code(400).send({ error: "insufficient coin of luck" });
      return reply.code(400).send({ error: "invalid input" });
    }

    return { ok: true, character: (txRes as any).character ?? null };
  });

  // POST /clans/:id/coin-luck/withdraw - забрати Coin of Luck з клану (тільки для глави)
  app.post("/clans/:id/coin-luck/withdraw", async (req, reply) => {
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });

    const { id } = req.params as { id: string };
    const { amount, expectedRevision } = req.body as { amount?: number; expectedRevision?: number };
    const expectedRevNum = Number(expectedRevision);

    if (!amount || amount <= 0) {
      return reply.code(400).send({ error: "amount must be greater than 0" });
    }
    if (!Number.isFinite(expectedRevNum) || expectedRevNum < 0) {
      return reply.code(400).send({ error: "expectedRevision required" });
    }

    const txRes = await prisma.$transaction(async (tx) => {
      const locked = await tx.$queryRaw<Array<{ id: string; name: string; heroJson: any }>>`
        SELECT "id", "name", "heroJson"
        FROM "Character"
        WHERE "accountId" = ${auth.accountId}
        ORDER BY "createdAt" ASC
        LIMIT 1
        FOR UPDATE
      `;
      if (locked.length === 0) return { ok: false as const, reason: "character_not_found" as const };
      const character = locked[0];
      const currentRevision = Number((character.heroJson as any)?.heroRevision ?? 0);
      if (currentRevision !== expectedRevNum) {
        return { ok: false as const, reason: "revision_conflict" as const, revision: currentRevision };
      }

      const clan = await tx.clan.findUnique({ where: { id } });
      if (!clan) return { ok: false as const, reason: "clan_not_found" as const };
      if (clan.creatorId !== character.id) {
        return { ok: false as const, reason: "forbidden" as const };
      }
      if (amount > clan.coinLuck) {
        return { ok: false as const, reason: "insufficient_clan_coin_luck" as const };
      }

      await tx.character.update({
        where: { id: character.id },
        data: { coinLuck: { increment: amount } },
      });
      await tx.clan.update({
        where: { id },
        data: { coinLuck: { decrement: amount } },
      });
      await tx.clanLog.create({
        data: {
          clanId: id,
          type: "coin_luck_withdrawn",
          characterId: character.id,
          message: `${character.name} забрал ${amount} Coin of Luck из клана`,
          metadata: { amount },
        },
      });
      const updatedCharacter = await tx.character.findUnique({
        where: { id: character.id },
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
      return { ok: true as const, character: serializeCharacterSnapshot(updatedCharacter) };
    });

    if (!txRes.ok) {
      if (txRes.reason === "character_not_found") return reply.code(404).send({ error: "character not found" });
      if (txRes.reason === "clan_not_found") return reply.code(404).send({ error: "clan not found" });
      if (txRes.reason === "revision_conflict") return reply.code(409).send({ error: "revision_conflict", revision: txRes.revision ?? 0 });
      if (txRes.reason === "forbidden") return reply.code(403).send({ error: "only clan leader can withdraw coin of luck" });
      if (txRes.reason === "insufficient_clan_coin_luck") return reply.code(400).send({ error: "insufficient coin of luck in clan" });
      return reply.code(400).send({ error: "invalid input" });
    }

    return { ok: true, character: (txRes as any).character ?? null };
  });

  // GET /clans/:id/warehouse - склад клану
  app.get("/clans/:id/warehouse", async (req, reply) => {
    try {
      await ensureClanWarehouseTable(app);
      app.log.info({ url: req.url, params: req.params }, "GET /clans/:id/warehouse called");
      const auth = getAuth(req);
      if (!auth) return reply.code(401).send({ error: "unauthorized" });

      const { id } = req.params as { id: string };
      const { page = "1", limit = "10" } = req.query as { page?: string; limit?: string };

      const pageNum = parseInt(page, 10) || 1;
      const limitNum = Math.min(parseInt(limit, 10) || 10, 50);

      const character = await prisma.character.findFirst({
        where: { accountId: auth.accountId },
      });

      if (!character) {
        return reply.code(404).send({ error: "character not found" });
      }

      const isMember = await prisma.clanMember.findFirst({
        where: {
          clanId: id,
          characterId: character.id,
        },
      });

      const isCreator = await prisma.clan.findFirst({
        where: {
          id,
          creatorId: character.id,
        },
      });

      if (!isMember && !isCreator) {
        return reply.code(403).send({ error: "you are not a member of this clan" });
      }

      // Переконаємося, що таблиця існує перед використанням
      let items: any[] = [];
      let total = 0;
      try {
        items = await prisma.clanWarehouse.findMany({
          where: { clanId: id },
          orderBy: { depositedAt: "desc" },
          take: limitNum,
          skip: (pageNum - 1) * limitNum,
        });

        total = await prisma.clanWarehouse.count({
          where: { clanId: id },
        });
      } catch (queryError: any) {
        app.log.warn({ error: queryError.message, code: queryError.code }, "Error during warehouse query, checking if table exists...");
        if (queryError?.message?.includes('does not exist') || queryError?.code === '42P01' || queryError?.message?.includes('ClanWarehouse')) {
          app.log.warn("ClanWarehouse table missing during query, ensuring it exists...");
          await ensureClanWarehouseTable(app);
          // Невелика затримка, щоб дати базі час на створення таблиці
          await new Promise(resolve => setTimeout(resolve, 100));
          // Спробуємо ще раз після створення таблиці
          try {
            items = await prisma.clanWarehouse.findMany({
              where: { clanId: id },
              orderBy: { depositedAt: "desc" },
              take: limitNum,
              skip: (pageNum - 1) * limitNum,
            });

            total = await prisma.clanWarehouse.count({
              where: { clanId: id },
            });
            app.log.info({ itemsCount: items.length, total }, "Query successful after table creation");
          } catch (retryError: any) {
            app.log.error({ error: retryError.message }, "Query failed even after table creation");
            throw retryError;
          }
        } else {
          throw queryError;
        }
      }

      return {
        ok: true,
        items: items.map((item) => ({
          id: item.id,
          itemId: item.itemId,
          qty: item.qty,
          meta: item.meta || {},
          depositedBy: item.depositedBy || null,
          depositedAt: item.depositedAt,
        })),
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      };
    } catch (error: any) {
      app.log.error({ error: error.message, stack: error.stack }, "Error in warehouse GET");
      return reply.code(500).send({ error: error.message || "Internal server error" });
    }
  });

  // POST /clans/:id/warehouse/deposit - покласти предмет в склад
  app.post("/clans/:id/warehouse/deposit", async (req, reply) => {
    try {
      await ensureClanWarehouseTable(app);
      app.log.info({ url: req.url, params: req.params, body: req.body }, "POST /clans/:id/warehouse/deposit called");
      const auth = getAuth(req);
      if (!auth) return reply.code(401).send({ error: "unauthorized" });

      const { id } = req.params as { id: string };
      const { itemId, qty = 1, meta = {}, expectedRevision } = req.body as {
        itemId?: string;
        qty?: number;
        meta?: any;
        expectedRevision?: number;
      };
      const expectedRevNum = Number(expectedRevision);

      app.log.info({ id, itemId, qty, meta }, "Processing warehouse deposit");

      if (!itemId) {
        return reply.code(400).send({ error: "itemId is required" });
      }
      if (!Number.isFinite(expectedRevNum) || expectedRevNum < 0) {
        return reply.code(400).send({ error: "expectedRevision required" });
      }
      if (String(itemId).trim() === "seven_seals_medal") {
        return reply.code(400).send({ error: "seven_seals_medal cannot be deposited" });
      }

      const character = await prisma.character.findFirst({
        where: { accountId: auth.accountId },
        select: { id: true, name: true, heroJson: true },
      });

      if (!character) {
        return reply.code(404).send({ error: "character not found" });
      }

      const isMember = await prisma.clanMember.findFirst({
        where: {
          clanId: id,
          characterId: character.id,
        },
      });

      const isCreator = await prisma.clan.findFirst({
        where: {
          id,
          creatorId: character.id,
        },
      });

      if (!isMember && !isCreator) {
        return reply.code(403).send({ error: "you are not a member of this clan" });
      }

      const qtyNum = Math.max(1, Math.floor(Number(qty) || 1));
      const heroJson = (character.heroJson as any) || {};
      const currentInventory = Array.isArray(heroJson.inventory) ? heroJson.inventory : [];
      let newInventory: any[];
      let transferItem: any;
      try {
        const result = removeItemFromInventory(currentInventory, {
          id: String(itemId),
          count: qtyNum,
          enchantLevel: (meta && typeof meta === "object" && Number(meta.enchantLevel)) || 0,
        });
        newInventory = result.newInventory;
        transferItem = result.transferItem;
      } catch (invErr: any) {
        return reply.code(400).send({ error: invErr.message || "not enough items in inventory" });
      }

      // Перевіряємо ліміт складу (200 предметів)
      // Спочатку переконаємося, що таблиця існує
      let currentCount = 0;
      try {
        currentCount = await prisma.clanWarehouse.count({
          where: { clanId: id },
        });
      } catch (countError: any) {
        app.log.warn({ error: countError.message, code: countError.code }, "Error during count, checking if table exists...");
        if (countError?.message?.includes('does not exist') || countError?.code === '42P01' || countError?.message?.includes('ClanWarehouse')) {
          app.log.warn("ClanWarehouse table missing during count, ensuring it exists...");
          await ensureClanWarehouseTable(app);
          // Невелика затримка, щоб дати базі час на створення таблиці
          await new Promise(resolve => setTimeout(resolve, 100));
          // Спробуємо ще раз після створення таблиці
          try {
            currentCount = await prisma.clanWarehouse.count({
              where: { clanId: id },
            });
            app.log.info({ currentCount }, "Count successful after table creation");
          } catch (retryError: any) {
            app.log.error({ error: retryError.message }, "Count failed even after table creation");
            throw retryError;
          }
        } else {
          throw countError;
        }
      }

      if (currentCount >= 200) {
        return reply.code(400).send({ error: "clan warehouse is full (200 items max)" });
      }

      const metaData = (meta && typeof meta === "object" && !Array.isArray(meta))
        ? meta
        : { name: transferItem?.name, icon: transferItem?.icon, slot: transferItem?.slot };

      const clanExists = await prisma.clan.findUnique({
        where: { id },
        select: { id: true },
      });

      if (!clanExists) {
        return reply.code(404).send({ error: "clan not found" });
      }

      app.log.info({ clanId: id, itemId, qty: qtyNum, metaData, depositedBy: character.id }, "Creating warehouse item");

      let mutationResult: { warehouseItem: any; character: any } | null = null;
      try {
        mutationResult = await prisma.$transaction(async (tx) => {
          const locked = await tx.$queryRaw<Array<{ id: string; heroJson: any }>>`
            SELECT "id", "heroJson"
            FROM "Character"
            WHERE "id" = ${character.id} AND "accountId" = ${auth.accountId}
            FOR UPDATE
          `;
          if (locked.length === 0) throw new Error("character not found");
          const currentRevision = Number((locked[0]?.heroJson as any)?.heroRevision ?? 0);
          if (currentRevision !== expectedRevNum) throw new Error("revision_conflict");

          const oldRevision = Number(heroJson.heroRevision ?? 0) || 0;
          const updatedHeroJson = addVersioning(
            { ...heroJson, inventory: newInventory },
            oldRevision
          );
          const invariants = enforceCharacterMutationInvariants({ heroJson: updatedHeroJson });
          if (!invariants.ok) throw new Error("mutation_invariant_failed");
          const updatedCharacter = await tx.character.update({
            where: { id: character.id },
            data: { heroJson: invariants.heroJson },
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
          const warehouseItem = await tx.clanWarehouse.create({
            data: {
              clanId: id,
              itemId: String(itemId),
              qty: qtyNum,
              meta: metaData,
              depositedBy: character.id,
            },
          });
          return {
            warehouseItem,
            character: serializeCharacterSnapshot(updatedCharacter),
          };
        });
      } catch (createError: any) {
        app.log.warn({ error: createError.message, code: createError.code }, "Error during warehouse create, checking if table exists...");
        if (createError?.message?.includes('does not exist') || createError?.code === '42P01' || createError?.message?.includes('ClanWarehouse')) {
          app.log.warn("ClanWarehouse table missing during create, ensuring it exists...");
          await ensureClanWarehouseTable(app);
          await new Promise(resolve => setTimeout(resolve, 100));
          try {
            mutationResult = await prisma.$transaction(async (tx) => {
              const locked = await tx.$queryRaw<Array<{ id: string; heroJson: any }>>`
                SELECT "id", "heroJson"
                FROM "Character"
                WHERE "id" = ${character.id} AND "accountId" = ${auth.accountId}
                FOR UPDATE
              `;
              if (locked.length === 0) throw new Error("character not found");
              const currentRevision = Number((locked[0]?.heroJson as any)?.heroRevision ?? 0);
              if (currentRevision !== expectedRevNum) throw new Error("revision_conflict");

              const oldRevision = Number(heroJson.heroRevision ?? 0) || 0;
              const updatedHeroJson = addVersioning(
                { ...heroJson, inventory: newInventory },
                oldRevision
              );
              const invariants = enforceCharacterMutationInvariants({ heroJson: updatedHeroJson });
              if (!invariants.ok) throw new Error("mutation_invariant_failed");
              const updatedCharacter = await tx.character.update({
                where: { id: character.id },
                data: { heroJson: invariants.heroJson },
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
              const warehouseItem = await tx.clanWarehouse.create({
                data: {
                  clanId: id,
                  itemId: String(itemId),
                  qty: qtyNum,
                  meta: metaData,
                  depositedBy: character.id,
                },
              });
              return {
                warehouseItem,
                character: serializeCharacterSnapshot(updatedCharacter),
              };
            });
            app.log.info({ warehouseItemId: mutationResult?.warehouseItem?.id }, "Create successful after table creation");
          } catch (retryError: any) {
            app.log.error({ error: retryError.message }, "Create failed even after table creation");
            throw retryError;
          }
        } else {
          throw createError;
        }
      }

      app.log.info({ warehouseItemId: mutationResult?.warehouseItem?.id }, "Warehouse item created");

      // Додаємо лог
      try {
        await prisma.clanLog.create({
          data: {
            clanId: id,
            type: "item_deposited",
            characterId: character.id,
            message: `${character.name} положил предмет в склад`,
            metadata: { itemId: String(itemId), qty: Number(qty) || 1 } as any,
          },
        });
      } catch (logError: any) {
        app.log.warn({ logError: logError.message }, "Failed to create clan log, but item was deposited");
        // Не кидаємо помилку, бо предмет вже покладено
      }

      return {
        ok: true,
        character: mutationResult?.character ?? null,
        item: {
          id: mutationResult?.warehouseItem?.id,
          itemId: mutationResult?.warehouseItem?.itemId,
          qty: mutationResult?.warehouseItem?.qty,
          meta: mutationResult?.warehouseItem?.meta || {},
          depositedBy: mutationResult?.warehouseItem?.depositedBy || null,
          depositedAt: mutationResult?.warehouseItem?.depositedAt,
        },
      };
    } catch (error: any) {
      if (error?.message === "revision_conflict") {
        return reply.code(409).send({ error: "revision_conflict" });
      }
      if (error?.message === "mutation_invariant_failed") {
        return reply.code(400).send({ error: "mutation_invariant_failed" });
      }
      app.log.error({ error: error.message, stack: error.stack }, "Error in warehouse deposit");
      return reply.code(500).send({ error: error.message || "Internal server error" });
    }
  });

  // POST /clans/:id/warehouse/withdraw - забрати предмет зі складу
  // itemId в body = id запису ClanWarehouse (warehouse row id), не itemId предмета
  app.post("/clans/:id/warehouse/withdraw", async (req, reply) => {
    try {
      await ensureClanWarehouseTable(app);
    } catch (error: any) {
      app.log.error({ error: error.message }, "Failed to ensure ClanWarehouse table");
    }
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });

    const { id } = req.params as { id: string };
    const { itemId: warehouseRowId, expectedRevision } = req.body as {
      itemId?: string;
      expectedRevision?: number;
    };
    const expectedRevNum = Number(expectedRevision);

    if (!warehouseRowId) {
      return reply.code(400).send({ error: "itemId is required" });
    }
    if (!Number.isFinite(expectedRevNum) || expectedRevNum < 0) {
      return reply.code(400).send({ error: "expectedRevision required" });
    }

    const character = await prisma.character.findFirst({
      where: { accountId: auth.accountId },
      select: { id: true, name: true, heroJson: true },
    });

    if (!character) {
      return reply.code(404).send({ error: "character not found" });
    }

    const isMember = await prisma.clanMember.findFirst({
      where: {
        clanId: id,
        characterId: character.id,
      },
    });

    const isCreator = await prisma.clan.findFirst({
      where: {
        id,
        creatorId: character.id,
      },
    });

    if (!isMember && !isCreator) {
      return reply.code(403).send({ error: "you are not a member of this clan" });
    }

    const warehouseItem = await prisma.clanWarehouse.findFirst({
      where: {
        clanId: id,
        id: warehouseRowId,
      },
    });

    if (!warehouseItem) {
      return reply.code(404).send({ error: "item not found in warehouse" });
    }

    const meta = (warehouseItem.meta as any) || {};
    const itemToAdd = pickSafeItemFields(
      {
        id: warehouseItem.itemId,
        name: meta.name,
        icon: meta.icon,
        slot: meta.slot,
        kind: meta.kind,
        count: warehouseItem.qty,
      },
      warehouseItem.qty
    );

    const heroJson = (character.heroJson as any) || {};
    const currentInventory = Array.isArray(heroJson.inventory) ? heroJson.inventory : [];
    const newInventory = addItemToInventory(currentInventory, itemToAdd);
    const oldRevision = Number(heroJson.heroRevision ?? 0) || 0;
    const updatedHeroJson = addVersioning(
      { ...heroJson, inventory: newInventory },
      oldRevision
    );
    const invariants = enforceCharacterMutationInvariants({ heroJson: updatedHeroJson });
    if (!invariants.ok) {
      return reply.code(400).send({ error: "mutation_invariant_failed" });
    }

    let updatedCharacterSnapshot: any = null;
    try {
      await prisma.$transaction(async (tx) => {
        const locked = await tx.$queryRaw<Array<{ id: string; heroJson: any }>>`
          SELECT "id", "heroJson"
          FROM "Character"
          WHERE "id" = ${character.id} AND "accountId" = ${auth.accountId}
          FOR UPDATE
        `;
        if (locked.length === 0) throw new Error("character not found");
        const currentRevision = Number((locked[0]?.heroJson as any)?.heroRevision ?? 0);
        if (currentRevision !== expectedRevNum) throw new Error("revision_conflict");

        const updatedCharacter = await tx.character.update({
          where: { id: character.id },
          data: { heroJson: invariants.heroJson },
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
        updatedCharacterSnapshot = serializeCharacterSnapshot(updatedCharacter);
        await tx.clanWarehouse.delete({
          where: { id: warehouseItem.id },
        });
        await tx.clanLog.create({
          data: {
            clanId: id,
            type: "item_withdrawn",
            characterId: character.id,
            message: `${character.name} забрал предмет из склада`,
            metadata: { itemId: warehouseItem.itemId, qty: warehouseItem.qty },
          },
        });
      });
    } catch (error: any) {
      if (error?.message === "revision_conflict") {
        return reply.code(409).send({ error: "revision_conflict" });
      }
      throw error;
    }

    return { ok: true, character: updatedCharacterSnapshot };
  });

  // POST /clans/:id/emblem - встановити емблему клану (тільки для глави)
  app.post("/clans/:id/emblem", async (req, reply) => {
    app.log.info({ url: req.url, params: req.params, body: req.body }, "POST /clans/:id/emblem called");
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });

    const { id } = req.params as { id: string };
    const { emblem } = req.body as { emblem?: string };

    if (!emblem) {
      return reply.code(400).send({ error: "emblem is required" });
    }

    const character = await prisma.character.findFirst({
      where: { accountId: auth.accountId },
    });

    if (!character) {
      return reply.code(404).send({ error: "character not found" });
    }

    const clan = await prisma.clan.findUnique({
      where: { id },
      include: {
        creator: {
          select: { id: true, name: true },
        },
      },
    });

    if (!clan) {
      return reply.code(404).send({ error: "clan not found" });
    }

    // Перевіряємо, чи гравець є головою клану
    if (clan.creatorId !== character.id) {
      return reply.code(403).send({ error: "only clan leader can set emblem" });
    }

    // Оновлюємо емблему
    const updatedClan = await prisma.clan.update({
      where: { id },
      data: { emblem } as any,
      include: {
        creator: {
          select: { id: true, name: true },
        },
      },
    });

    // Додаємо лог
    await prisma.clanLog.create({
      data: {
        clanId: id,
        type: "emblem_changed",
        characterId: character.id,
        message: `${character.name} изменил эмблему клана`,
        metadata: { emblem },
      },
    });

    return {
      ok: true,
      clan: updatedClan,
    };
  });

  // Invite, apply, leave, transfer
  registerClanInviteNestedRoutes(app);
  registerClanApplicationNestedRoutes(app);
  registerClanMemberNestedRoutes(app);

  // PATCH /clans/:id/announcement - оголошення клану (лідер/зам)
  app.patch("/clans/:id/announcement", async (req, reply) => {
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });

    const { id } = req.params as { id: string };
    const { announcement } = req.body as { announcement?: string };

    const character = await prisma.character.findFirst({
      where: { accountId: auth.accountId },
    });
    if (!character) return reply.code(404).send({ error: "character not found" });

    const isLeader = await prisma.clan.findFirst({
      where: { id, creatorId: character.id },
    });
    const isDeputy = await prisma.clanMember.findFirst({
      where: { clanId: id, characterId: character.id, isDeputy: true },
    });
    if (!isLeader && !isDeputy) {
      return reply.code(403).send({ error: "only leader or deputy can set announcement" });
    }

    const text = announcement != null ? String(announcement).slice(0, 500) : "";
    const updated = await prisma.clan.update({
      where: { id },
      data: { announcement: text },
    });

    return { ok: true, announcement: updated.announcement };
  });
}
