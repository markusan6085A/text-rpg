import { prisma } from "../../../../db";
import type { PkFighter, PkSession, PkSkill } from "./types";

export function getLocation(heroJson: any): string {
  return String(heroJson?.location ?? heroJson?.currentLocation ?? heroJson?.zone ?? "").trim();
}

export function isOnline(lastActivityAt: Date | null | undefined, updatedAt?: Date | null): boolean {
  const effective = lastActivityAt ?? updatedAt ?? null;
  if (!effective) return false;
  return new Date(effective).getTime() >= Date.now() - 10 * 60 * 1000;
}

export function normalizeSkills(heroJson: any): PkSkill[] {
  const raw = Array.isArray(heroJson?.skills) ? heroJson.skills : [];
  const bestById = new Map<number, number>();
  for (const s of raw) {
    const id = Number((s as any)?.id);
    const level = Math.max(1, Number((s as any)?.level) || 1);
    if (!id) continue;
    const prev = bestById.get(id) || 0;
    if (level > prev) bestById.set(id, level);
  }
  return Array.from(bestById.entries()).map(([id, level]) => ({
    id,
    level,
    mpCost: Math.max(0, 6 + level * 2),
    cooldownMs: Math.max(1000, (2 + Math.floor(level / 5)) * 1000),
    powerBonus: 10 + level * 8,
  }));
}

export function buildPkFighter(character: {
  id: string;
  name: string;
  level: number;
  heroJson: unknown;
}): PkFighter {
  const heroJson = (character.heroJson as any) || {};
  const level = Math.max(1, Number(character.level || 1));
  const battleStats = heroJson?.battleStats || {};

  const maxHp = Math.max(1, Number(heroJson?.maxHp ?? 180 + level * 24) || 1);
  const maxMp = Math.max(1, Number(heroJson?.maxMp ?? 100 + level * 10) || 1);
  const hp = Math.max(1, Math.min(maxHp, Number(heroJson?.hp ?? maxHp) || maxHp));
  const mp = Math.max(0, Math.min(maxMp, Number(heroJson?.mp ?? maxMp) || maxMp));

  const pAtk = Math.max(10, Number(battleStats?.pAtk ?? 40 + level * 6) || 10);
  const pDef = Math.max(5, Number(battleStats?.pDef ?? 25 + level * 4) || 5);
  const mAtk = Math.max(10, Number(battleStats?.mAtk ?? 35 + level * 5) || 10);
  const mDef = Math.max(5, Number(battleStats?.mDef ?? 20 + level * 4) || 5);

  const accuracy = Number(battleStats?.accuracy || 0);
  const evasion = Number(battleStats?.evasion || 0);
  const crit = Number(battleStats?.crit || 40);
  const mCrit = Number(battleStats?.mCrit || 4);
  const critPower = Number(battleStats?.critPower ?? battleStats?.critDamage ?? 100);

  const prefersMagic = mAtk > pAtk * 1.15;
  const skills = normalizeSkills(heroJson);

  return {
    id: character.id,
    name: character.name,
    hp,
    maxHp,
    mp,
    maxMp,
    pAtk,
    pDef,
    mAtk,
    mDef,
    accuracy,
    evasion,
    crit,
    mCrit,
    critPower,
    prefersMagic,
    skills,
  };
}

/** Оновлює maxHp/maxMp у сесії з поточного heroJson в БД, щоб HP було однакове всюди */
export async function refreshPkFighterStatsFromDb(session: PkSession): Promise<void> {
  const chars = await prisma.character.findMany({
    where: { id: { in: [session.attackerId, session.defenderId] } },
    select: { id: true, heroJson: true, level: true },
  });
  const attackerChar = chars.find((c) => c.id === session.attackerId);
  const defenderChar = chars.find((c) => c.id === session.defenderId);
  if (attackerChar?.heroJson) {
    const heroJson = (attackerChar.heroJson as any) || {};
    const level = Math.max(1, Number(attackerChar.level || 1));
    const maxHp = Math.max(1, Number(heroJson?.maxHp ?? 180 + level * 24) || 1);
    const maxMp = Math.max(1, Number(heroJson?.maxMp ?? 100 + level * 10) || 1);
    session.attacker.maxHp = maxHp;
    session.attacker.maxMp = maxMp;
    session.attacker.hp = Math.min(session.attacker.hp, maxHp);
    session.attacker.mp = Math.min(session.attacker.mp, maxMp);
  }
  if (defenderChar?.heroJson) {
    const heroJson = (defenderChar.heroJson as any) || {};
    const level = Math.max(1, Number(defenderChar.level || 1));
    const maxHp = Math.max(1, Number(heroJson?.maxHp ?? 180 + level * 24) || 1);
    const maxMp = Math.max(1, Number(heroJson?.maxMp ?? 100 + level * 10) || 1);
    session.defender.maxHp = maxHp;
    session.defender.maxMp = maxMp;
    session.defender.hp = Math.min(session.defender.hp, maxHp);
    session.defender.mp = Math.min(session.defender.mp, maxMp);
  }
}

