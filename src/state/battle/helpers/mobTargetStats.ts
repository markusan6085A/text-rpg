import type { Mob } from "../../../data/world/types";
import type { BattleBuff } from "../types";
import { MOB_DEFENSE_MULTIPLIER } from "../../../data/balance";
import { cleanupBuffs, applyBuffsToStats } from "./buffs";

/** Базові бойові поля моба для applyBuffsToStats (ті самі що в processMobAttack). */
export function mobBaseCombatStats(mob: Mob): Record<string, number> {
  const level = mob.level ?? 1;
  const m = mob as Mob & Partial<Record<"fireResist" | "waterResist" | "windResist" | "earthResist" | "holyResist" | "darkResist", number>>;
  return {
    pAtk: mob.pAtk ?? level * 20,
    pDef: mob.pDef ?? Math.round(level * 12),
    mAtk: mob.mAtk ?? 0,
    mDef: mob.mDef ?? Math.round(level * 10),
    fireResist: m.fireResist ?? 0,
    waterResist: m.waterResist ?? 0,
    windResist: m.windResist ?? 0,
    earthResist: m.earthResist ?? 0,
    holyResist: m.holyResist ?? 0,
    darkResist: m.darkResist ?? 0,
  };
}

/**
 * Стат моба з урахуванням mobBuffs — для розрахунку урону героя/саммона по цьому мобу (PvE).
 * pDef/mDef множаться на MOB_DEFENSE_MULTIPLIER так само, як у попередній «сирій» формулі.
 */
export function getMobTargetStatsForHeroDamage(
  mob: Mob,
  mobBuffs: BattleBuff[] | undefined,
  now: number
): {
  pDef: number;
  mDef: number;
  fireResist: number;
  waterResist: number;
  windResist: number;
  earthResist: number;
  holyResist: number;
  darkResist: number;
} {
  const cleaned = cleanupBuffs(mobBuffs || [], now);
  const base = mobBaseCombatStats(mob);
  const merged = applyBuffsToStats(base, cleaned);
  const rawP = merged.pDef ?? base.pDef;
  const rawM = merged.mDef ?? base.mDef;
  return {
    pDef: Math.max(1, Math.round(rawP * MOB_DEFENSE_MULTIPLIER)),
    mDef: Math.max(1, Math.round(rawM * MOB_DEFENSE_MULTIPLIER)),
    fireResist: merged.fireResist ?? 0,
    waterResist: merged.waterResist ?? 0,
    windResist: merged.windResist ?? 0,
    earthResist: merged.earthResist ?? 0,
    holyResist: merged.holyResist ?? 0,
    darkResist: merged.darkResist ?? 0,
  };
}
