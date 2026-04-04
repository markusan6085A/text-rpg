import type { BattleState } from "../../types";
import { persistBattle } from "../../persist";
import { persistSnapshot } from "../../helpers";
import { calcCooldownMs, getSkillCooldownMultiplier } from "../../cooldowns";
import { calcAutoAttackInterval, calcPhysicalSkillCooldown } from "../../../../utils/combatSpeed";
import { calcMagicCooldown } from "../../../../utils/magicSpeed";

export const XP_RATE = 1;
export const SUMMON_SKILLS = new Set([1128, 1129, 1154, 1228, 1334]);
export const SONIC_FOCUS_ID = 8;
export const SONIC_CONSUMERS = new Set([5, 6, 7, 9, 261, 442]);
export const SONIC_COST: Record<number, number> = { 5: 1, 6: 1, 7: 1, 9: 1, 261: 1, 442: 4 };
export const MAX_FOCUS_STACKS = 8;
export const FOCUS_DURATION_MS = 10 * 60 * 1000;

// Focused Force (для Orc Monk/Tyrant)
export const FOCUSED_FORCE_ID = 50;
export const FOCUSED_FORCE_CONSUMERS = new Set([54, 443]); // Force Blaster, Force Barrier
export const FOCUSED_FORCE_COST: Record<number, number> = { 54: 1, 443: 4 };
export const MAX_FOCUSED_FORCE_STACKS = 7;
export const FOCUSED_FORCE_DURATION_MS = 10 * 60 * 1000;

// Auto Spoil skill ID
export const AUTO_SPOIL_SKILL_ID = 2541;

// Whirlwind Attack skill ID
export const WHIRLWIND_ATTACK_SKILL_ID = 348;

/**
 * Check if Auto Spoil toggle skill is currently active
 */
export function hasAutoSpoilActive(activeBuffs: any[]): boolean {
  return activeBuffs.some((buff) => buff.id === AUTO_SPOIL_SKILL_ID);
}

/**
 * Check if Whirlwind Attack toggle skill is currently active
 */
export function hasWhirlwindAttackActive(activeBuffs: any[]): boolean {
  return activeBuffs.some((buff) => buff.id === WHIRLWIND_ATTACK_SKILL_ID);
}

export const clampChance = (val: number | undefined) => Math.max(0, Math.min(80, val ?? 0));

/**
 * Перевіряє, чи спрацював Skill Critical (шанс повторного використання скіла без кулдауну або подвоєння тривалості)
 * Залежить від skillMastery з heroStats (застосовані бафи, включаючи Focus Skill Mastery)
 * @param heroStats - стати героя з урахуванням бафів
 * @param activeBuffs - масив активних бафів (для перевірки наявності Focus Skill Mastery)
 * @returns true якщо Skill Critical спрацював, false інакше
 */
export const checkSkillCritical = (heroStats: any, activeBuffs: any[]): boolean => {
  // Перевіряємо, чи є активний Focus Skill Mastery (skill 334)
  const focusSkillMastery = activeBuffs.find((b) => b.id === 334);
  if (!focusSkillMastery) return false;

  // Отримуємо skillMastery з heroStats (вже застосовані бафи)
  const skillMastery = heroStats?.skillMastery ?? 0;
  if (skillMastery <= 0) return false;

  // Шанс Skill Critical = skillMastery * 2% (максимум 50%)
  // При skillMastery = 20 (2 base * 10 multiplier): шанс = 20 * 2 = 40%
  const critChance = Math.min(50, skillMastery * 2);
  const roll = Math.random() * 100;
  
  if (import.meta.env.DEV && roll < critChance) {
    console.log(`[Skill Critical] ✅ Спрацював! skillMastery: ${skillMastery}, шанс: ${critChance}%, roll: ${roll.toFixed(2)}`);
  }
  
  return roll < critChance;
};

// Автоатака: той самий масштаб critPower що й скіли (/1000), але трохи нижчий кап — вузький /3000
// робив Vicious Stance / предмети з critPower майже непомітними на білих ударах.
export const getCritMultiplier = (critDamage: number | undefined) => {
  const critPower = Math.max(0, critDamage ?? 0);
  const multiplier = 2.0 + critPower / 1000;
  return Math.min(2.85, multiplier);
};

// Скіли: вищий кап за автоатаку (рідші крити по відносній частоті ударів)
export const getSkillCritMultiplier = (critDamage: number | undefined) => {
  const critPower = Math.max(0, critDamage ?? 0);
  const multiplier = 2.0 + critPower / 1000;
  return Math.min(3.0, multiplier);
};

export type Setter = (
  partial: Partial<BattleState> | ((state: BattleState) => Partial<BattleState>),
  replace?: boolean
) => void;

export function createSetAndPersist(
  set: Setter,
  get: () => BattleState
) {
  return (updates: Partial<BattleState>) => {
    const currentCooldowns = get().cooldowns || {};
    const mergedCooldowns = updates.cooldowns
      ? { ...currentCooldowns, ...updates.cooldowns }
      : currentCooldowns;
    const merged = { ...(updates as any), cooldowns: mergedCooldowns };
    set((prev) => ({ ...(prev as any), ...merged }));
    persistSnapshot(get, persistBattle, merged);
  };
}

export function createCooldownMs(
  skillCategory: string,
  isMagicSkill: boolean,
  attackSpeed: number,
  castSpeed: number,
  passiveCdReduction: number,
  heroStats: any
) {
  return (baseSec?: number, isToggle?: boolean) => {
    if (isToggle) return 0;
    
    // Для фізичних скілів: спочатку attackSpeed, потім той самий % зменшення КД, що й у calcCooldownMs (екіп + пасивки).
    if (skillCategory === "physical_attack" && baseSec) {
      let ms = calcPhysicalSkillCooldown(baseSec, attackSpeed);
      const mult = getSkillCooldownMultiplier(heroStats);
      ms = Math.round(ms * mult);
      return Math.max(300, ms);
    }
    
    // Для магічних скілів використовуємо calcMagicCooldown
    if (isMagicSkill && baseSec) {
      return calcMagicCooldown(baseSec, castSpeed, passiveCdReduction);
    }
    
    // Для інших скілів використовуємо стандартний calcCooldownMs
    return calcCooldownMs(heroStats, baseSec, isToggle);
  };
}

/**
 * Helper для збереження cooldown з часом використання
 * Зберігає readyAt, usedAt та originalCd для подальшого перерахунку
 */
export function createCooldownEntry(
  skillId: number,
  cooldownMs: number,
  now: number
): Record<string, number> {
  const nextCD = now + cooldownMs;
  const cooldownValue = Number.isFinite(nextCD) ? nextCD : now + 5000;
  return {
    [skillId]: cooldownValue,
    [`${skillId}_usedAt`]: now,
    [`${skillId}_originalCd`]: cooldownMs,
  };
}

