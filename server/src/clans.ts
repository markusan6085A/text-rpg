import type { FastifyInstance } from "fastify";
import jwt from "jsonwebtoken";
import { prisma } from "./db";

// Функція для перевірки та створення таблиці ClanWarehouse, якщо вона не існує
async function ensureClanWarehouseTable(app: FastifyInstance) {
  try {
    // Перевіряємо, чи існує таблиця
    await prisma.$queryRaw`SELECT 1 FROM "ClanWarehouse" LIMIT 1`;
    app.log.debug("ClanWarehouse table exists");
  } catch (error: any) {
    // Якщо таблиця не існує, створюємо її
    if (error?.message?.includes('does not exist') || error?.code === '42P01' || error?.message?.includes('ClanWarehouse')) {
      app.log.warn({ error: error.message }, "ClanWarehouse table does not exist, creating it...");
      try {
        // Спочатку створюємо таблицю
        await prisma.$executeRawUnsafe(`
          CREATE TABLE IF NOT EXISTS "ClanWarehouse" (
            "id" TEXT NOT NULL,
            "clanId" TEXT NOT NULL,
            "itemId" TEXT NOT NULL,
            "qty" INTEGER NOT NULL DEFAULT 1,
            "meta" JSONB NOT NULL DEFAULT '{}',
            "depositedBy" TEXT,
            "depositedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT "ClanWarehouse_pkey" PRIMARY KEY ("id")
          );
        `);
        
        // Створюємо індекси
        await prisma.$executeRawUnsafe(`
          CREATE INDEX IF NOT EXISTS "ClanWarehouse_clanId_idx" ON "ClanWarehouse"("clanId");
        `);
        
        await prisma.$executeRawUnsafe(`
          CREATE INDEX IF NOT EXISTS "ClanWarehouse_clanId_depositedAt_idx" ON "ClanWarehouse"("clanId", "depositedAt");
        `);
        
        // Додаємо foreign key, якщо таблиця Clan існує
        const clanExists = await prisma.$queryRaw<Array<{exists: boolean}>>`
          SELECT EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = 'Clan'
          ) as exists;
        `;
        
        if (clanExists[0]?.exists) {
          const fkExists = await prisma.$queryRaw<Array<{exists: boolean}>>`
            SELECT EXISTS (
              SELECT 1 FROM pg_constraint 
              WHERE conname = 'ClanWarehouse_clanId_fkey'
            ) as exists;
          `;
          
          if (!fkExists[0]?.exists) {
            await prisma.$executeRawUnsafe(`
              ALTER TABLE "ClanWarehouse" 
              ADD CONSTRAINT "ClanWarehouse_clanId_fkey" 
              FOREIGN KEY ("clanId") REFERENCES "Clan"("id") 
              ON DELETE CASCADE ON UPDATE CASCADE;
            `);
          }
        }
        
        app.log.info("ClanWarehouse table created successfully");
      } catch (createError: any) {
        app.log.error({ error: createError.message, stack: createError.stack }, "Failed to create ClanWarehouse table");
        // Не кидаємо помилку далі, щоб не блокувати запит
      }
    } else {
      app.log.error({ error: error.message }, "Unexpected error checking ClanWarehouse table");
      // Не кидаємо помилку, спробуємо продовжити
    }
  }
}

function getAuth(req: any): { accountId: string; login: string; characterId?: string } | null {
  const header = req.headers?.authorization || "";
  const [type, token] = String(header).split(" ");
  if (type !== "Bearer" || !token) return null;

  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is missing in .env");

  try {
    const payload = jwt.verify(token, secret) as any;
    if (!payload?.accountId) return null;
    return { accountId: payload.accountId, login: payload.login, characterId: payload.characterId };
  } catch {
    return null;
  }
}

