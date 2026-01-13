import { cleanupBuffs, applyBuffsToStats } from "./buffs";
import type { BattleBuff, BattleState } from "../types";

/**
 * Застосовує бафи до статів сумону
 */
export function applySummonBuffs(
  summonStats: {
    pAtk?: number;
    pDef?: number;
    mAtk?: number;
    mDef?: number;
    attackSpeed?: number;
    castSpeed?: number;
    runSpeed?: number;
    critRate?: number;
    critDamage?: number;
    accuracy?: number;
    evasion?: number;
    debuffResist?: number;
    vampirism?: number;
  },
  buffs: BattleBuff[]
) {
  return applyBuffsToStats(summonStats, buffs);
}

/**
 * Очищає застарілі бафи сумону
 */
export function cleanupSummonBuffs(buffs: BattleBuff[], now: number): BattleBuff[] {
  return cleanupBuffs(buffs, now);
}

/**
 * Обчислює забафлені стати сумону з урахуванням активних бафів
 * Використовує базові стати (baseSummonStats), щоб уникнути множення ефектів
 */
export function computeBuffedSummonStats(
  baseSummonStats: BattleState["baseSummonStats"],
  buffs: BattleBuff[]
): {
  pAtk: number;
  pDef: number;
  mAtk: number;
  mDef: number;
  attackSpeed?: number;
  castSpeed?: number;
  runSpeed?: number;
  critRate?: number;
  critDamage?: number;
  accuracy?: number;
  evasion?: number;
  debuffResist?: number;
  vampirism?: number;
} {
  if (!baseSummonStats) {
    return { pAtk: 0, pDef: 0, mAtk: 0, mDef: 0 };
  }

  const baseStats = {
    pAtk: baseSummonStats.pAtk ?? 0,
    pDef: baseSummonStats.pDef ?? 0,
    mAtk: baseSummonStats.mAtk ?? 0,
    mDef: baseSummonStats.mDef ?? 0,
    attackSpeed: baseSummonStats.attackSpeed,
    castSpeed: baseSummonStats.castSpeed,
    runSpeed: baseSummonStats.runSpeed,
    critRate: baseSummonStats.critRate,
    critDamage: baseSummonStats.critDamage,
    accuracy: baseSummonStats.accuracy,
    evasion: baseSummonStats.evasion,
    debuffResist: baseSummonStats.debuffResist,
    vampirism: baseSummonStats.vampirism,
  };

  const buffed = applySummonBuffs(baseStats, buffs);
  
  // Округлюємо всі стати до цілих чисел
  return {
    pAtk: Math.round(buffed.pAtk ?? 0),
    pDef: Math.round(buffed.pDef ?? 0),
    mAtk: Math.round(buffed.mAtk ?? 0),
    mDef: Math.round(buffed.mDef ?? 0),
    attackSpeed: buffed.attackSpeed !== undefined ? Math.round(buffed.attackSpeed * 100) / 100 : undefined,
    castSpeed: buffed.castSpeed !== undefined ? Math.round(buffed.castSpeed * 100) / 100 : undefined,
    runSpeed: buffed.runSpeed !== undefined ? Math.round(buffed.runSpeed * 100) / 100 : undefined,
    critRate: buffed.critRate !== undefined ? Math.round(buffed.critRate * 100) / 100 : undefined,
    critDamage: buffed.critDamage !== undefined ? Math.round(buffed.critDamage * 100) / 100 : undefined,
    accuracy: Math.round(buffed.accuracy ?? 0),
    evasion: Math.round(buffed.evasion ?? 0),
    debuffResist: buffed.debuffResist !== undefined ? Math.round(buffed.debuffResist * 100) / 100 : undefined,
    vampirism: buffed.vampirism !== undefined ? Math.round(buffed.vampirism * 100) / 100 : undefined,
  };
}

