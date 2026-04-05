import type { FastifyInstance } from "fastify";
import { prisma } from "../../../db";
import { getEffectiveNickColor } from "../../../effectiveNickColor";
import { getAuth } from "../auth";
import { effectiveCharacterLevel } from "../../../utils/effectiveCharacterLevel";

function parseMaybeJsonObject(raw: any): Record<string, unknown> {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) return raw as Record<string, unknown>;
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed as Record<string, unknown>;
    } catch {
      // ignore malformed legacy value
    }
  }
  return {};
}

function normalizeHeroJsonForPublic(raw: any): Record<string, unknown> {
  const root = parseMaybeJsonObject(raw);
  const nested = parseMaybeJsonObject((root as any).heroJson);
  if (Object.keys(nested).length === 0) return root;
  // Legacy rows may contain payload under heroJson.heroJson. Merge to keep public profile stable.
  return { ...root, ...nested };
}

function buildPublicHeroJson(raw: any): Record<string, unknown> {
  const src = normalizeHeroJsonForPublic(raw);
  const out: Record<string, unknown> = {};
  const copy = (k: string) => {
    if (Object.prototype.hasOwnProperty.call(src, k)) out[k] = src[k];
  };
  // Public profile allowlist used by PlayerProfile UI (equipment, stats, counters, buffs)
  [
    "name",
    "race",
    "classId",
    "klass",
    "profession",
    "status",
    "equipment",
    "equipmentEnchantLevels",
    "equipmentInserts",
    "activeDyes",
    "skills",
    "heroBuffs",
    "location",
    "currentLocation",
    "zone",
    "zoneId",
    "currentCityId",
    "mobsKilled",
    "mobs_killed",
    "killedMobs",
    "totalKills",
    "karma",
    "pk",
    "pvpWins",
    "pvpLosses",
    "giftsCount",
    "premiumActive",
    "premiumExpiresAt",
    "baseStats",
    "baseStatsInitial",
    "hp",
    "mp",
    "cp",
    "maxHp",
    "maxMp",
    "maxCp",
    "sevenSealsBonus",
  ].forEach(copy);
  return out;
}

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
            nickColor: true,
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
            nickColor: true,
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
        const heroJson = normalizeHeroJsonForPublic((char as any).heroJson);
        const location = heroJson.location || "Unknown";
        const power = heroJson.power || 0;
        const nickColor = getEffectiveNickColor(heroJson, (char as any).nickColor);
        const lastActivityAt = char.lastActivityAt || char.updatedAt;
        const emblem = char.clanMember?.clan?.emblem || null;

        return {
          id: char.id,
          name: char.name,
          level: effectiveCharacterLevel(char),
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
      const body = (req.body ?? {}) as { characterId?: string; location?: string };
      const requestedCharacterId = String(body.characterId ?? "").trim();
      const requestedLocation = body.location !== undefined ? String(body.location).trim() : undefined;
      const character = requestedCharacterId
        ? await prisma.character.findFirst({
            where: { id: requestedCharacterId, accountId: auth.accountId },
            select: { id: true, name: true, heroJson: true, lastActivityAt: true },
          })
        : await prisma.character.findFirst({
            where: { accountId: auth.accountId },
            orderBy: { createdAt: "asc" },
            select: { id: true, name: true, heroJson: true, lastActivityAt: true },
          });

      if (!character) {
        return reply.code(404).send({ error: "character not found" });
      }

      // Перевірка повернення після 10+ годин — додаємо новину "такий то игрок вернулса в мир"
      const TEN_HOURS_MS = 10 * 60 * 60 * 1000;
      const lastAt = (character as any).lastActivityAt;
      if (lastAt && typeof lastAt.getTime === "function") {
        const gapMs = Date.now() - lastAt.getTime();
        if (gapMs >= TEN_HOURS_MS) {
          const { addNews } = await import("../../../news");
          addNews({
            type: "return_to_world",
            characterId: character.id,
            characterName: character.name,
            metadata: { hoursAbsent: Math.round(gapMs / (60 * 60 * 1000)) },
          }).catch((err) => app.log?.warn?.(err, "Failed to add return_to_world news"));
        }
      }

      if (requestedLocation !== undefined) {
        const heroJson = ((character as any).heroJson as any) || {};
        await prisma.character.update({
          where: { id: character.id },
          data: {
            lastActivityAt: new Date(),
            heroJson: { ...heroJson, location: requestedLocation },
          },
        });
      } else {
        await prisma.$executeRaw`UPDATE "Character" SET "lastActivityAt" = NOW() WHERE id = ${character.id}`;
      }

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
          coinsSilver: true,
          heroJson: true,
          createdAt: true,
          updatedAt: true,
          lastActivityAt: true,
          nickColor: true,
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
        id: char.id,
        name: char.name,
        race: char.race,
        classId: char.classId,
        sex: char.sex,
        level: effectiveCharacterLevel(char),
        exp: Number((char as any).exp ?? 0),
        sp: Number((char as any).sp ?? 0),
        adena: Number((char as any).adena ?? 0),
        aa: Number((char as any).aa ?? 0),
        coinLuck: Number((char as any).coinLuck ?? 0),
        coinsSilver: Number((char as any).coinsSilver ?? 0),
        heroJson: buildPublicHeroJson((char as any).heroJson),
        createdAt: char.createdAt ? char.createdAt.toISOString() : new Date().toISOString(),
        updatedAt: char.updatedAt ? char.updatedAt.toISOString() : undefined,
        nickColor: getEffectiveNickColor(parseMaybeJsonObject((char as any).heroJson), (char as any).nickColor) || undefined,
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
          coinsSilver: true,
          heroJson: true,
          createdAt: true,
          updatedAt: true,
          lastActivityAt: true,
          nickColor: true,
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
        id: char.id,
        name: char.name,
        race: char.race,
        classId: char.classId,
        sex: char.sex,
        level: effectiveCharacterLevel(char),
        exp: Number((char as any).exp ?? 0),
        sp: Number((char as any).sp ?? 0),
        adena: Number((char as any).adena ?? 0),
        aa: Number((char as any).aa ?? 0),
        coinLuck: Number((char as any).coinLuck ?? 0),
        coinsSilver: Number((char as any).coinsSilver ?? 0),
        heroJson: buildPublicHeroJson((char as any).heroJson),
        createdAt: char.createdAt ? char.createdAt.toISOString() : new Date().toISOString(),
        updatedAt: char.updatedAt ? char.updatedAt.toISOString() : undefined,
        nickColor: getEffectiveNickColor(parseMaybeJsonObject((char as any).heroJson), (char as any).nickColor) || undefined,
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