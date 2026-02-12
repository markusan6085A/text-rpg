import type { FastifyInstance, FastifyRequest } from "fastify";
import jwt from "jsonwebtoken";
import { prisma } from "./db";
import { rateLimiters, rateLimitMiddleware } from "./rateLimiter";
import { getMutedUntil } from "./chatMute";

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
      // Видалення старих повідомлень виконується в окремому процесі (не блокує запит)
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
        include: {
          character: {
            select: {
              name: true,
              heroJson: true, // Include heroJson to get nickColor
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

      // 🔥 Підраховуємо загальну кількість повідомлень (максимум 200)
      const totalMessages = await prisma.chatMessage.count({
        where: { 
          channel,
          createdAt: {
            gte: twentyFourHoursAgo,
          },
        },
      });
      const totalPages = Math.max(1, Math.ceil(Math.min(totalMessages, 200) / limit));

      // Don't reverse - show newest first (top to bottom)
      return {
        ok: true,
        messages: messages.map((msg) => {
          const char = (msg as any).character;
          const heroJson = (char?.heroJson as any) || {};
          const nickColor = heroJson.nickColor;
          // Отримуємо emblem з клану гравця
          const clanEmblem = char?.clanMember?.clan?.emblem;
          const emblem = clanEmblem && String(clanEmblem).trim() ? clanEmblem : null;
          
          return {
            id: msg.id,
            characterName: char?.name ?? "",
            characterId: msg.characterId, // Include for ownership check
            channel: msg.channel,
            message: msg.message,
            createdAt: msg.createdAt.toISOString(),
            isOwn: character ? msg.characterId === character.id : false,
            nickColor: nickColor || undefined,
            emblem: emblem,
          };
        }),
        page,
        limit,
        total: Math.min(totalMessages, 200),
        totalPages,
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
  app.post("/chat/messages", {
    preHandler: async (req, reply) => {
      await rateLimitMiddleware(rateLimiters.chat, "chat")(req, reply);
    },
  }, async (req, reply) => {
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

    // Get user's character
    type CharBanRow = { id: string; name: string; bannedUntil: Date | null };
    const character = await prisma.character.findFirst({
      where: { accountId: auth.accountId },
      orderBy: { createdAt: "asc" },
      select: { id: true, name: true, bannedUntil: true } as any,
    }) as unknown as CharBanRow | null;

    if (!character) {
      return reply.code(404).send({ error: "character not found" });
    }

    const isBanned = character.bannedUntil && new Date(character.bannedUntil).getTime() > Date.now();
    if (isBanned && (channel === "general" || channel === "trade" || channel === "clan")) {
      return reply.code(403).send({
        error: "banned",
        message: "Чат заблоковано до кінця бана.",
      });
    }

    const muteUntil = getMutedUntil(character.id);
    if (muteUntil != null) {
      const secLeft = Math.ceil((muteUntil - Date.now()) / 1000);
      return reply.code(403).send({
        error: "muted",
        message: `Чат замьючено ще на ${secLeft} сек.`,
      });
    }

    try {
      // 🔥 Перевіряємо кількість повідомлень в каналі (максимум 200)
      const messageCount = await prisma.chatMessage.count({
        where: { channel },
      });

      if (messageCount >= 200) {
        // Видаляємо найстаріші повідомлення, залишаємо 199, щоб додати нове
        const messagesToDelete = await prisma.chatMessage.findMany({
          where: { channel },
          orderBy: { createdAt: "asc" },
          take: messageCount - 199,
          select: { id: true },
        });

        if (messagesToDelete.length > 0) {
          await prisma.chatMessage.deleteMany({
            where: {
              id: { in: messagesToDelete.map((m) => m.id) },
            },
          });
        }
      }

      // 🔥 Видаляємо повідомлення старіші 24 годин перед додаванням нового
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      await prisma.chatMessage.deleteMany({
        where: {
          channel,
          createdAt: {
            lt: twentyFourHoursAgo,
          },
        },
      }).catch(() => {
        // Ігноруємо помилки видалення старих повідомлень
      });

      // 🔥 Перевіряємо інтервал між повідомленнями (5 секунд для general і trade)
      if (channel === "general" || channel === "trade") {
        const lastMessage = await prisma.chatMessage.findFirst({
          where: {
            characterId: character.id,
            channel,
          },
          orderBy: { createdAt: "desc" },
          select: { createdAt: true },
        });

        if (lastMessage) {
          const timeSinceLastMessage = Date.now() - new Date(lastMessage.createdAt).getTime();
          if (timeSinceLastMessage < 5000) {
            const remainingSeconds = Math.ceil((5000 - timeSinceLastMessage) / 1000);
            return reply.code(429).send({
              error: "rate_limit",
              message: `В чаті можна писати не частіше ніж раз на 5 секунд. Зачекайте ще ${remainingSeconds} сек.`,
              retryAfter: remainingSeconds,
            });
          }
        }
      }

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
