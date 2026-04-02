import type { FastifyInstance } from "fastify";
import { prisma } from "./db";
import { rateLimiters, rateLimitMiddleware } from "./rateLimiter";
import { getAuth } from "./routes/character/auth";
import { addVersioning } from "./heroJsonValidator";

const MAX_TRANSFER_PAYLOAD_LENGTH = 10_000;

function isStackableItem(item: any): boolean {
  const kind = String(item?.kind || "").toLowerCase();
  const slot = String(item?.slot || "").toLowerCase();
  return (
    kind === "resource" ||
    kind === "consumable" ||
    kind === "quest" ||
    kind === "scroll" ||
    slot === "resource" ||
    slot === "consumable" ||
    slot === "quest"
  );
}

function parseTransferPayload(rawPayload: string): { id: string; count: number; enchantLevel: number } {
  if (typeof rawPayload !== "string" || !rawPayload.trim()) {
    throw new Error("itemPayload is required");
  }
  if (rawPayload.length > MAX_TRANSFER_PAYLOAD_LENGTH) {
    throw new Error("itemPayload too large");
  }

  let parsed: any;
  try {
    parsed = JSON.parse(rawPayload);
  } catch {
    throw new Error("itemPayload must be valid JSON");
  }

  const item = parsed?.item ?? parsed;
  const id = typeof item?.id === "string" ? item.id.trim() : "";
  const countRaw = Number(item?.count ?? 1);
  const enchantLevelRaw = Number(item?.enchantLevel ?? 0);
  const count = Number.isFinite(countRaw) ? Math.floor(countRaw) : NaN;
  const enchantLevel = Number.isFinite(enchantLevelRaw) ? Math.floor(enchantLevelRaw) : 0;

  if (!id || id.length > 120) {
    throw new Error("invalid item id");
  }
  if (!Number.isInteger(count) || count < 1 || count > 100000) {
    throw new Error("invalid item count");
  }
  if (!Number.isInteger(enchantLevel) || enchantLevel < 0 || enchantLevel > 100000) {
    throw new Error("invalid enchant level");
  }

  return { id, count, enchantLevel };
}

function pickSafeItemFields(item: any, count: number): any {
  return {
    id: item?.id,
    name: item?.name ?? item?.id ?? "Item",
    icon: item?.icon,
    slot: item?.slot,
    kind: item?.kind,
    description: item?.description,
    enchantLevel: Number(item?.enchantLevel ?? 0) || 0,
    stats: item?.stats ?? undefined,
    count: Math.max(1, Math.floor(Number(count) || 1)),
  };
}

function removeItemFromInventory(inventory: any[], reqItem: { id: string; count: number; enchantLevel: number }) {
  const inv = Array.isArray(inventory) ? [...inventory] : [];
  const matches = (entry: any) => {
    if (!entry || entry.id !== reqItem.id) return false;
    const entryEnchant = Number(entry.enchantLevel ?? 0) || 0;
    return entryEnchant === reqItem.enchantLevel;
  };

  const sample = inv.find(matches);
  if (!sample) throw new Error("item not found in inventory");
  const stackable = isStackableItem(sample);

  if (!stackable) {
    if (reqItem.count !== 1) throw new Error("non-stackable items can only be transferred as x1");
    const idx = inv.findIndex(matches);
    if (idx < 0) throw new Error("item not found in inventory");
    const removed = inv[idx];
    inv.splice(idx, 1);
    return { newInventory: inv, transferItem: pickSafeItemFields(removed, 1) };
  }

  let left = reqItem.count;
  const result: any[] = [];
  let removedSample: any = null;
  for (const entry of inv) {
    if (!matches(entry)) {
      result.push(entry);
      continue;
    }
    removedSample = removedSample || entry;
    const currentCount = Math.max(1, Math.floor(Number(entry.count) || 1));
    if (left <= 0) {
      result.push(entry);
      continue;
    }
    if (currentCount > left) {
      result.push({ ...entry, count: currentCount - left });
      left = 0;
      continue;
    }
    left -= currentCount;
    // fully removed this stack
  }
  if (left > 0) throw new Error("not enough item count in inventory");
  return { newInventory: result, transferItem: pickSafeItemFields(removedSample, reqItem.count) };
}

