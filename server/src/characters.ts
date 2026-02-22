import type { FastifyInstance } from "fastify";
import jwt from "jsonwebtoken";
import { prisma } from "./db";
import { addNews } from "./news";
import { safeJsonStringify } from "./utils/sanitizeBigInt";
import { validateHeroJson, addVersioning, checkRevision } from "./heroJsonValidator";
import { rateLimiters, rateLimitMiddleware } from "./rateLimiter";

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
  // Не використовуємо bannedUntil/blockedUntil в select — старий Prisma client на деплої їх не знає (Unknown field)
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
        updatedAt: true,
      },
    });

    // ❗ ВАЖЛИВО: Додаємо heroRevision до персонажів, які його не мають
    // Це забезпечує сумісність зі старими записами
    for (const char of chars) {
      const heroJson = char.heroJson as any || {};
      if (!heroJson.heroRevision || heroJson.heroRevision === null) {
        const fallbackRevision = char.updatedAt 
          ? Math.floor(new Date(char.updatedAt).getTime())
          : Date.now();
        heroJson.heroRevision = fallbackRevision;
        heroJson.heroJsonVersion = heroJson.heroJsonVersion || 1;
        
        // Оновлюємо heroJson з ревізією (асинхронно, не блокуємо запит)
        prisma.character.update({
          where: { id: char.id },
          data: { heroJson },
        }).catch((err) => {
          app.log.error(err, `Failed to add heroRevision to character ${char.id}`);
        });
      }
    }

    let banMap: Record<string, { bannedUntil: string | null; blockedUntil: string | null }> = {};
    try {
      const rows = await prisma.$queryRaw<Array<{ id: string; bannedUntil: Date | null; blockedUntil: Date | null }>>`
        SELECT id, "bannedUntil", "blockedUntil" FROM "Character" WHERE "accountId" = ${auth.accountId}
      `;
      for (const r of rows) {
        banMap[r.id] = {
          bannedUntil: r.bannedUntil ? r.bannedUntil.toISOString() : null,
          blockedUntil: r.blockedUntil ? r.blockedUntil.toISOString() : null,
        };
      }
    } catch (_) {}

    const serializedChars = chars.map(char => ({
      ...char,
      exp: Number(char.exp),
      adena: Number(char.adena ?? 0),
      aa: Number(char.aa ?? 0),
      coinLuck: Number(char.coinLuck ?? 0),
      bannedUntil: banMap[char.id]?.bannedUntil ?? null,
      blockedUntil: banMap[char.id]?.blockedUntil ?? null,
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
        adena: Number(created.adena ?? 0),
        aa: Number(created.aa ?? 0),
        coinLuck: Number(created.coinLuck ?? 0),
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

  // POST /characters/:id/colorize-nick - зміна кольору ніка (50 Coin of Luck, має бути ПЕРЕД /characters/:id)
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

    const PRICE = 50;

    try {
      const ch = await prisma.character.findFirst({
        where: { id: targetId, accountId: auth.accountId },
        select: { id: true, coinLuck: true, heroJson: true },
      });
      if (!ch) return reply.code(404).send({ error: "character not found" });

      const heroJson = (ch.heroJson ?? {}) as any;
      const oldRevision = heroJson.heroRevision ?? 0;
      if (body.expectedRevision !== undefined && body.expectedRevision !== oldRevision) {
        return reply.code(409).send({ error: "revision_conflict", revision: oldRevision });
      }

      const currentCoinLuck = ch.coinLuck ?? 0;
      if (currentCoinLuck < PRICE) {
        return reply.code(400).send({ error: "not enough coinLuck", coinLuck: currentCoinLuck });
      }

      const { addVersioning } = await import("./heroJsonValidator");
      const updatedHeroJson = addVersioning(
        { ...heroJson, nickColor },
        oldRevision
      );

      const updated = await prisma.character.update({
        where: { id: ch.id },
        data: {
          coinLuck: { decrement: PRICE },
          nickColor,
          heroJson: updatedHeroJson,
        },
        select: { id: true, coinLuck: true, nickColor: true, heroJson: true, name: true, level: true, exp: true, sp: true, adena: true, aa: true, updatedAt: true },
      });

      return reply.send({ ok: true, character: { ...updated, exp: Number(updated.exp) } });
    } catch (error) {
      app.log.error(error, "Error colorize-nick:");
      return reply.code(500).send({
        error: "Internal Server Error",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // POST /characters/:id/rename-nick - зміна ніка (50 Coin of Luck, має бути ПЕРЕД /characters/:id)
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

    const PRICE = 50;

    try {
      const ch = await prisma.character.findFirst({
        where: { id: targetId, accountId: auth.accountId },
        select: { id: true, coinLuck: true, heroJson: true },
      });
      if (!ch) return reply.code(404).send({ error: "character not found" });

      const heroJson = (ch.heroJson ?? {}) as any;
      const oldRevision = heroJson.heroRevision ?? 0;
      if (body.expectedRevision !== undefined && body.expectedRevision !== oldRevision) {
        return reply.code(409).send({ error: "revision_conflict", revision: oldRevision });
      }

      const currentCoinLuck = Number(ch.coinLuck ?? 0);
      if (currentCoinLuck < PRICE) {
        return reply.code(400).send({ error: "not enough coinLuck", coinLuck: currentCoinLuck });
      }

      const { addVersioning } = await import("./heroJsonValidator");
      const updatedHeroJson = addVersioning(
        { ...heroJson, name: newName, coinOfLuck: currentCoinLuck - PRICE },
        oldRevision
      );

      const updated = await prisma.character.update({
        where: { id: ch.id },
        data: {
          coinLuck: { decrement: PRICE },
          name: newName,
          heroJson: updatedHeroJson,
        },
        select: { id: true, coinLuck: true, name: true, heroJson: true, level: true, exp: true, sp: true, adena: true, aa: true, updatedAt: true },
      });

      return reply.send({ ok: true, character: { ...updated, exp: Number(updated.exp) } });
    } catch (error) {
      app.log.error(error, "Error rename-nick:");
      return reply.code(500).send({
        error: "Internal Server Error",
        message: error instanceof Error ? error.message : "Unknown error",
      });
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
      // Отримуємо цільового гравця (level потрібен для fallback maxHp)
      const targetChar = await prisma.character.findUnique({
        where: { id: targetId },
        select: { id: true, level: true, heroJson: true },
      });

      if (!targetChar) {
        return reply.code(404).send({ error: "target character not found" });
      }

      const heroJson = (targetChar.heroJson as any) || {};
      const rawMaxHp = Number(
        heroJson.maxHp ?? heroJson.maxHP ?? heroJson.max_hp ??
        heroJson?.resources?.maxHp ?? heroJson?.battleStats?.maxHp ?? 0
      );
      const level = Number(targetChar.level ?? 1);
      // Якщо maxHp не збережено — обчислюємо з рівня (formula з calcResources)
      const maxHp = rawMaxHp > 100 ? rawMaxHp : Math.max(100, 150 + level * 12);
      const rawHp = Number(heroJson.hp ?? 0);
      const currentHp = rawHp > 0 ? Math.min(rawHp, maxHp) : maxHp;
      const newHp = Math.min(maxHp, currentHp + body.power);

      // ❗ ВАЖЛИВО: Інкрементуємо ревізію при зміні heroJson (side-effect endpoint)
      const oldRevision = heroJson.heroRevision || 0;
      const updatedHeroJson = {
        ...heroJson,
        hp: newHp,
        maxHp: maxHp,
        heroRevision: Date.now() > oldRevision ? Date.now() : oldRevision + 1,
        heroJsonVersion: heroJson.heroJsonVersion || 1,
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
      
      // ❗ ВАЖЛИВО: Перевірка конфліктів бафів та заміна за рівень
      // 1. Видаляємо бафи з таким самим id (замінюємо)
      // 2. Якщо новий баф має buffGroup, видаляємо всі бафи з таким самим buffGroup
      // 3. Якщо той самий баф, але кращого рівня - замінюємо старий
      let filteredBuffs = currentBuffs.filter((b: any) => {
        // Видаляємо бафи з таким самим id
        if (b.id === body.skillId) return false;
        
        // Якщо новий баф має buffGroup, видаляємо бафи з таким самим buffGroup
        if (newBuff.buffGroup && b.buffGroup === newBuff.buffGroup) {
          return false; // Видаляємо конфліктуючий баф
        }
        
        return true;
      });
      
      // 🔥 КРИТИЧНО: Перевіряємо чи є вже такий самий баф, але кращого рівня
      // Якщо є старий баф з таким самим id, але новий кращий - замінюємо
      // Якщо старий кращий - не додаємо новий
      const existingBuff = currentBuffs.find((b: any) => b.id === body.skillId);
      if (existingBuff) {
        // Порівнюємо загальну силу ефектів
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
        
        // Якщо старий баф кращий - не додаємо новий
        if (oldTotalPower >= newTotalPower) {
          app.log.info(
            {
              targetId,
              skillId: body.skillId,
              reason: "existing_buff_better",
              oldPower: oldTotalPower,
              newPower: newTotalPower,
            },
            '[POST /characters/:id/buff] Keeping existing buff (better than new)'
          );
          return reply.code(200).send({ ok: true, message: "Existing buff is better, keeping it" });
        }
        
        // Новий баф кращий - додаємо (старий вже видалений через filteredBuffs)
        app.log.info(
          {
            targetId,
            skillId: body.skillId,
            reason: "replacing_with_better",
            oldPower: oldTotalPower,
            newPower: newTotalPower,
          },
          '[POST /characters/:id/buff] Replacing buff with better version'
        );
      }
      
      // Додаємо новий баф
      const updatedBuffs = [...filteredBuffs, newBuff];
      
      // ❗ ВАЖЛИВО: Інкрементуємо ревізію при зміні heroJson (side-effect endpoint)
      const oldRevision = heroJson.heroRevision || 0;
      const updatedHeroJson = {
        ...heroJson,
        heroBuffs: updatedBuffs,
        heroRevision: Date.now() > oldRevision ? Date.now() : oldRevision + 1, // Інкремент ревізії
        heroJsonVersion: heroJson.heroJsonVersion || 1,
      };

      await prisma.character.update({
        where: { id: targetId },
        data: { heroJson: updatedHeroJson },
      });
      
      // ❗ Логуємо для діагностики
      const skillId = body.skillId;
      const buffName = newBuff.name;
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
        '[POST /characters/:id/buff] Buff applied'
      );
      
      return { ok: true, message: "Buff applied successfully" };
    } catch (error) {
      app.log.error(error, "Error buffing character:");
      return reply.code(500).send({
        error: "Internal Server Error",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // POST /characters/:id/resurrect — атомарно скидає смерть, ставить ресурси на max (має бути ПЕРЕД GET /characters/:id)
  app.post("/characters/:id/resurrect", async (req, reply) => {
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });

    const targetId = (req.params as any).id;
    if (!targetId) return reply.code(400).send({ error: "character id required" });

    try {
      const ch = await prisma.character.findFirst({
        where: { id: targetId, accountId: auth.accountId },
        select: { id: true, name: true, race: true, classId: true, sex: true, level: true, exp: true, sp: true, adena: true, aa: true, coinLuck: true, coinsSilver: true, heroJson: true, updatedAt: true },
      });
      if (!ch) return reply.code(404).send({ error: "character not found" });

      const heroJson = (ch.heroJson ?? {}) as any;
      const maxHp = Math.max(1, Number(heroJson.maxHp) || 100);
      const maxMp = Math.max(1, Number(heroJson.maxMp) || 50);
      const maxCp = Math.max(1, Number(heroJson.maxCp) || Math.round(maxHp * 0.6));

      const patchedHeroJson = {
        ...heroJson,
        isDead: false,
        deadAt: 0,
        hp: maxHp,
        mp: maxMp,
        cp: maxCp,
        hpFull: true,
        mpFull: true,
        cpFull: true,
        hpPercent: 1,
        mpPercent: 1,
        cpPercent: 1,
        heroBuffs: [],
      };

      const oldRevision = heroJson.heroRevision || 0;
      const versionedHeroJson = addVersioning(patchedHeroJson, oldRevision);

      const updated = await prisma.character.update({
        where: { id: ch.id },
        data: { heroJson: versionedHeroJson, lastActivityAt: new Date() },
        select: { id: true, name: true, race: true, classId: true, sex: true, level: true, exp: true, sp: true, adena: true, aa: true, coinLuck: true, coinsSilver: true, heroJson: true, updatedAt: true },
      });

      return reply.send({ ok: true, character: { ...updated, exp: Number(updated.exp) } });
    } catch (error) {
      app.log.error(error, "Error resurrect character:");
      return reply.code(500).send({
        error: "Internal Server Error",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // --- Fishing (має бути ПЕРЕД GET /characters/:id) ---
  const FISHING_COST_SP = 5000;
  const FISHING_COST_ADENA = 5_000_000;
  const FISHING_DURATION_MS = 60 * 60 * 1000;
  const ROD_ITEM_ID = "baby_duck_rod";
  const BAIT_ITEM_ID = "gludio_fish_lure";
  const FISH_ITEM_ID = "fish_seawater";
  const FISH_MIN = 100;
  const FISH_MAX = 300;

  app.get("/characters/:id/fishing", async (req, reply) => {
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });
    const id = (req.params as any).id;
    if (!id) return reply.code(400).send({ error: "character id required" });

    try {
      const ch = await prisma.character.findFirst({
        where: { id, accountId: auth.accountId },
        select: { id: true, heroJson: true },
      });
      if (!ch) return reply.code(404).send({ error: "character not found" });
      const heroJson = (ch.heroJson ?? {}) as any;
      let session = heroJson.fishingSession ?? null;
      // Для старих сесій без fishCount: якщо улов готовий — генеруємо і зберігаємо
      if (session && typeof session.startedAt === "number") {
        const elapsed = Date.now() - session.startedAt;
        if (elapsed >= FISHING_DURATION_MS && typeof session.fishCount !== "number") {
          const fishCount = FISH_MIN + Math.floor(Math.random() * (FISH_MAX - FISH_MIN + 1));
          const updatedHeroJson = { ...heroJson, fishingSession: { ...session, fishCount } };
          await prisma.character.update({
            where: { id: ch.id },
            data: { heroJson: updatedHeroJson },
          });
          session = { ...session, fishCount };
        }
      }
      return reply.send({ ok: true, session });
    } catch (error) {
      app.log.error(error, "GET /characters/:id/fishing");
      return reply.code(500).send({ error: "Internal Server Error" });
    }
  });

  app.post("/characters/:id/fishing/start", async (req, reply) => {
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });
    const id = (req.params as any).id;
    if (!id) return reply.code(400).send({ error: "character id required" });

    try {
      const ch = await prisma.character.findFirst({
        where: { id, accountId: auth.accountId },
        select: { id: true, sp: true, adena: true, heroJson: true },
      });
      if (!ch) return reply.code(404).send({ error: "character not found" });

      const heroJson = (ch.heroJson ?? {}) as any;
      if (heroJson.fishingSession) {
        return reply.code(400).send({ error: "fishing already in progress" });
      }

      const equipment = heroJson.equipment ?? {};
      const hasRod =
        equipment["weapon"] === ROD_ITEM_ID ||
        equipment["lrhand"] === ROD_ITEM_ID ||
        equipment["shield"] === ROD_ITEM_ID;
      if (!hasRod) {
        return reply.code(400).send({ error: "rod required (Baby Duck Rod)" });
      }

      const inv: any[] = Array.isArray(heroJson.inventory) ? heroJson.inventory : [];
      const baitIdx = inv.findIndex((i: any) => (i?.id ?? i?.itemId) === BAIT_ITEM_ID && (Number(i?.count) ?? 0) > 0);
      if (baitIdx < 0) {
        return reply.code(400).send({ error: "bait required (Gludio Fish Lure)" });
      }

      const sp = Number(ch.sp) ?? 0;
      const adena = Number(ch.adena) ?? 0;
      if (sp < FISHING_COST_SP || adena < FISHING_COST_ADENA) {
        return reply.code(400).send({ error: `need ${FISHING_COST_SP} SP and ${FISHING_COST_ADENA} adena` });
      }

      const newInv = inv.map((item: any, idx: number) => {
        if (idx !== baitIdx) return item;
        const c = Math.max(0, (Number(item.count) ?? 1) - 1);
        return c > 0 ? { ...item, count: c } : null;
      }).filter(Boolean) as any[];

      const fishCount = FISH_MIN + Math.floor(Math.random() * (FISH_MAX - FISH_MIN + 1));
      const oldRevision = heroJson.heroRevision ?? 0;
      const updatedHeroJson = addVersioning(
        {
          ...heroJson,
          inventory: newInv,
          fishingSession: { startedAt: Date.now(), fishCount },
        },
        oldRevision
      );

      const [updated] = await prisma.$transaction([
        prisma.character.update({
          where: { id: ch.id },
          data: {
            sp: { decrement: FISHING_COST_SP },
            adena: { decrement: FISHING_COST_ADENA },
            heroJson: updatedHeroJson,
            lastActivityAt: new Date(),
          },
          select: {
            id: true, name: true, race: true, classId: true, sex: true, level: true,
            exp: true, sp: true, adena: true, aa: true, coinLuck: true, heroJson: true, updatedAt: true,
          },
        }),
      ]);

      const fs = (updated.heroJson as any).fishingSession;
      const session = { startedAt: fs?.startedAt ?? Date.now(), fishCount: fs?.fishCount ?? fishCount };
      return reply.send({
        ok: true,
        character: { ...updated, exp: Number(updated.exp) },
        session,
      });
    } catch (error) {
      app.log.error(error, "POST /characters/:id/fishing/start");
      return reply.code(500).send({ error: "Internal Server Error" });
    }
  });

  app.post("/characters/:id/fishing/collect", async (req, reply) => {
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });
    const id = (req.params as any).id;
    if (!id) return reply.code(400).send({ error: "character id required" });

    try {
      const ch = await prisma.character.findFirst({
        where: { id, accountId: auth.accountId },
        select: { id: true, heroJson: true },
      });
      if (!ch) return reply.code(404).send({ error: "character not found" });

      const heroJson = (ch.heroJson ?? {}) as any;
      const session = heroJson.fishingSession;
      if (!session || typeof session.startedAt !== "number") {
        return reply.code(400).send({ error: "no active fishing session" });
      }

      const elapsed = Date.now() - session.startedAt;
      if (elapsed < FISHING_DURATION_MS) {
        return reply.code(400).send({ error: "fishing not ready yet (1 hour required)" });
      }

      const fishCount = typeof session.fishCount === "number" ? session.fishCount : FISH_MIN + Math.floor(Math.random() * (FISH_MAX - FISH_MIN + 1));
      const inv: any[] = Array.isArray(heroJson.inventory) ? [...heroJson.inventory] : [];
      const existing = inv.find((i: any) => (i?.id ?? i?.itemId) === FISH_ITEM_ID);
      if (existing) {
        existing.count = (Number(existing.count) ?? 0) + fishCount;
      } else {
        inv.push({
          id: FISH_ITEM_ID,
          name: "fish_seawater",
          icon: "/items/drops/resources/Etc_fish_seawater_i01_0.jpg",
          slot: "resource",
          count: fishCount,
        });
      }

      const { fishingSession: _, ...restHero } = heroJson;
      const oldRevision = heroJson.heroRevision ?? 0;
      const updatedHeroJson = addVersioning(
        { ...restHero, inventory: inv },
        oldRevision
      );

      const [updated] = await prisma.$transaction([
        prisma.character.update({
          where: { id: ch.id },
          data: { heroJson: updatedHeroJson, lastActivityAt: new Date() },
          select: {
            id: true, name: true, race: true, classId: true, sex: true, level: true,
            exp: true, sp: true, adena: true, aa: true, coinLuck: true, heroJson: true, updatedAt: true,
          },
        }),
      ]);

      return reply.send({
        ok: true,
        character: { ...updated, exp: Number(updated.exp) },
        fishCount,
      });
    } catch (error) {
      app.log.error(error, "POST /characters/:id/fishing/collect");
      return reply.code(500).send({ error: "Internal Server Error" });
    }
  });

  // GET /characters/:id  (Bearer token)
  // Не використовуємо bannedUntil/blockedUntil в select — старий Prisma client на деплої їх не знає (Unknown field)
  app.get("/characters/:id", async (req, reply) => {
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });

    const params = req.params as { id?: string };
    const id = params.id;

    if (!id) return reply.code(400).send({ error: "character id required" });

    const char = await prisma.character.findFirst({
      where: { id, accountId: auth.accountId },
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
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!char) return reply.code(404).send({ error: "character not found" });

    let bannedUntil: string | null = null;
    let blockedUntil: string | null = null;
    try {
      const rows = await prisma.$queryRaw<Array<{ bannedUntil: Date | null; blockedUntil: Date | null }>>`
        SELECT "bannedUntil", "blockedUntil" FROM "Character" WHERE id = ${id} AND "accountId" = ${auth.accountId}
      `;
      if (rows[0]) {
        bannedUntil = rows[0].bannedUntil ? rows[0].bannedUntil.toISOString() : null;
        blockedUntil = rows[0].blockedUntil ? rows[0].blockedUntil.toISOString() : null;
      }
    } catch (_) {
      // Колонки можуть відсутні до міграції
    }

    // 🔥 Оновлюємо lastActivityAt при завантаженні героя — гравець одразу в онлайні
    prisma.character.update({
      where: { id: char.id },
      data: { lastActivityAt: new Date() },
    }).catch(() => {});

    const serialized = {
      ...char,
      exp: Number(char.exp),
      adena: Number(char.adena ?? 0),
      aa: Number(char.aa ?? 0),
      coinLuck: Number(char.coinLuck ?? 0),
      coinsSilver: Number((char as any).coinsSilver ?? 0),
      bannedUntil,
      blockedUntil,
    };

    return { ok: true, character: serialized };
  });

  // PUT /characters/:id  (Bearer token)  { heroJson, level, exp, sp, adena, aa, coinLuck }
  app.put("/characters/:id", {
    preHandler: async (req, reply) => {
      await rateLimitMiddleware(rateLimiters.characterUpdate, "character-update")(req, reply);
    },
  }, async (req, reply) => {
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
      coinsSilver?: number;
      expectedRevision?: number; // Для optimistic locking
    };

    // Перевіряємо, що персонаж існує та належить цьому акаунту
    const existing = await prisma.character.findFirst({
      where: {
        id,
        accountId: auth.accountId,
      },
    });

    if (!existing) return reply.code(404).send({ error: "character not found" });

    // 🔥 КРИТИЧНО: Валідація критичних полів для захисту від читерства через DevTools
    // Перевіряємо, що нові значення не менші за поточні (захист від зменшення)
    // Або дозволяємо зміни тільки в межах розумних меж
    if (body.level !== undefined) {
      if (typeof body.level !== 'number' || body.level < 1 || body.level > 80) {
        return reply.code(400).send({ error: "invalid level (must be 1-80)" });
      }
      // Захист від зменшення рівня (можна тільки збільшувати)
      if (body.level < existing.level) {
        app.log.warn({
          accountId: auth.accountId,
          characterId: id,
          currentLevel: existing.level,
          attemptedLevel: body.level,
        }, `[PUT /characters/:id] Attempted to decrease level from ${existing.level} to ${body.level}`);
        return reply.code(400).send({ error: "level cannot be decreased" });
      }
    }

    if (body.exp !== undefined) {
      if (typeof body.exp !== 'number' || body.exp < 0) {
        return reply.code(400).send({ error: "invalid exp (must be >= 0)" });
      }
      // Захист від зменшення exp (можна тільки збільшувати)
      const currentExp = Number(existing.exp);
      if (body.exp < currentExp) {
        app.log.warn({
          accountId: auth.accountId,
          characterId: id,
          currentExp,
          attemptedExp: body.exp,
        }, `[PUT /characters/:id] Attempted to decrease exp from ${currentExp} to ${body.exp}`);
        return reply.code(400).send({ error: "exp cannot be decreased" });
      }
    }

    if (body.sp !== undefined) {
      if (typeof body.sp !== 'number' || body.sp < 0) {
        return reply.code(400).send({ error: "invalid sp (must be >= 0)" });
      }
      // Дозволяємо зменшення sp при оновленні heroJson.skills (learn skill)
      const skillsChanging = body.heroJson?.skills !== undefined;
      if (body.sp < existing.sp && !skillsChanging) {
        app.log.warn({
          accountId: auth.accountId,
          characterId: id,
          currentSp: existing.sp,
          attemptedSp: body.sp,
        }, `[PUT /characters/:id] Attempted to decrease sp from ${existing.sp} to ${body.sp}`);
        return reply.code(400).send({ error: "sp cannot be decreased" });
      }
    }

    if (body.adena !== undefined) {
      // BigInt серіалізується як string у JSON — приймаємо і number, і numeric string
      const adenaNum = typeof body.adena === "string" ? Number(body.adena) : body.adena;
      if (typeof adenaNum !== "number" || isNaN(adenaNum) || adenaNum < 0) {
        return reply.code(400).send({ error: "invalid adena (must be >= 0)" });
      }
      (body as any).adena = adenaNum; // нормалізуємо для подальшої обробки
      // Дозволяємо зменшення adena — потрібно для покупок в магазині, клані тощо
    }

    if (body.aa !== undefined) {
      if (typeof body.aa !== 'number' || body.aa < 0) {
        return reply.code(400).send({ error: "invalid aa (must be >= 0)" });
      }
      // Захист від зменшення aa (можна тільки збільшувати)
      if (body.aa < Number(existing.aa ?? 0)) {
        app.log.warn({
          accountId: auth.accountId,
          characterId: id,
          currentAa: existing.aa || 0,
          attemptedAa: body.aa,
        }, `[PUT /characters/:id] Attempted to decrease aa from ${existing.aa || 0} to ${body.aa}`);
        return reply.code(400).send({ error: "aa cannot be decreased" });
      }
    }

    if (body.coinsSilver !== undefined) {
      if (typeof body.coinsSilver !== 'number' || body.coinsSilver < 0) {
        return reply.code(400).send({ error: "invalid coinsSilver (must be >= 0)" });
      }
    }

    if (body.coinLuck !== undefined) {
      if (typeof body.coinLuck !== 'number' || body.coinLuck < 0) {
        return reply.code(400).send({ error: "invalid coinLuck (must be >= 0)" });
      }
      // ❗ coinLuck можна тільки збільшувати; зменшення — тільки через POST /premium/buy
      if (body.coinLuck < Number((existing as any).coinLuck ?? 0)) {
        app.log.warn({
          accountId: auth.accountId,
          characterId: id,
          currentCoinLuck: existing.coinLuck || 0,
          attemptedCoinLuck: body.coinLuck,
        }, `[PUT /characters/:id] Attempted to decrease coinLuck from ${existing.coinLuck || 0} to ${body.coinLuck}`);
        return reply.code(400).send({ error: "coinLuck cannot be decreased" });
      }
    }

    const oldHeroJson = existing.heroJson as any || {};
    const oldPremiumUntil = oldHeroJson.premiumUntil || 0;
    
    // ❗ ВАЖЛИВО: Якщо heroRevision відсутній - додаємо його автоматично
    // Це забезпечує сумісність зі старими записами
    if (!oldHeroJson.heroRevision || oldHeroJson.heroRevision === null) {
      const fallbackRevision = existing.updatedAt 
        ? Math.floor(new Date(existing.updatedAt).getTime())
        : Date.now();
      oldHeroJson.heroRevision = fallbackRevision;
      oldHeroJson.heroJsonVersion = oldHeroJson.heroJsonVersion || 1;
      
      // Оновлюємо heroJson з ревізією (асинхронно, не блокуємо запит)
      prisma.character.update({
        where: { id },
        data: { heroJson: oldHeroJson },
      }).catch((err) => {
        app.log.error(err, `Failed to add heroRevision to character ${id}`);
      });
    }
    
    // ❗ ВАЖЛИВО: Якщо heroRevision відсутній - додаємо його автоматично
    // Це забезпечує сумісність зі старими записами
    if (!oldHeroJson.heroRevision || oldHeroJson.heroRevision === null) {
      const fallbackRevision = existing.updatedAt 
        ? Math.floor(new Date(existing.updatedAt).getTime())
        : Date.now();
      oldHeroJson.heroRevision = fallbackRevision;
      oldHeroJson.heroJsonVersion = oldHeroJson.heroJsonVersion || 1;
      
      // Оновлюємо heroJson з ревізією (асинхронно, не блокуємо запит)
      prisma.character.update({
        where: { id },
        data: { heroJson: oldHeroJson },
      }).catch((err) => {
        app.log.error(err, `Failed to add heroRevision to character ${id}`);
      });
    }
    
    // Оновлюємо тільки передані поля
    const updateData: any = {};
    
    // ❗ ВАЖЛИВО: Захист від перезапису heroJson порожніми даними + валідація + optimistic locking
    if (body.heroJson !== undefined) {
      // 1. Перевірка optimistic locking (якщо клієнт передав expectedRevision)
      if (body.expectedRevision !== undefined) {
        const revisionCheck = checkRevision(oldHeroJson, body.expectedRevision);
        if (!revisionCheck.valid) {
          app.log.warn({
            accountId: auth.accountId,
            characterId: id,
            expectedRevision: body.expectedRevision,
            currentRevision: oldHeroJson.heroRevision || 0,
          }, `[PUT /characters/:id] Revision conflict for character ${id}: expected ${body.expectedRevision}, got ${oldHeroJson.heroRevision || 'none'}`);
          
          // ❗ ВАЖЛИВО: Повертаємо серверний state для синхронізації
          return reply.code(409).send({ 
            error: "revision_conflict",
            message: "Character was modified by another session. Please reload and try again.",
            currentRevision: oldHeroJson.heroRevision || 0,
            updatedAt: existing.updatedAt.toISOString(),
            // Повертаємо мінімальний серверний state (можна розширити до повного heroJson)
            serverState: {
              heroRevision: oldHeroJson.heroRevision || 0,
              heroJsonVersion: oldHeroJson.heroJsonVersion || 1,
              updatedAt: existing.updatedAt.toISOString(),
            },
          });
        }
      }

      // 2. Валідація структури heroJson
      const validation = validateHeroJson(body.heroJson);
      if (!validation.valid) {
        app.log.warn({
          characterId: id,
          accountId: auth.accountId,
          errors: validation.errors,
        }, `[PUT /characters/:id] Invalid heroJson structure for character ${id}`);
        return reply.code(400).send({
          error: "invalid_hero_json",
          message: "heroJson structure is invalid",
          errors: validation.errors,
        });
      }

      // 3. Перевірка, чи heroJson не порожній і має обов'язкові поля
      if (body.heroJson && typeof body.heroJson === 'object' && body.heroJson.name) {
        // ❗ premiumUntil можна тільки зменшувати; збільшення — тільки через POST /premium/buy
        const clientPremiumUntil = body.heroJson.premiumUntil != null ? Number(body.heroJson.premiumUntil) : oldPremiumUntil;
        const clampedPremiumUntil = Math.min(clientPremiumUntil, oldPremiumUntil);
        const heroJsonToSave = { ...body.heroJson, premiumUntil: clampedPremiumUntil };
        
        // 4. Додаємо/оновлюємо versioning
        // ❗ КРИТИЧНО: Сервер сам генерує нову ревізію на основі старої з БД
        const oldRevision = oldHeroJson.heroRevision || 0;
        const versionedHeroJson = addVersioning(heroJsonToSave, oldRevision);
        updateData.heroJson = versionedHeroJson;
        app.log.info({
          accountId: auth.accountId,
          characterId: id,
          oldRevision,
          newRevision: versionedHeroJson.heroRevision,
          inventoryItems: body.heroJson.inventory?.length || 0,
        }, `[PUT /characters/:id] Updating heroJson for character ${id}`);
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
    if (body.coinsSilver !== undefined) (updateData as any).coinsSilver = body.coinsSilver;

    // 🔥 Оновлюємо активність ТІЛЬКИ якщо оновлюється heroJson (основна активність)
    // Для інших полів (level, exp, тощо) активність оновлюється через heartbeat
    // Це зменшує навантаження на БД при частих оновленнях
    if (updateData.heroJson) {
      updateData.lastActivityAt = new Date();
    }

    // ❗ КРИТИЧНО: Атомарна перевірка ревізії + оновлення на рівні БД
    // Використовуємо умовний UPDATE через raw SQL для 100% атомарності
    let updated: any;
    if (body.expectedRevision !== undefined && updateData.heroJson) {
      // Використовуємо транзакцію з raw SQL для атомарного умовного UPDATE
      // UPDATE ... WHERE id = ? AND (heroJson->>'heroRevision')::bigint = expectedRevision
      // Якщо count = 0 → ревізія змінилася → 409
      // Якщо count = 1 → успіх → сервер інкрементив ревізію в цьому ж апдейті
      
      try {
        const result = await prisma.$transaction(async (tx) => {
          // Спочатку перевіряємо поточну ревізію з блокуючим read (SELECT FOR UPDATE)
          const locked = await tx.$queryRaw<Array<{ heroJson: any; updatedAt: Date }>>`
            SELECT "heroJson", "updatedAt"
            FROM "Character"
            WHERE "id" = ${id} AND "accountId" = ${auth.accountId}
            FOR UPDATE
          `;

          if (locked.length === 0) {
            return { success: false, reason: 'not_found' };
          }

          const currentHeroJson = locked[0].heroJson as any || {};
          const currentRevision = currentHeroJson.heroRevision || 0;

          if (currentRevision !== body.expectedRevision) {
            return { 
              success: false, 
              reason: 'revision_conflict',
              currentRevision,
              updatedAt: locked[0].updatedAt,
            };
          }

          // Атомарний UPDATE з умовою на ревізію
          // Використовуємо JSONB операції PostgreSQL
          const newRevision = Date.now() > currentRevision ? Date.now() : currentRevision + 1;
          const updatedHeroJson = {
            ...updateData.heroJson,
            heroRevision: newRevision,
          };

          // Виконуємо умовний UPDATE через raw SQL для атомарності
          // Будуємо SET частину динамічно з правильними параметрами PostgreSQL
          const setParts: string[] = [];
          const params: any[] = [];
          let paramIndex = 1;

          // Додаємо heroJson (завжди є, бо ми в блоці updateData.heroJson)
          setParts.push(`"heroJson" = $${paramIndex}::jsonb`);
          params.push(safeJsonStringify(updatedHeroJson));
          paramIndex++;

          if (updateData.level !== undefined) {
            setParts.push(`"level" = $${paramIndex}`);
            params.push(updateData.level);
            paramIndex++;
          }
          if (updateData.exp !== undefined) {
            setParts.push(`"exp" = $${paramIndex}::bigint`);
            params.push(updateData.exp);
            paramIndex++;
          }
          if (updateData.sp !== undefined) {
            setParts.push(`"sp" = $${paramIndex}`);
            params.push(updateData.sp);
            paramIndex++;
          }
          if (updateData.adena !== undefined) {
            setParts.push(`"adena" = $${paramIndex}`);
            params.push(updateData.adena);
            paramIndex++;
          }
          if (updateData.aa !== undefined) {
            setParts.push(`"aa" = $${paramIndex}`);
            params.push(updateData.aa);
            paramIndex++;
          }
          if (updateData.coinLuck !== undefined) {
            setParts.push(`"coinLuck" = $${paramIndex}`);
            params.push(updateData.coinLuck);
            paramIndex++;
          }
          if ((updateData as any).coinsSilver !== undefined) {
            setParts.push(`"coinsSilver" = $${paramIndex}`);
            params.push((updateData as any).coinsSilver);
            paramIndex++;
          }
          if (updateData.lastActivityAt) {
            setParts.push(`"lastActivityAt" = $${paramIndex}`);
            params.push(updateData.lastActivityAt);
            paramIndex++;
          }
          setParts.push(`"updatedAt" = NOW()`);

          // Виконуємо атомарний UPDATE з умовою на ревізію
          // Використовуємо $executeRawUnsafe з параметризованим SQL для безпеки
          const sql = `
            UPDATE "Character"
            SET ${setParts.join(', ')}
            WHERE "id" = $${paramIndex}
              AND "accountId" = $${paramIndex + 1}
              AND ("heroJson"->>'heroRevision')::bigint = $${paramIndex + 2}
          `;
          params.push(id, auth.accountId, body.expectedRevision);

          const updateResult = await tx.$executeRawUnsafe(sql, ...params);

          if (updateResult === 0) {
            // Ревізія змінилася під час виконання (дуже рідкісний випадок)
            return { 
              success: false, 
              reason: 'revision_conflict_during_update',
              currentRevision,
              updatedAt: locked[0].updatedAt,
            };
          }

          // Отримуємо оновлений запис
          const updated = await tx.character.findUnique({
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
              coinsSilver: true,
              heroJson: true,
              updatedAt: true,
            },
          });

          return { success: true, character: updated };
        });

        if (!result.success) {
          if (result.reason === 'not_found') {
            return reply.code(404).send({ error: "character not found" });
          }
          
          // Revision conflict
          app.log.warn(`[PUT /characters/:id] Atomic revision check failed for character ${id}: expected ${body.expectedRevision}, got ${result.currentRevision}`);
          return reply.code(409).send({ 
            error: "revision_conflict",
            message: "Character was modified by another session. Please reload and try again.",
            currentRevision: result.currentRevision || 0,
            updatedAt: result.updatedAt?.toISOString() || existing.updatedAt.toISOString(),
            serverState: {
              heroRevision: result.currentRevision || 0,
              heroJsonVersion: oldHeroJson.heroJsonVersion || 1,
              updatedAt: result.updatedAt?.toISOString() || existing.updatedAt.toISOString(),
            },
          });
        }

        // Успіх - використовуємо результат з транзакції
        updated = result.character!;
      } catch (txError) {
        app.log.error(txError, `[PUT /characters/:id] Transaction error for character ${id}`);
        return reply.code(500).send({
          error: "Internal Server Error",
          message: txError instanceof Error ? txError.message : "Transaction failed",
        });
      }
    } else {
      // Якщо expectedRevision не передано або не оновлюється heroJson - звичайний update
      // ❗ Перевіряємо чи є що оновлювати
      if (Object.keys(updateData).length === 0) {
        // Нема даних для оновлення — повертаємо existing без зміни
        updated = existing;
      } else {
        updated = await prisma.character.update({
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
            coinsSilver: true,
            heroJson: true,
            updatedAt: true,
          },
        });
      }
    }

    // Convert BigInt to Number for JSON serialization
    const serialized = {
      ...updated,
      exp: Number(updated.exp),
      adena: Number((updated as any).adena ?? 0),
      aa: Number((updated as any).aa ?? 0),
      coinLuck: Number((updated as any).coinLuck ?? 0),
      coinsSilver: Number((updated as any).coinsSilver ?? 0),
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

      // Активні за останні 10 хв: lastActivityAt >= X
      let onlineCharacters;
      try {
        onlineCharacters = await prisma.character.findMany({
          where: {
            lastActivityAt: { gte: tenMinutesAgo },
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
            clanMember: {
              select: {
                clan: {
                  select: {
                    emblem: true,
                  },
                },
              },
            },
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
            clanMember: {
              select: {
                clan: {
                  select: {
                    emblem: true,
                  },
                },
              },
            },
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
        const emblem = char.clanMember?.clan?.emblem || null;

        return {
          id: char.id,
          name: char.name,
          level: char.level,
          location,
          power,
          nickColor: nickColor || undefined,
          emblem: emblem || undefined,
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
  // 🔥 КРИТИЧНО: raw SQL — оновлюємо ТІЛЬКИ lastActivityAt, БЕЗ updatedAt.
  // Prisma update() тригерить updatedAt → optimistic lock (heroRevision) міг би "зламатися",
  // бо інші процеси іноді прив'язують revision до оновлень рядка.
  app.post("/characters/heartbeat", async (req, reply) => {
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

      await prisma.$executeRaw`UPDATE "Character" SET "lastActivityAt" = NOW() WHERE id = ${character.id}`;

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

  const VIEW_STATS_COST = 1_000_000;

  // POST /characters/:targetId/pay-view-stats - сплатити 1M аден для перегляду характеристик іншого гравця
  app.post("/characters/:targetId/pay-view-stats", async (req, reply) => {
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });
    const targetId = (req.params as { targetId?: string }).targetId;
    if (!targetId) return reply.code(400).send({ error: "targetId required" });

    try {
      const myChar = await prisma.character.findFirst({
        where: { accountId: auth.accountId },
        orderBy: { createdAt: "asc" },
        select: { id: true, adena: true },
      });
      if (!myChar) return reply.code(404).send({ error: "character not found" });
      const currentAdena = Number(myChar.adena ?? 0);
      if (currentAdena < VIEW_STATS_COST) {
        return reply.code(400).send({ error: "not enough adena", needed: VIEW_STATS_COST, have: currentAdena });
      }
      await prisma.character.update({
        where: { id: myChar.id },
        data: { adena: { decrement: VIEW_STATS_COST } },
      });
      return reply.send({ ok: true, newAdena: currentAdena - VIEW_STATS_COST });
    } catch (error) {
      app.log.error(error, "POST /characters/:targetId/pay-view-stats");
      return reply.code(500).send({ error: "Internal Server Error" });
    }
  });

  // GET /characters/public/:id - публічний профіль гравця (без авторизації)
  app.get("/characters/public/:id", async (req, reply) => {
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
          clanMember: {
            include: {
              clan: {
                select: {
                  id: true,
                  name: true,
                  emblem: true,
                },
              },
            },
          },
        },
      });

      if (!char) return reply.code(404).send({ error: "character not found" });

      // Convert BigInt to Number for JSON serialization
      const serialized = {
        ...char,
        exp: Number(char.exp),
        lastActivityAt: char.lastActivityAt ? char.lastActivityAt.toISOString() : null,
        clan: char.clanMember?.clan || null,
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

  // GET /characters/by-name/:name - публічний профіль гравця за ім'ям (без авторизації)
  app.get("/characters/by-name/:name", async (req, reply) => {
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
          clanMember: {
            include: {
              clan: {
                select: {
                  id: true,
                  name: true,
                  emblem: true,
                },
              },
            },
          },
        },
      });

      if (!char) return reply.code(404).send({ error: "character not found" });

      // Convert BigInt to Number for JSON serialization
      const serialized = {
        ...char,
        exp: Number(char.exp),
        lastActivityAt: char.lastActivityAt ? char.lastActivityAt.toISOString() : null,
        clan: char.clanMember?.clan || null,
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
