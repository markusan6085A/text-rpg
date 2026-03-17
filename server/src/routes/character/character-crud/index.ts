import type { FastifyInstance } from "fastify";
import { prisma } from "../../../db";
import { getAuth } from "../auth";
import { addNews } from "../../../news";
import { validateHeroJson, addVersioning, checkRevision } from "../../../heroJsonValidator";
import { safeJsonStringify } from "../../../utils/sanitizeBigInt";
import { rateLimiters, rateLimitMiddleware } from "../../../rateLimiter";

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
    const newHeroJson = {
      ...baseJson,
      ...oldHeroJson,
      ...(inventory !== undefined ? { inventory } : {}),
      ...(overflowChest !== undefined ? { overflowChest } : {}),
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

      app.log.info({ accountId: auth.accountId, characterId: id, invLen: inventory?.length ?? 0 }, "[PUT /characters/:id/inventory] Inventory updated");
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
    const newHeroJson = { ...baseJson, ...oldHeroJson, inventory: [] };
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
        }, `[PUT /characters/:id] Attempted to decrease coinLuck from ${existing.coinLuck || 0} to ${body.coinLuck} (allowing for enchant)`);
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
        const clientPremiumUntil = body.heroJson.premiumUntil != null ? Number(body.heroJson.premiumUntil) : oldPremiumUntil;
        const clampedPremiumUntil = Math.min(clientPremiumUntil, oldPremiumUntil);
        const heroJsonToSave = { ...body.heroJson, premiumUntil: clampedPremiumUntil };
        
        const oldRevision = oldHeroJson.heroRevision || 0;
        const versionedHeroJson = addVersioning(heroJsonToSave, oldRevision);
        updateData.heroJson = versionedHeroJson;
        app.log.info({
          accountId: auth.accountId,
          characterId: id,
          oldRevision,
          newRevision: versionedHeroJson.heroRevision,
          inventoryItems: body.heroJson.inventory?.length || 0,
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

    return { ok: true, character: serialized };
  });
}