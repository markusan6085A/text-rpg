/**
 * Копія логіки server/src/pveBattle/pveDamage.ts (rollAttackDamage / rollBaseAutoAttackDamage / sanitizeCombatStats).
 * Тримайте узгодженою з сервером при зміні формул PvE.
 */
import {
  L2_PHYSICAL_COEFFICIENT,
  L2_MAGIC_COEFFICIENT,
  L2_PVE_DAMAGE_MULTIPLIER,
} from "../../data/balance";

export type CombatStatsIn = {
  pAtk?: number;
  mAtk?: number;
  physSkillPower?: number;
  magicSkillPower?: number;
  crit?: number;
  mCrit?: number;
  critPower?: number;
  lsEmpower?: number;
  lsBackbiting?: number;
  fireAttack?: number;
  waterAttack?: number;
  windAttack?: number;
  earthAttack?: number;
  holyAttack?: number;
  darkAttack?: number;
};

function clamp(n: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, n));
}

function elementMultiplier(
  element: string | undefined,
  caster: CombatStatsIn,
  target: {
    fireResist: number;
    waterResist: number;
    windResist: number;
    earthResist: number;
    holyResist: number;
    darkResist: number;
  }
): number {
  if (!element) return 1;
  const attackBonus =
    element === "fire"
      ? caster.fireAttack ?? 0
      : element === "water"
        ? caster.waterAttack ?? 0
        : element === "wind"
          ? caster.windAttack ?? 0
          : element === "earth"
            ? caster.earthAttack ?? 0
            : element === "holy"
              ? caster.holyAttack ?? 0
              : element === "dark"
                ? caster.darkAttack ?? 0
                : 0;
  const resistPenalty =
    element === "fire"
      ? target.fireResist
      : element === "water"
        ? target.waterResist
        : element === "wind"
          ? target.windResist
          : element === "earth"
            ? target.earthResist
            : element === "holy"
              ? target.holyResist
              : element === "dark"
                ? target.darkResist
                : 0;
  const resistClamped = clamp(resistPenalty, -80, 95);
  return (1 + Math.max(0, attackBonus) / 100) * (1 - resistClamped / 100);
}

export function rollAttackDamage(args: {
  category: "physical_attack" | "magic_attack";
  power: number;
  element?: string;
  attacker: CombatStatsIn;
  targetPDef: number;
  targetMDef: number;
  targetResists: {
    fireResist: number;
    waterResist: number;
    windResist: number;
    earthResist: number;
    holyResist: number;
    darkResist: number;
  };
}): { damage: number; isCrit: boolean } {
  const power = Math.max(1, Math.floor(Number(args.power) || 1));
  const pDef = Math.max(1, Math.floor(Number(args.targetPDef) || 1));
  const mDef = Math.max(1, Math.floor(Number(args.targetMDef) || 1));
  const st = args.attacker;

  if (args.category === "magic_attack") {
    const mAtk = Math.max(1, clamp(Number(st.mAtk) || 1, 1, 50000));
    const l2Base = (L2_MAGIC_COEFFICIENT * (mAtk + 2 * power)) / mDef * L2_PVE_DAMAGE_MULTIPLIER;
    const skillBonus = 1 + clamp(Number(st.magicSkillPower) || 0, 0, 500) / 100;
    const elem = elementMultiplier(args.element, st, args.targetResists);
    const variance = 0.9 + Math.random() * 0.2;
    const critChance = Math.min(80, Number(st.mCrit) || 4);
    const isCrit = Math.random() * 100 < critChance;
    const critPower = clamp(Number(st.critPower) || 100, 0, 500);
    const critMult = isCrit ? Math.min(3.0, 2.0 + critPower / 1500) : 1.0;
    let raw = l2Base * skillBonus * elem * variance * critMult;
    const lsEmpower = clamp(Number(st.lsEmpower) || 0, 0, 200);
    if (lsEmpower > 0) raw *= 1 + lsEmpower / 100;
    return { damage: Math.max(1, Math.floor(raw)), isCrit };
  }

  const pAtk = Math.max(1, clamp(Number(st.pAtk) || 1, 1, 50000));
  const l2Base = (L2_PHYSICAL_COEFFICIENT * (pAtk + 2 * power)) / pDef * L2_PVE_DAMAGE_MULTIPLIER;
  const skillBonus = 1 + clamp(Number(st.physSkillPower) || 0, 0, 500) / 100;
  const variance = 0.8 + Math.random() * 0.4;
  const critChance = Math.min(80, Number(st.crit) || 40);
  const isCrit = Math.random() * 100 < critChance;
  const critPower = clamp(Number(st.critPower) || 100, 0, 500);
  const critMult = isCrit ? Math.min(3.0, 2.0 + critPower / 1500) : 1.0;
  let raw = l2Base * skillBonus * variance * critMult;
  const lsEmpower = clamp(Number(st.lsEmpower) || 0, 0, 200);
  const lsBackbiting = clamp(Number(st.lsBackbiting) || 0, 0, 200);
  if (lsEmpower > 0) raw *= 1 + lsEmpower / 100;
  if (lsBackbiting > 0) raw *= 1 + lsBackbiting / 100;
  return { damage: Math.max(1, Math.floor(raw)), isCrit };
}

export function rollBaseAutoAttackDamage(args: {
  pAtk: number;
  targetPDef: number;
  crit: number;
  critPower: number;
  lsBackbiting: number;
  physicalDamageMultiplier: number;
  shotMultiplier: number;
}): { damage: number; isCrit: boolean } {
  const pDef = Math.max(1, Math.floor(Number(args.targetPDef) || 1));
  const mult = Math.max(0.1, Number(args.physicalDamageMultiplier) || 1);
  const shot = Math.max(1, Number(args.shotMultiplier) || 1);
  const effectivePAtk = Math.max(1, clamp(Number(args.pAtk) || 1, 1, 50000) * mult * shot);
  const variance = 0.9 + Math.random() * 0.2;
  const raw = (L2_PHYSICAL_COEFFICIENT * effectivePAtk) / pDef * L2_PVE_DAMAGE_MULTIPLIER * variance;

  const critChance = Math.min(80, Number(args.crit) || 40);
  const isCrit = Math.random() * 100 < critChance;
  const critPower = clamp(Number(args.critPower) || 100, 0, 500);
  const critMult = isCrit ? Math.min(3.0, 2.0 + critPower / 1500) : 1.0;
  let damage = Math.max(1, Math.floor(raw * critMult));
  const lsBackbiting = clamp(Number(args.lsBackbiting) || 0, 0, 200);
  if (lsBackbiting > 0) damage = Math.round(damage * (1 + lsBackbiting / 100));
  return { damage, isCrit };
}

export function sanitizeCombatStats(raw: any): CombatStatsIn {
  if (!raw || typeof raw !== "object") return {};
  const n = (k: string, max: number) => clamp(Number((raw as any)[k]) || 0, 0, max);
  return {
    pAtk: n("pAtk", 50000),
    mAtk: n("mAtk", 50000),
    physSkillPower: n("physSkillPower", 500),
    magicSkillPower: n("magicSkillPower", 500),
    crit: n("crit", 100),
    mCrit: n("mCrit", 100),
    critPower: n("critPower", 500),
    lsEmpower: n("lsEmpower", 200),
    lsBackbiting: n("lsBackbiting", 200),
    fireAttack: n("fireAttack", 200),
    waterAttack: n("waterAttack", 200),
    windAttack: n("windAttack", 200),
    earthAttack: n("earthAttack", 200),
    holyAttack: n("holyAttack", 200),
    darkAttack: n("darkAttack", 200),
  };
}
