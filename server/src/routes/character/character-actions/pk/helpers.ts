import { prisma } from "../../../../db";
import type { PkFighter, PkFighterBuff, PkSession, PkSkill } from "./types";
import { calcPhysicalSkillCooldown } from "./combatSpeed";

export function getLocation(heroJson: any): string {
  return String(heroJson?.location ?? heroJson?.currentLocation ?? heroJson?.zone ?? "").trim();
}

export function isOnline(lastActivityAt: Date | null | undefined, updatedAt?: Date | null): boolean {
  const effective = lastActivityAt ?? updatedAt ?? null;
  if (!effective) return false;
  return new Date(effective).getTime() >= Date.now() - 10 * 60 * 1000;
}

export function extractPkBuffsFromHeroJson(heroJson: unknown): PkFighterBuff[] {
  const hj = (heroJson as any) || {};
  const raw = Array.isArray(hj.heroBuffs) ? hj.heroBuffs : [];
  return raw.map((b: any) => ({
    id: b?.id != null ? Number(b.id) : undefined,
    name: b?.name,
    icon: b?.icon,
    effects: Array.isArray(b?.effects) ? b.effects : [],
    expiresAt: typeof b?.expiresAt === "number" ? b.expiresAt : Number(b?.expiresAt) || 0,
    startedAt: b?.startedAt,
    durationMs: b?.durationMs,
    stackType: b?.stackType,
    buffGroup: b?.buffGroup,
    source: b?.source,
  }));
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

/** Після завантаження сесії з БД у старих payload може не бути стихійних полів. */
export function ensurePkFighterElementalFields(f: PkFighter): void {
  const z = (n: unknown) => (Number.isFinite(Number(n)) ? Number(n) : 0);
  f.fireResist = z(f.fireResist);
  f.waterResist = z(f.waterResist);
  f.windResist = z(f.windResist);
  f.earthResist = z(f.earthResist);
  f.holyResist = z(f.holyResist);
  f.darkResist = z(f.darkResist);
  f.fireAttack = z(f.fireAttack);
  f.waterAttack = z(f.waterAttack);
  f.windAttack = z(f.windAttack);
  f.earthAttack = z(f.earthAttack);
  f.holyAttack = z(f.holyAttack);
  f.darkAttack = z(f.darkAttack);
  f.magicSkillPower = z(f.magicSkillPower);
  f.physSkillPower = z(f.physSkillPower);
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
  const attackSpeed = Math.max(0, Number(battleStats?.attackSpeed ?? battleStats?.atkSpeed ?? 200) || 200);

  const num = (v: unknown) => (Number.isFinite(Number(v)) ? Number(v) : 0);
  const fireResist = num(battleStats?.fireResist);
  const waterResist = num(battleStats?.waterResist);
  const windResist = num(battleStats?.windResist);
  const earthResist = num(battleStats?.earthResist);
  const holyResist = num(battleStats?.holyResist);
  const darkResist = num(battleStats?.darkResist);
  const fireAttack = num(battleStats?.fireAttack);
  const waterAttack = num(battleStats?.waterAttack);
  const windAttack = num(battleStats?.windAttack);
  const earthAttack = num(battleStats?.earthAttack);
  const holyAttack = num(battleStats?.holyAttack);
  const darkAttack = num(battleStats?.darkAttack);
  const magicSkillPower = num(battleStats?.magicSkillPower);
  const physSkillPower = num(battleStats?.physSkillPower);

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
    attackSpeed,
    fireResist,
    waterResist,
    windResist,
    earthResist,
    holyResist,
    darkResist,
    fireAttack,
    waterAttack,
    windAttack,
    earthAttack,
    holyAttack,
    darkAttack,
    magicSkillPower,
    physSkillPower,
    prefersMagic,
    skills,
    buffs: extractPkBuffsFromHeroJson(heroJson),
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
    const bs = heroJson?.battleStats || {};
    session.attacker.attackSpeed = Math.max(
      0,
      Number(bs?.attackSpeed ?? bs?.atkSpeed ?? session.attacker.attackSpeed ?? 200) || 200
    );
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
    const bs = heroJson?.battleStats || {};
    session.defender.attackSpeed = Math.max(
      0,
      Number(bs?.attackSpeed ?? bs?.atkSpeed ?? session.defender.attackSpeed ?? 200) || 200
    );
  }
  if (attackerChar?.heroJson) {
    session.attacker.buffs = extractPkBuffsFromHeroJson(attackerChar.heroJson);
  }
  if (defenderChar?.heroJson) {
    session.defender.buffs = extractPkBuffsFromHeroJson(defenderChar.heroJson);
  }
}

