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
  // GET /news - отримати всі новини
  app.get("/news", async (req, reply) => {
    try {
      const news = await prisma.news.findMany({
        orderBy: { createdAt: "desc" },
        take: 100, // Останні 100 новин
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
      });

      return {
        ok: true,
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

// Функція для додавання новин (викликається з інших модулів)
export async function addNews(params: {
  type: "new_player" | "premium_purchase" | "raid_boss_kill";
  characterId?: string;
  characterName?: string;
  metadata?: any;
}): Promise<void> {
  try {
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
    console.error("[News] Error adding news:", error);
    console.error("[News] Params:", JSON.stringify(params, null, 2));
    // Перекидаємо помилку, щоб вона не тихо гасла
    throw error;
  }
}
