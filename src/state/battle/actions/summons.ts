/**
 * Summon system for Phantom Summoner and other classes
 * Centralized logic for summoning, managing, and attacking with summons
 */

import type { BattleState, BattleBuff } from "../types";
import type { Hero } from "../../../types/Hero";
import type { SkillDefinition, SkillLevelDefinition } from "../../../data/skills/types";
import { calcCooldownMs } from "../cooldowns";
import { persistSnapshot } from "../helpers";
import { persistBattle } from "../persist";
import { useHeroStore } from "../../heroStore";
import { getMaxResources } from "../helpers/getMaxResources";
import { computeBuffedMaxResources } from "../helpers";
import { cleanupSummonBuffs, computeBuffedSummonStats } from "../helpers/summonBuffs";
import { hasSpiritshotActive } from "./useSkill/shotHelpers";
import { getMobTargetStatsForHeroDamage } from "../helpers/mobTargetStats";
import { commitMobVictoryToHeroStore } from "../commitMobVictory";
import { buildVictoryResourceLogLines } from "../helpers/victoryLootLogLines";

type Setter = (
  partial: Partial<BattleState> | ((state: BattleState) => Partial<BattleState>),
  replace?: boolean
) => void;

/**
 * All summon skill IDs for Phantom Summoner and other classes
 */
export const PHANTOM_SUMMONER_SUMMON_SKILLS = new Set([
  // Phantom Summoner summons
  1128,  // Summon Shadow
  1226,  // Summon Boxer the Unicorn
  1228,  // Summon Silhouette
  1276,  // Summon Kai the Cat
  1278,  // Summon Soulless
  1333,  // Summon Nightshade
  // DarkAvenger summons
  283,   // Summon Dark Panther
  // Wizard summons
  1225,  // Summon Mew the Cat
  // Elemental Summoner summons
  1277,  // Summon Unicorn Merrow
  1332,  // Summon Unicorn Seraphim
]);

/**
 * Servitor heal/recharge skill IDs
 */
export const SERVITOR_HEAL_SKILLS = new Set([
  1126,  // Servitor Recharge
  1127,  // Servitor Heal
  1300,  // Servitor Cure
]);

/**
 * Servitor buff skill IDs
 */
export const SERVITOR_BUFF_SKILLS = new Set([
  1301,  // Servitor Blessing
  1299,  // Servitor Ultimate Defense
  1140,  // Servitor Physical Shield
  1146,  // Mighty Servitor
  1230,  // Bright Servitor
  1349,  // Final Servitor (Spectral Master)
]);

/**
 * Summon configuration based on skill ID
 */
const SUMMON_CONFIG: Record<number, {
  expPenalty: number;  // Experience penalty (0.0 = 0%, 0.9 = 90%)
  hpMultiplier: number; // HP multiplier from hero max HP
  mpMultiplier: number; // MP multiplier from hero max MP
  statMultiplier: number; // Stats multiplier from hero stats
  name?: string;       // Custom name override
}> = {
  1128: { expPenalty: 0.3, hpMultiplier: 0.7, mpMultiplier: 0.7, statMultiplier: 0.65, name: "Shadow" },
  1226: { expPenalty: 0.3, hpMultiplier: 0.7, mpMultiplier: 0.7, statMultiplier: 0.65, name: "Boxer the Unicorn" },
  1228: { expPenalty: 0.9, hpMultiplier: 0.7, mpMultiplier: 0.7, statMultiplier: 0.65, name: "Silhouette" },
  1276: { expPenalty: 0.1, hpMultiplier: 0.7, mpMultiplier: 0.7, statMultiplier: 0.65, name: "Kai the Cat" },
  1278: { expPenalty: 0.1, hpMultiplier: 0.7, mpMultiplier: 0.7, statMultiplier: 0.65, name: "Soulless" },
  1333: { expPenalty: 0.05, hpMultiplier: 0.7, mpMultiplier: 0.7, statMultiplier: 0.65, name: "Nightshade" },
  283: { expPenalty: 0.15, hpMultiplier: 0.4, mpMultiplier: 0.4, statMultiplier: 0.4, name: "Dark Panther" },
  1225: { expPenalty: 0.05, hpMultiplier: 0.7, mpMultiplier: 0.7, statMultiplier: 0.65, name: "Mew the Cat" },
  // Elemental Summoner summons
  1277: { expPenalty: 0.1, hpMultiplier: 0.7, mpMultiplier: 0.7, statMultiplier: 0.65, name: "Unicorn Merrow" },
  1332: { expPenalty: 0.05, hpMultiplier: 0.7, mpMultiplier: 0.7, statMultiplier: 0.65, name: "Unicorn Seraphim" },
};

