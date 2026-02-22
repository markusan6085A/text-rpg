import { FastifyInstance } from "fastify";
import { prisma } from "./db";

function getAuth(req: any): { accountId: string; login: string } | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  try {
    const token = authHeader.substring(7);
    const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64").toString());
    return { accountId: payload.accountId, login: payload.login };
  } catch {
    return null;
  }
}

// Початок тижня (понеділок) — UTC для узгодженості create/query
// Старий код (toLocaleString+timeZone) давав некоректний результат через парсинг в local timezone
function getWeekStartPoland(): Date {
  const now = new Date();
  const dayOfWeek = now.getUTCDay();
  const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  return new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() - daysToMonday,
    0, 0, 0, 0
  ));
}

// Кінець поточного тижня (неділя 23:59:59.999) — бонус діє до кінця неділі
function getWeekEndPoland(): number {
  const weekStart = getWeekStartPoland();
  return weekStart.getTime() + 7 * 24 * 60 * 60 * 1000 - 1;
}

// Інклюзивний фільтр: включає медалі з понеділка мінус 2 дні (на випадок timezone різниці)
function getWeekStartInclusive(): Date {
  const weekStart = getWeekStartPoland();
  return new Date(weekStart.getTime() - 2 * 24 * 60 * 60 * 1000);
}

// Перевірити, чи зараз понеділок-субота (польський час)
function isEventActive(): boolean {
  const now = new Date();
  const polandTime = new Date(now.toLocaleString("en-US", { timeZone: "Europe/Warsaw" }));
  const dayOfWeek = polandTime.getDay();
  return dayOfWeek >= 1 && dayOfWeek <= 6; // Понеділок-субота
}

