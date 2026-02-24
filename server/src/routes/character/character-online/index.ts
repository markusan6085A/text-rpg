import type { FastifyInstance } from "fastify";
import { prisma } from "../../../db";
import { getAuth } from "../auth";

export async function characterOnlineRoutes(app: FastifyInstance) {
  // GET /characters/online - список онлайн гравців (активні за останні 10 хвилин)
  app.get("/characters/online", async (req, reply) => {
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });

    try {
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

      let onlineCharacters;
      try {
        onlineCharacters = await prisma.character.findMany({
          where: {
            lastActivityAt: { gte: tenMinutesAgo },
          },
          orderBy: [
            { level: "desc" },
            { name: "asc" },
          ],
          select: {
            id: true,
            name: true,
            level: true,
            lastActivityAt: true,
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
      } catch (dbError: any) {
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

  // GET /characters/public/:id - публічний профіль гравця (без авторизації)
  app.get("/characters/public/:id", async (req, reply) => {
    const params = req.params as { id?: string };
    const id = params.id;

    if (!id) return reply.code(400).send({ error: "character id required" });

    try {
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