/**
 * Handle summon skill - creates a new summon
 */
export function handleSummon(
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
  if (!PHANTOM_SUMMONER_SUMMON_SKILLS.has(skillId)) return false;

  const config = SUMMON_CONFIG[skillId] || {
    expPenalty: 0.3,
    hpMultiplier: 0.7,
    mpMultiplier: 0.7,
    statMultiplier: 0.65,
  };

  const { maxHp, maxMp, maxCp } = computeMaxNow(activeBuffs);
  const curHeroMP = Math.min(maxMp, hero?.mp ?? maxMp);

  // Check MP cost
  if (curHeroMP < mpCost) return false;

  const nextHeroMP = curHeroMP - mpCost;

  // Calculate summon stats based on hero stats
  const summonMaxHp = Math.max(1, Math.round(maxHp * config.hpMultiplier));
  const summonMaxMp = Math.max(1, Math.round(maxMp * config.mpMultiplier));
  const basePAtk = Math.round((heroStats?.pAtk ?? 0) * config.statMultiplier);
  const baseMAtk = Math.round((heroStats?.mAtk ?? 0) * config.statMultiplier);
  const basePDef = Math.round((heroStats?.pDef ?? 0) * config.statMultiplier);
  const baseMDef = Math.round((heroStats?.mDef ?? 0) * config.statMultiplier);
  
  // Apply percentage bonus from power (for skills like Summon Dark Panther)
  // power is percentage bonus: 5 = +5%, 35 = +35%
  // Only apply if power > 0 (to avoid affecting other summons)
  const powerPercent = typeof levelDef.power === "number" && levelDef.power > 0 ? levelDef.power : 0;
  const powerMultiplier = powerPercent > 0 ? 1 + (powerPercent / 100) : 1;
  
  const summonPAtk = Math.round(basePAtk * powerMultiplier);
  const summonMAtk = Math.round(baseMAtk * powerMultiplier);
  const summonPDef = Math.round(basePDef * powerMultiplier);
  const summonMDef = Math.round(baseMDef * powerMultiplier);
  
  // Debug logging for Summon Dark Panther and Summon Mew the Cat
  if (skillId === 283 || skillId === 1225) {
    console.log(`[handleSummon] ${skillId === 283 ? 'Summon Dark Panther' : 'Summon Mew the Cat'} (Lv ${levelDef.level}):`, {
      skillId,
      level: levelDef.level,
      power: levelDef.power,
      powerPercent,
      powerMultiplier,
      heroPAtk: heroStats?.pAtk,
      heroMAtk: heroStats?.mAtk,
      heroPDef: heroStats?.pDef,
      heroMDef: heroStats?.mDef,
      statMultiplier: config.statMultiplier,
      basePAtk,
      baseMAtk,
      basePDef,
      baseMDef,
      summonPAtk,
      summonMAtk,
      summonPDef,
      summonMDef,
      bonusPAtk: summonPAtk - basePAtk,
      bonusMAtk: summonMAtk - baseMAtk,
      bonusPDef: summonPDef - basePDef,
      bonusMDef: summonMDef - baseMDef,
    });
  }

  const nextCD = now + cooldownMs(def.cooldown, false);
  const cooldownValue = Number.isFinite(nextCD) ? nextCD : now + 5000;
  const updatedCooldowns = { ...(get().cooldowns || {}), [skillId]: cooldownValue };

  const summonName = config.name || def.name;

  // Зберігаємо базові стати сумону (без бафів)
  const baseSummonStats = {
    pAtk: summonPAtk,
    pDef: summonPDef,
    mAtk: summonMAtk,
    mDef: summonMDef,
    maxHp: summonMaxHp,
    maxMp: summonMaxMp,
  };

  const newSummon = {
    id: def.id,
    name: summonName,
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
    expPenalty: config.expPenalty,
  };

  // Debug logging for Summon Dark Panther and Summon Mew the Cat creation
  if (skillId === 283 || skillId === 1225) {
    console.log(`[handleSummon] Creating ${skillId === 283 ? 'Summon Dark Panther' : 'Summon Mew the Cat'} with stats:`, {
      newSummon,
      baseSummonStats,
    });
  }

  const updateHero = useHeroStore.getState().updateHero;
  updateHero({ mp: nextHeroMP });

  // Apply master buff for Unicorn Seraphim (skill 1332)
  let newHeroBuffs = activeBuffs;
  if (skillId === 1332 && def.effects && Array.isArray(def.effects)) {
    const skillLevel = levelDef.level || 1;
    const buffPercent = skillLevel; // 1% per level (level 1 = 1%, level 10 = 10%)
    
    // Create buff effects based on skill level
    const buffEffects = def.effects.map((eff: any) => {
      if (eff.stat === "maxHp" || eff.stat === "pAtk" || eff.stat === "mAtk") {
        return {
          ...eff,
          value: buffPercent, // +1% per level
        };
      } else if (eff.stat === "cooldownReduction") {
        return {
          ...eff,
          value: buffPercent, // -1% cooldown per level
        };
      }
      return eff;
    });

    // Remove existing Unicorn Seraphim buff if present
    const isSameBuff = (b: any) => b.id === def.id || b.name === def.name;
    const filteredBuffs = activeBuffs.filter((b) => !isSameBuff(b));

    // Create new buff for master
    const masterBuff: BattleBuff = {
      id: def.id,
      name: `${def.name} (Master Buff)`,
      icon: def.icon || "/skills/attack.jpg",
      effects: buffEffects,
      expiresAt: Number.MAX_SAFE_INTEGER, // Permanent while summon is alive
      startedAt: now,
      durationMs: Number.MAX_SAFE_INTEGER,
      source: "summon",
    };

    newHeroBuffs = [...filteredBuffs, masterBuff];
  }

  const newLog = [`Вы призвали ${summonName}`, ...state.log].slice(0, 30);
  const updates: Partial<BattleState> = {
    status: state.status,
    log: newLog,
    cooldowns: updatedCooldowns,
    heroBuffs: newHeroBuffs,
    baseSummonStats,
    summon: newSummon,
    summonBuffs: [],
  };

  set((prev) => ({ ...(prev as any), ...(updates as any) }));
  persistSnapshot(get, persistBattle, updates);
  return true;
}

