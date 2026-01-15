import type { FastifyInstance, FastifyRequest } from "fastify";
import jwt from "jsonwebtoken";
import { prisma } from "./db";

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

export async function letterRoutes(app: FastifyInstance) {
  // POST /letters - відправити лист
  app.post("/letters", async (req, reply) => {
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

  // GET /letters - отримати листи (вхідні)
  app.get("/letters", async (req, reply) => {
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });

    const query = req.query as {
      page?: string;
      limit?: string;
    };

    const page = Math.max(1, parseInt(query.page || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(query.limit || "50", 10)));
    const skip = (page - 1) * limit;

    try {
      const character = await prisma.character.findFirst({
        where: { accountId: auth.accountId },
        orderBy: { createdAt: "asc" },
        select: { id: true },
      });

      if (!character) {
        return reply.code(404).send({ error: "character not found" });
      }

      const letters = await prisma.letter.findMany({
        where: { toCharacterId: character.id },
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
            },
          },
        },
      });

      const total = await prisma.letter.count({
        where: { toCharacterId: character.id },
      });

      const unreadCount = await prisma.letter.count({
        where: {
          toCharacterId: character.id,
          isRead: false,
        },
      });

      return {
        ok: true,
        letters,
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
            },
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
      if (letter.toCharacter.id !== character.id) {
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

      return { ok: true, letter };
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
