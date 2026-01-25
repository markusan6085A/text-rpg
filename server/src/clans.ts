import type { FastifyInstance } from "fastify";
import jwt from "jsonwebtoken";
import { prisma } from "./db";

function getAuth(req: any): { accountId: string; login: string; characterId?: string } | null {
  const header = req.headers?.authorization || "";
  const [type, token] = String(header).split(" ");
  if (type !== "Bearer" || !token) return null;

  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is missing in .env");

  try {
    const payload = jwt.verify(token, secret) as any;
    if (!payload?.accountId) return null;
    return { accountId: payload.accountId, login: payload.login, characterId: payload.characterId };
  } catch {
    return null;
  }
}

export async function clanRoutes(app: FastifyInstance) {
  // GET /clans - список всіх кланів
  app.get("/clans", async (req, reply) => {
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });

    const clans = await prisma.clan.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        level: true,
        reputation: true,
        adena: true,
        coinLuck: true,
        createdAt: true,
        _count: {
          select: { members: true },
        },
      },
    });

    return { ok: true, clans };
  });

  // GET /clans/my - мій клан (якщо є)
  app.get("/clans/my", async (req, reply) => {
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });

    // Знаходимо персонажа по accountId (беремо першого)
    const character = await prisma.character.findFirst({
      where: { accountId: auth.accountId },
    });

    if (!character) {
      return reply.code(404).send({ error: "character not found" });
    }

    // Перевіряємо, чи гравець створив клан або є членом клану
    const createdClan = await prisma.clan.findFirst({
      where: { creatorId: character.id },
      include: {
        creator: {
          select: { id: true, name: true },
        },
      },
    });

    const memberClan = await prisma.clanMember.findFirst({
      where: { characterId: character.id },
      include: {
        clan: {
          include: {
            creator: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    const clan = createdClan || memberClan?.clan;
    if (!clan) {
      return { ok: true, clan: null };
    }

    // Завантажуємо членів клану
    const members = await prisma.clanMember.findMany({
      where: { clanId: clan.id },
      include: {
        character: {
          select: {
            id: true,
            name: true,
            lastActivityAt: true,
          },
        },
      },
      orderBy: [
        { isDeputy: "desc" },
        { joinedAt: "asc" },
      ],
    });

    // Визначаємо, чи поточний гравець є головою
    const isLeader = clan.creatorId === character.id;

    return {
      ok: true,
      clan: {
        id: clan.id,
        name: clan.name,
        level: clan.level,
        reputation: clan.reputation,
        adena: clan.adena,
        coinLuck: clan.coinLuck,
        createdAt: clan.createdAt,
        creator: {
          id: clan.creator.id,
          name: clan.creator.name,
        },
        members: members.map((m) => ({
          id: m.id,
          characterId: m.character.id,
          characterName: m.character.name,
          title: m.title,
          isDeputy: m.isDeputy,
          joinedAt: m.joinedAt,
          isOnline: m.character.lastActivityAt
            ? new Date(m.character.lastActivityAt).getTime() > Date.now() - 5 * 60 * 1000
            : false,
        })),
        isLeader,
        memberCount: members.length,
      },
    };
  });

  // POST /clans - створити клан
  app.post("/clans", async (req, reply) => {
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });

    const { name } = req.body as { name?: string };

    if (!name || typeof name !== "string") {
      return reply.code(400).send({ error: "name is required" });
    }

    if (name.length < 3 || name.length > 16) {
      return reply.code(400).send({ error: "name must be between 3 and 16 characters" });
    }

    // Знаходимо персонажа
    const character = await prisma.character.findFirst({
      where: { accountId: auth.accountId },
    });

    if (!character) {
      return reply.code(404).send({ error: "character not found" });
    }

    // Перевіряємо, чи гравець вже створив клан або є членом клану
    const existingClan = await prisma.clan.findFirst({
      where: { creatorId: character.id },
    });

    const existingMember = await prisma.clanMember.findFirst({
      where: { characterId: character.id },
    });

    if (existingClan || existingMember) {
      return reply.code(409).send({ error: "you already have a clan" });
    }

    // Перевіряємо, чи назва клану вже існує
    const nameExists = await prisma.clan.findUnique({
      where: { name },
    });

    if (nameExists) {
      return reply.code(409).send({ error: "clan name already exists" });
    }

    try {
      // Створюємо клан та автоматично додаємо творця як члена
      const clan = await prisma.clan.create({
        data: {
          name,
          level: 1,
          creatorId: character.id,
          members: {
            create: {
              characterId: character.id,
              isDeputy: false,
            },
          },
          logs: {
            create: {
              type: "member_joined",
              characterId: character.id,
              message: `${character.name} создал клан "${name}"`,
            },
          },
        },
        include: {
          creator: {
            select: { id: true, name: true },
          },
        },
      });

      return {
        ok: true,
        clan: {
          id: clan.id,
          name: clan.name,
          level: clan.level,
          reputation: clan.reputation,
          adena: clan.adena,
          coinLuck: clan.coinLuck,
          createdAt: clan.createdAt,
          creator: {
            id: clan.creator.id,
            name: clan.creator.name,
          },
        },
      };
    } catch (e: any) {
      if (e.code === "P2002") {
        return reply.code(409).send({ error: "clan name already exists" });
      }
      throw e;
    }
  });

  // GET /clans/:id - деталі клану
  app.get("/clans/:id", async (req, reply) => {
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });

    const { id } = req.params as { id: string };

    const clan = await prisma.clan.findUnique({
      where: { id },
      include: {
        creator: {
          select: { id: true, name: true },
        },
      },
    });

    if (!clan) {
      return reply.code(404).send({ error: "clan not found" });
    }

    const members = await prisma.clanMember.findMany({
      where: { clanId: clan.id },
      include: {
        character: {
          select: {
            id: true,
            name: true,
            lastActivityAt: true,
          },
        },
      },
      orderBy: [
        { isDeputy: "desc" },
        { joinedAt: "asc" },
      ],
    });

    // Знаходимо поточного гравця
    const character = await prisma.character.findFirst({
      where: { accountId: auth.accountId },
    });

    const isLeader = character ? clan.creatorId === character.id : false;
    const isMember = character
      ? members.some((m) => m.characterId === character.id)
      : false;

    return {
      ok: true,
      clan: {
        id: clan.id,
        name: clan.name,
        level: clan.level,
        reputation: clan.reputation,
        adena: clan.adena,
        coinLuck: clan.coinLuck,
        createdAt: clan.createdAt,
        creator: {
          id: clan.creator.id,
          name: clan.creator.name,
        },
        members: members.map((m) => ({
          id: m.id,
          characterId: m.character.id,
          characterName: m.character.name,
          title: m.title,
          isDeputy: m.isDeputy,
          joinedAt: m.joinedAt,
          isOnline: m.character.lastActivityAt
            ? new Date(m.character.lastActivityAt).getTime() > Date.now() - 5 * 60 * 1000
            : false,
        })),
        isLeader,
        isMember,
        memberCount: members.length,
      },
    };
  });

  // GET /clans/:id/chat - повідомлення чату клану
  app.get("/clans/:id/chat", async (req, reply) => {
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });

    const { id } = req.params as { id: string };
    const { page = "1", limit = "50" } = req.query as { page?: string; limit?: string };

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = Math.min(parseInt(limit, 10) || 50, 100);

    // Перевіряємо, чи гравець є членом клану
    const character = await prisma.character.findFirst({
      where: { accountId: auth.accountId },
    });

    if (!character) {
      return reply.code(404).send({ error: "character not found" });
    }

    const isMember = await prisma.clanMember.findFirst({
      where: {
        clanId: id,
        characterId: character.id,
      },
    });

    const isCreator = await prisma.clan.findFirst({
      where: {
        id,
        creatorId: character.id,
      },
    });

    if (!isMember && !isCreator) {
      return reply.code(403).send({ error: "you are not a member of this clan" });
    }

    const messages = await prisma.clanChat.findMany({
      where: { clanId: id },
      include: {
        character: {
          select: {
            id: true,
            name: true,
            nickColor: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limitNum,
      skip: (pageNum - 1) * limitNum,
    });

    const total = await prisma.clanChat.count({
      where: { clanId: id },
    });

    return {
      ok: true,
      messages: messages.reverse().map((m) => ({
        id: m.id,
        characterId: m.character.id,
        characterName: m.character.name,
        nickColor: m.character.nickColor,
        message: m.message,
        createdAt: m.createdAt,
      })),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    };
  });

  // POST /clans/:id/chat - відправити повідомлення в чат клану
  app.post("/clans/:id/chat", async (req, reply) => {
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });

    const { id } = req.params as { id: string };
    const { message } = req.body as { message?: string };

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return reply.code(400).send({ error: "message is required" });
    }

    if (message.length > 500) {
      return reply.code(400).send({ error: "message too long (max 500 characters)" });
    }

    const character = await prisma.character.findFirst({
      where: { accountId: auth.accountId },
    });

    if (!character) {
      return reply.code(404).send({ error: "character not found" });
    }

    // Перевіряємо, чи гравець є членом клану
    const isMember = await prisma.clanMember.findFirst({
      where: {
        clanId: id,
        characterId: character.id,
      },
    });

    const isCreator = await prisma.clan.findFirst({
      where: {
        id,
        creatorId: character.id,
      },
    });

    if (!isMember && !isCreator) {
      return reply.code(403).send({ error: "you are not a member of this clan" });
    }

    const chatMessage = await prisma.clanChat.create({
      data: {
        clanId: id,
        characterId: character.id,
        message: message.trim(),
      },
      include: {
        character: {
          select: {
            id: true,
            name: true,
            nickColor: true,
          },
        },
      },
    });

    return {
      ok: true,
      message: {
        id: chatMessage.id,
        characterId: chatMessage.character.id,
        characterName: chatMessage.character.name,
        nickColor: chatMessage.character.nickColor,
        message: chatMessage.message,
        createdAt: chatMessage.createdAt,
      },
    };
  });

  // GET /clans/:id/logs - історія клану
  app.get("/clans/:id/logs", async (req, reply) => {
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });

    const { id } = req.params as { id: string };
    const { page = "1", limit = "50" } = req.query as { page?: string; limit?: string };

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = Math.min(parseInt(limit, 10) || 50, 100);

    // Перевіряємо, чи гравець є членом клану
    const character = await prisma.character.findFirst({
      where: { accountId: auth.accountId },
    });

    if (!character) {
      return reply.code(404).send({ error: "character not found" });
    }

    const isMember = await prisma.clanMember.findFirst({
      where: {
        clanId: id,
        characterId: character.id,
      },
    });

    const isCreator = await prisma.clan.findFirst({
      where: {
        id,
        creatorId: character.id,
      },
    });

    if (!isMember && !isCreator) {
      return reply.code(403).send({ error: "you are not a member of this clan" });
    }

    const logs = await prisma.clanLog.findMany({
      where: { clanId: id },
      include: {
        character: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limitNum,
      skip: (pageNum - 1) * limitNum,
    });

    const total = await prisma.clanLog.count({
      where: { clanId: id },
    });

    return {
      ok: true,
      logs: logs.map((log) => ({
        id: log.id,
        type: log.type,
        characterId: log.characterId,
        characterName: log.character?.name,
        targetCharacterId: log.targetCharacterId,
        message: log.message,
        metadata: log.metadata,
        createdAt: log.createdAt,
      })),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    };
  });

  // GET /clans/:id/members - список членів клану (детальний)
  app.get("/clans/:id/members", async (req, reply) => {
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });

    const { id } = req.params as { id: string };

    // Перевіряємо, чи гравець є членом клану
    const character = await prisma.character.findFirst({
      where: { accountId: auth.accountId },
    });

    if (!character) {
      return reply.code(404).send({ error: "character not found" });
    }

    const isMember = await prisma.clanMember.findFirst({
      where: {
        clanId: id,
        characterId: character.id,
      },
    });

    const isCreator = await prisma.clan.findFirst({
      where: {
        id,
        creatorId: character.id,
      },
    });

    if (!isMember && !isCreator) {
      return reply.code(403).send({ error: "you are not a member of this clan" });
    }

    const members = await prisma.clanMember.findMany({
      where: { clanId: id },
      include: {
        character: {
          select: {
            id: true,
            name: true,
            level: true,
            lastActivityAt: true,
          },
        },
      },
      orderBy: [
        { isDeputy: "desc" },
        { joinedAt: "asc" },
      ],
    });

    const clan = await prisma.clan.findUnique({
      where: { id },
      select: { creatorId: true },
    });

    return {
      ok: true,
      members: members.map((m) => ({
        id: m.id,
        characterId: m.character.id,
        characterName: m.character.name,
        characterLevel: m.character.level,
        title: m.title,
        isDeputy: m.isDeputy,
        isLeader: clan ? clan.creatorId === m.characterId : false,
        joinedAt: m.joinedAt,
        isOnline: m.character.lastActivityAt
          ? new Date(m.character.lastActivityAt).getTime() > Date.now() - 5 * 60 * 1000
          : false,
      })),
      isLeader: clan ? clan.creatorId === character.id : false,
    };
  });

  // DELETE /clans/:id - видалити клан (тільки для глави)
  app.delete("/clans/:id", async (req, reply) => {
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });

    const { id } = req.params as { id: string };

    const character = await prisma.character.findFirst({
      where: { accountId: auth.accountId },
    });

    if (!character) {
      return reply.code(404).send({ error: "character not found" });
    }

    const clan = await prisma.clan.findUnique({
      where: { id },
    });

    if (!clan) {
      return reply.code(404).send({ error: "clan not found" });
    }

    if (clan.creatorId !== character.id) {
      return reply.code(403).send({ error: "only clan leader can delete the clan" });
    }

    await prisma.clan.delete({
      where: { id },
    });

    return { ok: true };
  });

  // POST /clans/:id/members/:characterId/kick - вигнати гравця (тільки для глави)
  app.post("/clans/:id/members/:characterId/kick", async (req, reply) => {
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });

    const { id, characterId: targetCharacterId } = req.params as {
      id: string;
      characterId: string;
    };

    const character = await prisma.character.findFirst({
      where: { accountId: auth.accountId },
    });

    if (!character) {
      return reply.code(404).send({ error: "character not found" });
    }

    const clan = await prisma.clan.findUnique({
      where: { id },
    });

    if (!clan) {
      return reply.code(404).send({ error: "clan not found" });
    }

    if (clan.creatorId !== character.id) {
      return reply.code(403).send({ error: "only clan leader can kick members" });
    }

    if (targetCharacterId === character.id) {
      return reply.code(400).send({ error: "cannot kick yourself" });
    }

    const targetMember = await prisma.clanMember.findFirst({
      where: {
        clanId: id,
        characterId: targetCharacterId,
      },
      include: {
        character: {
          select: { name: true },
        },
      },
    });

    if (!targetMember) {
      return reply.code(404).send({ error: "member not found" });
    }

    await prisma.clanMember.delete({
      where: { id: targetMember.id },
    });

    // Додаємо лог
    await prisma.clanLog.create({
      data: {
        clanId: id,
        type: "member_kicked",
        characterId: character.id,
        targetCharacterId: targetCharacterId,
        message: `${character.name} исключил ${targetMember.character.name} из клана`,
      },
    });

    return { ok: true };
  });

  // POST /clans/:id/members/:characterId/title - змінити титул (тільки для глави)
  app.post("/clans/:id/members/:characterId/title", async (req, reply) => {
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });

    const { id, characterId: targetCharacterId } = req.params as {
      id: string;
      characterId: string;
    };
    const { title } = req.body as { title?: string };

    const character = await prisma.character.findFirst({
      where: { accountId: auth.accountId },
    });

    if (!character) {
      return reply.code(404).send({ error: "character not found" });
    }

    const clan = await prisma.clan.findUnique({
      where: { id },
    });

    if (!clan) {
      return reply.code(404).send({ error: "clan not found" });
    }

    if (clan.creatorId !== character.id) {
      return reply.code(403).send({ error: "only clan leader can change titles" });
    }

    const targetMember = await prisma.clanMember.findFirst({
      where: {
        clanId: id,
        characterId: targetCharacterId,
      },
      include: {
        character: {
          select: { name: true },
        },
      },
    });

    if (!targetMember) {
      return reply.code(404).send({ error: "member not found" });
    }

    const newTitle = title && title.trim().length > 0 ? title.trim() : null;

    await prisma.clanMember.update({
      where: { id: targetMember.id },
      data: { title: newTitle },
    });

    // Додаємо лог
    await prisma.clanLog.create({
      data: {
        clanId: id,
        type: "title_changed",
        characterId: character.id,
        targetCharacterId: targetCharacterId,
        message: `${character.name} изменил титул ${targetMember.character.name} на "${newTitle || "Нет титула"}"`,
        metadata: { oldTitle: targetMember.title, newTitle },
      },
    });

    return { ok: true };
  });

  // POST /clans/:id/members/:characterId/deputy - призначити/зняти зама (тільки для глави)
  app.post("/clans/:id/members/:characterId/deputy", async (req, reply) => {
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });

    const { id, characterId: targetCharacterId } = req.params as {
      id: string;
      characterId: string;
    };
    const { isDeputy } = req.body as { isDeputy?: boolean };

    const character = await prisma.character.findFirst({
      where: { accountId: auth.accountId },
    });

    if (!character) {
      return reply.code(404).send({ error: "character not found" });
    }

    const clan = await prisma.clan.findUnique({
      where: { id },
    });

    if (!clan) {
      return reply.code(404).send({ error: "clan not found" });
    }

    if (clan.creatorId !== character.id) {
      return reply.code(403).send({ error: "only clan leader can manage deputies" });
    }

    if (targetCharacterId === character.id) {
      return reply.code(400).send({ error: "cannot manage yourself" });
    }

    const targetMember = await prisma.clanMember.findFirst({
      where: {
        clanId: id,
        characterId: targetCharacterId,
      },
      include: {
        character: {
          select: { name: true },
        },
      },
    });

    if (!targetMember) {
      return reply.code(404).send({ error: "member not found" });
    }

    const newIsDeputy = isDeputy === true;

    await prisma.clanMember.update({
      where: { id: targetMember.id },
      data: { isDeputy: newIsDeputy },
    });

    // Додаємо лог
    await prisma.clanLog.create({
      data: {
        clanId: id,
        type: newIsDeputy ? "deputy_appointed" : "deputy_removed",
        characterId: character.id,
        targetCharacterId: targetCharacterId,
        message: newIsDeputy
          ? `${character.name} назначил ${targetMember.character.name} заместителем`
          : `${character.name} снял ${targetMember.character.name} с заместителя`,
      },
    });

    return { ok: true };
  });
}