function addItemToInventory(inventory: any[], item: any): any[] {
  const inv = Array.isArray(inventory) ? [...inventory] : [];
  const stackable = isStackableItem(item);
  if (!stackable) {
    inv.push({ ...item, count: 1 });
    return inv;
  }

  const targetEnchant = Number(item.enchantLevel ?? 0) || 0;
  const idx = inv.findIndex((i: any) =>
    i?.id === item.id && (Number(i?.enchantLevel ?? 0) || 0) === targetEnchant
  );
  const addCount = Math.max(1, Math.floor(Number(item.count) || 1));
  if (idx >= 0) {
    const prevCount = Math.max(1, Math.floor(Number(inv[idx]?.count) || 1));
    inv[idx] = { ...inv[idx], count: prevCount + addCount };
  } else {
    inv.push({ ...item, count: addCount });
  }
  return inv;
}

export async function letterRoutes(app: FastifyInstance) {
  // POST /letters - відправити лист
  app.post("/letters", {
    preHandler: async (req, reply) => {
      await rateLimitMiddleware(rateLimiters.letters, "letters")(req, reply);
    },
  }, async (req, reply) => {
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });

    const body = req.body as {
      toCharacterId?: string;
      toCharacterName?: string;
      subject?: string;
      message?: string;
    };

    if (!body.message || !body.message.trim()) {
      return reply.code(400).send({ error: "message is required" });
    }

    const subj = (body.subject ?? "").trim();
    if (subj === "[ITEM_TRANSFER]" || subj === "[WELCOME_NEW_PLAYER]") {
      return reply.code(400).send({ error: "Reserved subject" });
    }

    try {
      // Знаходимо свій character
      const fromCharacter = await prisma.character.findFirst({
        where: { accountId: auth.accountId },
        orderBy: { createdAt: "asc" },
        select: { id: true },
      });

      if (!fromCharacter) {
        return reply.code(404).send({ error: "character not found" });
      }

      // Знаходимо character одержувача
      let toCharacter;
      if (body.toCharacterId) {
        toCharacter = await prisma.character.findUnique({
          where: { id: body.toCharacterId },
          select: { id: true },
        });
      } else if (body.toCharacterName) {
        toCharacter = await prisma.character.findFirst({
          where: { name: { equals: body.toCharacterName, mode: 'insensitive' } },
          select: { id: true },
        });
      }

      if (!toCharacter) {
        return reply.code(404).send({ error: "recipient character not found" });
      }

      if (fromCharacter.id === toCharacter.id) {
        return reply.code(400).send({ error: "cannot send letter to yourself" });
      }

      // Створюємо лист
      const letter = await prisma.letter.create({
        data: {
          fromCharacterId: fromCharacter.id,
          toCharacterId: toCharacter.id,
          subject: body.subject?.trim() || "",
          message: body.message.trim(),
        },
        select: {
          id: true,
          subject: true,
          message: true,
          createdAt: true,
          toCharacter: {
            select: {
              id: true,
              name: true,
            },
          },
          fromCharacter: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      app.log.info({ fromCharacterId: fromCharacter.id, toCharacterId: toCharacter.id }, "Letter sent");
      return { ok: true, letter };
    } catch (error) {
      app.log.error(error, "Error sending letter:");
      return reply.code(500).send({
        error: "Internal Server Error",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // POST /letters/transfer - відправити предмет
  app.post("/letters/transfer", {
    preHandler: async (req, reply) => {
      await rateLimitMiddleware(rateLimiters.letters, "letters_transfer")(req, reply);
    },
  }, async (req, reply) => {
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });

    const body = req.body as {
      toCharacterName: string;
      itemPayload: string; // JSON string of the item
    };

    if (!body.itemPayload || !body.toCharacterName) {
      return reply.code(400).send({ error: "toCharacterName and itemPayload are required" });
    }

    try {
      const reqItem = parseTransferPayload(body.itemPayload);

      const result = await prisma.$transaction(async (tx) => {
        const fromCharacter = await tx.character.findFirst({
          where: { accountId: auth.accountId },
          orderBy: { createdAt: "asc" },
          select: { id: true, heroJson: true, adena: true },
        });
        if (!fromCharacter) throw new Error("character not found");

        const toCharacter = await tx.character.findFirst({
          where: { name: { equals: body.toCharacterName, mode: "insensitive" } },
          select: { id: true, name: true },
        });
        if (!toCharacter) throw new Error("recipient character not found");
        if (fromCharacter.id === toCharacter.id) throw new Error("cannot transfer to yourself");

        const heroJson = (fromCharacter.heroJson ?? {}) as any;
        const inventory = Array.isArray(heroJson.inventory) ? heroJson.inventory : [];
        const { newInventory, transferItem } = removeItemFromInventory(inventory, reqItem);
        const itemPrice = Math.max(0, Math.floor(Number(transferItem?.stats?.price ?? 0)));
        const transferFeePerItem = Math.floor(itemPrice * 0.05);
        const transferFee = transferFeePerItem * reqItem.count;
        const currentAdena = Number(fromCharacter.adena ?? 0);
        if (currentAdena < transferFee) {
          throw new Error("not enough adena for transfer fee");
        }
        const oldRevision = Number(heroJson.heroRevision ?? 0) || 0;
        const updatedHeroJson = addVersioning(
          { ...heroJson, inventory: newInventory },
          oldRevision
        );

        await tx.character.update({
          where: { id: fromCharacter.id },
          data: {
            heroJson: updatedHeroJson,
            adena: { decrement: transferFee },
          },
        });

        const transferPayload = JSON.stringify({
          item: transferItem,
          sender: auth.login,
        });

        const letter = await tx.letter.create({
          data: {
            fromCharacterId: fromCharacter.id,
            toCharacterId: toCharacter.id,
            subject: "[ITEM_TRANSFER]",
            message: transferPayload,
          },
          select: {
            id: true,
            subject: true,
            message: true,
            createdAt: true,
            toCharacter: { select: { id: true, name: true } },
            fromCharacter: { select: { id: true, name: true } },
          },
        });

        const updatedCharacter = await tx.character.findUnique({
          where: { id: fromCharacter.id },
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

        return { letter, updatedCharacter };
      });

      app.log.info(
        { letterId: result.letter.id, toCharacterName: body.toCharacterName, itemId: reqItem.id, count: reqItem.count },
        "Item transfer sent"
      );
      return {
        ok: true,
        letter: result.letter,
        character: result.updatedCharacter ? { ...result.updatedCharacter, exp: Number(result.updatedCharacter.exp) } : undefined,
      };
    } catch (error) {
      if (error instanceof Error) {
        const msg = error.message;
        if (
          msg === "character not found" ||
          msg === "recipient character not found" ||
          msg === "cannot transfer to yourself" ||
          msg === "item not found in inventory" ||
          msg === "not enough item count in inventory" ||
          msg === "non-stackable items can only be transferred as x1" ||
          msg === "itemPayload is required" ||
          msg === "itemPayload too large" ||
          msg === "itemPayload must be valid JSON" ||
          msg === "invalid item id" ||
          msg === "invalid item count" ||
          msg === "invalid enchant level" ||
          msg === "not enough adena for transfer fee"
        ) {
          const code =
            msg === "recipient character not found" || msg === "character not found"
              ? 404
              : 400;
          return reply.code(code).send({ error: msg });
        }
      }
      app.log.error(error, "Error sending item transfer:");
      return reply.code(500).send({
        error: "Internal Server Error",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // GET /letters - отримати листи (вхідні)
  app.get("/letters", async (req, reply) => {
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });

    const query = req.query as {
      page?: string;
      limit?: string;
      characterId?: string;
    };

    const page = Math.max(1, parseInt(query.page || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(query.limit || "50", 10)));
    const skip = (page - 1) * limit;

    try {
      let character: { id: string } | null = null;
      if (query.characterId?.trim()) {
        const c = await prisma.character.findFirst({
          where: { id: query.characterId.trim(), accountId: auth.accountId },
          select: { id: true },
        });
        character = c;
      }
      if (!character) {
        character = await prisma.character.findFirst({
          where: { accountId: auth.accountId },
          orderBy: { createdAt: "asc" },
          select: { id: true },
        });
      }

      if (!character) {
        return reply.code(404).send({ error: "character not found" });
      }

      // 🔥 Фільтруємо листи - показуємо тільки ті, що створені за останні 30 днів
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const whereClause = { 
        toCharacterId: character.id,
        createdAt: {
          gte: thirtyDaysAgo,
        },
      };

      // 🔥 Виконуємо всі запити паралельно для швидшої відповіді
      const [letters, total, unreadCount] = await Promise.all([
        prisma.letter.findMany({
          where: whereClause,
          orderBy: { createdAt: "desc" },
          take: limit,
          skip,
          select: {
            id: true,
            subject: true,
            message: true,
            isRead: true,
            createdAt: true,
            fromCharacter: {
              select: {
                id: true,
                name: true,
                nickColor: true, // ✅ замість heroJson
                clanMember: {
                  include: {
                clan: {
                  select: {
                    emblem: true,
                  } as any,
                },
                  },
                },
              } as any,
            },
          },
        }),
        prisma.letter.count({ where: whereClause }),
        prisma.letter.count({
          where: {
            ...whereClause,
            isRead: false,
          },
        }),
      ]);

      // Додаємо emblem до fromCharacter
      const lettersWithEmblem = letters.map((l: any) => ({
        ...l,
        fromCharacter: l.fromCharacter ? {
          ...l.fromCharacter,
          emblem: l.fromCharacter.clanMember?.clan?.emblem || null,
        } : l.fromCharacter,
      }));

      return {
        ok: true,
        letters: lettersWithEmblem,
        total,
        unreadCount,
        page,
        limit,
      };
    } catch (error) {
      app.log.error(error, "Error fetching letters:");
      return reply.code(500).send({
        error: "Internal Server Error",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // GET /letters/:id - отримати один лист
  app.get("/letters/:id", async (req, reply) => {
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });

    const params = req.params as { id: string };
    const { id } = params;

    if (!id) return reply.code(400).send({ error: "letter id is required" });

    try {
      const character = await prisma.character.findFirst({
        where: { accountId: auth.accountId },
        orderBy: { createdAt: "asc" },
        select: { id: true },
      });

      if (!character) {
        return reply.code(404).send({ error: "character not found" });
      }

      const letter = await prisma.letter.findUnique({
        where: { id },
        select: {
          id: true,
          subject: true,
          message: true,
          isRead: true,
          createdAt: true,
          readAt: true,
          fromCharacter: {
            select: {
              id: true,
              name: true,
              nickColor: true, // ✅
              clanMember: {
                include: {
                clan: {
                  select: {
                    emblem: true,
                  } as any,
                },
                },
              },
            } as any,
          },
          toCharacter: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      if (!letter) {
        return reply.code(404).send({ error: "letter not found" });
      }

      // Перевіряємо, чи це наш лист (отримувач)
      if ((letter as any).toCharacter?.id !== character.id) {
        return reply.code(403).send({ error: "access denied" });
      }

      // Відмічаємо як прочитаний, якщо ще не прочитаний
      if (!letter.isRead) {
        await prisma.letter.update({
          where: { id },
          data: {
            isRead: true,
            readAt: new Date(),
          },
        });
        letter.isRead = true;
        letter.readAt = new Date();
      }

      // Додаємо emblem до fromCharacter
      const letterWithEmblem = {
        ...letter,
        fromCharacter: letter.fromCharacter ? {
          ...letter.fromCharacter,
          emblem: (letter.fromCharacter as any).clanMember?.clan?.emblem || null,
        } : letter.fromCharacter,
      };

      return { ok: true, letter: letterWithEmblem };
    } catch (error) {
      app.log.error(error, "Error fetching letter:");
      return reply.code(500).send({
        error: "Internal Server Error",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // DELETE /letters/:id - видалити лист
  app.delete<{ Params: { id: string } }>("/letters/:id", { schema: { body: false } }, async (req, reply) => {
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });

    const params = req.params as { id: string };
    const { id } = params;

    if (!id) return reply.code(400).send({ error: "letter id is required" });

    try {
      const character = await prisma.character.findFirst({
        where: { accountId: auth.accountId },
        orderBy: { createdAt: "asc" },
        select: { id: true },
      });

      if (!character) {
        return reply.code(404).send({ error: "character not found" });
      }

      const letter = await prisma.letter.findUnique({
        where: { id },
        select: {
          toCharacterId: true,
        },
      });

      if (!letter) {
        return reply.code(404).send({ error: "letter not found" });
      }

      // Тільки отримувач може видалити лист
      if (letter.toCharacterId !== character.id) {
        return reply.code(403).send({ error: "access denied" });
      }

      await prisma.letter.delete({
        where: { id },
      });

      app.log.info({ letterId: id, characterId: character.id }, "Letter deleted");
      return { ok: true, message: "Letter deleted" };
    } catch (error) {
      app.log.error(error, "Error deleting letter:");
      return reply.code(500).send({
        error: "Internal Server Error",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // POST /letters/:id/collect-item - забрати предмет з листа атомарно (додає item в інвентар і видаляє лист)
  app.post("/letters/:id/collect-item", async (req, reply) => {
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });

    const params = req.params as { id: string };
    const letterId = params?.id;
    if (!letterId) return reply.code(400).send({ error: "letter id is required" });

    try {
      const result = await prisma.$transaction(async (tx) => {
        const character = await tx.character.findFirst({
          where: { accountId: auth.accountId },
          orderBy: { createdAt: "asc" },
          select: { id: true, heroJson: true },
        });
        if (!character) throw new Error("character not found");

        const letter = await tx.letter.findUnique({
          where: { id: letterId },
          select: {
            id: true,
            subject: true,
            message: true,
            toCharacterId: true,
          },
        });
        if (!letter) throw new Error("letter not found");
        if (letter.toCharacterId !== character.id) throw new Error("access denied");
        if (letter.subject !== "[ITEM_TRANSFER]") throw new Error("letter is not an item transfer");

        const transferData = parseTransferPayload(letter.message);
        let parsed: any;
        try {
          parsed = JSON.parse(letter.message);
        } catch {
          parsed = {};
        }
        const safeItem = pickSafeItemFields(parsed?.item ?? {}, transferData.count);
        if (!safeItem.id || safeItem.id !== transferData.id) {
          safeItem.id = transferData.id;
          safeItem.count = transferData.count;
          safeItem.enchantLevel = transferData.enchantLevel;
        }

        const heroJson = (character.heroJson ?? {}) as any;
        const currentInventory = Array.isArray(heroJson.inventory) ? heroJson.inventory : [];
        const nextInventory = addItemToInventory(currentInventory, safeItem);
        const oldRevision = Number(heroJson.heroRevision ?? 0) || 0;
        const updatedHeroJson = addVersioning(
          { ...heroJson, inventory: nextInventory },
          oldRevision
        );

        const updatedCharacter = await tx.character.update({
          where: { id: character.id },
          data: { heroJson: updatedHeroJson },
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

        await tx.letter.delete({ where: { id: letter.id } });
        return { updatedCharacter, item: safeItem };
      });

      return reply.send({
        ok: true,
        character: { ...result.updatedCharacter, exp: Number(result.updatedCharacter.exp) },
        item: result.item,
      });
    } catch (error) {
      if (error instanceof Error) {
        const msg = error.message;
        if (
          msg === "character not found" ||
          msg === "letter not found" ||
          msg === "access denied" ||
          msg === "letter is not an item transfer" ||
          msg === "itemPayload is required" ||
          msg === "itemPayload too large" ||
          msg === "itemPayload must be valid JSON" ||
          msg === "invalid item id" ||
          msg === "invalid item count" ||
          msg === "invalid enchant level"
        ) {
          const code = msg === "character not found" || msg === "letter not found" ? 404 : 400;
          return reply.code(code).send({ error: msg });
        }
      }
      app.log.error(error, "Error collecting transfer item:");
      return reply.code(500).send({
        error: "Internal Server Error",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // GET /letters/conversation/:playerId - переписка (вхідні + вихідні) з пагінацією в БД
  app.get("/letters/conversation/:playerId", async (req, reply) => {
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });

    const params = req.params as { playerId: string };
    const { playerId } = params;
    const query = req.query as { page?: string; limit?: string };

    if (!playerId) return reply.code(400).send({ error: "playerId is required" });

    try {
      const character = await prisma.character.findFirst({
        where: { accountId: auth.accountId },
        orderBy: { createdAt: "asc" },
        select: { id: true },
      });

      if (!character) return reply.code(404).send({ error: "character not found" });

      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const page = Math.max(1, parseInt(query.page || "1", 10));
      const limit = Math.min(50, Math.max(1, parseInt(query.limit || "10", 10)));
      const skip = (page - 1) * limit;

      // 1) Позначаємо вхідні як прочитані (тільки від playerId до нас)
      await prisma.letter.updateMany({
        where: {
          fromCharacterId: playerId,
          toCharacterId: character.id,
          isRead: false,
          createdAt: { gte: thirtyDaysAgo },
        },
        data: { isRead: true, readAt: new Date() },
      });

      // 2) Один WHERE на обидва напрямки
      const convWhere = {
        createdAt: { gte: thirtyDaysAgo },
        OR: [
          { fromCharacterId: playerId, toCharacterId: character.id },
          { fromCharacterId: character.id, toCharacterId: playerId },
        ],
      };

      const [letters, total] = await Promise.all([
        prisma.letter.findMany({
          where: convWhere,
          orderBy: { createdAt: "desc" },
          take: limit,
          skip,
          select: {
            id: true,
            subject: true,
            message: true,
            isRead: true,
            createdAt: true,
            fromCharacterId: true, // ✅ потрібно для isOwn
            fromCharacter: {
              select: { id: true, name: true, nickColor: true } as any,
            },
            toCharacter: {
              select: { id: true, name: true },
            },
          },
        }),
        prisma.letter.count({ where: convWhere }),
      ]);

      const lettersWithMeta = letters.map((l: any) => ({
        ...l,
        isOwn: l.fromCharacterId === character.id,
        fromCharacter: l.fromCharacter ? {
          ...l.fromCharacter,
          emblem: l.fromCharacter.clanMember?.clan?.emblem || null,
        } : l.fromCharacter,
      }));

      return { ok: true, letters: lettersWithMeta, total, page, limit };
    } catch (error) {
      app.log.error(error, "Error fetching conversation:");
      return reply.code(500).send({
        error: "Internal Server Error",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // GET /letters/unread-count - отримати кількість непрочитаних
  app.get("/letters/unread-count", async (req, reply) => {
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });

    try {
      const character = await prisma.character.findFirst({
        where: { accountId: auth.accountId },
        orderBy: { createdAt: "asc" },
        select: { id: true },
      });

      if (!character) {
        return reply.code(404).send({ error: "character not found" });
      }

      const unreadCount = await prisma.letter.count({
        where: {
          toCharacterId: character.id,
          isRead: false,
        },
      });

      return { ok: true, unreadCount };
    } catch (error) {
      app.log.error(error, "Error fetching unread count:");
      return reply.code(500).send({
        error: "Internal Server Error",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });
}
