/**
 * Special skill handlers for skills that require custom logic
 * (summon skills, corpse drain, servitor buffs, etc.)
 */

import type { BattleState } from "../types";
import type { SkillDefinition, SkillLevelDefinition } from "../../../data/skills/types";
import { calcCooldownMs } from "../cooldowns";
import { persistSnapshot } from "../helpers";
import { persistBattle } from "../persist";
import { useHeroStore } from "../../heroStore";
import { recalculateAllStats } from "../../../utils/stats/recalculateAllStats";
import { hasSpiritshotActive } from "./useSkill/shotHelpers";

type Setter = (
  partial: Partial<BattleState> | ((state: BattleState) => Partial<BattleState>),
  replace?: boolean
) => void;

/**
 * Summon skill IDs that need special handling
 */
export const SUMMON_SKILL_IDS = new Set([
  1128, // Summon Shadow
  1129, // Summon Reanimated Man (variant)
  1154, // Summon Corrupted Man
  1228, // Summon Silhouette
  1334, // Other summon
]);

/**
 * Servitor heal/recharge skill IDs
 */
export const SERVITOR_HEAL_SKILL_IDS = new Set([
  1126, // Servitor Recharge
  1127, // Servitor Heal
]);

/**
 * Servitor buff skill IDs
 */
export const SERVITOR_BUFF_SKILL_IDS = new Set([
  1146, // Mighty Servitor
  1230, // Bright Servitor
]);

/**
 * Corpse drain skill IDs
 */
export const CORPSE_DRAIN_SKILL_IDS = new Set([
  1151, // Corpse Life Drain
]);

/**
 * Handle summon skills (Summon Shadow, Summon Silhouette, etc.)
 */
export function handleSummonSkill(
  skillId: number,
  def: SkillDefinition,
  levelDef: SkillLevelDefinition,
  state: BattleState,
  hero: any,
  heroStats: any,
  mpCost: number,
  now: number,
  set: Setter,
  get: () => BattleState,
  computeMaxNow: (buffs: any[]) => { maxHp: number; maxMp: number; maxCp: number },
  activeBuffs: any[],
  cooldownMs: (cooldown: number | undefined, isPhysical: boolean) => number
): boolean {
  if (!SUMMON_SKILL_IDS.has(skillId)) return false;

  const { maxHp, maxMp, maxCp } = computeMaxNow(activeBuffs);
  const curHeroHP = Math.min(maxHp, hero?.hp ?? maxHp);
  const curHeroMP = Math.min(maxMp, hero?.mp ?? maxMp);
  const curHeroCP = Math.min(maxCp, hero?.cp ?? maxCp);

  const nextHeroMP = curHeroMP - mpCost;
  const summonMaxHp = Math.max(1, Math.round(maxHp * 0.7));
  const summonMaxMp = Math.max(1, Math.round(maxMp * 0.7));
  const summonPAtk = Math.round((heroStats?.pAtk ?? 0) * 0.65);
  const summonPDef = Math.round((heroStats?.pDef ?? 0) * 0.65);
  const summonMAtk = Math.round((heroStats?.mAtk ?? 0) * 0.65);
  const summonMDef = Math.round((heroStats?.mDef ?? 0) * 0.65);
  
  // Determine exp penalty based on skill
  const expPenalty = skillId === 1228 ? 0.9 : 0.3; // Silhouette = 90%, Shadow = 30%

  const nextCD = now + cooldownMs(def.cooldown, false);
  const cooldownValue = Number.isFinite(nextCD) ? nextCD : now + 5000;
  const updatedCooldowns = { ...(get().cooldowns || {}), [skillId]: cooldownValue };
  
  const newSummon = {
    id: def.id,
    name: def.name,
    icon: def.icon,
    level: hero?.level ?? 1,
    hp: summonMaxHp,
    mp: summonMaxMp,
    maxHp: summonMaxHp,
    maxMp: summonMaxMp,
    pAtk: summonPAtk,
    pDef: summonPDef,
    mAtk: summonMAtk,
    mDef: summonMDef,
  };

  const updateHero = useHeroStore.getState().updateHero;
  updateHero({ mp: nextHeroMP });

  const newLog = [`Вы призвали ${def.name}`, ...state.log].slice(0, 30);
  const updates: Partial<BattleState> = {
    status: state.status,
    log: newLog,
    cooldowns: updatedCooldowns,
    heroBuffs: activeBuffs,
    summon: newSummon,
  };

  set((prev) => ({ ...(prev as any), ...(updates as any) }));
  persistSnapshot(get, persistBattle, updates);
  return true;
}

/**
 * Handle servitor heal/recharge skills
 */