// 🔥 Окремий плагін для вкладених роутів /clans/:id/*
async function clanNestedRoutes(app: FastifyInstance) {
  // POST /clans/:id/adena/deposit - покласти адену в клан
  app.post("/clans/:id/adena/deposit", async (req, reply) => {
    app.log.info({ url: req.url, params: req.params, body: req.body }, "POST /clans/:id/adena/deposit called");
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });

    const { id } = req.params as { id: string };
    const { amount } = req.body as { amount?: number };
    
    app.log.info({ id, amount }, "Processing adena deposit");

    if (!amount || amount <= 0) {
      return reply.code(400).send({ error: "amount must be greater than 0" });
    }

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

    if (amount > (character.adena || 0)) {
      return reply.code(400).send({ error: "insufficient adena" });
    }

    // Оновлюємо адену гравця та клану
    await prisma.character.update({
      where: { id: character.id },
      data: { adena: { decrement: amount } },
    });

    await prisma.clan.update({
      where: { id },
      data: { adena: { increment: amount } },
    });

    // Додаємо лог
    await prisma.clanLog.create({
      data: {
        clanId: id,
        type: "adena_deposited",
        characterId: character.id,
        message: `${character.name} положил ${amount} адены в клан`,
        metadata: { amount },
      },
    });

    return { ok: true };
  });

  // POST /clans/:id/adena/withdraw - забрати адену з клану (тільки для глави)
  app.post("/clans/:id/adena/withdraw", async (req, reply) => {
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });

    const { id } = req.params as { id: string };
    const { amount } = req.body as { amount?: number };

    if (!amount || amount <= 0) {
      return reply.code(400).send({ error: "amount must be greater than 0" });
    }

    const character = await prisma.character.findFirst({
      where: { accountId: auth.accountId },
    });

    if (!character) {
      return reply.code(404).send({ error: "character not found" });
    }

    const clan = await prisma.clan.findUnique({
      where: { id },
    });

    if (!clan) {
      return reply.code(404).send({ error: "clan not found" });
    }

    if (clan.creatorId !== character.id) {
      return reply.code(403).send({ error: "only clan leader can withdraw adena" });
    }

    if (amount > clan.adena) {
      return reply.code(400).send({ error: "insufficient adena in clan" });
    }

    // Оновлюємо адену гравця та клану
    await prisma.character.update({
      where: { id: character.id },
      data: { adena: { increment: amount } },
    });

    await prisma.clan.update({
      where: { id },
      data: { adena: { decrement: amount } },
    });

    // Додаємо лог
    await prisma.clanLog.create({
      data: {
        clanId: id,
        type: "adena_withdrawn",
        characterId: character.id,
        message: `${character.name} забрал ${amount} адены из клана`,
        metadata: { amount },
      },
    });

    return { ok: true };
  });

  // POST /clans/:id/coin-luck/deposit - покласти Coin of Luck в клан
  app.post("/clans/:id/coin-luck/deposit", async (req, reply) => {
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });

    const { id } = req.params as { id: string };
    const { amount } = req.body as { amount?: number };

    if (!amount || amount <= 0) {
      return reply.code(400).send({ error: "amount must be greater than 0" });
    }

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

    if (amount > (character.coinLuck || 0)) {
      return reply.code(400).send({ error: "insufficient coin of luck" });
    }

    // Оновлюємо Coin of Luck гравця та клану
    await prisma.character.update({
      where: { id: character.id },
      data: { coinLuck: { decrement: amount } },
    });

    await prisma.clan.update({
      where: { id },
      data: { coinLuck: { increment: amount } },
    });

    // Додаємо лог
    await prisma.clanLog.create({
      data: {
        clanId: id,
        type: "coin_luck_deposited",
        characterId: character.id,
        message: `${character.name} положил ${amount} Coin of Luck в клан`,
        metadata: { amount },
      },
    });

    return { ok: true };
  });

  // POST /clans/:id/coin-luck/withdraw - забрати Coin of Luck з клану (тільки для глави)
  app.post("/clans/:id/coin-luck/withdraw", async (req, reply) => {
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });

    const { id } = req.params as { id: string };
    const { amount } = req.body as { amount?: number };

    if (!amount || amount <= 0) {
      return reply.code(400).send({ error: "amount must be greater than 0" });
    }

    const character = await prisma.character.findFirst({
      where: { accountId: auth.accountId },
    });

    if (!character) {
      return reply.code(404).send({ error: "character not found" });
    }

    const clan = await prisma.clan.findUnique({
      where: { id },
    });

    if (!clan) {
      return reply.code(404).send({ error: "clan not found" });
    }

    if (clan.creatorId !== character.id) {
      return reply.code(403).send({ error: "only clan leader can withdraw coin of luck" });
    }

    if (amount > clan.coinLuck) {
      return reply.code(400).send({ error: "insufficient coin of luck in clan" });
    }

    // Оновлюємо Coin of Luck гравця та клану
    await prisma.character.update({
      where: { id: character.id },
      data: { coinLuck: { increment: amount } },
    });

    await prisma.clan.update({
      where: { id },
      data: { coinLuck: { decrement: amount } },
    });

    // Додаємо лог
    await prisma.clanLog.create({
      data: {
        clanId: id,
        type: "coin_luck_withdrawn",
        characterId: character.id,
        message: `${character.name} забрал ${amount} Coin of Luck из клана`,
        metadata: { amount },
      },
    });

    return { ok: true };
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
        if (queryError?.message?.includes('does not exist') || queryError?.code === '42P01') {
          app.log.warn("ClanWarehouse table missing during query, ensuring it exists...");
          await ensureClanWarehouseTable(app);
          // Спробуємо ще раз після створення таблиці
          items = await prisma.clanWarehouse.findMany({
            where: { clanId: id },
            orderBy: { depositedAt: "desc" },
            take: limitNum,
            skip: (pageNum - 1) * limitNum,
          });

          total = await prisma.clanWarehouse.count({
            where: { clanId: id },
          });
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
      const { itemId, qty = 1, meta = {} } = req.body as { itemId?: string; qty?: number; meta?: any };

      app.log.info({ id, itemId, qty, meta }, "Processing warehouse deposit");

      if (!itemId) {
        return reply.code(400).send({ error: "itemId is required" });
      }

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

      // Перевіряємо ліміт складу (200 предметів)
      // Спочатку переконаємося, що таблиця існує
      let currentCount = 0;
      try {
        currentCount = await prisma.clanWarehouse.count({
          where: { clanId: id },
        });
      } catch (countError: any) {
        if (countError?.message?.includes('does not exist') || countError?.code === '42P01') {
          app.log.warn("ClanWarehouse table missing during count, ensuring it exists...");
          await ensureClanWarehouseTable(app);
          // Спробуємо ще раз після створення таблиці
          currentCount = await prisma.clanWarehouse.count({
            where: { clanId: id },
          });
        } else {
          throw countError;
        }
      }

      if (currentCount >= 200) {
        return reply.code(400).send({ error: "clan warehouse is full (200 items max)" });
      }

      // TODO: Перевірити, чи є предмет у гравця та забрати його

      // Переконуємося, що meta є об'єктом
      let metaData: any = {};
      try {
        if (meta && typeof meta === 'object' && !Array.isArray(meta)) {
          metaData = meta;
        }
      } catch (e) {
        app.log.warn({ error: e }, "Failed to parse meta, using empty object");
        metaData = {};
      }

      // Перевіряємо, чи клан існує
      const clanExists = await prisma.clan.findUnique({
        where: { id },
        select: { id: true },
      });

      if (!clanExists) {
        return reply.code(404).send({ error: "clan not found" });
      }

      app.log.info({ clanId: id, itemId, qty, metaData, depositedBy: character.id }, "Creating warehouse item");

      let warehouseItem;
      try {
        warehouseItem = await prisma.clanWarehouse.create({
          data: {
            clanId: id,
            itemId: String(itemId),
            qty: Math.max(1, Math.floor(Number(qty) || 1)),
            meta: metaData,
            depositedBy: character.id,
          },
        });
      } catch (createError: any) {
        if (createError?.message?.includes('does not exist') || createError?.code === '42P01') {
          app.log.warn("ClanWarehouse table missing during create, ensuring it exists...");
          await ensureClanWarehouseTable(app);
          // Спробуємо ще раз після створення таблиці
          warehouseItem = await prisma.clanWarehouse.create({
            data: {
              clanId: id,
              itemId: String(itemId),
              qty: Math.max(1, Math.floor(Number(qty) || 1)),
              meta: metaData,
              depositedBy: character.id,
            },
          });
        } else {
          throw createError;
        }
      }

      app.log.info({ warehouseItemId: warehouseItem.id }, "Warehouse item created");

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
        item: {
          id: warehouseItem.id,
          itemId: warehouseItem.itemId,
          qty: warehouseItem.qty,
          meta: warehouseItem.meta || {},
          depositedBy: warehouseItem.depositedBy || null,
          depositedAt: warehouseItem.depositedAt,
        },
      };
    } catch (error: any) {
      app.log.error({ error: error.message, stack: error.stack }, "Error in warehouse deposit");
      return reply.code(500).send({ error: error.message || "Internal server error" });
    }
  });

  // POST /clans/:id/warehouse/withdraw - забрати предмет зі складу
  app.post("/clans/:id/warehouse/withdraw", async (req, reply) => {
    try {
      await ensureClanWarehouseTable(app);
    } catch (error: any) {
      app.log.error({ error: error.message }, "Failed to ensure ClanWarehouse table");
    }
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });

    const { id } = req.params as { id: string };
    const { itemId } = req.body as { itemId?: string };

    if (!itemId) {
      return reply.code(400).send({ error: "itemId is required" });
    }

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

    const warehouseItem = await prisma.clanWarehouse.findFirst({
      where: {
        clanId: id,
        id: itemId,
      },
    });

    if (!warehouseItem) {
      return reply.code(404).send({ error: "item not found in warehouse" });
    }

    await prisma.clanWarehouse.delete({
      where: { id: warehouseItem.id },
    });

    // Додаємо лог
    await prisma.clanLog.create({
      data: {
        clanId: id,
        type: "item_withdrawn",
        characterId: character.id,
        message: `${character.name} забрал предмет из склада`,
        metadata: { itemId: warehouseItem.itemId, qty: warehouseItem.qty },
      },
    });

    // TODO: Додати предмет гравцю

    return { ok: true };
  });
}

