import type { FastifyInstance } from "fastify";
import { prisma } from "../../../db";
import { getAuth } from "../auth";
import { addNews } from "../../../news";
import { validateHeroJson, addVersioning, checkRevision } from "../../../heroJsonValidator";
import { safeJsonStringify } from "../../../utils/sanitizeBigInt";
import { rateLimiters, rateLimitMiddleware } from "../../../rateLimiter";
import {
  buildCharacterSyncMetadata,
  enqueuePlayerActivityLog,
  getClientIp,
} from "../../../playerActivityLog";
import { mergeHeroJsonForClientPut } from "../../../utils/tvtHeroJsonMerge";
import {
  heroLooksMystic,
  mysticSpellbookGuildKey,
  MYSTIC_SPELLBOOK_TURNIN,
  removeOneStackFromInventory,
} from "../../../mysticSpellbookServer";
import { trySendWelcomeLetterForNewAccount } from "../../../welcomeNewPlayerLetter";
import {
  computeProfessionSkillLearn,
  computeAdditionalSkillLearn,
  parseSkillIdFromRequestBody,
} from "../../../learnSkillServer";
import { calculateServerDrops } from "../../../utils/serverDropCalculator";

export async function characterCrudRoutes(app: FastifyInstance) {
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
      const existingCount = await prisma.character.count({
        where: { accountId: auth.accountId },
      });

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
          adena: 50_000,
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

      const serialized = {
        ...created,
        exp: Number(created.exp),
        adena: Number(created.adena ?? 0),
        aa: Number(created.aa ?? 0),
        coinLuck: Number(created.coinLuck ?? 0),
      };

      try {
        await addNews({
          type: "new_player",
          characterId: created.id,
          characterName: created.name,
          metadata: {},
        });
        app.log.info(`News added for new player: ${created.name} (${created.id})`);
      } catch (newsError) {
        app.log.error(newsError, `Failed to add news for new player: ${created.name}`);
      }

      if (existingCount === 0) {
        await trySendWelcomeLetterForNewAccount({
          newCharacterId: created.id,
          log: app.log,
        });
      }

      return { ok: true, character: serialized };
    } catch (e: any) {
      console.error('Error creating character:', e);
      if (e.code === 'P2002') {
        return reply.code(409).send({ error: "character name already exists for this account" });
      }
      return reply.code(500).send({ error: e.message || "Internal server error" });
    }
  });

  // PUT /characters/:id/inventory — оновити тільки inventory/overflowChest (без exp/level/sp, щоб куплені предмети зберігались)
  app.put("/characters/:id/inventory", {
    preHandler: async (req, reply) => {
      await rateLimitMiddleware(rateLimiters.characterUpdate, "character-update")(req, reply);
    },
  }, async (req, reply) => {
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });

    const params = req.params as { id?: string };
    const id = params.id;
    if (!id) return reply.code(400).send({ error: "character id required" });

    const body = req.body as { inventory?: any[]; overflowChest?: any[] };
    const inventory = Array.isArray(body.inventory) ? body.inventory : undefined;
    const overflowChest = Array.isArray(body.overflowChest) ? body.overflowChest : undefined;
    if (inventory === undefined && overflowChest === undefined) {
      return reply.code(400).send({ error: "inventory or overflowChest required" });
    }

    const existing = await prisma.character.findFirst({
      where: { id, accountId: auth.accountId },
    });
    if (!existing) return reply.code(404).send({ error: "character not found" });

    const oldHeroJson = (existing.heroJson as any) || {};
    const baseJson = {
      name: oldHeroJson.name || existing.name,
      race: oldHeroJson.race || existing.race,
      classId: oldHeroJson.classId || oldHeroJson.klass || existing.classId,
      klass: oldHeroJson.klass || oldHeroJson.classId || existing.classId,
      level: oldHeroJson.level ?? existing.level ?? 1,
    };
    const newHeroJsonRaw = {
      ...baseJson,
      ...oldHeroJson,
      ...(inventory !== undefined ? { inventory } : {}),
      ...(overflowChest !== undefined ? { overflowChest } : {}),
    };
    const newHeroJson = mergeHeroJsonForClientPut(oldHeroJson, newHeroJsonRaw);
    const validation = validateHeroJson(newHeroJson);
    if (!validation.valid) {
      return reply.code(400).send({ error: "invalid_hero_json", errors: validation.errors });
    }

    const oldRevision = oldHeroJson.heroRevision || 0;
    const versionedHeroJson = addVersioning(newHeroJson, oldRevision);

    try {
      const updated = await prisma.character.update({
        where: { id },
        data: {
          heroJson: versionedHeroJson as any,
          lastActivityAt: new Date(),
        },
        select: {
          id: true, name: true, race: true, classId: true, sex: true,
          level: true, exp: true, sp: true, adena: true, aa: true, coinLuck: true,
          heroJson: true, createdAt: true, updatedAt: true,
        },
      });

      const serialized = {
        ...updated,
        exp: Number(updated.exp),
        adena: Number(updated.adena ?? 0),
        aa: Number(updated.aa ?? 0),
        coinLuck: Number(updated.coinLuck ?? 0),
      };

      app.log.info({ accountId: auth.accountId, characterId: id, invLen: inventory?.length ?? 0 }, "[PUT /characters/:id/inventory] Inventory updated");

      enqueuePlayerActivityLog({
        accountId: auth.accountId,
        characterId: id,
        characterName: existing.name,
        action: "inventory.update",
        metadata: {
          inventoryLen: inventory !== undefined ? inventory.length : undefined,
          overflowLen: overflowChest !== undefined ? overflowChest.length : undefined,
          prevInvLen: Array.isArray(oldHeroJson.inventory) ? oldHeroJson.inventory.length : 0,
          prevOverflowLen: Array.isArray(oldHeroJson.overflowChest) ? oldHeroJson.overflowChest.length : 0,
        },
        clientIp: getClientIp(req),
      });

      return { ok: true, character: serialized };
    } catch (e: any) {
      app.log.error(e, `[PUT /characters/:id/inventory] Error for character ${id}`);
      return reply.code(500).send({ error: e.message || "Internal server error" });
    }
  });

  // PUT /characters/:id/inventory/clear — очистити інвентар без exp/level/sp (уникаємо "exp cannot be decreased")
  app.put("/characters/:id/inventory/clear", {
    preHandler: async (req, reply) => {
      await rateLimitMiddleware(rateLimiters.characterUpdate, "character-update")(req, reply);
    },
  }, async (req, reply) => {
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });

    const params = req.params as { id?: string };
    const id = params.id;
    if (!id) return reply.code(400).send({ error: "character id required" });

    const existing = await prisma.character.findFirst({
      where: { id, accountId: auth.accountId },
    });
    if (!existing) return reply.code(404).send({ error: "character not found" });

    const oldHeroJson = (existing.heroJson as any) || {};
    // 🔥 Якщо heroJson порожній — беремо name/race/classId з character (нові персонажі)
    const baseJson = {
      name: oldHeroJson.name || existing.name,
      race: oldHeroJson.race || existing.race,
      classId: oldHeroJson.classId || oldHeroJson.klass || existing.classId,
      klass: oldHeroJson.klass || oldHeroJson.classId || existing.classId,
      level: oldHeroJson.level ?? existing.level ?? 1,
    };
    const newHeroJson = {
      ...baseJson,
      ...oldHeroJson,
      inventory: [],
      overflowChest: [],
      inventoryClearedAt: Date.now(),
    };
    const validation = validateHeroJson(newHeroJson);
    if (!validation.valid) {
      return reply.code(400).send({ error: "invalid_hero_json", errors: validation.errors });
    }

    const oldRevision = oldHeroJson.heroRevision || 0;
    const versionedHeroJson = addVersioning(newHeroJson, oldRevision);

    try {
      const updated = await prisma.character.update({
        where: { id },
        data: {
          heroJson: versionedHeroJson as any,
          lastActivityAt: new Date(),
        },
        select: {
          id: true, name: true, race: true, classId: true, sex: true,
          level: true, exp: true, sp: true, adena: true, aa: true, coinLuck: true,
          heroJson: true, createdAt: true, updatedAt: true,
        },
      });

      const serialized = {
        ...updated,
        exp: Number(updated.exp),
        adena: Number(updated.adena ?? 0),
        aa: Number(updated.aa ?? 0),
        coinLuck: Number(updated.coinLuck ?? 0),
      };

      app.log.info({ accountId: auth.accountId, characterId: id }, "[PUT /characters/:id/inventory/clear] Inventory cleared");
      return { ok: true, character: serialized };
    } catch (e: any) {
      app.log.error(e, `[PUT /characters/:id/inventory/clear] Error for character ${id}`);
      return reply.code(500).send({ error: e.message || "Internal server error" });
    }
  });

  // PUT /characters/:id  (Bearer token)
  app.put("/characters/:id", {
    preHandler: async (req, reply) => {
      await rateLimitMiddleware(rateLimiters.characterUpdate, "character-update")(req, reply);
    },
  }, async (req, reply) => {
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
      coinsSilver?: number;
      expectedRevision?: number;
    };

    const existing = await prisma.character.findFirst({
      where: {
        id,
        accountId: auth.accountId,
      },
    });

    if (!existing) return reply.code(404).send({ error: "character not found" });

    const heroJsonSnapshotForLog = JSON.parse(JSON.stringify(existing.heroJson || {})) as Record<
      string,
      unknown
    >;

    if (body.level !== undefined) {
      if (typeof body.level !== 'number' || body.level < 1 || body.level > 80) {
        return reply.code(400).send({ error: "invalid level (must be 1-80)" });
      }
      if (body.level < existing.level) {
        app.log.warn({
          accountId: auth.accountId,
          characterId: id,
          currentLevel: existing.level,
          attemptedLevel: body.level,
        }, `[PUT /characters/:id] Attempted to decrease level from ${existing.level} to ${body.level}`);
        return reply.code(400).send({ error: "level cannot be decreased" });
      }
    }

    if (body.exp !== undefined) {
      if (typeof body.exp !== 'number' || body.exp < 0) {
        return reply.code(400).send({ error: "invalid exp (must be >= 0)" });
      }
      const currentExp = Number(existing.exp);
      const requestedLevel = body.level !== undefined ? Number(body.level) : Number(existing.level);
      const isLevelUpRequest = requestedLevel > Number(existing.level);
      // exp у грі зберігається як прогрес поточного рівня, тому після level-up exp може "скинутися".
      // Забороняємо зменшення exp тільки якщо рівень НЕ підвищується.
      if (body.exp < currentExp && !isLevelUpRequest) {
        app.log.warn({
          accountId: auth.accountId,
          characterId: id,
          currentExp,
          attemptedExp: body.exp,
        }, `[PUT /characters/:id] Attempted to decrease exp from ${currentExp} to ${body.exp}`);
        return reply.code(400).send({ error: "exp cannot be decreased" });
      }
    }

    if (body.sp !== undefined) {
      if (typeof body.sp !== 'number' || body.sp < 0) {
        return reply.code(400).send({ error: "invalid sp (must be >= 0)" });
      }
      const skillsChanging = body.heroJson?.skills !== undefined;
      if (body.sp < existing.sp && !skillsChanging) {
        app.log.warn({
          accountId: auth.accountId,
          characterId: id,
          currentSp: existing.sp,
          attemptedSp: body.sp,
        }, `[PUT /characters/:id] Attempted to decrease sp from ${existing.sp} to ${body.sp}`);
        return reply.code(400).send({ error: "sp cannot be decreased" });
      }
    }

    if (body.adena !== undefined) {
      const adenaNum = typeof body.adena === "string" ? Number(body.adena) : body.adena;
      if (typeof adenaNum !== "number" || isNaN(adenaNum) || adenaNum < 0) {
        return reply.code(400).send({ error: "invalid adena (must be >= 0)" });
      }
      (body as any).adena = adenaNum;
    }

    if (body.aa !== undefined) {
      if (typeof body.aa !== 'number' || body.aa < 0) {
        return reply.code(400).send({ error: "invalid aa (must be >= 0)" });
      }
      if (body.aa < Number(existing.aa ?? 0)) {
        app.log.warn({
          accountId: auth.accountId,
          characterId: id,
          currentAa: existing.aa || 0,
          attemptedAa: body.aa,
        }, `[PUT /characters/:id] Attempted to decrease aa from ${existing.aa || 0} to ${body.aa}`);
        return reply.code(400).send({ error: "aa cannot be decreased" });
      }
    }

    if (body.coinsSilver !== undefined) {
      if (typeof body.coinsSilver !== 'number' || body.coinsSilver < 0) {
        return reply.code(400).send({ error: "invalid coinsSilver (must be >= 0)" });
      }
    }

    if (body.coinLuck !== undefined) {
      if (typeof body.coinLuck !== 'number' || body.coinLuck < 0) {
        return reply.code(400).send({ error: "invalid coinLuck (must be >= 0)" });
      }
      if (body.coinLuck < Number((existing as any).coinLuck ?? 0)) {
        app.log.warn({
          accountId: auth.accountId,
          characterId: id,
          currentCoinLuck: existing.coinLuck || 0,
          attemptedCoinLuck: body.coinLuck,
        }, `[PUT /characters/:id] Attempted to decrease coinLuck from ${existing.coinLuck || 0} to ${body.coinLuck}`);
        return reply.code(400).send({ error: "coinLuck cannot be decreased" });
      }
    }

    const oldHeroJson = existing.heroJson as any || {};
    const oldPremiumUntil = oldHeroJson.premiumUntil || 0;
    
    if (!oldHeroJson.heroRevision || oldHeroJson.heroRevision === null) {
      const fallbackRevision = existing.updatedAt 
        ? Math.floor(new Date(existing.updatedAt).getTime())
        : Date.now();
      oldHeroJson.heroRevision = fallbackRevision;
      oldHeroJson.heroJsonVersion = oldHeroJson.heroJsonVersion || 1;
      
      prisma.character.update({
        where: { id },
        data: { heroJson: oldHeroJson },
      }).catch((err) => {
        app.log.error(err, `Failed to add heroRevision to character ${id}`);
      });
    }
    
    const updateData: any = {};
    
    if (body.heroJson !== undefined) {
      if (body.expectedRevision !== undefined) {
        const revisionCheck = checkRevision(oldHeroJson, body.expectedRevision);
        if (!revisionCheck.valid) {
          app.log.warn({
            accountId: auth.accountId,
            characterId: id,
            expectedRevision: body.expectedRevision,
            currentRevision: oldHeroJson.heroRevision || 0,
          }, `[PUT /characters/:id] Revision conflict for character ${id}: expected ${body.expectedRevision}, got ${oldHeroJson.heroRevision || 'none'}`);
          
          return reply.code(409).send({ 
            error: "revision_conflict",
            message: "Character was modified by another session. Please reload and try again.",
            currentRevision: oldHeroJson.heroRevision || 0,
            updatedAt: existing.updatedAt.toISOString(),
            serverState: {
              heroRevision: oldHeroJson.heroRevision || 0,
              heroJsonVersion: oldHeroJson.heroJsonVersion || 1,
              updatedAt: existing.updatedAt.toISOString(),
            },
          });
        }
      }

      const validation = validateHeroJson(body.heroJson);
      if (!validation.valid) {
        app.log.warn({
          characterId: id,
          accountId: auth.accountId,
          errors: validation.errors,
        }, `[PUT /characters/:id] Invalid heroJson structure for character ${id}`);
        return reply.code(400).send({
          error: "invalid_hero_json",
          message: "heroJson structure is invalid",
          errors: validation.errors,
        });
      }

      if (body.heroJson && typeof body.heroJson === 'object' && body.heroJson.name) {
        const heroJsonMergedTvt = mergeHeroJsonForClientPut(oldHeroJson, body.heroJson);
        const clientPremiumUntil =
          heroJsonMergedTvt.premiumUntil != null ? Number(heroJsonMergedTvt.premiumUntil) : oldPremiumUntil;
        const clampedPremiumUntil = Math.min(clientPremiumUntil, oldPremiumUntil);
        const heroJsonToSave = { ...heroJsonMergedTvt, premiumUntil: clampedPremiumUntil };
        
        const oldRevision = oldHeroJson.heroRevision || 0;
        const versionedHeroJson = addVersioning(heroJsonToSave, oldRevision);
        updateData.heroJson = versionedHeroJson;
        app.log.info({
          accountId: auth.accountId,
          characterId: id,
          oldRevision,
          newRevision: versionedHeroJson.heroRevision,
          inventoryItems: heroJsonMergedTvt.inventory?.length || 0,
        }, `[PUT /characters/:id] Updating heroJson for character ${id}`);
      } else {
        app.log.warn(`[PUT /characters/:id] Attempted to save empty or invalid heroJson for character ${id}, ignoring`);
      }
    }
    
    if (body.level !== undefined) updateData.level = body.level;
    if (body.exp !== undefined) updateData.exp = BigInt(body.exp);
    if (body.sp !== undefined) updateData.sp = body.sp;
    if (body.adena !== undefined) updateData.adena = body.adena;
    if (body.aa !== undefined) updateData.aa = body.aa;
    if (body.coinLuck !== undefined) updateData.coinLuck = body.coinLuck;
    if (body.coinsSilver !== undefined) (updateData as any).coinsSilver = body.coinsSilver;

    if (updateData.heroJson) {
      updateData.lastActivityAt = new Date();
    }

    let updated: any;
    if (body.expectedRevision !== undefined && updateData.heroJson) {
      try {
        const result = await prisma.$transaction(async (tx) => {
          const locked = await tx.$queryRaw<Array<{ heroJson: any; updatedAt: Date }>>`
            SELECT "heroJson", "updatedAt"
            FROM "Character"
            WHERE "id" = ${id} AND "accountId" = ${auth.accountId}
            FOR UPDATE
          `;

          if (locked.length === 0) {
            return { success: false, reason: 'not_found' };
          }

          const currentHeroJson = locked[0].heroJson as any || {};
          const currentRevision = currentHeroJson.heroRevision || 0;

          if (currentRevision !== body.expectedRevision) {
            return { 
              success: false, 
              reason: 'revision_conflict',
              currentRevision,
              updatedAt: locked[0].updatedAt,
            };
          }

          const newRevision = Date.now() > currentRevision ? Date.now() : currentRevision + 1;
          const updatedHeroJson = {
            ...updateData.heroJson,
            heroRevision: newRevision,
          };

          const setParts: string[] = [];
          const params: any[] = [];
          let paramIndex = 1;

          setParts.push(`"heroJson" = $${paramIndex}::jsonb`);
          params.push(safeJsonStringify(updatedHeroJson));
          paramIndex++;

          if (updateData.level !== undefined) {
            setParts.push(`"level" = $${paramIndex}`);
            params.push(updateData.level);
            paramIndex++;
          }
          if (updateData.exp !== undefined) {
            setParts.push(`"exp" = $${paramIndex}::bigint`);
            params.push(updateData.exp);
            paramIndex++;
          }
          if (updateData.sp !== undefined) {
            setParts.push(`"sp" = $${paramIndex}`);
            params.push(updateData.sp);
            paramIndex++;
          }
          if (updateData.adena !== undefined) {
            setParts.push(`"adena" = $${paramIndex}`);
            params.push(updateData.adena);
            paramIndex++;
          }
          if (updateData.aa !== undefined) {
            setParts.push(`"aa" = $${paramIndex}`);
            params.push(updateData.aa);
            paramIndex++;
          }
          if (updateData.coinLuck !== undefined) {
            setParts.push(`"coinLuck" = $${paramIndex}`);
            params.push(updateData.coinLuck);
            paramIndex++;
          }
          if ((updateData as any).coinsSilver !== undefined) {
            setParts.push(`"coinsSilver" = $${paramIndex}`);
            params.push((updateData as any).coinsSilver);
            paramIndex++;
          }
          if (updateData.lastActivityAt) {
            setParts.push(`"lastActivityAt" = $${paramIndex}`);
            params.push(updateData.lastActivityAt);
            paramIndex++;
          }
          setParts.push(`"updatedAt" = NOW()`);

          const sql = `
            UPDATE "Character"
            SET ${setParts.join(', ')}
            WHERE "id" = $${paramIndex}
              AND "accountId" = $${paramIndex + 1}
              AND ("heroJson"->>'heroRevision')::bigint = $${paramIndex + 2}
          `;
          params.push(id, auth.accountId, body.expectedRevision);

          const updateResult = await tx.$executeRawUnsafe(sql, ...params);

          if (updateResult === 0) {
            return { 
              success: false, 
              reason: 'revision_conflict_during_update',
              currentRevision,
              updatedAt: locked[0].updatedAt,
            };
          }

          const updated = await tx.character.findUnique({
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
              updatedAt: true,
            },
          });

          return { success: true, character: updated };
        });

        if (!result.success) {
          if (result.reason === 'not_found') {
            return reply.code(404).send({ error: "character not found" });
          }
          
          app.log.warn(`[PUT /characters/:id] Atomic revision check failed for character ${id}: expected ${body.expectedRevision}, got ${result.currentRevision}`);
          return reply.code(409).send({ 
            error: "revision_conflict",
            message: "Character was modified by another session. Please reload and try again.",
            currentRevision: result.currentRevision || 0,
            updatedAt: result.updatedAt?.toISOString() || existing.updatedAt.toISOString(),
            serverState: {
              heroRevision: result.currentRevision || 0,
              heroJsonVersion: oldHeroJson.heroJsonVersion || 1,
              updatedAt: result.updatedAt?.toISOString() || existing.updatedAt.toISOString(),
            },
          });
        }

        updated = result.character!;
      } catch (txError) {
        app.log.error(txError, `[PUT /characters/:id] Transaction error for character ${id}`);
        return reply.code(500).send({
          error: "Internal Server Error",
          message: txError instanceof Error ? txError.message : "Transaction failed",
        });
      }
    } else {
      if (Object.keys(updateData).length === 0) {
        updated = existing;
      } else {
        updated = await prisma.character.update({
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
            coinsSilver: true,
            heroJson: true,
            updatedAt: true,
          },
        });
      }
    }

    const serialized = {
      ...updated,
      exp: Number(updated.exp),
      adena: Number((updated as any).adena ?? 0),
      aa: Number((updated as any).aa ?? 0),
      coinLuck: Number((updated as any).coinLuck ?? 0),
      coinsSilver: Number((updated as any).coinsSilver ?? 0),
    };

    if (updateData.heroJson && updated) {
      const newHj = (updated.heroJson || {}) as Record<string, unknown>;
      const rowSnap = (c: typeof updated) => ({
        level: Number(c.level ?? 1),
        exp: BigInt((c as any).exp ?? 0),
        adena: BigInt((c as any).adena ?? 0),
        sp: Number((c as any).sp ?? 0),
        coinLuck: BigInt((c as any).coinLuck ?? 0),
        coinsSilver: BigInt((c as any).coinsSilver ?? 0),
      });
      const meta = buildCharacterSyncMetadata(heroJsonSnapshotForLog, newHj, rowSnap(existing as any), rowSnap(updated));
      if (meta) {
        enqueuePlayerActivityLog({
          accountId: auth.accountId,
          characterId: id,
          characterName: updated.name,
          action: "character.sync",
          metadata: meta,
          clientIp: getClientIp(req),
        });
      }
    }

    return { ok: true, character: serialized };
  });

  // POST /characters/:id/mage-spellbook/turn-in — здати книгу гільдії магів (знімає предмет з інвентаря, виставляє heroJson.spellbookGuild)
  app.post(
    "/characters/:id/mage-spellbook/turn-in",
    {
      preHandler: async (req, reply) => {
        await rateLimitMiddleware(rateLimiters.characterUpdate, "character-update")(req, reply);
      },
    },
    async (req, reply) => {
      const auth = getAuth(req);
      if (!auth) return reply.code(401).send({ error: "unauthorized" });

      const params = req.params as { id?: string };
      const id = params.id;
      if (!id) return reply.code(400).send({ error: "character id required" });

      const body = req.body as { skillId?: unknown };
      const skillId = Number(body.skillId);
      if (!Number.isInteger(skillId) || skillId <= 0) {
        return reply.code(400).send({ error: "invalid input" });
      }

      const spec = MYSTIC_SPELLBOOK_TURNIN[skillId];
      if (!spec) return reply.code(400).send({ error: "invalid input" });

      const existing = await prisma.character.findFirst({
        where: { id, accountId: auth.accountId },
      });
      if (!existing) return reply.code(404).send({ error: "character not found" });

      const oldHeroJson = (existing.heroJson as any) || {};
      if (!heroLooksMystic(oldHeroJson)) {
        return reply.code(403).send({ error: "forbidden" });
      }

      const skills = Array.isArray(oldHeroJson.skills) ? oldHeroJson.skills : [];
      const row = skills.find((s: any) => Number(s?.id) === skillId);
      const cur = row ? Number(row.level) || 0 : 0;
      if (cur !== 0) return reply.code(400).send({ error: "invalid input" });

      const guildKey = mysticSpellbookGuildKey(skillId, spec.targetLevel);
      const prevGuild = oldHeroJson.spellbookGuild && typeof oldHeroJson.spellbookGuild === "object" ? oldHeroJson.spellbookGuild : {};
      if (prevGuild[guildKey]) {
        return reply.code(400).send({ error: "invalid input" });
      }

      const inventory = Array.isArray(oldHeroJson.inventory) ? [...oldHeroJson.inventory] : [];
      let newInventory: any[];
      try {
        newInventory = removeOneStackFromInventory(inventory, spec.bookItemId).newInventory;
      } catch {
        return reply.code(400).send({ error: "invalid input" });
      }

      const mergedBase = {
        name: oldHeroJson.name || existing.name,
        race: oldHeroJson.race || existing.race,
        classId: oldHeroJson.classId || oldHeroJson.klass || existing.classId,
        klass: oldHeroJson.klass || oldHeroJson.classId || existing.classId,
        level: oldHeroJson.level ?? existing.level ?? 1,
      };

      const newHeroJsonRaw = {
        ...mergedBase,
        ...oldHeroJson,
        inventory: newInventory,
        spellbookGuild: { ...prevGuild, [guildKey]: true },
      };
      const newHeroJson = mergeHeroJsonForClientPut(oldHeroJson, newHeroJsonRaw);
      const validation = validateHeroJson(newHeroJson);
      if (!validation.valid) {
        return reply.code(400).send({ error: "invalid_hero_json", errors: validation.errors });
      }

      const oldRevision = oldHeroJson.heroRevision || 0;
      const versionedHeroJson = addVersioning(newHeroJson, oldRevision);

      const updated = await prisma.character.update({
        where: { id },
        data: {
          heroJson: versionedHeroJson as any,
          lastActivityAt: new Date(),
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

      const serialized = {
        ...updated,
        exp: Number(updated.exp),
        adena: Number(updated.adena ?? 0),
        aa: Number(updated.aa ?? 0),
        coinLuck: Number(updated.coinLuck ?? 0),
      };

      return reply.send({ ok: true, character: serialized, guildKey });
    }
  );

  // POST /characters/:id/learn-skill — серверне вивчення скілу гільдії за SP (whitelist професії, книга для містика)
  app.post(
    "/characters/:id/learn-skill",
    {
      preHandler: async (req, reply) => {
        await rateLimitMiddleware(rateLimiters.characterUpdate, "character-update")(req, reply);
      },
    },
    async (req, reply) => {
      const auth = getAuth(req);
      if (!auth) return reply.code(401).send({ error: "unauthorized" });

      const params = req.params as { id?: string };
      const id = params.id;
      if (!id) return reply.code(400).send({ error: "character id required" });

      const skillId = parseSkillIdFromRequestBody(req.body);
      if (skillId == null) {
        return reply.code(400).send({ error: "invalid input" });
      }

      const existing = await prisma.character.findFirst({
        where: { id, accountId: auth.accountId },
      });
      if (!existing) return reply.code(404).send({ error: "character not found" });

      const computed = computeProfessionSkillLearn(
        {
          level: existing.level,
          sp: Number((existing as any).sp ?? 0),
          heroJson: existing.heroJson,
          classId: existing.classId,
        },
        skillId
      );
      if (!computed.ok) {
        return reply.code(computed.status).send({ error: computed.status === 403 ? "forbidden" : "invalid input" });
      }

      const oldHeroJson = (existing.heroJson as any) || {};
      const mergedBase = {
        name: oldHeroJson.name || existing.name,
        race: oldHeroJson.race || existing.race,
        classId: oldHeroJson.classId || oldHeroJson.klass || existing.classId,
        klass: oldHeroJson.klass || oldHeroJson.classId || existing.classId,
        level: oldHeroJson.level ?? existing.level ?? 1,
      };
      const newHeroJsonRaw = {
        ...mergedBase,
        ...oldHeroJson,
        ...computed.mergedHeroJsonRaw,
      };
      const newHeroJson = mergeHeroJsonForClientPut(oldHeroJson, newHeroJsonRaw);
      const validation = validateHeroJson(newHeroJson);
      if (!validation.valid) {
        return reply.code(400).send({ error: "invalid_hero_json", errors: validation.errors });
      }

      const oldRevision = oldHeroJson.heroRevision || 0;
      const versionedHeroJson = addVersioning(newHeroJson, oldRevision);

      const updated = await prisma.character.update({
        where: { id },
        data: {
          sp: computed.newSp,
          heroJson: versionedHeroJson as any,
          lastActivityAt: new Date(),
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
          coinsSilver: true,
          heroJson: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      const serialized = {
        ...updated,
        exp: Number(updated.exp),
        adena: Number(updated.adena ?? 0),
        aa: Number(updated.aa ?? 0),
        coinLuck: Number(updated.coinLuck ?? 0),
        coinsSilver: Number((updated as any).coinsSilver ?? 0),
      };

      return reply.send({ ok: true, character: serialized });
    }
  );

  // POST /characters/:id/learn-additional-skill — додаткові скіли за адену (whitelist)
  app.post(
    "/characters/:id/learn-additional-skill",
    {
      preHandler: async (req, reply) => {
        await rateLimitMiddleware(rateLimiters.characterUpdate, "character-update")(req, reply);
      },
    },
    async (req, reply) => {
      const auth = getAuth(req);
      if (!auth) return reply.code(401).send({ error: "unauthorized" });

      const params = req.params as { id?: string };
      const id = params.id;
      if (!id) return reply.code(400).send({ error: "character id required" });

      const skillId = parseSkillIdFromRequestBody(req.body);
      if (skillId == null) {
        return reply.code(400).send({ error: "invalid input" });
      }

      const existing = await prisma.character.findFirst({
        where: { id, accountId: auth.accountId },
      });
      if (!existing) return reply.code(404).send({ error: "character not found" });

      const computed = computeAdditionalSkillLearn(
        {
          adena: (existing as any).adena ?? 0n,
          level: existing.level,
          heroJson: existing.heroJson,
          classId: existing.classId,
        },
        skillId
      );
      if (!computed.ok) {
        return reply.code(computed.status).send({ error: computed.status === 403 ? "forbidden" : "invalid input" });
      }

      const oldHeroJson = (existing.heroJson as any) || {};
      const mergedBase = {
        name: oldHeroJson.name || existing.name,
        race: oldHeroJson.race || existing.race,
        classId: oldHeroJson.classId || oldHeroJson.klass || existing.classId,
        klass: oldHeroJson.klass || oldHeroJson.classId || existing.classId,
        level: oldHeroJson.level ?? existing.level ?? 1,
      };
      const newHeroJsonRaw = {
        ...mergedBase,
        ...oldHeroJson,
        ...computed.mergedHeroJsonRaw,
      };
      const newHeroJson = mergeHeroJsonForClientPut(oldHeroJson, newHeroJsonRaw);
      const validation = validateHeroJson(newHeroJson);
      if (!validation.valid) {
        return reply.code(400).send({ error: "invalid_hero_json", errors: validation.errors });
      }

      const oldRevision = oldHeroJson.heroRevision || 0;
      const versionedHeroJson = addVersioning(newHeroJson, oldRevision);

      const updated = await prisma.character.update({
        where: { id },
        data: {
          adena: computed.newAdena,
          heroJson: versionedHeroJson as any,
          lastActivityAt: new Date(),
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
          coinsSilver: true,
          heroJson: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      const serialized = {
        ...updated,
        exp: Number(updated.exp),
        adena: Number(updated.adena ?? 0),
        aa: Number(updated.aa ?? 0),
        coinLuck: Number(updated.coinLuck ?? 0),
        coinsSilver: Number((updated as any).coinsSilver ?? 0),
      };

      return reply.send({ ok: true, character: serialized });
    }
  );

  // POST /characters/:id/enchant — server-side atomic enchant (Phase 1)
  app.post("/characters/:id/enchant", async (req, reply) => {
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });

    const id = (req.params as any).id;
    const body = req.body as {
      scrollId?: string;
      slot?: string | null;
      inventoryItemIndex?: number | null;
      /** itemId of the target — сервер верифікує, що item[index].id збігається, щоб уникнути заточки не тієї зброї при розбіжності індексів */
      targetItemId?: string | null;
    };

    const scrollId = String(body.scrollId ?? "").trim();
    if (!scrollId) return reply.code(400).send({ error: "scrollId required" });
    if (body.slot == null && body.inventoryItemIndex == null) {
      return reply.code(400).send({ error: "slot or inventoryItemIndex required" });
    }

    const character = await prisma.character.findFirst({
      where: { id, accountId: auth.accountId },
    });
    if (!character) return reply.code(404).send({ error: "character not found" });

    const heroJson: any = (character.heroJson as any) || {};
    const inventory: any[] = Array.isArray(heroJson.inventory) ? heroJson.inventory : [];

    // Detect scroll type from ID
    const sid = scrollId.toLowerCase();
    const isWeaponScroll = sid.includes("weapon");
    const isArmorScroll = sid.includes("armor");
    const isBlessedScroll = sid.includes("bless") || sid.includes("quest_shop");
    const isGmGiantScroll = /^gm_giant_enchant_(weapon|armor)_(d|c|b|a|s)$/i.test(scrollId);

    if (!isWeaponScroll && !isArmorScroll) {
      return reply.code(400).send({ error: "unknown scroll type" });
    }

    // Find scroll in inventory
    const scrollIdx = inventory.findIndex(
      (i: any) => i && i.id === scrollId && (i.count ?? 1) > 0
    );
    if (scrollIdx < 0) return reply.code(400).send({ error: "scroll not found in inventory" });

    // Find target item and determine if weapon
    let currentEnchantLevel = 0;
    let isWeaponItem = false;
    let targetIsEquipped = false;
    let targetSlot: string | null = null;
    let targetInventoryIndex: number | null = null;

    if (body.slot) {
      const equipment: any = heroJson.equipment ?? {};
      const equippedId = equipment[body.slot];
      if (!equippedId) return reply.code(400).send({ error: "no item in slot" });

      const enchLevels: any = heroJson.equipmentEnchantLevels ?? {};
      currentEnchantLevel = Number(enchLevels[body.slot] ?? 0);
      targetIsEquipped = true;
      targetSlot = body.slot;
      const weaponSlots = ["weapon", "lrhand", "rhand", "lhand"];
      isWeaponItem = weaponSlots.includes(body.slot);
    } else if (body.inventoryItemIndex != null) {
      const idx = Number(body.inventoryItemIndex);
      if (idx < 0 || idx >= inventory.length) {
        return reply.code(400).send({ error: "invalid inventoryItemIndex" });
      }

      let item = inventory[idx];
      if (!item) return reply.code(400).send({ error: "no item at index" });

      // Verify that the item at the given index matches the expected itemId.
      // If there is a mismatch (client/server inventory order diverged), find the correct item by ID.
      const targetItemId = body.targetItemId
        ? String(body.targetItemId).replace(/^shop_/i, "").toLowerCase()
        : null;
      if (targetItemId) {
        const serverItemId = String(item.id ?? "").replace(/^shop_/i, "").toLowerCase();
        if (serverItemId !== targetItemId) {
          // Wrong item at this index — search for the correct one
          const correctedIdx = inventory.findIndex((it: any) => {
            if (!it) return false;
            const id = String(it.id ?? "").replace(/^shop_/i, "").toLowerCase();
            return id === targetItemId;
          });
          if (correctedIdx < 0) {
            return reply.code(400).send({ error: "target item not found in inventory" });
          }
          item = inventory[correctedIdx];
          targetInventoryIndex = correctedIdx;
        } else {
          targetInventoryIndex = idx;
        }
      } else {
        targetInventoryIndex = idx;
      }

      currentEnchantLevel = Number(item.enchantLevel ?? 0);
      const kind = String(item.kind ?? "").toLowerCase();
      const itemSlot = String(item.slot ?? "").toLowerCase();
      isWeaponItem =
        kind === "weapon" ||
        ["weapon", "lrhand", "rhand", "lhand"].includes(itemSlot);
    }

    // Validate scroll type vs item
    if (isWeaponScroll && !isWeaponItem) {
      return reply.code(400).send({ error: "weapon scroll can only enchant weapons" });
    }
    if (isArmorScroll && isWeaponItem) {
      return reply.code(400).send({ error: "armor scroll cannot enchant weapons" });
    }

    const maxEnchant = isWeaponItem ? 40 : 30;
    if (currentEnchantLevel >= maxEnchant) {
      return reply.code(400).send({ error: "item already at max enchant" });
    }

    // Success chance (mirrors enchantScroll.ts client logic)
    let successChance: number;
    if (isWeaponItem) {
      if (isGmGiantScroll) successChance = 1;
      else if (currentEnchantLevel < 5) successChance = 1.0;
      else if (currentEnchantLevel < 15) successChance = 0.8;
      else if (currentEnchantLevel < 30) successChance = 0.7;
      else successChance = 0.6;
    } else {
      if (isGmGiantScroll) successChance = 1;
      else if (currentEnchantLevel < 3) successChance = 1.0;
      else if (currentEnchantLevel < 10) successChance = 0.9;
      else if (currentEnchantLevel < 20) successChance = 0.8;
      else successChance = 0.7;
    }
    if (isBlessedScroll && !isGmGiantScroll) {
      successChance = Math.max(successChance, 0.95);
    }

    const success = Math.random() < successChance;

    // Calculate result level
    let newEnchantLevel: number;
    if (success) {
      newEnchantLevel = currentEnchantLevel + 1;
    } else if (isBlessedScroll) {
      newEnchantLevel = currentEnchantLevel > 3 ? 3 : currentEnchantLevel;
    } else if (isWeaponItem) {
      if (currentEnchantLevel < 5) newEnchantLevel = 0;
      else if (currentEnchantLevel < 15) newEnchantLevel = 5;
      else if (currentEnchantLevel < 30) newEnchantLevel = 10;
      else newEnchantLevel = 15;
    } else {
      newEnchantLevel = currentEnchantLevel;
    }

    // Deep clone heroJson and apply changes
    const newHeroJson: any = JSON.parse(JSON.stringify(heroJson));
    const newInventory: any[] = Array.isArray(newHeroJson.inventory) ? newHeroJson.inventory : [];

    // Consume one scroll (remove or decrement)
    let adjustedTargetIndex = targetInventoryIndex;
    const scrollCount = Number(newInventory[scrollIdx]?.count ?? 1);
    if (scrollCount <= 1) {
      newInventory.splice(scrollIdx, 1);
      if (adjustedTargetIndex != null && scrollIdx < adjustedTargetIndex) {
        adjustedTargetIndex -= 1;
      }
    } else {
      newInventory[scrollIdx] = { ...newInventory[scrollIdx], count: scrollCount - 1 };
    }

    // Apply enchant result
    if (targetIsEquipped && targetSlot) {
      newHeroJson.equipmentEnchantLevels = {
        ...(newHeroJson.equipmentEnchantLevels ?? {}),
        [targetSlot]: newEnchantLevel,
      };
    } else if (
      adjustedTargetIndex != null &&
      adjustedTargetIndex >= 0 &&
      adjustedTargetIndex < newInventory.length
    ) {
      newInventory[adjustedTargetIndex] = {
        ...newInventory[adjustedTargetIndex],
        enchantLevel: newEnchantLevel,
      };
    }
    newHeroJson.inventory = newInventory;

    const oldRevision = Number(heroJson.heroRevision ?? 0);
    const versionedHeroJson = addVersioning(newHeroJson, oldRevision);

    await prisma.character.update({
      where: { id },
      data: { heroJson: versionedHeroJson as any, lastActivityAt: new Date() },
    });

    enqueuePlayerActivityLog({
      accountId: auth.accountId,
      characterId: id,
      characterName: String((character.heroJson as any)?.name ?? character.name ?? ""),
      action: "enchant",
      metadata: {
        scrollId,
        slot: body.slot ?? null,
        inventoryItemIndex: body.inventoryItemIndex ?? null,
        success,
        newEnchantLevel,
        targetIsEquipped,
      },
      clientIp: getClientIp(req),
    });

    return reply.send({ ok: true, success, newEnchantLevel, heroJson: versionedHeroJson });
  });

  // POST /characters/:id/use-buff-scroll — atomic buff scroll application (no client race)
  app.post("/characters/:id/use-buff-scroll", async (req, reply) => {
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });

    const id = (req.params as any).id;
    const body = req.body as { itemId?: string };
    const itemId = String(body.itemId ?? "").trim();
    if (!itemId) return reply.code(400).send({ error: "itemId required" });

    const { GM_BLESS_SCROLL_EFFECTS, GM_BLESS_SCROLL_DURATION_MS } = await import("../../../data/gmBlessScrollBuffs");
    const buffDef = GM_BLESS_SCROLL_EFFECTS[itemId];
    if (!buffDef) return reply.code(400).send({ error: "unknown buff scroll" });

    const character = await prisma.character.findFirst({
      where: { id, accountId: auth.accountId },
    });
    if (!character) return reply.code(404).send({ error: "character not found" });

    const heroJson: any = (character.heroJson as any) || {};
    const inventory: any[] = Array.isArray(heroJson.inventory) ? heroJson.inventory : [];

    // Знаходимо скрол в інвентарі (нормалізуємо shop_ префікс)
    const normalizeId = (s: string) => String(s ?? "").replace(/^shop_/i, "").toLowerCase();
    const scrollIdx = inventory.findIndex(
      (i: any) => i && normalizeId(String(i.id ?? "")) === normalizeId(itemId) && (i.count ?? 1) > 0
    );
    if (scrollIdx < 0) return reply.code(400).send({ error: "scroll not found in inventory" });

    // Знімаємо 1 скрол
    const scrollRow = inventory[scrollIdx];
    const newCount = (scrollRow.count ?? 1) - 1;
    if (newCount > 0) {
      inventory[scrollIdx] = { ...scrollRow, count: newCount };
    } else {
      inventory.splice(scrollIdx, 1);
    }

    // Будуємо баф
    const now = Date.now();
    const { GM_BLESS_SCROLL_ICON } = await import("../../../data/gmBlessScrollBuffs");
    const newBuff = {
      id: buffDef.buffId,
      name: buffDef.buffName,
      source: "gm_bless_scroll",
      buffGroup: "GM_BLESS_SCROLL",
      icon: buffDef.icon ?? GM_BLESS_SCROLL_ICON,
      effects: buffDef.effects.map((e: any) => ({ ...e })),
      expiresAt: now + GM_BLESS_SCROLL_DURATION_MS,
      startedAt: now,
      durationMs: GM_BLESS_SCROLL_DURATION_MS,
    };

    // Мерджимо бафи: видаляємо дублікат по id, додаємо новий (оновлює тривалість)
    const existingBuffs: any[] = Array.isArray(heroJson.heroBuffs) ? heroJson.heroBuffs : [];
    const filtered = existingBuffs.filter(
      (b: any) => !(typeof b?.id === "number" && b.id === newBuff.id)
    );
    const heroBuffs = [newBuff, ...filtered];

    const updatedHeroJson = { ...heroJson, inventory, heroBuffs };
    const versionedHeroJson = addVersioning(updatedHeroJson);

    await prisma.character.update({
      where: { id },
      data: { heroJson: versionedHeroJson as any, lastActivityAt: new Date() },
    });

    enqueuePlayerActivityLog({
      accountId: auth.accountId,
      characterId: id,
      characterName: String(heroJson.name ?? character.name ?? ""),
      action: "use_buff_scroll",
      metadata: { itemId, buffName: buffDef.buffName },
      clientIp: getClientIp(req),
    });

    return reply.send({ ok: true, heroJson: versionedHeroJson });
  });

  // POST /characters/:id/battle-finish — server-authoritative drop calc + battle result save
  app.post("/characters/:id/battle-finish", async (req, reply) => {
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });

    const id = (req.params as any).id;
    const body = req.body as {
      mobId?: string;
      /** true = hero used Sweep/Auto Spoil before this kill */
      spoiled?: boolean;
      /** Zone where the mob was killed — used for server-side drop table lookup */
      zoneId?: string;
      earnedExp?: number;
      earnedSp?: number;
      earnedAdena?: number;
      newLevel?: number;
      newExp?: number;
      newSp?: number;
      newAdena?: number;
      newHp?: number;
      newMp?: number;
      newCp?: number;
      /** Quest item drops (still computed client-side, added to inventory here) */
      questDrops?: Array<{ id: string; count: number; name?: string; kind?: string; slot?: string; icon?: string }>;
      heroJsonPatch?: Record<string, any>;
    };

    // Sanity limits
    const MAX_EXP_PER_KILL = 5_000_000;
    const MAX_ADENA_PER_KILL = 500_000;
    const MAX_SP_PER_KILL = 50_000;
    const earnedExp = Math.max(0, Math.min(MAX_EXP_PER_KILL, Number(body.earnedExp ?? 0)));
    const earnedAdena = Math.max(0, Math.min(MAX_ADENA_PER_KILL, Number(body.earnedAdena ?? 0)));
    const earnedSp = Math.max(0, Math.min(MAX_SP_PER_KILL, Number(body.earnedSp ?? 0)));

    const character = await prisma.character.findFirst({
      where: { id, accountId: auth.accountId },
    });
    if (!character) return reply.code(404).send({ error: "character not found" });

    const heroJson: any = (character.heroJson as any) || {};

    // ── Server-side drop calculation ───────────────────────────────────────
    const mobId = String(body.mobId ?? "");
    const zoneId = body.zoneId ? String(body.zoneId) : undefined;

    let serverDropResult: {
      items: any[];
      adena: number;
      messages: string[];
      questProgressUpdates: Array<{ questId: string; itemId: string; count: number }>;
      zaricheEquip?: any;
    } = {
      items: [],
      adena: 0,
      messages: [],
      questProgressUpdates: [],
      zaricheEquip: undefined,
    };
    if (mobId) {
      try {
        serverDropResult = calculateServerDrops(
          mobId,
          zoneId,
          body.spoiled === true,
          {
            level: Number(heroJson.level ?? 1),
            premiumUntil: Number(heroJson.premiumUntil ?? 0),
            profession: String(heroJson.klass ?? heroJson.profession ?? ""),
            inventorySize: Array.isArray(heroJson.inventory) ? heroJson.inventory.length : 0,
            activeQuests: Array.isArray(heroJson.activeQuests) ? heroJson.activeQuests : [],
            inventory: Array.isArray(heroJson.inventory) ? heroJson.inventory : [],
            equipment: (heroJson.equipment as Record<string, string | null>) ?? {},
            equipmentEnchantLevels: (heroJson.equipmentEnchantLevels as Record<string, number>) ?? {},
          }
        );
      } catch {
        // Drop calculation failure is non-fatal; continue without drops
      }
    }

    // ── Build updated heroJson ─────────────────────────────────────────────
    const newHeroJson: any = { ...heroJson };

    // Apply level/exp/sp (client calculated; server trusts with limits)
    if (body.newLevel != null) newHeroJson.level = Number(body.newLevel);
    if (body.newExp != null) newHeroJson.exp = Number(body.newExp);
    if (body.newSp != null) newHeroJson.sp = Number(body.newSp);
    if (body.newHp != null) newHeroJson.hp = Number(body.newHp);
    if (body.newMp != null) newHeroJson.mp = Number(body.newMp);
    if (body.newCp != null) newHeroJson.cp = Number(body.newCp);

    // Adena: current DB adena + client earnedAdena (validated by cap)
    newHeroJson.adena = Number(heroJson.adena ?? 0) + earnedAdena;

    // Patch allowed non-critical fields (quest progress, kill counters, etc.)
    if (body.heroJsonPatch) {
      for (const [key, value] of Object.entries(body.heroJsonPatch)) {
        if (
          key !== "equipment" &&
          key !== "equipmentEnchantLevels" &&
          key !== "skills" &&
          key !== "inventory" &&
          key !== "overflowChest"
        ) {
          newHeroJson[key] = value;
        }
      }
    }

    // ── Apply zariche auto-equip ───────────────────────────────────────────
    if (serverDropResult.zaricheEquip) {
      const ze = serverDropResult.zaricheEquip;
      newHeroJson.equipment = ze.equipment;
      newHeroJson.equipmentEnchantLevels = ze.equipmentEnchantLevels;
      newHeroJson.zaricheEquippedUntil = ze.zaricheEquippedUntil;
    }

    // ── Apply server-calculated quest progress updates ────────────────────
    if (serverDropResult.questProgressUpdates.length > 0) {
      const baseActiveQuests: any[] = Array.isArray(newHeroJson.activeQuests)
        ? newHeroJson.activeQuests
        : [];
      const updatedActiveQuests = baseActiveQuests.map((aq: any) => {
        const updates = serverDropResult.questProgressUpdates.filter(
          (u) => u.questId === aq.questId
        );
        if (updates.length === 0) return aq;
        const newProgress = { ...(aq.progress ?? {}) };
        for (const u of updates) {
          newProgress[u.itemId] = (newProgress[u.itemId] ?? 0) + u.count;
        }
        return { ...aq, progress: newProgress };
      });
      newHeroJson.activeQuests = updatedActiveQuests;
    }

    // ── Add server drops to inventory ─────────────────────────────────────
    const inventory: any[] = Array.isArray(heroJson.inventory) ? [...heroJson.inventory] : [];
    const overflowChest: any[] = Array.isArray(heroJson.overflowChest)
      ? [...heroJson.overflowChest]
      : [];
    const MAX_INVENTORY = 200;

    // If zariche dropped, returned old weapon goes to inventory first
    const zaricheReturnedWeapon = serverDropResult.zaricheEquip?.returnedWeapon;
    const allDropsToAdd: any[] = [
      ...(zaricheReturnedWeapon ? [zaricheReturnedWeapon] : []),
      ...serverDropResult.items.filter((i: any) => i.id !== "zariche"), // zariche handled via equip
      ...(Array.isArray(body.questDrops) ? body.questDrops : []),       // legacy client fallback
    ];

    function addDropToInventory(drop: any): void {
      if (!drop.id) return;
      const itemId = String(drop.id).trim();
      const count = Math.max(1, Math.floor(Number(drop.count ?? 1)));
      if (!itemId) return;

      // Equipment pieces (weapons, armor, jewelry) are never stackable — each is its own row.
      // Everything else (resources, consumables, quest items, unknown) stacks by default.
      const EQUIP_KINDS = new Set(["equipment", "weapon", "armor", "helmet", "boots", "gloves", "shield", "necklace", "ring", "earring", "jewelry", "belt", "cloak"]);
      const EQUIP_SLOTS = new Set(["weapon", "armor", "helmet", "boots", "gloves", "shield", "necklace", "ring", "earring", "jewelry", "belt", "cloak"]);
      const dropKind = String(drop.kind ?? "").toLowerCase();
      const dropSlot = String(drop.slot ?? "").toLowerCase();
      const isStackable = !EQUIP_KINDS.has(dropKind) && !EQUIP_SLOTS.has(dropSlot);

      const existingIdx = isStackable
        ? inventory.findIndex((i: any) => i && i.id === itemId && !(i?.meta?.hasLSPassive))
        : -1;

      if (existingIdx >= 0) {
        inventory[existingIdx] = {
          ...inventory[existingIdx],
          count: (inventory[existingIdx].count ?? 0) + count,
        };
      } else if (inventory.length < MAX_INVENTORY) {
        inventory.push({ ...drop, id: itemId, count });
      } else {
        const ovIdx = overflowChest.findIndex((i: any) => i && i.id === itemId);
        if (ovIdx >= 0) {
          overflowChest[ovIdx] = {
            ...overflowChest[ovIdx],
            count: (overflowChest[ovIdx].count ?? 0) + count,
          };
        } else {
          overflowChest.push({ ...drop, id: itemId, count });
        }
      }
    }

    for (const drop of allDropsToAdd) {
      addDropToInventory(drop);
    }

    // Дедублікація: злиття фрагментованих стакових записів (кілька рядків з однаковим id та count=1)
    // що виникли до введення стакування. Виконується після кожного battle-finish.
    function deduplicateStackableInventory(inv: any[]): any[] {
      // "equipment" — загальний kind з drop-таблиць; має бути тут поряд з конкретними слотами
      const EQUIP_K = new Set(["equipment","weapon","armor","helmet","boots","gloves","shield","necklace","ring","earring","jewelry","belt","cloak","lhand","rhand","lrhand"]);
      const result: any[] = [];
      const seenIdx = new Map<string, number>(); // id -> index in result
      for (const item of inv) {
        if (!item?.id) { result.push(item); continue; }
        const id = String(item.id).trim();
        const kind = String(item.kind ?? "").toLowerCase();
        const slot = String(item.slot ?? "").toLowerCase();
        const stackable = !(item?.meta?.hasLSPassive) && !EQUIP_K.has(kind) && !EQUIP_K.has(slot);
        if (!stackable) { result.push(item); continue; }
        const existing = seenIdx.get(id);
        if (existing !== undefined) {
          result[existing] = { ...result[existing], count: (result[existing].count ?? 1) + (item.count ?? 1) };
        } else {
          seenIdx.set(id, result.length);
          result.push({ ...item });
        }
      }
      return result;
    }

    // Видаляємо з інвентаря ВСІ копії предметів, що ВЖЕ одягнені (щоб не виникали дублікати екіпу в сумці)
    // Примітка: "equipment" — загальний kind від drop-таблиць; включаємо у перевірку разом з конкретними слотами.
    const equippedIds = new Set<string>();
    const equip = newHeroJson.equipment as Record<string, string | null> | undefined;
    if (equip) {
      Object.values(equip).forEach((v) => { if (v) equippedIds.add(String(v).replace(/^shop_/i, "").toLowerCase()); });
    }
    const EQUIP_KINDS_FILTER = new Set(["equipment","weapon","armor","helmet","boots","gloves","shield","necklace","ring","earring","jewelry","belt","cloak"]);
    const filteredInv: any[] = [];
    for (const item of inventory) {
      if (!item?.id) { filteredInv.push(item); continue; }
      const baseId = String(item.id).replace(/^shop_/i, "").toLowerCase();
      const kind = String(item.kind ?? "").toLowerCase();
      const slot = String(item.slot ?? "").toLowerCase();
      const isEquipKind = EQUIP_KINDS_FILTER.has(kind) || EQUIP_KINDS_FILTER.has(slot);
      const isEquipped = equippedIds.has(baseId);
      const isLSPassive = !!(item?.meta?.hasLSPassive);
      // Видаляємо ВСІ копії одягненого предмета (не тільки першу) без LS-пасиву
      if (isEquipped && isEquipKind && !isLSPassive) {
        continue; // пропускаємо — видаляємо дублікат
      }
      filteredInv.push(item);
    }

    newHeroJson.inventory = deduplicateStackableInventory(filteredInv);
    newHeroJson.overflowChest = deduplicateStackableInventory(overflowChest);

    const oldRevision = Number(heroJson.heroRevision ?? 0);
    const versionedHeroJson = addVersioning(newHeroJson, oldRevision);

    const updateData: any = {
      heroJson: versionedHeroJson as any,
      lastActivityAt: new Date(),
    };
    updateData.adena = BigInt(Math.max(0, Math.floor(Number(newHeroJson.adena))));

    await prisma.character.update({ where: { id }, data: updateData });

    enqueuePlayerActivityLog({
      accountId: auth.accountId,
      characterId: id,
      characterName: String((character.heroJson as any)?.name ?? character.name ?? ""),
      action: "battle.finish",
      metadata: {
        mobId: mobId || null,
        earnedExp,
        earnedSp,
        earnedAdena,
        newLevel: body.newLevel ?? null,
        serverDrops: serverDropResult.items.length,
        serverDropAdena: serverDropResult.adena,
        questDrops: serverDropResult.questProgressUpdates.length,
        zaricheEquipped: !!serverDropResult.zaricheEquip,
      },
      clientIp: getClientIp(req),
    });

    return reply.send({
      ok: true,
      heroJson: versionedHeroJson,
      serverDrops: {
        items: serverDropResult.items,
        adena: serverDropResult.adena,
        messages: serverDropResult.messages,
        questProgressUpdates: serverDropResult.questProgressUpdates,
        zaricheEquipped: !!serverDropResult.zaricheEquip,
        zaricheEquippedUntil: serverDropResult.zaricheEquip?.zaricheEquippedUntil,
      },
    });
  });

  // POST /characters/:id/equip-commit — atomic equip state save (Phase 2)
  // Client calculates new equip state, server saves it atomically
  app.post("/characters/:id/equip-commit", async (req, reply) => {
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });

    const id = (req.params as any).id;
    const body = req.body as {
      equipment?: Record<string, any>;
      inventory?: any[];
      equipmentEnchantLevels?: Record<string, number>;
    };

    if (!body.equipment || !body.inventory) {
      return reply.code(400).send({ error: "equipment and inventory required" });
    }

    const character = await prisma.character.findFirst({
      where: { id, accountId: auth.accountId },
    });
    if (!character) return reply.code(404).send({ error: "character not found" });

    const heroJson: any = (character.heroJson as any) || {};

    // Серверна очистка: видалити з inventory ВСІ рядки, id яких є в equipment
    // (щоб не залишилося "тіней" від shop_ prefix розбіжностей або race conditions)
    const normEquipId = (s: any) => String(s ?? "").replace(/^shop_/i, "").toLowerCase();
    const equippedNormIds = new Set(
      Object.values(body.equipment ?? {})
        .filter(Boolean)
        .map((v: any) => normEquipId(String(v)))
    );
    const cleanedInventory = (body.inventory ?? []).filter((item: any) => {
      if (!item?.id) return true;
      const normId = normEquipId(String(item.id));
      // Якщо item є в одягненому equipment — прибрати з інвентаря
      return !equippedNormIds.has(normId);
    });

    const newHeroJson: any = {
      ...heroJson,
      equipment: body.equipment,
      inventory: cleanedInventory,
      equipmentEnchantLevels: body.equipmentEnchantLevels ?? heroJson.equipmentEnchantLevels ?? {},
    };

    const oldRevision = Number(heroJson.heroRevision ?? 0);
    const versionedHeroJson = addVersioning(newHeroJson, oldRevision);

    await prisma.character.update({
      where: { id },
      data: { heroJson: versionedHeroJson as any, lastActivityAt: new Date() },
    });

    // Count equipped slots for logging
    const equippedSlots = Object.entries(body.equipment ?? {})
      .filter(([, v]) => !!v)
      .map(([k]) => k);
    enqueuePlayerActivityLog({
      accountId: auth.accountId,
      characterId: id,
      characterName: String((character.heroJson as any)?.name ?? character.name ?? ""),
      action: "equip.commit",
      metadata: {
        equippedSlots,
        inventoryLen: Array.isArray(body.inventory) ? body.inventory.length : 0,
      },
      clientIp: getClientIp(req),
    });

    return reply.send({ ok: true, heroJson: versionedHeroJson });
  });

  // POST /characters/:id/shop/buy — server-side GM shop purchase (Phase 3)
  app.post("/characters/:id/shop/buy", async (req, reply) => {
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });

    const id = (req.params as any).id;
    const body = req.body as {
      itemId?: string;
      quantity?: number;
      currency?: string;
      unitPrice?: number;
      itemMeta?: Record<string, any>;
    };

    const itemId = String(body.itemId ?? "").trim();
    const quantity = Math.max(1, Math.floor(Number(body.quantity ?? 1)));

    if (!itemId) return reply.code(400).send({ error: "itemId required" });

    // Validate against server-side catalog for price authority
    const { getGmShopItemPrice } = await import("../../../data/gmShopCatalog");
    const catalogEntry = getGmShopItemPrice(itemId);
    if (!catalogEntry) {
      return reply.code(400).send({ error: "item not available in shop" });
    }
    const unitPrice = catalogEntry.unitPrice;
    const currency = catalogEntry.currency;
    const totalPrice = unitPrice * quantity;

    const character = await prisma.character.findFirst({
      where: { id, accountId: auth.accountId },
    });
    if (!character) return reply.code(404).send({ error: "character not found" });

    const heroJson: any = (character.heroJson as any) || {};
    const inventory: any[] = Array.isArray(heroJson.inventory) ? [...heroJson.inventory] : [];

    let newAdena = Number((character as any).adena ?? 0);

    if (currency === "adena") {
      if (newAdena < totalPrice) {
        return reply.code(400).send({ error: "insufficient adena" });
      }
      newAdena -= totalPrice;
    } else if (currency === "ancient_adena" || currency === "aa") {
      const aaIdx = inventory.findIndex((i: any) => i && i.id === "ancient_adena");
      const aaCount = Number(inventory[aaIdx]?.count ?? 0);
      if (aaCount < totalPrice) {
        return reply.code(400).send({ error: "insufficient ancient adena" });
      }
      if (aaCount - totalPrice <= 0) {
        inventory.splice(aaIdx, 1);
      } else {
        inventory[aaIdx] = { ...inventory[aaIdx], count: aaCount - totalPrice };
      }
    } else if (currency === "coins_silver") {
      const silverCount = Number((character as any).coinsSilver ?? 0);
      if (silverCount < totalPrice) {
        return reply.code(400).send({ error: "insufficient silver coins" });
      }
    }

    // Add item to inventory using client-provided metadata for item display fields
    const itemMeta = body.itemMeta as Record<string, any> | undefined;
    // Normalize shop_ prefix when finding existing stack (client may store with or without prefix)
    const normalizeId = (id: string) => String(id ?? "").replace(/^shop_/i, "").toLowerCase();
    const normalizedItemId = normalizeId(itemId);
    const existingIdx = inventory.findIndex(
      (i: any) => i && normalizeId(String(i.id ?? "")) === normalizedItemId
    );
    if (existingIdx >= 0) {
      inventory[existingIdx] = {
        ...inventory[existingIdx],
        count: (inventory[existingIdx].count ?? 0) + quantity,
      };
    } else {
      inventory.push({
        id: itemId,
        count: quantity,
        ...(itemMeta || {}),
      });
    }

    const newHeroJson: any = { ...heroJson, inventory };
    const oldRevision = Number(heroJson.heroRevision ?? 0);
    const versionedHeroJson = addVersioning(newHeroJson, oldRevision);

    const updateData: any = {
      heroJson: versionedHeroJson as any,
      lastActivityAt: new Date(),
    };
    if (currency === "adena") {
      updateData.adena = BigInt(Math.floor(newAdena));
    }
    if (currency === "coins_silver") {
      const silverCount = Number((character as any).coinsSilver ?? 0);
      updateData.coinsSilver = Math.max(0, silverCount - totalPrice);
    }

    await prisma.character.update({ where: { id }, data: updateData });

    enqueuePlayerActivityLog({
      accountId: auth.accountId,
      characterId: id,
      characterName: String((character.heroJson as any)?.name ?? character.name ?? ""),
      action: "shop.buy",
      metadata: {
        itemId,
        quantity,
        currency,
        unitPrice,
        totalPrice,
      },
      clientIp: getClientIp(req),
    });

    const updatedChar = await prisma.character.findFirst({ where: { id } });
    return reply.send({
      ok: true,
      heroJson: versionedHeroJson,
      adena: Number((updatedChar as any)?.adena ?? newAdena),
      coinsSilver: Number((updatedChar as any)?.coinsSilver ?? 0),
    });
  });

  // POST /characters/:id/pickup-item — server-side atomic inventory add
  // Used for: battle drops, quest rewards, mail attachments, any atomic item grant.
  app.post("/characters/:id/pickup-item", async (req, reply) => {
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });

    const id = (req.params as any).id;
    const body = req.body as {
      /** Items to add to inventory */
      items: Array<{
        id: string;
        count?: number;
        name?: string;
        kind?: string;
        slot?: string;
        icon?: string;
        grade?: string;
        enchantLevel?: number;
        [key: string]: any;
      }>;
      /** Optional: source for logging (battle, quest, mail, etc.) */
      source?: string;
    };

    if (!Array.isArray(body.items) || body.items.length === 0) {
      return reply.code(400).send({ error: "items array required" });
    }
    // Sanity: max 50 items per request
    if (body.items.length > 50) {
      return reply.code(400).send({ error: "too many items (max 50)" });
    }

    const character = await prisma.character.findFirst({
      where: { id, accountId: auth.accountId },
    });
    if (!character) return reply.code(404).send({ error: "character not found" });

    const heroJson: any = (character.heroJson as any) || {};
    const inventory: any[] = Array.isArray(heroJson.inventory) ? [...heroJson.inventory] : [];
    const MAX_INVENTORY = 200;

    const addedItems: string[] = [];
    const overflowItems: any[] = Array.isArray(heroJson.overflowChest)
      ? [...heroJson.overflowChest]
      : [];

    for (const item of body.items) {
      if (!item.id) continue;
      const itemId = String(item.id).trim();
      const count = Math.max(1, Math.floor(Number(item.count ?? 1)));
      if (!itemId) continue;

      // Equipment pieces are never stackable — everything else stacks by default.
      const EQUIP_KINDS_PU = new Set(["weapon","armor","helmet","boots","gloves","shield","necklace","ring","earring","jewelry","belt","cloak"]);
      const isStackable =
        !(item as any).meta?.hasLSPassive &&
        !EQUIP_KINDS_PU.has(String(item.kind ?? "").toLowerCase()) &&
        !EQUIP_KINDS_PU.has(String(item.slot ?? "").toLowerCase());

      // Нормалізуємо shop_ prefix для findIndex (щоб shop_xxx та xxx знаходили один стак)
      const normPickupId = (s: string) => String(s ?? "").replace(/^shop_/i, "").toLowerCase();
      const existingIdx = isStackable
        ? inventory.findIndex((i: any) => i && normPickupId(String(i.id ?? "")) === normPickupId(itemId) && !(i?.meta?.hasLSPassive))
        : -1;

      if (existingIdx >= 0 && isStackable) {
        inventory[existingIdx] = {
          ...inventory[existingIdx],
          count: (inventory[existingIdx].count ?? 0) + count,
        };
        addedItems.push(itemId);
      } else if (inventory.length < MAX_INVENTORY) {
        inventory.push({ ...item, id: itemId, count });
        addedItems.push(itemId);
      } else {
        // Inventory full → overflow
        const ovIdx = overflowItems.findIndex((i: any) => i && normPickupId(String(i.id ?? "")) === normPickupId(itemId));
        if (ovIdx >= 0) {
          overflowItems[ovIdx] = {
            ...overflowItems[ovIdx],
            count: (overflowItems[ovIdx].count ?? 0) + count,
          };
        } else {
          overflowItems.push({ ...item, id: itemId, count });
        }
      }
    }

    const newHeroJson: any = { ...heroJson, inventory, overflowChest: overflowItems };
    const oldRevision = Number(heroJson.heroRevision ?? 0);
    const versionedHeroJson = addVersioning(newHeroJson, oldRevision);

    await prisma.character.update({
      where: { id },
      data: { heroJson: versionedHeroJson as any, lastActivityAt: new Date() },
    });

    enqueuePlayerActivityLog({
      accountId: auth.accountId,
      characterId: id,
      characterName: String((character.heroJson as any)?.name ?? character.name ?? ""),
      action: `pickup.${body.source ?? "unknown"}`,
      metadata: {
        itemCount: body.items.length,
        addedItems: addedItems.slice(0, 20),
        overflowCount: overflowItems.length - (Array.isArray(heroJson.overflowChest) ? heroJson.overflowChest.length : 0),
      },
      clientIp: getClientIp(req),
    });

    return reply.send({ ok: true, heroJson: versionedHeroJson });
  });
}