export function handleServitorHeal(
  skillId: number,
  def: SkillDefinition,
  levelDef: SkillLevelDefinition,
  state: BattleState,
  heroStats: any,
  mpCost: number,
  now: number,
  set: Setter,
  get: () => BattleState,
  computeMaxNow: (buffs: any[]) => { maxHp: number; maxMp: number; maxCp: number },
  activeBuffs: any[],
  cooldownMs: (cooldown: number | undefined, isPhysical: boolean) => number
): boolean {
  if (!SERVITOR_HEAL_SKILL_IDS.has(skillId)) return false;

  const hero = useHeroStore.getState().hero;
  const { maxHp, maxMp, maxCp } = computeMaxNow(activeBuffs);
  const currentHeroHP = Math.min(maxHp, hero?.hp ?? maxHp);
  const currentHeroMP = Math.min(maxMp, hero?.mp ?? maxMp);
  const currentHeroCP = Math.min(maxCp, hero?.cp ?? maxCp);

  if (!state.summon) {
    const currentCooldowns = get().cooldowns || {};
    const updates: Partial<BattleState> = {
      heroBuffs: activeBuffs,
      log: [`${def.name}: нет призванного существа`, ...state.log].slice(0, 30),
      cooldowns: currentCooldowns,
    };
    set((prev) => ({ ...(prev as any), ...updates }));
    persistSnapshot(get, persistBattle, updates);
    return true;
  }

  const basePower = typeof levelDef.power === "number" ? levelDef.power : 0;
  const healBonus = heroStats?.healPower ?? 0;
  const healAmountRaw =
    def.powerType === "percent" ? Math.round(maxHp * (basePower / 100)) : basePower;
  let healAmount = Math.round(healAmountRaw * (1 + Math.max(0, healBonus) / 100));
  
  // Якщо є spiritshot - збільшуємо хіл в 2 рази (для магів)
  const spiritshotActive = hasSpiritshotActive(hero);
  if (spiritshotActive) {
    healAmount = Math.round(healAmount * 2);
  }

  const nextCD = now + cooldownMs(def.cooldown, false);
  const cooldownValue = Number.isFinite(nextCD) ? nextCD : now + 5000;
  const updatedCooldowns = { ...(get().cooldowns || {}), [skillId]: cooldownValue };
  const nextHeroMP = currentHeroMP - mpCost;
  
  const isMpHeal = skillId === 1126; // Servitor Recharge
  const healedSummonHp = isMpHeal
    ? state.summon.hp
    : Math.min(state.summon.maxHp, state.summon.hp + healAmount);
  const healedSummonMp = isMpHeal
    ? Math.min(state.summon.maxMp, state.summon.mp + healAmount)
    : state.summon.mp;
  
  const updatedSummon = { ...state.summon, hp: healedSummonHp, mp: healedSummonMp };
  const newLog = [
    isMpHeal
      ? `${def.name}: +${healAmount} MP призванному существу`
      : `${def.name}: +${healAmount} HP призванному существу`,
    ...state.log,
  ].slice(0, 30);

  const updateHero = useHeroStore.getState().updateHero;
  updateHero({ mp: nextHeroMP });

  const updates: Partial<BattleState> = {
    status: state.status,
    log: newLog,
    cooldowns: updatedCooldowns,
    heroBuffs: activeBuffs,
    summon: updatedSummon,
  };
  set((prev) => ({ ...(prev as any), ...updates }));
  persistSnapshot(get, persistBattle, updates);
  return true;
}

/**
 * Handle servitor buff skills (Mighty Servitor, etc.)
 */
export function handleServitorBuff(
  skillId: number,
  def: SkillDefinition,
  levelDef: SkillLevelDefinition,
  state: BattleState,
  mpCost: number,
  now: number,
  set: Setter,
  get: () => BattleState,
  computeMaxNow: (buffs: any[]) => { maxHp: number; maxMp: number; maxCp: number },
  activeBuffs: any[],
  cooldownMs: (cooldown: number | undefined, isPhysical: boolean) => number
): boolean {
  if (!SERVITOR_BUFF_SKILL_IDS.has(skillId)) return false;

  const hero = useHeroStore.getState().hero;
  const { maxHp, maxMp, maxCp } = computeMaxNow(activeBuffs);
  const currentHeroHP = Math.min(maxHp, hero?.hp ?? maxHp);
  const currentHeroMP = Math.min(maxMp, hero?.mp ?? maxMp);
  const currentHeroCP = Math.min(maxCp, hero?.cp ?? maxCp);

  if (!state.summon) {
    const currentCooldowns = get().cooldowns || {};
    const updates: Partial<BattleState> = {
      heroBuffs: activeBuffs,
      log: [`${def.name}: нет призванного существа`, ...state.log].slice(0, 30),
      cooldowns: currentCooldowns,
    };
    set((prev) => ({ ...(prev as any), ...updates }));
    persistSnapshot(get, persistBattle, updates);
    return true;
  }

  // Apply buff to summon (stored in summon buffs or handled via effects)
  // For now, we'll just log it - actual buff application to summon needs to be implemented
  const nextCD = now + cooldownMs(def.cooldown, false);
  const cooldownValue = Number.isFinite(nextCD) ? nextCD : now + 5000;
  const updatedCooldowns = { ...(get().cooldowns || {}), [skillId]: cooldownValue };
  const nextHeroMP = currentHeroMP - mpCost;

  const multiplier = typeof levelDef.power === "number" ? levelDef.power : 1.0;
  const newLog = [
    `${def.name}: +${Math.round((multiplier - 1) * 100)}% P. Atk призванному существу`,
    ...state.log,
  ].slice(0, 30);

  const updateHero = useHeroStore.getState().updateHero;
  updateHero({ mp: nextHeroMP });

  const updates: Partial<BattleState> = {
    status: state.status,
    log: newLog,
    cooldowns: updatedCooldowns,
    heroBuffs: activeBuffs,
  };
  set((prev) => ({ ...(prev as any), ...updates }));
  persistSnapshot(get, persistBattle, updates);
  return true;
}

