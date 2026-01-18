import type { FastifyInstance } from "fastify";
import jwt from "jsonwebtoken";
import { prisma } from "./db";
import { addNews } from "./news";

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

export async function characterRoutes(app: FastifyInstance) {
  // GET /characters  (Bearer token)
  app.get("/characters", async (req, reply) => {
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });

    const chars = await prisma.character.findMany({
      where: { accountId: auth.accountId },
      orderBy: { createdAt: "asc" },
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
        heroJson: true,
        createdAt: true,
      },
    });

    // Convert BigInt to Number for JSON serialization
    const serializedChars = chars.map(char => ({
      ...char,
      exp: Number(char.exp),
    }));

    return { ok: true, characters: serializedChars };
  });

  // POST /characters  (Bearer token)  { name, race, classId, sex }
  app.post("/characters", async (req, reply) => {
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });

    const body = req.body as {
      name?: string;
      race?: string;
      classId?: string;
      sex?: string;
    };

    const name = (body.name ?? "").trim();
    const race = (body.race ?? "").trim();
    const classId = (body.classId ?? "").trim();
    const sex = (body.sex ?? "").trim();

    if (name.length < 2) return reply.code(400).send({ error: "name too short" });
    if (!race) return reply.code(400).send({ error: "race required" });
    if (!classId) return reply.code(400).send({ error: "classId required" });
    if (!sex) return reply.code(400).send({ error: "sex required" });

    try {
      const created = await prisma.character.create({
        data: {
          accountId: auth.accountId,
          name,
          race,
          classId,
          sex,
          level: 1,
          exp: 0,
          sp: 0,
          adena: 0,
          aa: 0,
          coinLuck: 0,
          heroJson: {},
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
          heroJson: true,
          createdAt: true,
        },
      });

      // Convert BigInt to Number for JSON serialization
      const serialized = {
        ...created,
        exp: Number(created.exp),
      };

      // Додаємо новину про нового гравця
      try {
        await addNews({
          type: "new_player",
          characterId: created.id,
          characterName: created.name,
          metadata: {},
        });
        app.log.info(`News added for new player: ${created.name} (${created.id})`);
      } catch (newsError) {
        app.log.error(newsError, `Failed to add news for new player: ${created.name}`);
        // Не блокуємо створення персонажа, якщо додавання новини не вдалося
      }

      return { ok: true, character: serialized };
    } catch (e: any) {
      console.error('Error creating character:', e);
      
      // Check for unique constraint violation
      if (e.code === 'P2002') {
        return reply.code(409).send({ error: "character name already exists for this account" });
      }
      
      // Return 500 for other errors
      return reply.code(500).send({ error: e.message || "Internal server error" });
    }
  });

  // POST /characters/:id/heal - лікування іншого гравця (має бути ПЕРЕД /characters/:id)
  app.post("/characters/:id/heal", async (req, reply) => {
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });

    const targetId = (req.params as any).id;
    const body = req.body as { skillId: number; power: number };

    if (!body.skillId || !body.power) {
      return reply.code(400).send({ error: "skillId and power are required" });
    }

    try {
      // Отримуємо цільового гравця
      const targetChar = await prisma.character.findUnique({
        where: { id: targetId },
        select: { id: true, heroJson: true },
      });

      if (!targetChar) {
        return reply.code(404).send({ error: "target character not found" });
      }

      const heroJson = (targetChar.heroJson as any) || {};
      const currentHp = heroJson.hp || heroJson.maxHp || 100;
      const maxHp = heroJson.maxHp || 100;
      const newHp = Math.min(maxHp, currentHp + body.power);

      // Оновлюємо HP
      const updatedHeroJson = {
        ...heroJson,
        hp: newHp,
      };

      await prisma.character.update({
        where: { id: targetId },
        data: { heroJson: updatedHeroJson },
      });

      return { ok: true, healedHp: newHp - currentHp, currentHp: newHp };
    } catch (error) {
      app.log.error(error, "Error healing character:");
      return reply.code(500).send({
        error: "Internal Server Error",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // POST /characters/:id/buff - застосування бафу до іншого гравця (має бути ПЕРЕД /characters/:id)
  app.post("/characters/:id/buff", async (req, reply) => {
    app.log.info(`[POST /characters/:id/buff] Request received: ${req.url}`);
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });

    const targetId = (req.params as any).id;
    const body = req.body as { skillId: number; buffData: any };
    
    app.log.info(`[POST /characters/:id/buff] targetId: ${targetId}, skillId: ${body?.skillId}`);

    if (!body.skillId || !body.buffData) {
      return reply.code(400).send({ error: "skillId and buffData are required" });
    }

    try {
      // Отримуємо цільового гравця
      const targetChar = await prisma.character.findUnique({
        where: { id: targetId },
        select: { id: true, heroJson: true },
      });

      if (!targetChar) {
        return reply.code(404).send({ error: "target character not found" });
      }

      const heroJson = (targetChar.heroJson as any) || {};
      
      // Отримуємо поточні бафи з heroJson (якщо є)
      const currentBuffs = Array.isArray(heroJson.heroBuffs) ? heroJson.heroBuffs : [];
      
      // Створюємо новий баф з правильними полями
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
      
      // Видаляємо старі бафи з таким самим id (замінюємо)
      const filteredBuffs = currentBuffs.filter((b: any) => b.id !== body.skillId);
      
      // Додаємо новий баф
      const updatedBuffs = [...filteredBuffs, newBuff];
      
      // Оновлюємо heroJson з новими бафами
      const updatedHeroJson = {
        ...heroJson,
        heroBuffs: updatedBuffs,
      };

      await prisma.character.update({
        where: { id: targetId },
        data: { heroJson: updatedHeroJson },
      });
      
      return { ok: true, message: "Buff applied successfully" };
    } catch (error) {
      app.log.error(error, "Error buffing character:");
      return reply.code(500).send({
        error: "Internal Server Error",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // GET /characters/:id  (Bearer token)
  app.get("/characters/:id", async (req, reply) => {
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });

    const params = req.params as { id?: string };
    const id = params.id;

    if (!id) return reply.code(400).send({ error: "character id required" });

    const char = await prisma.character.findFirst({
      where: {
        id,
        accountId: auth.accountId, // Забезпечуємо, що персонаж належить цьому акаунту
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
        heroJson: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!char) return reply.code(404).send({ error: "character not found" });

    // Convert BigInt to Number for JSON serialization
    const serialized = {
      ...char,
      exp: Number(char.exp),
    };

    return { ok: true, character: serialized };
  });

  // PUT /characters/:id  (Bearer token)  { heroJson, level, exp, sp, adena, aa, coinLuck }
  app.put("/characters/:id", async (req, reply) => {
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });
    
    // 🔥 Оновлюємо активність при будь-якій активності з персонажем

    const params = req.params as { id?: string };
    const id = params.id;

    if (!id) return reply.code(400).send({ error: "character id required" });

    const body = req.body as {
      heroJson?: any;
      level?: number;
      exp?: number;
      sp?: number;
      adena?: number;
      aa?: number;
      coinLuck?: number;
    };

    // Перевіряємо, що персонаж існує та належить цьому акаунту
    const existing = await prisma.character.findFirst({
      where: {
        id,
        accountId: auth.accountId,
      },
    });

    if (!existing) return reply.code(404).send({ error: "character not found" });

    // Перевіряємо, чи була покупка преміуму (premiumUntil збільшився)
    let premiumPurchased = false;
    let premiumHours = 0;
    const oldHeroJson = existing.heroJson as any || {};
    const oldPremiumUntil = oldHeroJson.premiumUntil || 0;
    
    // Оновлюємо тільки передані поля
    const updateData: any = {};
    
    // ❗ ВАЖЛИВО: Захист від перезапису heroJson порожніми даними
    if (body.heroJson !== undefined) {
      // Перевіряємо, чи heroJson не порожній і має обов'язкові поля
      if (body.heroJson && typeof body.heroJson === 'object' && body.heroJson.name) {
        const newPremiumUntil = body.heroJson.premiumUntil || 0;
        // Якщо premiumUntil збільшився (нова покупка)
        if (newPremiumUntil > oldPremiumUntil && newPremiumUntil > Date.now()) {
          premiumPurchased = true;
          // Обчислюємо тривалість в годинах
          const now = Date.now();
          const durationMs = newPremiumUntil - Math.max(now, oldPremiumUntil);
          premiumHours = Math.round(durationMs / (1000 * 60 * 60));
        }
        updateData.heroJson = body.heroJson;
        app.log.info(`[PUT /characters/:id] Updating heroJson for character ${id}, inventory items: ${body.heroJson.inventory?.length || 0}`);
      } else {
        app.log.warn(`[PUT /characters/:id] Attempted to save empty or invalid heroJson for character ${id}, ignoring`);
        // НЕ оновлюємо heroJson, якщо він порожній або невалідний
      }
    }
    
    if (body.level !== undefined) updateData.level = body.level;
    if (body.exp !== undefined) updateData.exp = BigInt(body.exp);
    if (body.sp !== undefined) updateData.sp = body.sp;
    if (body.adena !== undefined) updateData.adena = body.adena;
    if (body.aa !== undefined) updateData.aa = body.aa;
    if (body.coinLuck !== undefined) updateData.coinLuck = body.coinLuck;

    // 🔥 Оновлюємо активність при будь-якому оновленні персонажа
    updateData.lastActivityAt = new Date();

    const updated = await prisma.character.update({
      where: { id },
      data: updateData,
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
        heroJson: true,
        updatedAt: true,
      },
    });

    // Додаємо новину про покупку преміуму, якщо була покупка
    if (premiumPurchased && premiumHours > 0) {
      await addNews({
        type: "premium_purchase",
        characterId: updated.id,
        characterName: updated.name,
        metadata: { hours: premiumHours },
      }).catch((err) => {
        app.log.error(err, "Error adding premium purchase news:");
      });
    }

    // Convert BigInt to Number for JSON serialization
    const serialized = {
      ...updated,
      exp: Number(updated.exp),
    };

    return { ok: true, character: serialized };
  });

  // GET /characters/online - список онлайн гравців (активні за останні 10 хвилин)
  app.get("/characters/online", async (req, reply) => {
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });

    try {
      // Гравці активні за останні 10 хвилин (600 000 мс)
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

      // 🔥 Якщо поле lastActivityAt не існує, використовуємо updatedAt як fallback
      let onlineCharacters;
      try {
        onlineCharacters = await prisma.character.findMany({
          where: {
            lastActivityAt: {
              gte: tenMinutesAgo, // Активні за останні 10 хвилин
            },
          },
          orderBy: [
            { level: "desc" }, // Сортуємо по рівню (високий спочатку)
            { name: "asc" },   // Потім по імені
          ],
          select: {
            id: true,
            name: true,
            level: true,
            lastActivityAt: true,
            heroJson: true, // Звідси можемо взяти location та power
          },
        });
      } catch (dbError: any) {
        // Якщо поле lastActivityAt не існує, використовуємо updatedAt
        app.log.warn({ error: dbError?.message }, "lastActivityAt field may not exist, using updatedAt fallback");
        onlineCharacters = await prisma.character.findMany({
          where: {
            updatedAt: {
              gte: tenMinutesAgo,
            },
          },
          orderBy: [
            { level: "desc" },
            { name: "asc" },
          ],
          select: {
            id: true,
            name: true,
            level: true,
            updatedAt: true,
            heroJson: true,
          },
        });
      }

      // Форматуємо дані для фронтенду
      const players = onlineCharacters.map((char: any) => {
        const heroJson = (char.heroJson as any) || {};
        const location = heroJson.location || "Unknown";
        const power = heroJson.power || 0;
        const nickColor = heroJson.nickColor;
        const lastActivityAt = char.lastActivityAt || char.updatedAt;

        return {
          id: char.id,
          name: char.name,
          level: char.level,
          location,
          power,
          nickColor: nickColor || undefined,
          lastActivityAt: lastActivityAt ? (lastActivityAt.toISOString ? lastActivityAt.toISOString() : lastActivityAt) : new Date().toISOString(),
        };
      });

      const count = players.length;
      app.log.info({ count, accountId: auth.accountId }, "GET /characters/online - returning online players");

      return {
        ok: true,
        players,
        count,
      };
    } catch (error) {
      app.log.error(error, "Error fetching online players:");
      return reply.code(500).send({
        error: "Internal Server Error",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // POST /characters/heartbeat - оновлення активності (heartbeat)
  app.post("/characters/heartbeat", async (req, reply) => {
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });

    try {
      // Оновлюємо lastActivityAt для першого (активного) персонажа
      const character = await prisma.character.findFirst({
        where: { accountId: auth.accountId },
        orderBy: { createdAt: "asc" },
        select: { id: true },
      });

      if (!character) {
        return reply.code(404).send({ error: "character not found" });
      }

      // Оновлюємо lastActivityAt
      await prisma.character.update({
        where: { id: character.id },
        data: {
          lastActivityAt: new Date(),
        },
      });

      return {
        ok: true,
        message: "Activity updated",
      };
    } catch (error) {
      app.log.error(error, "Error updating heartbeat:");
      return reply.code(500).send({
        error: "Internal Server Error",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // GET /characters/public/:id - публічний профіль гравця (можна переглянути без авторизації власного акаунта)
  app.get("/characters/public/:id", async (req, reply) => {
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });

    const params = req.params as { id?: string };
    const id = params.id;

    if (!id) return reply.code(400).send({ error: "character id required" });

    try {
      // 🔥 Шукаємо персонажа за ID (без перевірки accountId - публічний профіль)
      const char = await prisma.character.findUnique({
        where: { id },
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
          heroJson: true,
          createdAt: true,
          updatedAt: true,
          lastActivityAt: true, // 🔥 Для показу "Останній раз був"
        },
      });

      if (!char) return reply.code(404).send({ error: "character not found" });

      // Convert BigInt to Number for JSON serialization
      const serialized = {
        ...char,
        exp: Number(char.exp),
        lastActivityAt: char.lastActivityAt ? char.lastActivityAt.toISOString() : null,
      };

      return { ok: true, character: serialized };
    } catch (error) {
      app.log.error(error, "Error fetching public character profile:");
      return reply.code(500).send({
        error: "Internal Server Error",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // GET /characters/by-name/:name - публічний профіль гравця за ім'ям
  app.get("/characters/by-name/:name", async (req, reply) => {
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });

    const params = req.params as { name?: string };
    const name = params.name;

    if (!name) return reply.code(400).send({ error: "character name required" });

    try {
      // 🔥 Шукаємо персонажа за ім'ям (перший знайдений)
      const char = await prisma.character.findFirst({
        where: { name },
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
          heroJson: true,
          createdAt: true,
          updatedAt: true,
          lastActivityAt: true,
        },
      });

      if (!char) return reply.code(404).send({ error: "character not found" });

      // Convert BigInt to Number for JSON serialization
      const serialized = {
        ...char,
        exp: Number(char.exp),
        lastActivityAt: char.lastActivityAt ? char.lastActivityAt.toISOString() : null,
      };

      return { ok: true, character: serialized };
    } catch (error) {
      app.log.error(error, "Error fetching public character profile by name:");
      return reply.code(500).send({
        error: "Internal Server Error",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

}
