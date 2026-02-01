/**
 * Централізована функція для перерахунку ВСІХ статів героя
 * Це просто orchestration - викликає всі функції в правильному порядку
 * 
 * Порядок перерахунку (як у L2):
 * 1. baseStats (race + class)
 * 2. level scaling
 * 3. equipment bonuses
 * 4. passive skills
 * 5. buffs (пізніше)
 * 6. caps / limits
 */
import { calcBaseStats } from "./calcBaseStats";
import { calcResources } from "./calcResources";
import { calcCombatStats } from "./calcCombatStats";
import { 
  applyPassiveSkillsToCombat, 
  applyPassiveSkillsToResources 
} from "./applyPassiveSkills";
import { applyBaseStatGrowthByClass } from "./applyBaseStatGrowth";
import { computeBuffedMaxResources, applyBuffsToStats } from "../../state/battle/helpers";
import { getMaxResources } from "../../state/battle/helpers/getMaxResources";
import { getSkillDef } from "../../state/battle/loadout";
import type { BattleBuff } from "../../state/battle/types";

export interface RecalculatedStats {
  baseStats: {
    STR: number;
    DEX: number;
    CON: number;
    INT: number;
    WIT: number;
    MEN: number;
  };
  originalBaseStats: {
    STR: number;
    DEX: number;
    CON: number;
    INT: number;
    WIT: number;
    MEN: number;
  };
  resources: {
    hp: number;
    maxHp: number;
    mp: number;
    maxMp: number;
    cp: number;
    maxCp: number;
  };
  finalStats: {
    pAtk: number;
    mAtk: number;
    pDef: number;
    mDef: number;
    accuracy: number;
    evasion: number;
    crit: number;
    mCrit: number;
    critPower: number;
    attackSpeed: number;
    castSpeed: number;
    hpRegen: number;
    mpRegen: number;
    cpRegen: number;
    shieldBlockRate?: number;
    shieldBlockPower?: number;
  };
  // Стати БЕЗ бафів (для бойової логіки)
  baseFinalStats: {
    pAtk: number;
    mAtk: number;
    pDef: number;
    mDef: number;
    accuracy: number;
    evasion: number;
    crit: number;
    mCrit: number;
    critPower: number;
    attackSpeed: number;
    castSpeed: number;
    hpRegen: number;
    mpRegen: number;
    cpRegen: number;
    shieldBlockRate?: number;
    shieldBlockPower?: number;
  };
}