/**
 * Handle servitor heal/recharge/cure skills
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
  if (!SERVITOR_HEAL_SKILLS.has(skillId)) return false;

  const hero = useHeroStore.getState().hero;
  const { maxHp, maxMp, maxCp } = computeMaxNow(activeBuffs);
  const currentHeroMP = Math.min(maxMp, hero?.mp ?? maxMp);

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
    def.powerType === "percent" ? Math.round(state.summon.maxHp * (basePower / 100)) : basePower;
  let healAmount = Math.round(healAmountRaw * (1 + Math.max(0, healBonus) / 100));
  
  // Якщо spiritshot увімкнений на панелі - збільшуємо хіл в 2 рази
  const spiritshotActive = hasSpiritshotActive(hero, state.loadoutSlots ?? [], state.activeChargeSlots ?? []);
  if (spiritshotActive) {
    healAmount = Math.round(healAmount * 2);
  }

  const nextCD = now + cooldownMs(def.cooldown, false);
  const cooldownValue = Number.isFinite(nextCD) ? nextCD : now + 5000;
  const updatedCooldowns = { ...(get().cooldowns || {}), [skillId]: cooldownValue };
  const nextHeroMP = currentHeroMP - mpCost;

  // Determine skill type
  const isMpHeal = skillId === 1126; // Servitor Recharge
  const isCure = skillId === 1300; // Servitor Cure

  let healedSummonHp = state.summon.hp;
  let healedSummonMp = state.summon.mp;
  let logMessage = "";

  if (isCure) {
    // Cure removes debuffs (bleed, poison) - for now just heal a bit
    healedSummonHp = Math.min(state.summon.maxHp, state.summon.hp + Math.round(healAmount * 0.5));
    logMessage = `${def.name}: вылечил призванное существо (+${Math.round(healAmount * 0.5)} HP)`;
  } else if (isMpHeal) {
    healedSummonMp = Math.min(state.summon.maxMp, state.summon.mp + healAmount);
    logMessage = `${def.name}: +${healAmount} MP призванному существу`;
  } else {
    healedSummonHp = Math.min(state.summon.maxHp, state.summon.hp + healAmount);
    logMessage = `${def.name}: +${healAmount} HP призванному существу`;
  }

  const updatedSummon = { ...state.summon, hp: healedSummonHp, mp: healedSummonMp };
  const newLog = [logMessage, ...state.log].slice(0, 30);

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
 * Handle servitor buff skills
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
  if (!SERVITOR_BUFF_SKILLS.has(skillId)) return false;

  const hero = useHeroStore.getState().hero;
  const { maxHp, maxMp, maxCp } = computeMaxNow(activeBuffs);
  const currentHeroMP = Math.min(maxMp, hero?.mp ?? maxMp);

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

  const nextCD = now + cooldownMs(def.cooldown, false);
  const cooldownValue = Number.isFinite(nextCD) ? nextCD : now + 5000;
  const updatedCooldowns = { ...(get().cooldowns || {}), [skillId]: cooldownValue };
  const nextHeroMP = currentHeroMP - mpCost;

  // Очищаємо застарілі бафи сумону
  const cleanedSummonBuffs = cleanupSummonBuffs(state.summonBuffs || [], now);
  
  // Витягуємо ефекти з визначення скілу
  const effects = Array.isArray(def.effects) ? def.effects : [];
  const effList = effects.length > 0
    ? effects.map((eff: any) => {
        const base =
          typeof eff.value === "number"
            ? eff.value
            : typeof levelDef.power === "number"
            ? levelDef.power
            : 0;
        return {
          ...eff,
          value: base * (eff.multiplier ?? 1),
          mode: eff.mode ?? (def.powerType === "percent" ? "percent" : eff.mode ?? "flat"),
        };
      })
    : typeof levelDef.power === "number" && def.powerType === "percent"
    ? [{ stat: "pDef", mode: "percent", value: levelDef.power }]
    : [];

  // Спеціальна обробка для різних скілів
  let finalEffList = effList;
  if (skillId === 1299) {
    // Servitor Ultimate Defense - +3600 P.Def, +2700 M.Def (flat)
    finalEffList = [
      { stat: "pDef", mode: "flat", value: 3600 },
      { stat: "mDef", mode: "flat", value: 2700 },
    ];
  } else if (skillId === 1140) {
    // Servitor Physical Shield - percent P.Def (and M.Def at level 5)
    finalEffList = [{ stat: "pDef", mode: "percent", value: levelDef.power ?? 5 }];
    if (levelDef.level === 5) {
      finalEffList.push({ stat: "mDef", mode: "percent", value: levelDef.power ?? 25 });
    }
  } else if (skillId === 1146) {
    // Mighty Servitor - multiplier P.Atk (power is multiplier: 1.08, 1.12, 1.15)
    const multiplier = typeof levelDef.power === "number" ? levelDef.power : 1.0;
    finalEffList = [{ stat: "pAtk", mode: "multiplier", value: multiplier }];
  } else if (skillId === 1349) {
    // Final Servitor (1349) - використовуємо ефекти з визначення
    finalEffList = effects.length > 0 ? effList : [];
  }

  // Видаляємо старі бафи з таким самим stackType або id
  const isSameBuff = (b: any) =>
    b.id === def.id || b.name === def.name || (def.stackType && b.stackType === def.stackType);
  const filteredSummonBuffs = cleanedSummonBuffs.filter((b) => !isSameBuff(b));

  // Додаємо новий баф
  const durationSec = def.duration ?? 10;
  const newSummonBuff: BattleBuff = {
    id: def.id,
    name: def.name,
    icon: def.icon || "/skills/attack.jpg",
    stackType: def.stackType,
    effects: finalEffList,
    expiresAt: now + durationSec * 1000,
    startedAt: now,
    durationMs: durationSec * 1000,
    source: "skill",
  };

  // Обчислюємо забафлені стати сумону від базових статів (щоб уникнути множення)
  let baseStats = state.baseSummonStats;
  let shouldResetBuffs = false;
  
  // Якщо baseSummonStats не існує, створюємо його з поточних статів сумону
  if (!baseStats && state.summon) {
    // Якщо є активні бафи, це означає, що стати вже забафлені
    // У такому випадку скидаємо всі бафи і створюємо baseSummonStats з поточних статів
    if (cleanedSummonBuffs.length > 0) {
      // Скидаємо всі бафи, щоб отримати базові стати
      // Це не ідеально, але краще ніж множення ефектів
      shouldResetBuffs = true;
    }
    
    // Створюємо базові стати з поточних (для сумонів, створених до додавання baseSummonStats)
    baseStats = {
      pAtk: state.summon.pAtk ?? 0,
      pDef: state.summon.pDef ?? 0,
      mAtk: state.summon.mAtk ?? 0,
      mDef: state.summon.mDef ?? 0,
      maxHp: state.summon.maxHp ?? 1,
      maxMp: state.summon.maxMp ?? 1,
    };
  }
  
  if (!baseStats) {
    // Якщо все ще немає базових статів, використовуємо поточні
    baseStats = {
      pAtk: state.summon?.pAtk ?? 0,
      pDef: state.summon?.pDef ?? 0,
      mAtk: state.summon?.mAtk ?? 0,
      mDef: state.summon?.mDef ?? 0,
      maxHp: state.summon?.maxHp ?? 1,
      maxMp: state.summon?.maxMp ?? 1,
    };
  }
  
  // Якщо baseSummonStats не існував і були бафи, скидаємо їх і починаємо з чистого листа
  const finalSummonBuffs = shouldResetBuffs
    ? [newSummonBuff] // Скидаємо старі бафи, залишаємо тільки новий
    : [...filteredSummonBuffs, newSummonBuff];
  
  const buffedStats = computeBuffedSummonStats(baseStats, finalSummonBuffs);

  // Оновлюємо стати сумону (вже округлені в computeBuffedSummonStats)
  const updatedSummon = {
    ...state.summon,
    pAtk: buffedStats.pAtk,
    pDef: buffedStats.pDef,
    mAtk: buffedStats.mAtk,
    mDef: buffedStats.mDef,
    attackSpeed: buffedStats.attackSpeed,
    castSpeed: buffedStats.castSpeed,
    runSpeed: buffedStats.runSpeed,
    critRate: buffedStats.critRate,
    critDamage: buffedStats.critDamage,
    accuracy: buffedStats.accuracy,
    evasion: buffedStats.evasion,
    debuffResist: buffedStats.debuffResist,
    vampirism: buffedStats.vampirism,
  };
  
  // Оновлюємо baseSummonStats, якщо його не було (для старих сумонів)
  const updatedBaseStats = state.baseSummonStats || baseStats;

  // Формуємо повідомлення в лог
  let logMessage = "";
  if (skillId === 1301) {
    logMessage = `${def.name}: снял негативные эффекты с призванного существа`;
  } else if (skillId === 1299) {
    logMessage = `${def.name}: +3600 P.Def, +2700 M.Def призванному существу (30 сек)`;
  } else if (skillId === 1140) {
    const pDefPercent = levelDef.power ?? 5;
    const logText = levelDef.level === 5
      ? `+${pDefPercent}% P.Def, +${pDefPercent}% M.Def`
      : `+${pDefPercent}% P.Def`;
    logMessage = `${def.name}: ${logText} призванному существу (${durationSec} сек)`;
  } else if (skillId === 1146) {
    const multiplier = typeof levelDef.power === "number" ? levelDef.power : 1.0;
    const percent = Math.round((multiplier - 1) * 100);
    logMessage = `${def.name}: +${percent}% P.Atk призванному существу (${durationSec} сек)`;
  } else if (skillId === 1349) {
    // Final Servitor
    const effectsList: string[] = [];
    finalEffList.forEach((eff) => {
      const stat = eff.stat;
      const value = eff.value ?? 0;
      const mode = eff.mode;
      if (mode === "percent") {
        if (stat === "pAtk") effectsList.push(`+${value}% P.Atk`);
        else if (stat === "mAtk") effectsList.push(`+${value}% M.Atk`);
        else if (stat === "pDef") effectsList.push(`+${value}% P.Def`);
        else if (stat === "mDef") effectsList.push(`+${value}% M.Def`);
        else if (stat === "attackSpeed") effectsList.push(`+${value}% Atk.Spd`);
        else if (stat === "castSpeed") effectsList.push(`+${value}% Cast.Spd`);
        else if (stat === "critRate") effectsList.push(`+${value}% Crit`);
        else if (stat === "critDamage") effectsList.push(`+${value}% Crit.Dmg`);
        else if (stat === "maxHp") effectsList.push(`+${value}% Max HP`);
        else if (stat === "debuffResist") effectsList.push(`+${value}% Debuff Resist`);
      } else if (mode === "flat") {
        if (stat === "accuracy") effectsList.push(`+${value} Accuracy`);
        else if (stat === "evasion") effectsList.push(`+${value} Evasion`);
      }
    });
    logMessage = `${def.name}: ${effectsList.join(", ")} (${durationSec} сек)`;
  } else {
    logMessage = `${def.name} применено к призванному существу`;
  }

  const updateHero = useHeroStore.getState().updateHero;
  updateHero({ mp: nextHeroMP });

  const updates: Partial<BattleState> = {
    status: state.status,
    log: [logMessage, ...state.log].slice(0, 30),
    cooldowns: updatedCooldowns,
    heroBuffs: activeBuffs,
    summonBuffs: finalSummonBuffs,
    baseSummonStats: updatedBaseStats,
    summon: updatedSummon,
  };
  set((prev) => ({ ...(prev as any), ...updates }));
  persistSnapshot(get, persistBattle, updates);
  return true;
}

/**
 * Process summon attack on mob
 * Called during battle tick to make summon attack
 */