/**
 * Handle corpse drain skills (Corpse Life Drain)
 */
export function handleCorpseDrain(
  skillId: number,
  def: SkillDefinition,
  levelDef: SkillLevelDefinition,
  state: BattleState,
  hero: any,
  mpCost: number,
  now: number,
  set: Setter,
  get: () => BattleState,
  computeMaxNow: (buffs: any[]) => { maxHp: number; maxMp: number; maxCp: number },
  activeBuffs: any[],
  cooldownMs: (cooldown: number | undefined, isPhysical: boolean) => number
): boolean {
  if (!CORPSE_DRAIN_SKILL_IDS.has(skillId)) return false;

  // Check if mob is dead (corpse available)
  if (state.mobHP > 0 || !state.mob) {
    const currentCooldowns = get().cooldowns || {};
    const updates: Partial<BattleState> = {
      heroBuffs: activeBuffs,
      log: [`${def.name}: можно использовать только на труп`, ...state.log].slice(0, 30),
      cooldowns: currentCooldowns,
    };
    set((prev) => ({ ...(prev as any), ...updates }));
    persistSnapshot(get, persistBattle, updates);
    return true;
  }

  const { maxHp, maxMp, maxCp } = computeMaxNow(activeBuffs);
  const currentHeroHP = Math.min(maxHp, hero?.hp ?? maxHp);
  const currentHeroMP = Math.min(maxMp, hero?.mp ?? maxMp);
  const currentHeroCP = Math.min(maxCp, hero?.cp ?? maxCp);

  const basePower = typeof levelDef.power === "number" ? levelDef.power : 0;
  const levelDiff = Math.abs((hero?.level ?? 1) - (state.mob?.level ?? 1));
  const levelPenalty = levelDiff > 3 ? Math.max(0.5, 1 - (levelDiff - 3) * 0.1) : 1.0;
  const healAmount = Math.round(basePower * levelPenalty);

  const nextHeroHP = Math.min(maxHp, currentHeroHP + healAmount);
  const nextHeroMP = currentHeroMP - mpCost;
  const nextCD = now + cooldownMs(def.cooldown, false);
  const cooldownValue = Number.isFinite(nextCD) ? nextCD : now + 5000;
  const updatedCooldowns = { ...(get().cooldowns || {}), [skillId]: cooldownValue };

  const newLog = [
    `${def.name}: +${healAmount} HP из трупа ${state.mob?.name ?? "монстра"}`,
    ...state.log,
  ].slice(0, 30);

  const updateHero = useHeroStore.getState().updateHero;
  
  // Перераховуємо стати після зміни HP через Corpse Life Drain, щоб активувати/деактивувати пасивні скіли з hpThreshold
  const heroWithNewHp = { ...hero, hp: nextHeroHP, maxHp: maxHp };
  const recalculated = recalculateAllStats(heroWithNewHp, activeBuffs);
  
  // Оновлюємо battleStats якщо вони змінилися
  if (recalculated.finalStats.pAtk !== hero?.battleStats?.pAtk ||
      recalculated.finalStats.mAtk !== hero?.battleStats?.mAtk ||
      recalculated.finalStats.pDef !== hero?.battleStats?.pDef ||
      recalculated.finalStats.mDef !== hero?.battleStats?.mDef) {
    updateHero({ 
      hp: nextHeroHP, 
      mp: nextHeroMP,
      battleStats: recalculated.finalStats 
    });
  } else {
    updateHero({ hp: nextHeroHP, mp: nextHeroMP });
  }

  const updates: Partial<BattleState> = {
    status: state.status,
    log: newLog,
    cooldowns: updatedCooldowns,
    heroBuffs: activeBuffs,
    mob: undefined, // Corpse disappears
    mobHP: 0,
  };
  set((prev) => ({ ...(prev as any), ...updates }));
  persistSnapshot(get, persistBattle, updates);
  return true;
}