export async function sevenSealsRoutes(app: FastifyInstance) {
  // GET /seven-seals/ranking - отримати рейтинг
  app.get("/seven-seals/ranking", async (req, reply) => {
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });

    try {
      const character = await prisma.character.findFirst({
        where: { accountId: auth.accountId },
        orderBy: { createdAt: "asc" },
        select: { id: true },
      });

      if (!character) return reply.code(404).send({ error: "character not found" });

      const weekStart = getWeekStartPoland();
      const weekStartInclusive = getWeekStartInclusive();
      const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000); // наступний понеділок

      // Отримуємо рейтинг — інклюзивний фільтр (timezone bug) + верхня межа
      const medals = await prisma.sevenSealsMedal.findMany({
        where: {
          weekStart: {
            gte: weekStartInclusive,
            lt: weekEnd,
          },
        },
        select: {
          characterId: true,
          character: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      // Групуємо по characterId та рахуємо кількість
      const medalCounts = new Map<string, { characterId: string; characterName: string; count: number }>();
      
      medals.forEach((medal) => {
        const charId = medal.characterId;
        const charName = medal.character?.name || "Unknown";
        const current = medalCounts.get(charId) || { characterId: charId, characterName: charName, count: 0 };
        current.count++;
        medalCounts.set(charId, current);
      });

      // Сортуємо по кількості медалей (від більшого до меншого)
      const ranking = Array.from(medalCounts.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 100) // Топ 100
        .map((player, index) => ({
          characterId: player.characterId,
          characterName: player.characterName,
          medalCount: player.count,
          rank: index + 1,
        }));

      // Знаходимо мій рейтинг та кількість медалей (той самий фільтр що й для ranking)
      const myMedals = await prisma.sevenSealsMedal.count({
        where: {
          characterId: character.id,
          weekStart: {
            gte: weekStartInclusive,
            lt: weekEnd,
          },
        },
      });

      const myRankIndex = ranking.findIndex((p) => p.characterId === character.id);
      const myRank = myRankIndex >= 0 ? myRankIndex + 1 : null;

      return {
        ok: true,
        ranking,
        myRank,
        myMedals,
      };
    } catch (error) {
      app.log.error(error, "Error fetching Seven Seals ranking:");
      return reply.code(500).send({
        error: "Internal Server Error",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // POST /seven-seals/medal - зафіксувати випадання медальки
  app.post("/seven-seals/medal", async (req, reply) => {
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });

    const body = req.body as { characterId?: string };

    if (!body.characterId) {
      return reply.code(400).send({ error: "characterId is required" });
    }

    // Перевіряємо, чи івент активний
    if (!isEventActive()) {
      return reply.code(400).send({ error: "Event is not active (only Monday-Saturday)" });
    }

    try {
      // Перевіряємо, чи персонаж належить цьому акаунту
      const character = await prisma.character.findFirst({
        where: {
          id: body.characterId,
          accountId: auth.accountId,
        },
        select: { id: true },
      });

      if (!character) {
        return reply.code(404).send({ error: "character not found" });
      }

      const weekStart = getWeekStartPoland();

      // Додаємо медальку
      await prisma.sevenSealsMedal.create({
        data: {
          characterId: character.id,
          weekStart,
        },
      });

      return { ok: true };
    } catch (error) {
      app.log.error(error, "Error adding Seven Seals medal:");
      return reply.code(500).send({
        error: "Internal Server Error",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // GET /seven-seals/rank/:characterId — ранг персонажа (медалі поточного тижня або heroJson.sevenSealsBonus)
  // Переможці = топ-3 по медалях; якщо є sevenSealsBonus — вже забрали нагороду
  app.get("/seven-seals/rank/:characterId", async (req, reply) => {
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });

    const { characterId } = req.params as { characterId: string };
    if (!characterId) return reply.code(400).send({ error: "characterId required" });

    try {
      const char = await prisma.character.findUnique({
        where: { id: characterId },
        select: { heroJson: true },
      });

      const heroJson = (char?.heroJson ?? {}) as Record<string, unknown>;
      const sevenSealsBonus = heroJson.sevenSealsBonus as { rank?: number; expiresAt?: number } | undefined;
      const claimedRank = sevenSealsBonus && typeof sevenSealsBonus === "object" ? sevenSealsBonus.rank : undefined;
      const expiresAt = sevenSealsBonus?.expiresAt ?? 0;
      if (typeof claimedRank === "number" && claimedRank >= 1 && claimedRank <= 3 && expiresAt > Date.now()) {
        return {
          ok: true,
          characterId,
          rank: claimedRank,
          medalCount: 0,
          fromClaimedBonus: true,
        };
      }

      const weekStartInclusive = getWeekStartInclusive();
      const weekEnd = new Date(weekStartInclusive.getTime() + 7 * 24 * 60 * 60 * 1000);

      const medals = await prisma.sevenSealsMedal.findMany({
        where: {
          weekStart: { gte: weekStartInclusive, lt: weekEnd },
        },
        select: { characterId: true },
      });

      const medalCounts = new Map<string, number>();
      medals.forEach((m) => medalCounts.set(m.characterId, (medalCounts.get(m.characterId) ?? 0) + 1));

      const myMedals = medalCounts.get(characterId) ?? 0;
      const aboveCount = Array.from(medalCounts.values()).filter((c) => c > myMedals).length;
      const rank = myMedals > 0 ? aboveCount + 1 : null;

      return {
        ok: true,
        characterId,
        rank: rank && rank <= 3 ? rank : null,
        medalCount: myMedals,
        fromClaimedBonus: false,
      };
    } catch (error) {
      app.log.error(error, "Error fetching Seven Seals rank:");
      return reply.code(500).send({
        error: "Internal Server Error",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // POST /seven-seals/claim — отримати нагороду за 1-3 місце (топ-3 по медалях тижня)
  app.post("/seven-seals/claim", async (req, reply) => {
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });

    const body = req.body as { characterId: string };
    const characterId = body.characterId;
    if (!characterId) return reply.code(400).send({ error: "characterId required" });

    try {
      const character = await prisma.character.findFirst({
        where: { id: characterId, accountId: auth.accountId },
        select: { id: true, heroJson: true, coinLuck: true },
      });
      if (!character) return reply.code(404).send({ error: "character not found" });

      const weekStartInclusive = getWeekStartInclusive();
      const weekEnd = new Date(weekStartInclusive.getTime() + 7 * 24 * 60 * 60 * 1000);
      const medals = await prisma.sevenSealsMedal.findMany({
        where: { weekStart: { gte: weekStartInclusive, lt: weekEnd } },
        select: { characterId: true },
      });
      const medalCounts = new Map<string, number>();
      medals.forEach((m) => medalCounts.set(m.characterId, (medalCounts.get(m.characterId) ?? 0) + 1));
      const myMedals = medalCounts.get(characterId) ?? 0;
      const aboveCount = Array.from(medalCounts.values()).filter((c) => c > myMedals).length;
      const rank = myMedals > 0 ? aboveCount + 1 : 0;
      if (rank < 1 || rank > 3) {
        return reply.code(400).send({ error: "only rank 1-3 (by medals) can claim rewards" });
      }

      const heroJson = (character.heroJson as Record<string, unknown>) || {};
      const existing = heroJson.sevenSealsBonus as { expiresAt?: number } | undefined;
      const now = Date.now();
      const expiresAt = getWeekEndPoland();
      if (existing && typeof existing === "object" && (existing.expiresAt ?? 0) > now) {
        return reply.send({
          ok: true,
          alreadyClaimed: true,
          bonus: heroJson.sevenSealsBonus,
        });
      }

      const RANGES: Record<number, { pAtk: [number, number]; pDef: [number, number]; coinLuck: [number, number] }> = {
        1: { pAtk: [125, 750], pDef: [154, 456], coinLuck: [5, 20] },
        2: { pAtk: [100, 500], pDef: [100, 400], coinLuck: [5, 15] },
        3: { pAtk: [80, 300], pDef: [80, 300], coinLuck: [5, 10] },
      };
      const r = RANGES[rank] || RANGES[3];
      const rand = (min: number, max: number) => Math.floor(min + Math.random() * (max - min + 1));
      const coinLuckReward = rand(r.coinLuck[0], r.coinLuck[1]);
      const sevenSealsBonus = {
        pAtk: rand(r.pAtk[0], r.pAtk[1]),
        mAtk: rand(r.pAtk[0], r.pAtk[1]),
        pDef: rand(r.pDef[0], r.pDef[1]),
        mDef: rand(r.pDef[0], r.pDef[1]),
        coinLuck: coinLuckReward,
        rank,
        expiresAt,
      };

      const updatedHeroJson = {
        ...heroJson,
        sevenSealsBonus,
      };
      await prisma.character.update({
        where: { id: characterId },
        data: {
          heroJson: updatedHeroJson,
          coinLuck: { increment: coinLuckReward },
        },
      });

      return reply.send({
        ok: true,
        bonus: sevenSealsBonus,
      });
    } catch (error) {
      app.log.error(error, "Error claiming Seven Seals reward:");
      return reply.code(500).send({
        error: "Internal Server Error",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // POST /seven-seals/add — нарахування очок (адмін/тест)
  app.post("/seven-seals/add", async (req, reply) => {
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });

    const body = req.body as { characterId: string; points?: number; seal?: string | null };
    const characterId = body.characterId;
    const add = Math.trunc(body.points ?? 0);
    const seal = body.seal ?? null;

    if (!characterId || !Number.isFinite(add)) {
      return reply.code(400).send({ ok: false, error: "bad_request" });
    }

    try {
      const row = await prisma.sevenSealsScore.upsert({
        where: { characterId },
        create: { characterId, points: Math.max(0, add), seal },
        update: {
          points: { increment: add },
          seal,
        },
        select: { characterId: true, points: true, seal: true, updatedAt: true },
      });

      return { ok: true, ...row };
    } catch (error) {
      app.log.error(error, "Error adding Seven Seals points:");
      return reply.code(500).send({
        error: "Internal Server Error",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });
}