export function recalculateAllStats(
  hero: any,
  buffs: BattleBuff[] = []
): RecalculatedStats {
  // 1. baseStats (race + class) - ОРИГІНАЛЬНІ, НЕ ЗМІНЮЮТЬСЯ
  // Використовуємо baseStatsInitial якщо є, інакше baseStats, інакше обчислюємо
  const originalBaseStats = hero.baseStatsInitial || 
    hero.baseStats || 
    calcBaseStats(
      hero.race || "Human", 
      hero.klass || hero.profession || "Fighter"
    );

  const level = hero.level || 1;

  // 1.5. Застосовуємо ріст базових статів за рівнем (L2-стиль)
  // Ріст застосовується ТІЛЬКИ до копії, НЕ змінюємо originalBaseStats
  let grownBaseStats = applyBaseStatGrowthByClass(
    originalBaseStats,
    level,
    hero.klass,
    hero.profession
  );

  // 1.6. Застосовуємо краски (dyes) до базових статів
  // Краски застосовуються ПІСЛЯ росту за рівнем, АЛЕ ДО розрахунку ресурсів та бойових статів
  if (hero.activeDyes && hero.activeDyes.length > 0) {
    grownBaseStats = { ...grownBaseStats }; // Створюємо копію
    
    for (const dye of hero.activeDyes) {
      // Додаємо до плюсового стату
      grownBaseStats[dye.statPlus] = (grownBaseStats[dye.statPlus] || 0) + dye.effect;
      
      // Віднімаємо від мінусового стату (але не нижче мінімуму)
      const minStat = 3; // Мінімальне значення стату
      grownBaseStats[dye.statMinus] = Math.max(
        minStat,
        (grownBaseStats[dye.statMinus] || 0) - dye.effect
      );
    }
  }

  // 2. level scaling -> resources (використовуємо зрощені стати)
  const resources = calcResources(grownBaseStats, level, hero.equipment, hero.activeDyes);

  // 3. level scaling + equipment bonuses -> combat stats (використовуємо зрощені стати)
  let combatStats = calcCombatStats(
    grownBaseStats,
    level,
    hero.equipment,
    hero.equipmentEnchantLevels,
    hero.activeDyes
  );

  // 3.5. Бонус 7 печатей (победитель 1-3 місце) — рандомні стати з heroJson
  const sevenSealsBonus = (hero as any)?.heroJson?.sevenSealsBonus;
  if (sevenSealsBonus && typeof sevenSealsBonus === "object") {
    const b = sevenSealsBonus as { pAtk?: number; mAtk?: number; pDef?: number; mDef?: number };
    combatStats = {
      ...combatStats,
      pAtk: combatStats.pAtk + (Number(b.pAtk) || 0),
      mAtk: combatStats.mAtk + (Number(b.mAtk) || 0),
      pDef: combatStats.pDef + (Number(b.pDef) || 0),
      mDef: combatStats.mDef + (Number(b.mDef) || 0),
    };
  }

  // 🔍 ДІАГНОСТИКА: перевіряємо mDef ПІСЛЯ екіпіровки, ПЕРЕД пасивками
  console.log(`[recalculateAllStats] mDef after equipment:`, {
    mDef: combatStats.mDef,
    equipment: hero.equipment,
  });

  // 4. passive skills -> combat stats
  const learnedSkills = Array.isArray(hero.skills) ? hero.skills : [];
  
  // 🔍 ДІАГНОСТИКА: перевіряємо, чи є Anti Magic в learnedSkills
  const antiMagicSkill = learnedSkills.find((s: any) => s.id === 146);
  console.log(`[recalculateAllStats] Anti Magic skill in learnedSkills:`, {
    found: !!antiMagicSkill,
    skill: antiMagicSkill,
    allSkills: learnedSkills.map((s: any) => ({ id: s.id, level: s.level })),
  });
  
  // Отримуємо maxHp з бафами для правильної перевірки умови HP
  const baseMax = getMaxResources(hero);
  const buffedMax = computeBuffedMaxResources(baseMax, buffs);
  const currentMaxHp = buffedMax.maxHp;
  
  // Використовуємо поточний HP героя та maxHp З БАФАМИ для перевірки умов HP в пасивних скілах
  // (наприклад, Final Frenzy активується коли HP < 40% від maxHp з бафами)
  // ❗ ВАЖЛИВО: Якщо hero.hp не встановлено або дорівнює/більше базового maxHp (без бафів),
  // то вважаємо що герой має повне HP (100% від maxHp з бафами)
  // Це гарантує, що скіли з hpThreshold не активуються при повному HP
  let currentHp: number;
  if (hero.hp === undefined || hero.hp === null) {
    // HP не встановлено - вважаємо повне HP з бафами
    currentHp = currentMaxHp;
  } else if (hero.hp >= resources.maxHp) {
    // HP дорівнює або більше базового maxHp (без бафів) - вважаємо повне HP з бафами
    // Це гарантує, що якщо герой мав повне HP без бафів, він має повне HP з бафами
    currentHp = currentMaxHp;
  } else {
    // HP менше базового maxHp - використовуємо як є (але не більше currentMaxHp)
    currentHp = Math.min(currentMaxHp, Math.max(0, hero.hp));
  }
  
  // Діагностика для скілів з hpThreshold (наприклад, Final Frenzy)
  const hasHpThresholdSkill = learnedSkills.some((s: any) => {
    const skillDef = getSkillDef(s.id);
    return skillDef?.hpThreshold !== undefined;
  });
  if (hasHpThresholdSkill) {
    console.log(`[recalculateAllStats] HP check for hpThreshold skills:`, {
      heroHp: hero.hp,
      resourcesMaxHp: resources.maxHp,
      currentMaxHp,
      currentHp,
      hpPercent: currentMaxHp > 0 ? (currentHp / currentMaxHp) : 1,
      buffsCount: buffs.length,
    });
  }
  
  // Діагностика перед викликом applyPassiveSkillsToCombat
  if (hasHpThresholdSkill) {
    console.log(`[recalculateAllStats] Calling applyPassiveSkillsToCombat with HP:`, {
      currentHp,
      currentMaxHp,
      currentHpType: typeof currentHp,
      currentMaxHpType: typeof currentMaxHp,
      learnedSkillsCount: learnedSkills.length,
    });
  }
  
  const finalCombatStats = applyPassiveSkillsToCombat(
    combatStats,
    learnedSkills,
    buffs,
    currentHp,
    currentMaxHp,
    hero.equipment
  );

  // 🔍 ДІАГНОСТИКА: перевіряємо mDef ПІСЛЯ пасивок
  console.log(`[recalculateAllStats] mDef after passives:`, {
    mDefBefore: combatStats.mDef,
    mDefAfter: finalCombatStats.mDef,
    difference: finalCombatStats.mDef - combatStats.mDef,
  });

  // 4. passive skills -> resources (БЕЗ бафів - бафи застосовуються в computeBuffedMaxResources)
  const finalResources = applyPassiveSkillsToResources(
    resources,
    learnedSkills,
    [], // ❗ НЕ передаємо бафи - вони застосовуються в computeBuffedMaxResources
    hero.equipment // Передаємо equipment для перевірки умов (броня/зброя)
  );

  // 5. Бафи НЕ застосовуються тут в recalculateAllStats
  // Бафи застосовуються в бою через applyBuffsToStats(hero.battleStats, activeBuffs)
  // Це гарантує, що hero.battleStats містить стати БЕЗ бафів (базові + екіпіровка + сетові бонуси + пасивні скіли)
  // А бафи застосовуються динамічно в бою на основі поточних activeBuffs
  // Для ресурсів (HP/MP/CP) бафи застосовуються в computeBuffedMaxResources при використанні
  // Це гарантує, що hero.maxHp містить базове значення БЕЗ бафів
  // 6. caps / limits вже застосовані в calcCombatStats

  // 7. Clamp поточні ресурси до нових max значень (L2 правило)
  // Якщо passive змінює maxHp/maxMp/maxCp, поточні ресурси не міняються автоматично
  // Але вони не можуть перевищувати нові max значення
  const clampedResources = {
    ...finalResources,
    hp: Math.min(finalResources.hp, finalResources.maxHp),
    mp: Math.min(finalResources.mp, finalResources.maxMp),
    cp: Math.min(finalResources.cp, finalResources.maxCp),
  };

  // 8. Застосовуємо бафи до статів для відображення в UI (Stats.tsx)
  // ❗ ВАЖЛИВО: В бою бафи застосовуються через applyBuffsToStats(hero.battleStats, activeBuffs)
  // Але для відображення в UI (Stats.tsx) треба застосувати бафи тут
  const statsWithBuffsForDisplay = applyBuffsToStats(finalCombatStats, buffs);

  // 9. Конвертуємо crit та mCrit в відсотки (для відображення)
  // Формула: critPercent = Math.min(100, Math.round(crit / 10))
  // Наприклад: crit = 1200 → critPercent = 100% (1200 / 10 = 120, обмежено до 100)
  // Наприклад: crit = 350 → critPercent = 35% (350 / 10 = 35)
  const baseStatsWithPercent = {
    ...finalCombatStats,
    crit: Math.min(100, Math.round(finalCombatStats.crit / 10)),
    mCrit: Math.min(100, Math.round(finalCombatStats.mCrit / 10)),
  };
  const finalStatsWithPercent = {
    ...statsWithBuffsForDisplay,
    crit: Math.min(100, Math.round(statsWithBuffsForDisplay.crit / 10)), // Конвертуємо flat → %
    mCrit: Math.min(100, Math.round(statsWithBuffsForDisplay.mCrit / 10)), // Конвертуємо flat → %
  };

  return {
    baseStats: grownBaseStats, // ЗРОЩЕНІ стати для відображення в UI
    originalBaseStats: originalBaseStats, // ОРИГІНАЛЬНІ стати для збереження
    resources: clampedResources,
    finalStats: finalStatsWithPercent, // ✅ Значення З бафами для UI
    baseFinalStats: baseStatsWithPercent, // ✅ Значення БЕЗ бафів (бойова логіка)
  };
}