export function serializePkSession(session: PkSession) {
  return {
    ok: true,
    serverNow: Date.now(),
    session: {
      id: session.id,
      attackerId: session.attackerId,
      defenderId: session.defenderId,
      sessionKind: session.sessionKind ?? "pk",
      attacker: session.attacker,
      defender: session.defender,
      cooldowns: session.attackerCooldowns,
      attackerCooldowns: session.attackerCooldowns,
      defenderCooldowns: session.defenderCooldowns ?? {},
      log: session.log,
      ended: session.ended,
      winnerId: session.winnerId ?? null,
      escapedById: session.escapedById ?? null,
      escapedByName: session.escapedByName ?? null,
      updatedAt: session.updatedAt,
    },
  };
}

/** Урон як у клієнті: простий удар = pAtk - pDef, скіл = трохи більше (+ powerBonus). */
export function computeDamage(
  attacker: PkFighter,
  defender: PkFighter,
  powerBonus: number,
  useMagic: boolean,
  shotMultiplier: number = 1.0
): { dmg: number; isCrit: boolean; isMiss: boolean } {
  const pAtk = Math.max(1, Number(attacker.pAtk || 1));
  const mAtk = Math.max(1, Number(attacker.mAtk || 1));
  const pDef = Math.max(1, Number(defender.pDef || 1));
  const mDef = Math.max(1, Number(defender.mDef || 1));
  const skillBonus = Math.max(0, Number(powerBonus || 0));

  if (!useMagic && powerBonus === 0) {
    const hitChance = Math.max(20, Math.min(100, 90 + (attacker.accuracy || 0) - (defender.evasion || 0)));
    if (Math.random() * 100 > hitChance) {
      return { dmg: 0, isCrit: false, isMiss: true };
    }
  }

  const critChanceRaw = useMagic ? attacker.mCrit || 4 : attacker.crit || 40;
  const critChance = Math.min(80, critChanceRaw);
  const isCrit = Math.random() * 100 < critChance;

  const critPower = attacker.critPower || 100;
  const critMult = isCrit
    ? powerBonus > 0
      ? Math.min(3.0, 2.0 + critPower / 1500)
      : Math.min(2.0, 1.5 + critPower / 5000)
    : 1.0;

  const variance = 0.92 + Math.random() * 0.16;

  if (useMagic) {
    const raw = Math.max(0, mAtk - mDef);
    const base = raw + skillBonus;
    return { dmg: Math.max(1, Math.floor(base * variance * critMult * shotMultiplier)), isCrit, isMiss: false };
  }

  const raw = Math.max(0, pAtk - pDef);
  const base = raw + skillBonus;
  return { dmg: Math.max(1, Math.floor(base * variance * critMult * shotMultiplier)), isCrit, isMiss: false };
}

export function getEffectivePkNickColor(heroJson: any, now = Date.now()): string | undefined {
  const forcedColor = String(heroJson?.pkForcedNickColor ?? "").trim();
  const forcedUntilRaw = heroJson?.pkForcedNickColorUntil;
  const forcedUntil = Number(forcedUntilRaw);
  if (forcedColor) {
    if (!Number.isFinite(forcedUntil) || forcedUntil > now) return forcedColor;
  }
  const combatColor = String(heroJson?.pkCombatNickColor ?? "").trim();
  const combatUntil = Number(heroJson?.pkCombatNickColorUntil);
  if (combatColor && Number.isFinite(combatUntil) && combatUntil > now) return combatColor;
  const baseColor = String(heroJson?.nickColor ?? "").trim();
  return baseColor || undefined;
}
