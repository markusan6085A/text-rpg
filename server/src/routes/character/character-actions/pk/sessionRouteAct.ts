import type { FastifyInstance } from "fastify";
import { prisma } from "../../../../db";
import { getAuth } from "../../auth";
import { addVersioning } from "../../../../heroJsonValidator";
import type { PkFighter, PkSession, PkSkill } from "./types";
import { isArenaLikeSession, isTvtSession } from "./types";
import { pkSessions, cleanupPkSessions, savePkSessionToDb, loadPkSessionFromDb } from "./store";
import {
  ensurePkFighterElementalFields,
  getLocation,
  isOnline,
  serializePkSession,
  refreshPkFighterStatsFromDb,
  computeDamage,
  formatPkAttackSkillFailureMessage,
  resolvePkAttackSkillCooldownMs,
} from "./helpers";
import { syncPkRealtimeState, syncArenaHpOnly } from "./sync";
import { savePkResultIfNeeded } from "./results";
import { abortTvtMatchOnFlee } from "../tvt/engine";

export function registerPkSessionActRoute(app: FastifyInstance): void {
  app.post("/characters/pk/session/:id/act", async (req, reply) => {
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });
    await cleanupPkSessions();

    const sessionId = String((req.params as any)?.id ?? "").trim();
    const body = (req.body ?? {}) as {
      skillId?: number;
      isBuff?: boolean;
      isToggle?: boolean;
      isDebuff?: boolean;
      name?: string;
      target?: string;
      shotMultiplier?: number;
      shotName?: string;
      buffEffects?: Array<{ stat: string; mode: string; value?: number; multiplier?: number }>;
      debuffEffects?: Array<{ stat: string; mode: string; value?: number; multiplier?: number }>;
      buffCooldownMs?: number;
      buffDurationSec?: number;
      /** Базовий КД скіла (сек), з skillDef.cooldown — для фіз. скілів перераховується через attackSpeed */
      skillBaseCooldownSec?: number;
      /** Чи скіл magic_attack (інше ніж prefersMagic у сесії) */
      isMagicAttack?: boolean;
      /** Стихія magic_attack (узгоджено з client skillDef.element) */
      skillElement?: string;
    };
    const skillId = body.skillId !== undefined ? Number(body.skillId) : undefined;
    const isBuff = body.isBuff;
    const isToggle = body.isToggle;
    const skillName = body.name;
    const shotMultiplier = typeof body.shotMultiplier === "number" ? body.shotMultiplier : 1.0;
    const shotName = body.shotName;
    const buffEffects = Array.isArray(body.buffEffects) ? body.buffEffects : [];
    const buffCooldownMs = typeof body.buffCooldownMs === "number" ? body.buffCooldownMs : undefined;
    const buffDurationSec = typeof body.buffDurationSec === "number" && body.buffDurationSec > 0 ? body.buffDurationSec : 120;
    const skillBaseCooldownSec =
      typeof body.skillBaseCooldownSec === "number" && Number.isFinite(body.skillBaseCooldownSec) && body.skillBaseCooldownSec > 0
        ? body.skillBaseCooldownSec
        : undefined;
    const isMagicAttackOpt = typeof body.isMagicAttack === "boolean" ? body.isMagicAttack : undefined;
    const isDebuff = body.isDebuff === true;
    const debuffEffects = Array.isArray(body.debuffEffects) ? body.debuffEffects : [];
    const skillElementRaw =
      typeof body.skillElement === "string" && body.skillElement.trim()
        ? body.skillElement.trim()
        : undefined;

    let session = pkSessions.get(sessionId);
    if (!session) {
      session = await loadPkSessionFromDb(sessionId);
      if (session) pkSessions.set(sessionId, session);
    }
    if (!session) return reply.code(404).send({ error: "pk session not found" });
    ensurePkFighterElementalFields(session.attacker);
    ensurePkFighterElementalFields(session.defender);

    const me = await prisma.character.findFirst({
      where: {
        accountId: auth.accountId,
        id: { in: [session.attackerId, session.defenderId] as any },
      },
      select: { id: true },
    });
    if (!me) return reply.code(403).send({ error: "forbidden" });
    if (session.ended) {
      await refreshPkFighterStatsFromDb(session);
      return reply.send(serializePkSession(session));
    }

    const now = Date.now();
    const actorRole: "attacker" | "defender" = me.id === session.attackerId ? "attacker" : "defender";

    const charsLive = await prisma.character.findMany({
      where: { id: { in: [session.attackerId, session.defenderId] } },
      select: { id: true, name: true, heroJson: true, lastActivityAt: true, updatedAt: true },
    });
    const liveAttacker = charsLive.find((c) => c.id === session.attackerId);
    const liveDefender = charsLive.find((c) => c.id === session.defenderId);
    const patchPkAttackSpeed = (fighter: PkFighter, heroJson: any) => {
      const bs = heroJson?.battleStats || {};
      const sp = Math.max(0, Number(bs?.attackSpeed ?? bs?.atkSpeed ?? fighter.attackSpeed ?? 200) || 200);
      fighter.attackSpeed = sp;
    };
    if (liveAttacker?.heroJson) patchPkAttackSpeed(session.attacker, liveAttacker.heroJson as any);
    if (liveDefender?.heroJson) patchPkAttackSpeed(session.defender, liveDefender.heroJson as any);

    const baseLoc =
      String(session.startLocation ?? "").trim() ||
      getLocation(liveAttacker?.heroJson as any) ||
      getLocation(liveDefender?.heroJson as any);
    session.startLocation = baseLoc || session.startLocation;
    const attackerLocNow = getLocation(liveAttacker?.heroJson as any);
    const defenderLocNow = getLocation(liveDefender?.heroJson as any);
    const attackerOnline = isOnline(liveAttacker?.lastActivityAt as any, liveAttacker?.updatedAt as any);
    const defenderOnline = isOnline(liveDefender?.lastActivityAt as any, liveDefender?.updatedAt as any);
    const attackerEscaped = !!baseLoc && attackerLocNow !== baseLoc;
    const defenderEscaped = !!baseLoc && defenderLocNow !== baseLoc;
    const someoneEscaped = !attackerOnline || !defenderOnline || attackerEscaped || defenderEscaped;
    if (!isArenaLikeSession(session) && someoneEscaped) {
      const escapedChar = !defenderOnline || defenderEscaped ? liveDefender : liveAttacker;
      const escapedName = String(escapedChar?.name ?? "Игрок").trim() || "Игрок";
      session.ended = true;
      session.winnerId = undefined;
      session.escapedById = escapedChar?.id;
      session.escapedByName = escapedName;
      session.log.unshift(`${escapedName} сбежал!`);
      session.log = session.log.slice(0, 30);
      session.updatedAt = now;
      await prisma.$transaction(async (tx) => {
        const ids = [session.attackerId, session.defenderId].sort();
        await tx.$queryRawUnsafe(`SELECT id FROM "Character" WHERE id IN ($1, $2) FOR UPDATE`, ids[0], ids[1]);
        const chars = await tx.character.findMany({
          where: { id: { in: [session.attackerId, session.defenderId] } },
          select: { id: true, heroJson: true },
        });
        for (const c of chars) {
          const heroJson = ((c.heroJson as any) || {}) as any;
          const cleaned = addVersioning(
            {
              ...heroJson,
              pkIncoming: null,
              pkSyncUntil: 0,
            },
            Number(heroJson.heroRevision ?? 0) || 0
          );
          await tx.character.update({
            where: { id: c.id },
            data: { heroJson: cleaned, lastActivityAt: new Date() },
          });
        }
      });
      await savePkSessionToDb(session);
      if (isTvtSession(session)) {
        await abortTvtMatchOnFlee(session);
      }
      await refreshPkFighterStatsFromDb(session);
      return reply.send(serializePkSession(session));
    }

    const pickSkill = (fighter: PkFighter, cooldowns: Record<number, number>, requestedSkillId?: number): PkSkill | null => {
      if (requestedSkillId === undefined) return null;
      const requested = fighter.skills.find((s) => s.id === requestedSkillId);
      if (!requested) return null;
      if ((cooldowns[requested.id] ?? 0) > now) return null;
      if (fighter.mp < requested.mpCost) return null;
      return requested;
    };

    const ELEM_RES = new Set([
      "fireResist",
      "waterResist",
      "windResist",
      "earthResist",
      "holyResist",
      "darkResist",
    ]);

    const applyBuffEffects = (
      fighter: PkFighter,
      effects: Array<{ stat: string; mode: string; value?: number; multiplier?: number }>
    ) => {
      const statKeys = [
        "pAtk",
        "pDef",
        "mAtk",
        "mDef",
        "maxHp",
        "maxMp",
        "accuracy",
        "evasion",
        "crit",
        "mCrit",
        "critPower",
        "fireResist",
        "waterResist",
        "windResist",
        "earthResist",
        "holyResist",
        "darkResist",
        "fireAttack",
        "waterAttack",
        "windAttack",
        "earthAttack",
        "holyAttack",
        "darkAttack",
        "magicSkillPower",
        "physSkillPower",
      ];
      for (const e of effects) {
        const raw = String(e.stat || "").trim();
        const stat = raw === "critDamage" ? "critPower" : raw;
        if (!stat || !statKeys.includes(stat)) continue;
        const mode = String(e.mode || "flat").toLowerCase();
        const map: Record<string, number> = {
          pAtk: fighter.pAtk,
          pDef: fighter.pDef,
          mAtk: fighter.mAtk,
          mDef: fighter.mDef,
          maxHp: fighter.maxHp,
          maxMp: fighter.maxMp,
          accuracy: fighter.accuracy,
          evasion: fighter.evasion,
          crit: fighter.crit,
          mCrit: fighter.mCrit,
          critPower: fighter.critPower,
          fireResist: fighter.fireResist,
          waterResist: fighter.waterResist,
          windResist: fighter.windResist,
          earthResist: fighter.earthResist,
          holyResist: fighter.holyResist,
          darkResist: fighter.darkResist,
          fireAttack: fighter.fireAttack,
          waterAttack: fighter.waterAttack,
          windAttack: fighter.windAttack,
          earthAttack: fighter.earthAttack,
          holyAttack: fighter.holyAttack,
          darkAttack: fighter.darkAttack,
          magicSkillPower: fighter.magicSkillPower,
          physSkillPower: fighter.physSkillPower,
        };
        if (!(stat in map)) continue;
        let newVal = map[stat];
        if (mode === "percent" && typeof e.value === "number") {
          if (ELEM_RES.has(stat) && newVal === 0 && e.value < 0) {
            newVal = e.value;
          } else {
            newVal = Math.round(newVal * (1 + e.value / 100));
          }
        } else if (mode === "flat" && typeof e.value === "number") {
          if (ELEM_RES.has(stat)) {
            newVal = newVal + e.value;
          } else {
            newVal = Math.max(0, newVal + e.value);
          }
        } else if (mode === "multiplier" && (typeof e.multiplier === "number" || typeof e.value === "number")) {
          const m = typeof e.multiplier === "number" ? e.multiplier : 1 + (e.value ?? 0) / 100;
          if (ELEM_RES.has(stat) && newVal === 0 && m !== 1) {
            newVal = m < 1 ? 100 * (m - 1) : 0;
          } else {
            newVal = Math.round(newVal * m);
          }
        }
        (fighter as any)[stat] = newVal;
      }
      fighter.pDef = Math.max(1, Math.round(fighter.pDef));
      fighter.mDef = Math.max(1, Math.round(fighter.mDef));
    };

    const doTurn = (
      attacker: PkFighter,
      defender: PkFighter,
      cooldowns: Record<number, number>,
      requestedSkillId?: number,
      reqIsBuff?: boolean,
      reqIsToggle?: boolean,
      reqSkillName?: string,
      reqShotMultiplier: number = 1.0,
      reqShotName?: string,
      reqBuffEffects?: Array<{ stat: string; mode: string; value?: number; multiplier?: number }>,
      reqBuffCooldownMs?: number,
      reqSkillBaseCooldownSec?: number,
      reqIsMagicAttack?: boolean,
      reqIsDebuff?: boolean,
      reqDebuffEffects?: Array<{ stat: string; mode: string; value?: number; multiplier?: number }>,
      reqSkillElement?: string
    ): number => {
      const skill = pickSkill(attacker, cooldowns, requestedSkillId);

      if (
        requestedSkillId !== undefined &&
        !(reqIsBuff || reqIsToggle) &&
        !skill
      ) {
        session.log.unshift(
          formatPkAttackSkillFailureMessage(attacker, cooldowns, requestedSkillId, now, reqSkillName)
        );
        session.log = session.log.slice(0, 30);
        return 0;
      }

      if ((reqIsBuff || reqIsToggle) && !skill) {
        const sName = reqSkillName || `skill#${requestedSkillId ?? "?"}`;
        const requested = requestedSkillId != null ? attacker.skills.find((s) => s.id === requestedSkillId) : null;
        if (requested && attacker.mp < requested.mpCost) {
          session.log.unshift(`${attacker.name}: не хватает MP для ${sName} (нужно ${requested.mpCost}).`);
        } else {
          session.log.unshift(`${attacker.name}: не удалось использовать ${sName}.`);
        }
        session.log = session.log.slice(0, 30);
        return 0;
      }

      if (skill && (reqIsBuff || reqIsToggle)) {
        attacker.mp = Math.max(0, attacker.mp - skill.mpCost);
        const cdMs = typeof reqBuffCooldownMs === "number" && reqBuffCooldownMs >= 0 ? reqBuffCooldownMs : skill.cooldownMs;
        cooldowns[skill.id] = now + cdMs;
        if (Array.isArray(reqBuffEffects) && reqBuffEffects.length > 0) {
          applyBuffEffects(attacker, reqBuffEffects);
        }
        const sName = reqSkillName || skill.name || `skill#${skill.id}`;
        if (reqIsToggle) {
          session.log.unshift(`${attacker.name} использует переключаемое умение ${sName}`);
        } else {
          session.log.unshift(`${attacker.name} использует бафф ${sName}`);
        }
        session.log = session.log.slice(0, 30);
        return 0;
      }

      if (skill && reqIsDebuff) {
        if (!Array.isArray(reqDebuffEffects) || reqDebuffEffects.length === 0) {
          session.log.unshift(
            `${attacker.name}: дебафф без эффектов (${reqSkillName || skill.name || `skill#${skill.id}`}).`
          );
          session.log = session.log.slice(0, 30);
          return 0;
        }
        attacker.mp = Math.max(0, attacker.mp - skill.mpCost);
        const useMagicCd =
          typeof reqIsMagicAttack === "boolean" ? reqIsMagicAttack : true;
        const cdMs = resolvePkAttackSkillCooldownMs(
          attacker,
          skill,
          useMagicCd,
          reqSkillBaseCooldownSec
        );
        cooldowns[skill.id] = now + cdMs;
        applyBuffEffects(defender, reqDebuffEffects);
        const sName = reqSkillName || skill.name || `skill#${skill.id}`;
        session.log.unshift(`${attacker.name}: дебафф ${sName} на ${defender.name}`);
        session.log = session.log.slice(0, 30);
        return 0;
      }

      const useMagic = skill
        ? typeof reqIsMagicAttack === "boolean"
          ? reqIsMagicAttack
          : attacker.prefersMagic
        : false;
      const powerBonus = skill?.powerBonus ?? 0;
      const { dmg, isCrit, isMiss } = computeDamage(
        attacker,
        defender,
        powerBonus,
        useMagic,
        reqShotMultiplier,
        reqSkillElement
      );
      defender.hp = Math.max(0, defender.hp - dmg);

      const critText = isCrit ? " (критический удар!)" : "";
      const shotText = reqShotName ? ` Используя ${reqShotName},` : "";

      if (isMiss) {
        session.log.unshift(`${attacker.name} промахивается по ${defender.name}!`);
      } else if (skill) {
        attacker.mp = Math.max(0, attacker.mp - skill.mpCost);
        const cdMs = resolvePkAttackSkillCooldownMs(attacker, skill, useMagic, reqSkillBaseCooldownSec);
        cooldowns[skill.id] = now + cdMs;
        const sName = reqSkillName || skill.name || `skill#${skill.id}`;
        session.log.unshift(`${attacker.name} использует ${sName}.${shotText} Наносит ${dmg} урона${critText}`);
      } else {
        session.log.unshift(`${attacker.name} атакует (простая атака).${shotText} Наносит ${dmg} урона${critText}`);
      }
      session.log = session.log.slice(0, 30);
      return dmg;
    };

    if (session.attackerHasHit === undefined) session.attackerHasHit = false;
    if (session.defenderHasHit === undefined) session.defenderHasHit = false;
    let appliedBuffTurn = false;
    if (actorRole === "attacker") {
      const dmg = doTurn(
        session.attacker,
        session.defender,
        session.attackerCooldowns,
        skillId,
        isBuff,
        isToggle,
        skillName,
        shotMultiplier,
        shotName,
        buffEffects,
        buffCooldownMs,
        skillBaseCooldownSec,
        isMagicAttackOpt,
        isDebuff,
        debuffEffects,
        skillElementRaw
      );
      appliedBuffTurn = !!(
        dmg === 0 &&
        (isBuff || isToggle) &&
        (isToggle || (Array.isArray(buffEffects) && buffEffects.length > 0))
      );
      session.lastHitDamage = dmg;
      session.lastHitById = session.attackerId;
      session.lastHitByName = session.attacker.name;
      session.attackerHasHit = true;

      if (session.defender.hp <= 0) {
        session.ended = true;
        session.winnerId = session.attackerId;
      }
    } else {
      const dmg = doTurn(
        session.defender,
        session.attacker,
        session.defenderCooldowns,
        skillId,
        isBuff,
        isToggle,
        skillName,
        shotMultiplier,
        shotName,
        buffEffects,
        buffCooldownMs,
        skillBaseCooldownSec,
        isMagicAttackOpt,
        isDebuff,
        debuffEffects,
        skillElementRaw
      );
      appliedBuffTurn = !!(
        dmg === 0 &&
        (isBuff || isToggle) &&
        (isToggle || (Array.isArray(buffEffects) && buffEffects.length > 0))
      );
      session.lastHitDamage = dmg;
      session.lastHitById = session.defenderId;
      session.lastHitByName = session.defender.name;
      session.defenderHasHit = true;

      if (session.attacker.hp <= 0) {
        session.ended = true;
        session.winnerId = session.defenderId;
      }
    }
    session.updatedAt = Date.now();

    let actorBuffs: any[] | undefined;
    if (appliedBuffTurn && skillId && skillName) {
      const actorId = actorRole === "attacker" ? session.attackerId : session.defenderId;
      const durationMs = buffDurationSec * 1000;
      const newBuff = {
        id: skillId,
        name: String(skillName || "").trim() || `skill#${skillId}`,
        icon: "",
        effects: buffEffects,
        expiresAt: now + durationMs,
        startedAt: now,
        durationMs,
        source: "skill" as const,
        buffGroup: undefined as string | undefined,
        stackType: undefined as string | undefined,
      };
      try {
        const targetChar = await prisma.character.findUnique({
          where: { id: actorId },
          select: { id: true, heroJson: true },
        });
        if (targetChar) {
          const heroJson = ((targetChar.heroJson as any) || {}) as any;
          const currentBuffs = Array.isArray(heroJson.heroBuffs) ? heroJson.heroBuffs : [];
          const filteredBuffs = currentBuffs.filter((b: any) => b.id !== skillId);
          const updatedBuffs = [...filteredBuffs, newBuff];
          const oldRevision = Number(heroJson.heroRevision ?? 0) || 0;
          const updatedHeroJson = addVersioning({ ...heroJson, heroBuffs: updatedBuffs }, oldRevision);
          await prisma.character.update({
            where: { id: actorId },
            data: { heroJson: updatedHeroJson },
          });
          actorBuffs = updatedBuffs;
        }
      } catch (e: any) {
        app.log?.warn?.(e, "[actPkSession] Failed to persist heroBuffs");
      }
    }

    if (isArenaLikeSession(session)) {
      await syncArenaHpOnly(session, now);
    } else {
      await syncPkRealtimeState(session, actorRole, now);
    }
    await savePkResultIfNeeded(session);
    await savePkSessionToDb(session);
    await refreshPkFighterStatsFromDb(session);
    const response = serializePkSession(session);
    if (actorBuffs) (response as any).actorBuffs = actorBuffs;
    return reply.send(response);
  });
}
