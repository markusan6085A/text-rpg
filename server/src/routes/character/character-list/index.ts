import type { FastifyInstance } from "fastify";
import path from "path";
import fs from "node:fs";
import { prisma } from "../../../db";
import { getAuth } from "../auth";
import { attachBaseResourcesForApi } from "../../../utils/characterBaseResources";

/** Корінь Vite dist (як у server/src/index.ts) — для портретів /characters/*.jpg */
function clientDistRoot(): string {
  const fromServerParent = path.resolve(process.cwd(), "..", "dist");
  const fromCwd = path.resolve(process.cwd(), "dist");
  try {
    if (fs.existsSync(fromServerParent)) return fromServerParent;
    if (fs.existsSync(fromCwd)) return fromCwd;
  } catch {
    /* noop */
  }
  return fromServerParent;
}

const CHARACTER_PORTRAIT_EXT = /\.(jpe?g|png|gif|webp|svg|ico)$/i;

export async function characterListRoutes(app: FastifyInstance) {
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
        baseMaxHp: true,
        baseMaxMp: true,
        baseMaxCp: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // ❗ ВАЖЛИВО: Додаємо heroRevision до персонажів, які його не мають
    for (const char of chars) {
      const heroJson = char.heroJson as any || {};
      if (!heroJson.heroRevision || heroJson.heroRevision === null) {
        const fallbackRevision = char.updatedAt 
          ? Math.floor(new Date(char.updatedAt).getTime())
          : Date.now();
        heroJson.heroRevision = fallbackRevision;
        heroJson.heroJsonVersion = heroJson.heroJsonVersion || 1;
        
        // Оновлюємо heroJson з ревізією (асинхронно, не блокуємо запит)
        prisma.character.update({
          where: { id: char.id },
          data: { heroJson },
        }).catch((err) => {
          app.log.error(err, `Failed to add heroRevision to character ${char.id}`);
        });
      }
    }

    let banMap: Record<string, { bannedUntil: string | null; blockedUntil: string | null }> = {};
    try {
      const rows = await prisma.$queryRaw<Array<{ id: string; bannedUntil: Date | null; blockedUntil: Date | null }>>`
        SELECT id, "bannedUntil", "blockedUntil" FROM "Character" WHERE "accountId" = ${auth.accountId}
      `;
      for (const r of rows) {
        banMap[r.id] = {
          bannedUntil: r.bannedUntil ? r.bannedUntil.toISOString() : null,
          blockedUntil: r.blockedUntil ? r.blockedUntil.toISOString() : null,
        };
      }
    } catch (_) {}

    const serializedChars = chars.map((char) =>
      attachBaseResourcesForApi({
        ...char,
        exp: Number(char.exp),
        adena: Number(char.adena ?? 0),
        aa: Number(char.aa ?? 0),
        coinLuck: Number(char.coinLuck ?? 0),
        bannedUntil: banMap[char.id]?.bannedUntil ?? null,
        blockedUntil: banMap[char.id]?.blockedUntil ?? null,
      }),
    );

    return { ok: true, characters: serializedChars };
  });

  // GET /characters/:id  (Bearer token)
  app.get("/characters/:id", async (req, reply) => {
    const params = req.params as { id?: string };
    const id = params.id;

    if (!id) return reply.code(400).send({ error: "character id required" });

    // Портрети race/class — URL збігається з API /characters/:id (cuid). Спочатку віддаємо файл без JWT.
    if (CHARACTER_PORTRAIT_EXT.test(id)) {
      const safe = path.basename(id);
      if (!safe || safe !== id) {
        return reply.code(400).send({ error: "invalid path" });
      }
      const root = clientDistRoot();
      const charsDir = path.join(root, "characters");
      const abs = path.join(charsDir, safe);
      if (!abs.startsWith(charsDir)) {
        return reply.code(404).send({ error: "Not found" });
      }
      if (!fs.existsSync(abs)) {
        return reply.code(404).send({ error: "Not found" });
      }
      return reply.sendFile(`characters/${safe}`);
    }

    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });

    const char = await prisma.character.findFirst({
      where: { id, accountId: auth.accountId },
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
        coinsSilver: true,
        heroJson: true,
        baseMaxHp: true,
        baseMaxMp: true,
        baseMaxCp: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!char) return reply.code(404).send({ error: "character not found" });

    let bannedUntil: string | null = null;
    let blockedUntil: string | null = null;
    try {
      const rows = await prisma.$queryRaw<Array<{ bannedUntil: Date | null; blockedUntil: Date | null }>>`
        SELECT "bannedUntil", "blockedUntil" FROM "Character" WHERE id = ${id} AND "accountId" = ${auth.accountId}
      `;
      if (rows[0]) {
        bannedUntil = rows[0].bannedUntil ? rows[0].bannedUntil.toISOString() : null;
        blockedUntil = rows[0].blockedUntil ? rows[0].blockedUntil.toISOString() : null;
      }
    } catch (_) {}

    // 🔥 Оновлюємо lastActivityAt при завантаженні героя — гравець одразу в онлайні
    prisma.character.update({
      where: { id: char.id },
      data: { lastActivityAt: new Date() },
    }).catch(() => {});

    const serialized = attachBaseResourcesForApi({
      ...char,
      exp: Number(char.exp),
      adena: Number(char.adena ?? 0),
      aa: Number(char.aa ?? 0),
      coinLuck: Number(char.coinLuck ?? 0),
      coinsSilver: Number((char as any).coinsSilver ?? 0),
      bannedUntil,
      blockedUntil,
    });

    return { ok: true, character: serialized };
  });
}