/** Повідомлення в лог, коли клієнт просить атакуючий скіл, а сервер не може його застосувати (без підміни на базову атаку). */
export function formatPkAttackSkillFailureMessage(
  fighter: PkFighter,
  cooldowns: Record<number, number>,
  requestedSkillId: number,
  now: number,
  reqSkillName?: string
): string {
  const requested = fighter.skills.find((s) => s.id === requestedSkillId);
  const sName =
    String(reqSkillName || "").trim() ||
    (requested?.name ? String(requested.name) : "") ||
    `skill#${requestedSkillId}`;
  if (!requested) {
    return `${fighter.name}: не удалось использовать ${reqSkillName?.trim() || `skill#${requestedSkillId}`}.`;
  }
  if ((cooldowns[requested.id] ?? 0) > now) {
    return `${fighter.name}: ${sName} на перезарядке.`;
  }
  if (fighter.mp < requested.mpCost) {
    return `${fighter.name}: не хватает MP для ${sName} (нужно ${requested.mpCost}).`;
  }
  return `${fighter.name}: не удалось использовать ${sName}.`;
}

/** КД атакуючого скіла після удару: фіз. — як у клієнта (attackSpeed), маг. — baseSec * 1000. */
export function resolvePkAttackSkillCooldownMs(
  attacker: PkFighter,
  skill: PkSkill,
  useMagic: boolean,
  reqSkillBaseCooldownSec?: number
): number {
  const fallbackSec = Math.max(0.5, skill.cooldownMs / 1000);
  const baseSec =
    typeof reqSkillBaseCooldownSec === "number" &&
    Number.isFinite(reqSkillBaseCooldownSec) &&
    reqSkillBaseCooldownSec > 0
      ? Math.min(180, Math.max(0.1, reqSkillBaseCooldownSec))
      : fallbackSec;
  if (useMagic) {
    return Math.round(baseSec * 1000);
  }
  const atkSp = attacker.attackSpeed ?? 200;
  return calcPhysicalSkillCooldown(baseSec, atkSp);
}

/** Узгоджено з client `src/data/balance.ts` + calculatePhysical/MagicDamage (PvE). */
const L2_PHYSICAL_COEFF_PK = 70;
const L2_MAGIC_COEFF_PK = 70;
const L2_PVE_DMG_MULT_PK = 2.8;

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
      lastHitDamage: session.lastHitDamage ?? 0,
      updatedAt: session.updatedAt,
    },
  };
}

const PK_ELEMENT_IDS = new Set(["fire", "water", "wind", "earth", "holy", "dark"]);

function normalizePkSkillElement(raw: string | null | undefined): string | null {
  const s = String(raw || "").trim().toLowerCase();
  return PK_ELEMENT_IDS.has(s) ? s : null;
}

/** Як у клієнті calculateMagicDamage: атака стихією + опір (від'ємний опір = вразливість). */
function pkElementMultiplier(attacker: PkFighter, defender: PkFighter, element: string | null): number {
  if (!element) return 1;
  const attackBonus =
    element === "fire"
      ? attacker.fireAttack
      : element === "water"
        ? attacker.waterAttack
        : element === "wind"
          ? attacker.windAttack
          : element === "earth"
            ? attacker.earthAttack
            : element === "holy"
              ? attacker.holyAttack
              : element === "dark"
                ? attacker.darkAttack
                : 0;
  const resistPenalty =
    element === "fire"
      ? defender.fireResist
      : element === "water"
        ? defender.waterResist
        : element === "wind"
          ? defender.windResist
          : element === "earth"
            ? defender.earthResist
            : element === "holy"
              ? defender.holyResist
              : element === "dark"
                ? defender.darkResist
                : 0;
  const resistClamped = Math.max(-80, Math.min(95, resistPenalty));
  return (1 + Math.max(0, attackBonus) / 100) * (1 - resistClamped / 100);
}

