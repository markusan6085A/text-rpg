import type { FastifyInstance } from "fastify";
import { prisma } from "./db";
import { getAuth } from "./routes/character/auth";
import { addVersioning } from "./heroJsonValidator";
import { removeItemFromInventory, addItemToInventory, pickSafeItemFields } from "./utils/inventoryHelpers";
import { registerClanInviteRoutes, registerClanInviteNestedRoutes } from "./routes/clans/invites";
import { registerClanApplicationRoutes, registerClanApplicationNestedRoutes } from "./routes/clans/applications";
import { registerClanMemberNestedRoutes } from "./routes/clans/members";

// Функція для перевірки та створення таблиці ClanWarehouse, якщо вона не існує
async function ensureClanWarehouseTable(app: FastifyInstance): Promise<void> {
  app.log.info("Checking if ClanWarehouse table exists...");
  try {
    // Перевіряємо, чи існує таблиця
    await prisma.$queryRaw`SELECT 1 FROM "ClanWarehouse" LIMIT 1`;
    app.log.info("ClanWarehouse table exists");
    return;
  } catch (error: any) {
    app.log.warn({ 
      error: error.message, 
      code: error.code,
      errorName: error.name 
    }, "Error checking ClanWarehouse table");
    
    // Якщо таблиця не існує, створюємо її
    const isTableMissing = error?.message?.includes('does not exist') || 
                          error?.code === '42P01' || 
                          error?.message?.includes('ClanWarehouse') ||
                          error?.message?.includes('relation') ||
                          error?.name === 'PrismaClientKnownRequestError';
    
    if (isTableMissing) {
      app.log.warn("ClanWarehouse table does not exist, creating it...");
      try {
        // Спочатку створюємо таблицю
        app.log.info("Creating ClanWarehouse table...");
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
        app.log.info("ClanWarehouse table created");
        
        // Створюємо індекси
        app.log.info("Creating indexes...");
        await prisma.$executeRawUnsafe(`
          CREATE INDEX IF NOT EXISTS "ClanWarehouse_clanId_idx" ON "ClanWarehouse"("clanId");
        `);
        
        await prisma.$executeRawUnsafe(`
          CREATE INDEX IF NOT EXISTS "ClanWarehouse_clanId_depositedAt_idx" ON "ClanWarehouse"("clanId", "depositedAt");
        `);
        app.log.info("Indexes created");
        
        // Додаємо foreign key, якщо таблиця Clan існує
        try {
          const clanExists = await prisma.$queryRaw<Array<{exists: boolean}>>`
            SELECT EXISTS (
              SELECT 1 FROM information_schema.tables 
              WHERE table_schema = 'public' AND table_name = 'Clan'
            ) as exists;
          `;
          
          if (clanExists[0]?.exists) {
            app.log.info("Clan table exists, adding foreign key...");
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
              app.log.info("Foreign key added");
            } else {
              app.log.info("Foreign key already exists");
            }
          } else {
            app.log.warn("Clan table does not exist, skipping foreign key");
          }
        } catch (fkError: any) {
          app.log.warn({ error: fkError.message }, "Failed to add foreign key, but table was created");
        }
        
        app.log.info("ClanWarehouse table created successfully");
      } catch (createError: any) {
        app.log.error({ 
          error: createError.message, 
          code: createError.code,
          stack: createError.stack 
        }, "Failed to create ClanWarehouse table");
        throw createError; // Кидаємо помилку, щоб retry логіка могла спробувати ще раз
      }
    } else {
      app.log.error({ error: error.message, code: error.code }, "Unexpected error checking ClanWarehouse table");
      // Не кидаємо помилку, спробуємо продовжити
    }
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
      const { itemId, qty = 1, meta = {} } = req.body as { itemId?: string; qty?: number; meta?: any };

      app.log.info({ id, itemId, qty, meta }, "Processing warehouse deposit");

      if (!itemId) {
        return reply.code(400).send({ error: "itemId is required" });
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

      let warehouseItem;
      try {
        warehouseItem = await prisma.$transaction(async (tx) => {
          const oldRevision = Number(heroJson.heroRevision ?? 0) || 0;
          const updatedHeroJson = addVersioning(
            { ...heroJson, inventory: newInventory },
            oldRevision
          );
          await tx.character.update({
            where: { id: character.id },
            data: { heroJson: updatedHeroJson },
          });
          return tx.clanWarehouse.create({
            data: {
              clanId: id,
              itemId: String(itemId),
              qty: qtyNum,
              meta: metaData,
              depositedBy: character.id,
            },
          });
        });
      } catch (createError: any) {
        app.log.warn({ error: createError.message, code: createError.code }, "Error during warehouse create, checking if table exists...");
        if (createError?.message?.includes('does not exist') || createError?.code === '42P01' || createError?.message?.includes('ClanWarehouse')) {
          app.log.warn("ClanWarehouse table missing during create, ensuring it exists...");
          await ensureClanWarehouseTable(app);
          await new Promise(resolve => setTimeout(resolve, 100));
          try {
            warehouseItem = await prisma.$transaction(async (tx) => {
              const oldRevision = Number(heroJson.heroRevision ?? 0) || 0;
              const updatedHeroJson = addVersioning(
                { ...heroJson, inventory: newInventory },
                oldRevision
              );
              await tx.character.update({
                where: { id: character.id },
                data: { heroJson: updatedHeroJson },
              });
              return tx.clanWarehouse.create({
                data: {
                  clanId: id,
                  itemId: String(itemId),
                  qty: qtyNum,
                  meta: metaData,
                  depositedBy: character.id,
                },
              });
            });
            app.log.info({ warehouseItemId: warehouseItem.id }, "Create successful after table creation");
          } catch (retryError: any) {
            app.log.error({ error: retryError.message }, "Create failed even after table creation");
            throw retryError;
          }
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
    const { itemId: warehouseRowId } = req.body as { itemId?: string };

    if (!warehouseRowId) {
      return reply.code(400).send({ error: "itemId is required" });
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

    await prisma.$transaction(async (tx) => {
      await tx.character.update({
        where: { id: character.id },
        data: { heroJson: updatedHeroJson },
      });
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

    return { ok: true };
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

export async function clanRoutes(app: FastifyInstance) {
  // 🔥 Invites/applications — до /clans/:id (щоб /clans/invites не матчилось як :id)
  registerClanInviteRoutes(app);
  registerClanApplicationRoutes(app);

  // Вкладені роути /clans/:id/...
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
        emblem: true,
        createdAt: true,
        _count: {
          select: { members: true },
        },
      } as any,
    });

    return { ok: true, clans };
  });

  // GET /clans/my - мій клан (якщо є)
  app.get("/clans/my", async (req, reply) => {
    try {
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

      const clanId = clan.id;

      // Завантажуємо членів клану
      const members = await prisma.clanMember.findMany({
        where: { clanId },
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
          emblem: (clan as any).emblem || null,
          announcement: (clan as any).announcement ?? null,
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
    } catch (error: any) {
      app.log.error({ error: error.message, stack: error.stack }, "Error fetching my clan:");
      return reply.code(500).send({ 
        error: "Internal Server Error",
        message: error.message || "Failed to fetch clan"
      });
    }
  });

  // POST /clans - створити клан
  app.post("/clans", async (req, reply) => {
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });

    const { name, characterId: bodyCharacterId } = req.body as { name?: string; characterId?: string };

    if (!name || typeof name !== "string") {
      return reply.code(400).send({ error: "name is required" });
    }

    if (name.length < 3 || name.length > 16) {
      return reply.code(400).send({ error: "name must be between 3 and 16 characters" });
    }

    // Використовуємо characterId з body якщо передано (поточний персонаж гравця), інакше findFirst
    let character;
    if (bodyCharacterId && typeof bodyCharacterId === "string") {
      character = await prisma.character.findUnique({
        where: { id: bodyCharacterId },
      });
      if (!character || character.accountId !== auth.accountId) {
        return reply.code(403).send({ error: "character does not belong to your account" });
      }
    } else {
      character = await prisma.character.findFirst({
        where: { accountId: auth.accountId },
      });
    }

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
          emblem: (clan as any).emblem || null,
          createdAt: clan.createdAt,
          creator: {
            id: clan.creator.id,
            name: clan.creator.name,
          },
        },
      };
    } catch (e: any) {
      app.log.error({ error: e.message, stack: e.stack, code: e.code }, "Error creating clan:");
      if (e.code === "P2002") {
        return reply.code(409).send({ error: "clan name already exists" });
      }
      return reply.code(500).send({ 
        error: "Internal Server Error",
        message: e.message || "Failed to create clan"
      });
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
          emblem: (clan as any).emblem || null,
          announcement: (clan as any).announcement ?? null,
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
            clanMember: {
              include: {
                clan: {
                  select: {
                    emblem: true,
                  } as any,
                },
              },
            },
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
        emblem: m.character.clanMember?.clan?.emblem || null,
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