export async function clanRoutes(app: FastifyInstance) {
  // 🔥 КРИТИЧНО: Спочатку реєструємо вкладені роути (специфічні) з префіксом
  // Використовуємо префікс, щоб гарантувати правильний порядок обробки
  await app.register(clanNestedRoutes, { prefix: "" });
  
  // GET /clans - список всіх кланів
  app.get("/clans", async (req, reply) => {
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });

    const clans = await prisma.clan.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        level: true,
        reputation: true,
        adena: true,
        coinLuck: true,
        createdAt: true,
        _count: {
          select: { members: true },
        },
      },
    });

    return { ok: true, clans };
  });

  // GET /clans/my - мій клан (якщо є)
  app.get("/clans/my", async (req, reply) => {
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });

    // Знаходимо персонажа по accountId (беремо першого)
    const character = await prisma.character.findFirst({
      where: { accountId: auth.accountId },
    });

    if (!character) {
      return reply.code(404).send({ error: "character not found" });
    }

    // Перевіряємо, чи гравець створив клан або є членом клану
    const createdClan = await prisma.clan.findFirst({
      where: { creatorId: character.id },
      include: {
        creator: {
          select: { id: true, name: true },
        },
      },
    });

    const memberClan = await prisma.clanMember.findFirst({
      where: { characterId: character.id },
      include: {
        clan: {
          include: {
            creator: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    const clan = createdClan || memberClan?.clan;
    if (!clan) {
      return { ok: true, clan: null };
    }

    // Завантажуємо членів клану
    const members = await prisma.clanMember.findMany({
      where: { clanId: clan.id },
      include: {
        character: {
          select: {
            id: true,
            name: true,
            lastActivityAt: true,
          },
        },
      },
      orderBy: [
        { isDeputy: "desc" },
        { joinedAt: "asc" },
      ],
    });

    // Визначаємо, чи поточний гравець є головою
    const isLeader = clan.creatorId === character.id;

    return {
      ok: true,
      clan: {
        id: clan.id,
        name: clan.name,
        level: clan.level,
        reputation: clan.reputation,
        adena: clan.adena,
        coinLuck: clan.coinLuck,
        createdAt: clan.createdAt,
        creator: {
          id: clan.creator.id,
          name: clan.creator.name,
        },
        members: members.map((m) => ({
          id: m.id,
          characterId: m.character.id,
          characterName: m.character.name,
          title: m.title,
          isDeputy: m.isDeputy,
          joinedAt: m.joinedAt,
          isOnline: m.character.lastActivityAt
            ? new Date(m.character.lastActivityAt).getTime() > Date.now() - 5 * 60 * 1000
            : false,
        })),
        isLeader,
        memberCount: members.length,
      },
    };
  });

  // POST /clans - створити клан
  app.post("/clans", async (req, reply) => {
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });

    const { name } = req.body as { name?: string };

    if (!name || typeof name !== "string") {
      return reply.code(400).send({ error: "name is required" });
    }

    if (name.length < 3 || name.length > 16) {
      return reply.code(400).send({ error: "name must be between 3 and 16 characters" });
    }

    // Знаходимо персонажа
    const character = await prisma.character.findFirst({
      where: { accountId: auth.accountId },
    });

    if (!character) {
      return reply.code(404).send({ error: "character not found" });
    }

    // Перевіряємо, чи гравець вже створив клан або є членом клану
    const existingClan = await prisma.clan.findFirst({
      where: { creatorId: character.id },
    });

    const existingMember = await prisma.clanMember.findFirst({
      where: { characterId: character.id },
    });

    if (existingClan || existingMember) {
      return reply.code(409).send({ error: "you already have a clan" });
    }

    // Перевіряємо, чи назва клану вже існує
    const nameExists = await prisma.clan.findUnique({
      where: { name },
    });

    if (nameExists) {
      return reply.code(409).send({ error: "clan name already exists" });
    }

    try {
      // Створюємо клан та автоматично додаємо творця як члена
      const clan = await prisma.clan.create({
        data: {
          name,
          level: 1,
          creatorId: character.id,
          members: {
            create: {
              characterId: character.id,
              isDeputy: false,
            },
          },
          logs: {
            create: {
              type: "member_joined",
              characterId: character.id,
              message: `${character.name} создал клан "${name}"`,
            },
          },
        },
        include: {
          creator: {
            select: { id: true, name: true },
          },
        },
      });

      return {
        ok: true,
        clan: {
          id: clan.id,
          name: clan.name,
          level: clan.level,
          reputation: clan.reputation,
          adena: clan.adena,
          coinLuck: clan.coinLuck,
          createdAt: clan.createdAt,
          creator: {
            id: clan.creator.id,
            name: clan.creator.name,
          },
        },
      };
    } catch (e: any) {
      if (e.code === "P2002") {
        return reply.code(409).send({ error: "clan name already exists" });
      }
      throw e;
    }
  });

  // GET /clans/:id - деталі клану
  app.get("/clans/:id", async (req, reply) => {
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });

    const { id } = req.params as { id: string };

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

    const members = await prisma.clanMember.findMany({
      where: { clanId: clan.id },
      include: {
        character: {
          select: {
            id: true,
            name: true,
            lastActivityAt: true,
          },
        },
      },
      orderBy: [
        { isDeputy: "desc" },
        { joinedAt: "asc" },
      ],
    });

    // Знаходимо поточного гравця
    const character = await prisma.character.findFirst({
      where: { accountId: auth.accountId },
    });

    const isLeader = character ? clan.creatorId === character.id : false;
    const isMember = character
      ? members.some((m) => m.characterId === character.id)
      : false;

    return {
      ok: true,
      clan: {
        id: clan.id,
        name: clan.name,
        level: clan.level,
        reputation: clan.reputation,
        adena: clan.adena,
        coinLuck: clan.coinLuck,
        createdAt: clan.createdAt,
        creator: {
          id: clan.creator.id,
          name: clan.creator.name,
        },
        members: members.map((m) => ({
          id: m.id,
          characterId: m.character.id,
          characterName: m.character.name,
          title: m.title,
          isDeputy: m.isDeputy,
          joinedAt: m.joinedAt,
          isOnline: m.character.lastActivityAt
            ? new Date(m.character.lastActivityAt).getTime() > Date.now() - 5 * 60 * 1000
            : false,
        })),
        isLeader,
        isMember,
        memberCount: members.length,
      },
    };
  });

  // GET /clans/:id/chat - повідомлення чату клану
  app.get("/clans/:id/chat", async (req, reply) => {
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });

    const { id } = req.params as { id: string };
    const { page = "1", limit = "50" } = req.query as { page?: string; limit?: string };

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = Math.min(parseInt(limit, 10) || 50, 100);

    // Перевіряємо, чи гравець є членом клану
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

    const messages = await prisma.clanChat.findMany({
      where: { clanId: id },
      include: {
        character: {
          select: {
            id: true,
            name: true,
            nickColor: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limitNum,
      skip: (pageNum - 1) * limitNum,
    });

    const total = await prisma.clanChat.count({
      where: { clanId: id },
    });

    return {
      ok: true,
      messages: messages.reverse().map((m) => ({
        id: m.id,
        characterId: m.character.id,
        characterName: m.character.name,
        nickColor: m.character.nickColor,
        message: m.message,
        createdAt: m.createdAt,
      })),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    };
  });

  // POST /clans/:id/chat - відправити повідомлення в чат клану
  app.post("/clans/:id/chat", async (req, reply) => {
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });

    const { id } = req.params as { id: string };
    const { message } = req.body as { message?: string };

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return reply.code(400).send({ error: "message is required" });
    }

    if (message.length > 500) {
      return reply.code(400).send({ error: "message too long (max 500 characters)" });
    }

    const character = await prisma.character.findFirst({
      where: { accountId: auth.accountId },
    });

    if (!character) {
      return reply.code(404).send({ error: "character not found" });
    }

    // Перевіряємо, чи гравець є членом клану
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

    const chatMessage = await prisma.clanChat.create({
      data: {
        clanId: id,
        characterId: character.id,
        message: message.trim(),
      },
      include: {
        character: {
          select: {
            id: true,
            name: true,
            nickColor: true,
          },
        },
      },
    });

    return {
      ok: true,
      message: {
        id: chatMessage.id,
        characterId: chatMessage.character.id,
        characterName: chatMessage.character.name,
        nickColor: chatMessage.character.nickColor,
        message: chatMessage.message,
        createdAt: chatMessage.createdAt,
      },
    };
  });

  // GET /clans/:id/logs - історія клану
  app.get("/clans/:id/logs", async (req, reply) => {
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });

    const { id } = req.params as { id: string };
    const { page = "1", limit = "50" } = req.query as { page?: string; limit?: string };

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = Math.min(parseInt(limit, 10) || 50, 100);

    // Перевіряємо, чи гравець є членом клану
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

    const logs = await prisma.clanLog.findMany({
      where: { clanId: id },
      include: {
        character: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limitNum,
      skip: (pageNum - 1) * limitNum,
    });

    const total = await prisma.clanLog.count({
      where: { clanId: id },
    });

    return {
      ok: true,
      logs: logs.map((log) => ({
        id: log.id,
        type: log.type,
        characterId: log.characterId,
        characterName: log.character?.name,
        targetCharacterId: log.targetCharacterId,
        message: log.message,
        metadata: log.metadata,
        createdAt: log.createdAt,
      })),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    };
  });

  // GET /clans/:id/members - список членів клану (детальний)
  app.get("/clans/:id/members", async (req, reply) => {
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });

    const { id } = req.params as { id: string };

    // Перевіряємо, чи гравець є членом клану
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

    const members = await prisma.clanMember.findMany({
      where: { clanId: id },
      include: {
        character: {
          select: {
            id: true,
            name: true,
            level: true,
            lastActivityAt: true,
          },
        },
      },
      orderBy: [
        { isDeputy: "desc" },
        { joinedAt: "asc" },
      ],
    });

    const clan = await prisma.clan.findUnique({
      where: { id },
      select: { creatorId: true },
    });

    return {
      ok: true,
      members: members.map((m) => ({
        id: m.id,
        characterId: m.character.id,
        characterName: m.character.name,
        characterLevel: m.character.level,
        title: m.title,
        isDeputy: m.isDeputy,
        isLeader: clan ? clan.creatorId === m.characterId : false,
        joinedAt: m.joinedAt,
        isOnline: m.character.lastActivityAt
          ? new Date(m.character.lastActivityAt).getTime() > Date.now() - 5 * 60 * 1000
          : false,
      })),
      isLeader: clan ? clan.creatorId === character.id : false,
    };
  });

  // DELETE /clans/:id - видалити клан (тільки для глави)
  app.delete("/clans/:id", async (req, reply) => {
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });

    const { id } = req.params as { id: string };

    const character = await prisma.character.findFirst({
      where: { accountId: auth.accountId },
    });

    if (!character) {
      return reply.code(404).send({ error: "character not found" });
    }

    const clan = await prisma.clan.findUnique({
      where: { id },
    });

    if (!clan) {
      return reply.code(404).send({ error: "clan not found" });
    }

    if (clan.creatorId !== character.id) {
      return reply.code(403).send({ error: "only clan leader can delete the clan" });
    }

    await prisma.clan.delete({
      where: { id },
    });

    return { ok: true };
  });

  // POST /clans/:id/members/:characterId/kick - вигнати гравця (тільки для глави)
  app.post("/clans/:id/members/:characterId/kick", async (req, reply) => {
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });

    const { id, characterId: targetCharacterId } = req.params as {
      id: string;
      characterId: string;
    };

    const character = await prisma.character.findFirst({
      where: { accountId: auth.accountId },
    });

    if (!character) {
      return reply.code(404).send({ error: "character not found" });
    }

    const clan = await prisma.clan.findUnique({
      where: { id },
    });

    if (!clan) {
      return reply.code(404).send({ error: "clan not found" });
    }

    if (clan.creatorId !== character.id) {
      return reply.code(403).send({ error: "only clan leader can kick members" });
    }

    if (targetCharacterId === character.id) {
      return reply.code(400).send({ error: "cannot kick yourself" });
    }

    const targetMember = await prisma.clanMember.findFirst({
      where: {
        clanId: id,
        characterId: targetCharacterId,
      },
      include: {
        character: {
          select: { name: true },
        },
      },
    });

    if (!targetMember) {
      return reply.code(404).send({ error: "member not found" });
    }

    await prisma.clanMember.delete({
      where: { id: targetMember.id },
    });

    // Додаємо лог
    await prisma.clanLog.create({
      data: {
        clanId: id,
        type: "member_kicked",
        characterId: character.id,
        targetCharacterId: targetCharacterId,
        message: `${character.name} исключил ${targetMember.character.name} из клана`,
      },
    });

    return { ok: true };
  });

  // POST /clans/:id/members/:characterId/title - змінити титул (тільки для глави)
  app.post("/clans/:id/members/:characterId/title", async (req, reply) => {
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });

    const { id, characterId: targetCharacterId } = req.params as {
      id: string;
      characterId: string;
    };
    const { title } = req.body as { title?: string };

    const character = await prisma.character.findFirst({
      where: { accountId: auth.accountId },
    });

    if (!character) {
      return reply.code(404).send({ error: "character not found" });
    }

    const clan = await prisma.clan.findUnique({
      where: { id },
    });

    if (!clan) {
      return reply.code(404).send({ error: "clan not found" });
    }

    if (clan.creatorId !== character.id) {
      return reply.code(403).send({ error: "only clan leader can change titles" });
    }

    const targetMember = await prisma.clanMember.findFirst({
      where: {
        clanId: id,
        characterId: targetCharacterId,
      },
      include: {
        character: {
          select: { name: true },
        },
      },
    });

    if (!targetMember) {
      return reply.code(404).send({ error: "member not found" });
    }

    const newTitle = title && title.trim().length > 0 ? title.trim() : null;

    await prisma.clanMember.update({
      where: { id: targetMember.id },
      data: { title: newTitle },
    });

    // Додаємо лог
    await prisma.clanLog.create({
      data: {
        clanId: id,
        type: "title_changed",
        characterId: character.id,
        targetCharacterId: targetCharacterId,
        message: `${character.name} изменил титул ${targetMember.character.name} на "${newTitle || "Нет титула"}"`,
        metadata: { oldTitle: targetMember.title, newTitle },
      },
    });

    return { ok: true };
  });

  // POST /clans/:id/members/:characterId/deputy - призначити/зняти зама (тільки для глави)
  app.post("/clans/:id/members/:characterId/deputy", async (req, reply) => {
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });

    const { id, characterId: targetCharacterId } = req.params as {
      id: string;
      characterId: string;
    };
    const { isDeputy } = req.body as { isDeputy?: boolean };

    const character = await prisma.character.findFirst({
      where: { accountId: auth.accountId },
    });

    if (!character) {
      return reply.code(404).send({ error: "character not found" });
    }

    const clan = await prisma.clan.findUnique({
      where: { id },
    });

    if (!clan) {
      return reply.code(404).send({ error: "clan not found" });
    }

    if (clan.creatorId !== character.id) {
      return reply.code(403).send({ error: "only clan leader can manage deputies" });
    }

    if (targetCharacterId === character.id) {
      return reply.code(400).send({ error: "cannot manage yourself" });
    }

    const targetMember = await prisma.clanMember.findFirst({
      where: {
        clanId: id,
        characterId: targetCharacterId,
      },
      include: {
        character: {
          select: { name: true },
        },
      },
    });

    if (!targetMember) {
      return reply.code(404).send({ error: "member not found" });
    }

    const newIsDeputy = isDeputy === true;

    await prisma.clanMember.update({
      where: { id: targetMember.id },
      data: { isDeputy: newIsDeputy },
    });

    // Додаємо лог
    await prisma.clanLog.create({
      data: {
        clanId: id,
        type: newIsDeputy ? "deputy_appointed" : "deputy_removed",
        characterId: character.id,
        targetCharacterId: targetCharacterId,
        message: newIsDeputy
          ? `${character.name} назначил ${targetMember.character.name} заместителем`
          : `${character.name} снял ${targetMember.character.name} с заместителя`,
      },
    });

    return { ok: true };
  });

}
