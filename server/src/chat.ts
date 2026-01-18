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

export async function chatRoutes(app: FastifyInstance) {
  // GET /chat/messages?channel=general&page=1&limit=50
  app.get("/chat/messages", async (req, reply) => {
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });

    const query = req.query as {
      channel?: string;
      page?: string;
      limit?: string;
    };

    const channel = query.channel || "general";
    const page = Math.max(1, parseInt(query.page || "1", 10));
    const limit = Math.min(10, Math.max(1, parseInt(query.limit || "10", 10))); // Max 10 per page
    const skip = (page - 1) * limit;

    try {
      // Get user's character to check ownership
      const character = await prisma.character.findFirst({
        where: { accountId: auth.accountId },
        orderBy: { createdAt: "asc" },
        select: { id: true },
      });

      // 🔥 Фільтруємо повідомлення - показуємо тільки ті, що створені за останні 24 години
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const messages = await prisma.chatMessage.findMany({
        where: { 
          channel,
          createdAt: {
            gte: twentyFourHoursAgo, // Only messages from last 24 hours
          },
        },
        orderBy: { createdAt: "desc" }, // Newest first (top)
        take: limit,
        skip,
        select: {
          id: true,
          message: true,
          channel: true,
          createdAt: true,
          characterId: true, // Include characterId to check ownership
          character: {
            select: {
              name: true,
              heroJson: true, // Include heroJson to get nickColor
            },
          },
        },
      });

      // Don't reverse - show newest first (top to bottom)
      return {
        ok: true,
        messages: messages.map((msg) => {
          const heroJson = (msg.character.heroJson as any) || {};
          const nickColor = heroJson.nickColor;
          return {
            id: msg.id,
            characterName: msg.character.name,
            characterId: msg.characterId, // Include for ownership check
            channel: msg.channel,
            message: msg.message,
            createdAt: msg.createdAt.toISOString(),
            isOwn: character ? msg.characterId === character.id : false,
            nickColor: nickColor || undefined,
          };
        }),
        page,
        limit,
      };
    } catch (error) {
      app.log.error(error, "Error fetching chat messages:");
      return reply.code(500).send({
        error: "Internal Server Error",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // POST /chat/messages { channel, message }
  app.post("/chat/messages", async (req, reply) => {
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });

    const body = req.body as {
      channel?: string;
      message?: string;
    };

    const channel = (body.channel || "general").trim();
    const message = (body.message || "").trim();

    if (!message || message.length === 0) {
      return reply.code(400).send({ error: "message is required" });
    }

    if (message.length > 500) {
      return reply.code(400).send({ error: "message too long (max 500 characters)" });
    }

    // Get user's character - only select id for faster query
    const character = await prisma.character.findFirst({
      where: { accountId: auth.accountId },
      orderBy: { createdAt: "asc" },
      select: { id: true, name: true }, // Only get what we need
    });

    if (!character) {
      return reply.code(404).send({ error: "character not found" });
    }

    try {
      // 🔥 Оновлюємо активність персонажа при відправці повідомлення
      await prisma.character.update({
        where: { id: character.id },
        data: {
          lastActivityAt: new Date(),
        },
      }).catch(() => {
        // Ігноруємо помилки оновлення активності
      });

      const chatMessage = await prisma.chatMessage.create({
        data: {
          characterId: character.id,
          channel,
          message,
        },
        select: {
          id: true,
          message: true,
          channel: true,
          createdAt: true,
          character: {
            select: {
              name: true,
            },
          },
        },
      });

      return {
        ok: true,
        message: {
          id: chatMessage.id,
          characterName: chatMessage.character.name,
          channel: chatMessage.channel,
          message: chatMessage.message,
          createdAt: chatMessage.createdAt.toISOString(),
        },
      };
    } catch (error) {
      app.log.error(error, "Error creating chat message:");
      return reply.code(500).send({
        error: "Internal Server Error",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // DELETE /chat/messages/:id
  app.delete<{ Params: { id: string } }>("/chat/messages/:id", {
    // 🔥 Явно вказуємо, що body не потрібен для DELETE
    schema: {
      body: false, // НЕ очікуємо body
    },
  }, async (req: FastifyRequest<{ Params: { id: string } }>, reply) => {
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });

    // 🔥 Парсимо messageId з різних джерел (Fastify іноді не парсить правильно)
    let messageId: string | undefined;
    
    // Спробуємо з params
    if (req.params && typeof req.params === 'object' && 'id' in req.params) {
      messageId = String(req.params.id);
    }
    
    // Якщо не вийшло, спробуємо з URL
    if (!messageId || messageId.trim() === '') {
      const urlMatch = req.url.match(/\/chat\/messages\/([^\/\?]+)/);
      if (urlMatch && urlMatch[1]) {
        messageId = decodeURIComponent(urlMatch[1]);
      }
    }

    // Логуємо для діагностики
    app.log.info({ 
      messageId, 
      params: req.params, 
      url: req.url, 
      accountId: auth.accountId 
    }, "DELETE /chat/messages/:id");

    if (!messageId || messageId.trim() === '') {
      app.log.error({ params: req.params, url: req.url }, "Invalid message id in delete request");
      return reply.code(400).send({ error: "message id is required", details: { params: req.params, url: req.url } });
    }

    try {
      // Get user's character
      const character = await prisma.character.findFirst({
        where: { accountId: auth.accountId },
        orderBy: { createdAt: "asc" },
        select: { id: true },
      });

      if (!character) {
        app.log.warn({ accountId: auth.accountId }, "Character not found for delete request");
        return reply.code(404).send({ error: "character not found" });
      }

      // Check if message exists and belongs to user
      const message = await prisma.chatMessage.findUnique({
        where: { id: messageId },
        select: { characterId: true, channel: true },
      });

      if (!message) {
        app.log.warn({ messageId, characterId: character.id }, "Message not found for delete");
        return reply.code(404).send({ error: "message not found" });
      }

      // 🔥 Видаляти можна тільки в "general" або "trade" каналах
      if (message.channel !== "general" && message.channel !== "trade") {
        app.log.warn({ messageId, channel: message.channel, characterId: character.id }, "Delete attempt in wrong channel");
        return reply.code(403).send({ error: "you can only delete messages in general or trade channels" });
      }

      // 🔥 Видаляти можна тільки свої повідомлення
      if (message.characterId !== character.id) {
        app.log.warn({ 
          messageId, 
          messageCharacterId: message.characterId, 
          userCharacterId: character.id 
        }, "Delete attempt for someone else's message");
        return reply.code(403).send({ error: "you can only delete your own messages" });
      }

      // Delete message
      await prisma.chatMessage.delete({
        where: { id: messageId },
      });

      app.log.info({ messageId, channel: message.channel, characterId: character.id }, "Message deleted successfully");

      return {
        ok: true,
        message: "Message deleted",
      };
    } catch (error) {
      app.log.error({ error, messageId, accountId: auth.accountId }, "Error deleting chat message:");
      return reply.code(500).send({
        error: "Internal Server Error",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });
}