export function processSummonAttack(
  state: BattleState,
  now: number,
  set: Setter,
  get: () => BattleState
): void {
  if (!state.summon || state.summon.hp <= 0) return;
  if (!state.mob || state.mobHP <= 0) return;
  if (state.status !== "fighting") return;

  // Summon attacks every 2-3 seconds
  const lastSummonAttack = (state as any).summonLastAttackAt || 0;
  const summonAttackInterval = 2000 + Math.random() * 1000; // 2-3 seconds
  if (now - lastSummonAttack < summonAttackInterval) return;

  // Обчислюємо забафлені стати сумону від базових статів
  const baseStats = state.baseSummonStats || {
    pAtk: state.summon.pAtk ?? 0,
    pDef: state.summon.pDef ?? 0,
    mAtk: state.summon.mAtk ?? 0,
    mDef: state.summon.mDef ?? 0,
    maxHp: state.summon.maxHp ?? 1,
    maxMp: state.summon.maxMp ?? 1,
  };
  const buffedStats = computeBuffedSummonStats(baseStats, state.summonBuffs || []);
  const summon = state.summon;
  const mob = state.mob;

  // Calculate summon damage using buffed stats
  const summonPAtk = buffedStats.pAtk;
  const summonMAtk = buffedStats.mAtk;
  
  // Debug logging for Summon Dark Panther attacks
  if (summon.id === 283) {
    console.log(`[processSummonAttack] Summon Dark Panther attacking:`, {
      summonId: summon.id,
      baseStats,
      summonBuffs: state.summonBuffs || [],
      buffedStats,
      summonPAtk,
      summonMAtk,
      summonFromState: {
        pAtk: state.summon.pAtk,
        mAtk: state.summon.mAtk,
        pDef: state.summon.pDef,
        mDef: state.summon.mDef,
      },
    });
  }
  
  const { pDef: mobPDefRaw, mDef: mobMDefRaw } = getMobTargetStatsForHeroDamage(mob, state.mobBuffs, now);
  const mobPDef = Math.max(5, mobPDefRaw);
  const mobMDef = Math.max(5, mobMDefRaw);

  // Summon uses physical or magic attack (50/50 chance or based on type)
  const useMagic = summonMAtk > summonPAtk || Math.random() > 0.5;
  const baseDamage = useMagic ? summonMAtk : summonPAtk;
  const mobDef = useMagic ? mobMDef : mobPDef;

  // Simple damage calculation (similar to hero attack)
  const damage = Math.max(1, Math.round(baseDamage * (100 / (100 + mobDef / 2))));
  const critChance = 5; // 5% crit chance for summons
  const isCrit = Math.random() * 100 < critChance;
  const finalDamage = isCrit ? Math.round(damage * 1.5) : damage;

  const newMobHP = Math.max(0, state.mobHP - finalDamage);
  const attackType = useMagic ? "магией" : "физической атакой";
  const critText = isCrit ? " (крит!)" : "";
  const newLog = [
    `${summon.name || "Призванное существо"} атакует ${mob.name} ${attackType} и наносит ${Math.round(finalDamage)} урона${critText}.`,
    ...state.log,
  ].slice(0, 30);

  const updates: Partial<BattleState> = {
    mobHP: newMobHP,
    log: newLog,
    summonLastAttackAt: now,
  };

  // Check if mob is dead
  if (newMobHP <= 0) {
    const curHero = useHeroStore.getState().hero;
    if (!curHero) {
      updates.status = "victory";
      updates.mobHP = 0;
      set((prev) => ({ ...(prev as any), ...updates }));
      persistSnapshot(get, persistBattle, updates);
      return;
    }
    const baseMax = getMaxResources(curHero);
    const { maxHp, maxMp, maxCp } = computeBuffedMaxResources(baseMax, state.heroBuffs || []);
    const postHp = Math.min(maxHp, curHero.hp ?? maxHp);
    const postMp = Math.min(maxMp, curHero.mp ?? maxMp);
    const postCp = Math.min(maxCp, curHero.cp ?? maxCp);

    const v = commitMobVictoryToHeroStore({
      mob,
      heroBuffs: state.heroBuffs || [],
      postVictoryHp: postHp,
      postVictoryMp: postMp,
      postVictoryCp: postCp,
      zoneId: state.zoneId,
      mobIndex: state.mobIndex,
    });
    const { displayExp, displaySp, displayAdena, dropMessages, mobSpoiled, levelUpMessage, partyMemberLootLines } =
      v;
    if (levelUpMessage) newLog.unshift(levelUpMessage);

    updates.status = "victory";
    // Не встановлюємо mob = undefined тут, щоб модалка могла використовувати інформацію про моба
    // mob буде очищено при reset() або startBattle()
    updates.log = [
      `ПЕРЕМОГА!`,
      mobSpoiled ? `Auto Spoil: моб автоматично спойлено.` : null,
      ...buildVictoryResourceLogLines(
        curHero.name ?? "Герой",
        displayExp,
        displaySp,
        displayAdena
      ),
      ...(dropMessages.length > 0 ? dropMessages : []),
      ...(partyMemberLootLines.length > 0 ? partyMemberLootLines : []),
      ...newLog,
    ].filter((msg) => msg !== null).slice(0, 30);
    updates.lastReward = {
      exp: displayExp,
      sp: displaySp,
      adena: displayAdena,
      mob: mob.name ?? "",
      spoiled: mobSpoiled,
      mobAggressivePatrol: mob.aggressivePatrol === true,
    };
  }

  set((prev) => ({ ...(prev as any), ...updates }));
  persistSnapshot(get, persistBattle, updates);
}

