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

// Отримати початок поточного тижня (понеділок) в польському часі
function getWeekStartPoland(): Date {
  const now = new Date();
  // Конвертуємо в польський час
  const polandTime = new Date(now.toLocaleString("en-US", { timeZone: "Europe/Warsaw" }));
  const dayOfWeek = polandTime.getDay(); // 0 = неділя, 1 = понеділок, ..., 6 = субота
  const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Днів до понеділка
  
  const weekStart = new Date(polandTime);
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() - daysToMonday);
  
  return weekStart;
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

      // Отримуємо рейтинг для поточного тижня
      const medals = await prisma.sevenSealsMedal.findMany({
        where: {
          weekStart: {
            gte: weekStart,
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

      // Знаходимо мій рейтинг та кількість медалей
      const myMedals = await prisma.sevenSealsMedal.count({
        where: {
          characterId: character.id,
          weekStart: {
            gte: weekStart,
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
}