/**
 * Урон узгоджено з PvE: базова атака — як baseAttack (L2_PHYSICAL * pAtk/pDef * PVE_MULT);
 * скіли — як calculatePhysicalDamage / calculateMagicDamage (L2 * (atk + 2*power) / def * PVE_MULT).
 */
export function computeDamage(
  attacker: PkFighter,
  defender: PkFighter,
  powerBonus: number,
  useMagic: boolean,
  shotMultiplier: number = 1.0,
  skillElement?: string | null
): { dmg: number; isCrit: boolean; isMiss: boolean } {
  const pAtk = Math.max(1, Number(attacker.pAtk || 1));
  const mAtk = Math.max(1, Number(attacker.mAtk || 1));
  const pDef = Math.max(1, Number(defender.pDef || 1));
  const mDef = Math.max(1, Number(defender.mDef || 1));
  const skillBonus = Math.max(0, Number(powerBonus || 0));

  /* Усі фізичні удари (база + фіз. скіли) — шанс промаху; магія без промаху (як раніше). */
  if (!useMagic) {
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
    ? skillBonus > 0
      ? Math.min(3.0, 2.0 + critPower / 1500)
      : Math.min(2.0, 1.5 + critPower / 5000)
    : 1.0;

  const element = normalizePkSkillElement(skillElement);

  if (useMagic) {
    if (skillBonus > 0) {
      const power = Math.max(1, skillBonus);
      const variance = 0.9 + Math.random() * 0.2;
      let l2Base =
        (L2_MAGIC_COEFF_PK * (mAtk + 2 * power)) / mDef * L2_PVE_DMG_MULT_PK;
      const magicSkillMult = 1 + (attacker.magicSkillPower || 0) / 100;
      l2Base *= magicSkillMult;
      const elemMult = pkElementMultiplier(attacker, defender, element);
      const dmg = Math.max(1, Math.floor(l2Base * variance * critMult * shotMultiplier * elemMult));
      return { dmg, isCrit, isMiss: false };
    }
    const variance = 0.92 + Math.random() * 0.16;
    const raw = Math.max(0, mAtk - mDef);
    const base = raw + skillBonus;
    return { dmg: Math.max(1, Math.floor(base * variance * critMult * shotMultiplier)), isCrit, isMiss: false };
  }

  if (skillBonus > 0) {
    const power = Math.max(1, skillBonus);
    const variance = 0.8 + Math.random() * 0.4;
    let l2Base =
      (L2_PHYSICAL_COEFF_PK * (pAtk + 2 * power)) / pDef * L2_PVE_DMG_MULT_PK;
    const physSkillMult = 1 + (attacker.physSkillPower || 0) / 100;
    l2Base *= physSkillMult;
    const elemMult = pkElementMultiplier(attacker, defender, element);
    const dmg = Math.max(1, Math.floor(l2Base * variance * critMult * shotMultiplier * elemMult));
    return { dmg, isCrit, isMiss: false };
  }

  const varianceBasic = 0.9 + Math.random() * 0.2;
  const effectivePAtk = Math.max(1, pAtk * shotMultiplier);
  const dmgBase = Math.max(
    1,
    Math.floor(L2_PHYSICAL_COEFF_PK * (effectivePAtk / pDef) * varianceBasic * L2_PVE_DMG_MULT_PK)
  );
  const dmg = Math.max(1, Math.floor(dmgBase * critMult));
  return { dmg, isCrit, isMiss: false };
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
