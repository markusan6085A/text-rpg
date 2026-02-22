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

export async function newsRoutes(app: FastifyInstance) {
  // GET /news - отримати новини (20 на сторінку, max 100 всього)
  // ?page=1 (default), ?limit=20
  app.get("/news", async (req, reply) => {
    try {
      const query = req.query as { page?: string; limit?: string };
      const page = Math.max(1, parseInt(query.page || "1", 10) || 1);
      const limit = Math.min(20, Math.max(1, parseInt(query.limit || "20", 10) || 20));
      const skip = (page - 1) * limit;

      const [news, total] = await Promise.all([
        prisma.news.findMany({
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
          select: {
          id: true,
          type: true,
          characterId: true,
          characterName: true,
          metadata: true,
          createdAt: true,
          character: {
            select: {
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
          },
        },
      }),
        prisma.news.count(),
      ]);

      return {
        ok: true,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        news: news.map((n) => ({
          id: n.id,
          type: n.type,
          characterId: n.characterId,
          characterName: n.characterName,
          emblem: n.character?.clanMember?.clan?.emblem || null,
          metadata: n.metadata,
          createdAt: n.createdAt.toISOString(),
        })),
      };
    } catch (error) {
      app.log.error(error, "Error fetching news:");
      return reply.code(500).send({
        error: "Internal Server Error",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // POST /news/raid-boss-kill - зафіксувати вбивство raid boss
  app.post("/news/raid-boss-kill", async (req, reply) => {
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });

    const body = req.body as {
      characterId?: string;
      characterName?: string;
      bossName?: string;
      bossLevel?: number;
      bossDrops?: any[];
    };

    if (!body.characterId || !body.bossName) {
      return reply.code(400).send({ error: "characterId and bossName are required" });
    }

    try {
      // Перевіряємо, чи персонаж належить цьому акаунту
      const character = await prisma.character.findFirst({
        where: {
          id: body.characterId,
          accountId: auth.accountId,
        },
        select: {
          id: true,
          name: true,
        },
      });

      if (!character) {
        return reply.code(404).send({ error: "character not found" });
      }

      // Додаємо новину
      await addNews({
        type: "raid_boss_kill",
        characterId: character.id,
        characterName: character.name,
        metadata: {
          bossName: body.bossName,
          bossLevel: body.bossLevel,
          bossDrops: body.bossDrops || [],
        },
      });

      return { ok: true };
    } catch (error) {
      app.log.error(error, "Error adding raid boss kill news:");
      return reply.code(500).send({
        error: "Internal Server Error",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });
}

const NEWS_MAX_TOTAL = 100;

// Функція для додавання новин (викликається з інших модулів)
// Максимум 100 новин — старі видаляються при додаванні нових
export async function addNews(params: {
  type: "new_player" | "premium_purchase" | "raid_boss_kill";
  characterId?: string;
  characterName?: string;
  metadata?: any;
}): Promise<void> {
  try {
    // Видаляємо найстаріші, якщо вже є 100+
    const count = await prisma.news.count();
    if (count >= NEWS_MAX_TOTAL) {
      const oldest = await prisma.news.findMany({
        orderBy: { createdAt: "asc" },
        take: count - NEWS_MAX_TOTAL + 1,
        select: { id: true },
      });
      if (oldest.length > 0) {
        await prisma.news.deleteMany({
          where: { id: { in: oldest.map((n) => n.id) } },
        });
      }
    }

    const news = await prisma.news.create({
      data: {
        type: params.type,
        characterId: params.characterId || null,
        characterName: params.characterName || null,
        metadata: params.metadata || {},
      },
    });
    console.log(`[News] Added news: type=${params.type}, characterName=${params.characterName}, id=${news.id}`);
  } catch (error) {
    console.error("[News] Error adding news:", (error as Error)?.message, (error as { code?: string })?.code);
    // Перекидаємо помилку, щоб вона не тихо гасла
    throw error;
  }
}
