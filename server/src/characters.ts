import type { FastifyInstance } from "fastify";
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

export async function characterRoutes(app: FastifyInstance) {
  // GET /characters  (Bearer token)
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
      },
    });

    // Convert BigInt to Number for JSON serialization
    const serializedChars = chars.map(char => ({
      ...char,
      exp: Number(char.exp),
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
      };

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

  // GET /characters/:id  (Bearer token)
  app.get("/characters/:id", async (req, reply) => {
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });

    const params = req.params as { id?: string };
    const id = params.id;

    if (!id) return reply.code(400).send({ error: "character id required" });

    const char = await prisma.character.findFirst({
      where: {
        id,
        accountId: auth.accountId, // Забезпечуємо, що персонаж належить цьому акаунту
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
        updatedAt: true,
      },
    });

    if (!char) return reply.code(404).send({ error: "character not found" });

    // Convert BigInt to Number for JSON serialization
    const serialized = {
      ...char,
      exp: Number(char.exp),
    };

    return { ok: true, character: serialized };
  });

  // PUT /characters/:id  (Bearer token)  { heroJson, level, exp, sp, adena, aa, coinLuck }
  app.put("/characters/:id", async (req, reply) => {
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });

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
    };

    // Перевіряємо, що персонаж існує та належить цьому акаунту
    const existing = await prisma.character.findFirst({
      where: {
        id,
        accountId: auth.accountId,
      },
    });

    if (!existing) return reply.code(404).send({ error: "character not found" });

    // Оновлюємо тільки передані поля
    const updateData: any = {};
    
    // ❗ ВАЖЛИВО: Захист від перезапису heroJson порожніми даними
    if (body.heroJson !== undefined) {
      // Перевіряємо, чи heroJson не порожній і має обов'язкові поля
      if (body.heroJson && typeof body.heroJson === 'object' && body.heroJson.name) {
        updateData.heroJson = body.heroJson;
        app.log.info(`[PUT /characters/:id] Updating heroJson for character ${id}, inventory items: ${body.heroJson.inventory?.length || 0}`);
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

    const updated = await prisma.character.update({
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
        heroJson: true,
        updatedAt: true,
      },
    });

    // Convert BigInt to Number for JSON serialization
    const serialized = {
      ...updated,
      exp: Number(updated.exp),
    };

    return { ok: true, character: serialized };
  });
}
