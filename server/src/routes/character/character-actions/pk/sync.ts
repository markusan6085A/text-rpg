import { prisma } from "../../../../db";
import { addVersioning } from "../../../../heroJsonValidator";
import type { PkSession } from "./types";
import { getEffectivePkNickColor } from "./helpers";

export async function syncPkRealtimeState(session: PkSession, actorRole: "attacker" | "defender", now = Date.now()) {
  const actorId = actorRole === "attacker" ? session.attackerId : session.defenderId;
  const targetId = actorRole === "attacker" ? session.defenderId : session.attackerId;
  const actorState = actorRole === "attacker" ? session.attacker : session.defender;
  const targetState = actorRole === "attacker" ? session.defender : session.attacker;

  await prisma.$transaction(async (tx) => {
    const ids = [actorId, targetId].sort();
    await tx.$queryRawUnsafe(`SELECT id FROM "Character" WHERE id IN ($1, $2) FOR UPDATE`, ids[0], ids[1]);
    const chars = await tx.character.findMany({
      where: { id: { in: [actorId, targetId] } },
      select: { id: true, heroJson: true },
    });
    if (chars.length !== 2) return;

    const actorChar = chars.find((c) => c.id === actorId);
    const targetChar = chars.find((c) => c.id === targetId);
    if (!actorChar || !targetChar) return;

    const actorJson = ((actorChar.heroJson as any) || {}) as any;
    const targetJson = ((targetChar.heroJson as any) || {}) as any;

    const combatColor = "#FC0FC0";
    const combatUntil = now + 10_000;
    const pkSyncUntil = now + 15_000;
    const actorDisplayColor =
      getEffectivePkNickColor(
        { ...actorJson, pkCombatNickColor: combatColor, pkCombatNickColorUntil: combatUntil },
        now
      ) || combatColor;

    const nextActorJson = {
      ...actorJson,
      hp: actorState.hp,
      mp: actorState.mp,
      maxHp: actorState.maxHp,
      maxMp: actorState.maxMp,
      pkCombatNickColor: combatColor,
      pkCombatNickColorUntil: combatUntil,
      pkSyncUntil,
    };

    const nextTargetJson = {
      ...targetJson,
      hp: targetState.hp,
      mp: targetState.mp,
      maxHp: targetState.maxHp,
      maxMp: targetState.maxMp,
      pkIncoming: {
        attackerId: actorId,
        attackerName: actorState.name,
        attackerNickColor: actorDisplayColor,
        sessionId: session.id,
        until: now + 10_000,
      },
      pkSyncUntil,
    };

    await tx.character.update({
      where: { id: actorId },
      data: { heroJson: nextActorJson, lastActivityAt: new Date() },
    });
    await tx.character.update({
      where: { id: targetId },
      data: { heroJson: nextTargetJson, lastActivityAt: new Date() },
    });
  });
}

/** Арена: лише HP/MP у heroJson, без pkIncoming / кольорів бою */
export async function syncArenaHpOnly(session: PkSession, now = Date.now()) {
  await prisma.$transaction(async (tx) => {
    const ids = [session.attackerId, session.defenderId].sort();
    await tx.$queryRawUnsafe(`SELECT id FROM "Character" WHERE id IN ($1, $2) FOR UPDATE`, ids[0], ids[1]);
    const chars = await tx.character.findMany({
      where: { id: { in: [session.attackerId, session.defenderId] } },
      select: { id: true, heroJson: true },
    });
    for (const c of chars) {
      const heroJson = ((c.heroJson as any) || {}) as any;
      const f = c.id === session.attackerId ? session.attacker : session.defender;
      const nextJson = {
        ...heroJson,
        hp: f.hp,
        mp: f.mp,
        maxHp: f.maxHp,
        maxMp: f.maxMp,
        arenaSyncUntil: now + 15_000,
      };
      await tx.character.update({
        where: { id: c.id },
        data: {
          heroJson: addVersioning(nextJson, Number(heroJson.heroRevision ?? 0) || 0),
          lastActivityAt: new Date(),
        },
      });
    }
  });
}
