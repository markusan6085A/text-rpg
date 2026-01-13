import type { SkillDefinition, SkillLevelDefinition } from "../types";
import type { SkillStat } from "../types/stats";

// Weapon Mastery (skill 249) values from XML - used for special percent calculations
const WEAPON_MASTERY_PATK = [1.5, 2.8, 4.5, 5.7, 6.7, 8.3, 9.5, 11.6, 13.3, 16, 17, 18.1, 20.4, 21.6, 22.8, 25.5, 26.9, 28.3, 31.4, 33, 34.6, 38, 39.8, 41.7, 43.5, 45.4, 47.4, 49.4, 51.4, 53.5, 55.6, 57.7, 59.9, 62.0, 64.1, 66.8, 68.5, 70.7, 72.9, 75.1, 77.2, 79.4];
const WEAPON_MASTERY_MATK = [1.9, 3.5, 5.7, 7.2, 8.3, 10.3, 11.9, 14.6, 16.6, 20, 21.3, 22.6, 25.4, 26.9, 28.5, 31.8, 33.6, 35.4, 39.2, 41.2, 43.2, 47.5, 49.8, 52.1, 54.4, 56.8, 59.2, 61.7, 64.3, 66.8, 69.4, 72.1, 74.8, 77.4, 80.2, 82.9, 85.6, 88.4, 91.1, 93.8, 96.5, 99.3];

// Weapon Mastery (skill 142) for Elven Wizard - levels 3-9
// pAtk values: 4.5, 5.7, 6.7, 8.3, 9.5, 11.6, 13.3
// mAtk values: 5.7, 7.2, 8.3, 10.3, 11.9, 14.6, 16.6
const WEAPON_MASTERY_142_PATK = [4.5, 5.7, 6.7, 8.3, 9.5, 11.6, 13.3];
const WEAPON_MASTERY_142_MATK = [5.7, 7.2, 8.3, 10.3, 11.9, 14.6, 16.6];

// Weapon Mastery (skill 141) for Overlord and Warcryer - levels 10-42
// pAtk values from Warcryer.txt
const WEAPON_MASTERY_141_PATK = [16, 17, 18.1, 20.4, 21.6, 22.8, 25.5, 26.9, 28.3, 31.4, 33, 34.6, 38, 39.8, 41.7, 43.5, 45.4, 47.4, 49.4, 51.4, 53.5, 55.6, 57.7, 59.8, 62, 64.1, 66.3, 68.5, 70.7, 72.9, 75.1, 77.2, 79.4];
// mAtk values from Warcryer.txt
const WEAPON_MASTERY_141_MATK = [20, 21.3, 22.6, 25.4, 26.9, 28.5, 31.8, 33.6, 35.4, 39.2, 41.2, 43.2, 47.5, 49.8, 52.1, 54.4, 56.8, 59.2, 61.7, 64.3, 66.8, 69.4, 72.1, 74.8, 77.4, 80.2, 82.9, 85.6, 88.4, 91.1, 93.8, 96.5, 99.3];

/**
 * Тип для статів, які можуть бути модифіковані пасивними скілами
 */
export type BattleStats = {
  [K in SkillStat]?: number;
} & {
  pAtk?: number;
  pDef?: number;
  mAtk?: number;
  mDef?: number;
  maxHp?: number;
  maxMp?: number;
  maxCp?: number;
  attackSpeed?: number;
  atkSpeed?: number;
  castSpeed?: number;
  [key: string]: number | undefined;
};

/**
 * Застосовує один пасивний скіл до stats
 * Повертає НОВИЙ об'єкт, не мутує вхідний
 * 
 * ❗ ПРИНЦИП: ЖОДНА мутація вхідного об'єкта
 */
export function applySinglePassive(
  baseStats: BattleStats,
  skill: SkillDefinition,
  level: SkillLevelDefinition
): BattleStats {
  const stats = { ...baseStats };
  const modifiers = skill.effects && skill.effects.length ? skill.effects : undefined;

  // Special handling for Weapon Mastery (skill 249)
  if (skill.id === 249 && modifiers) {
    return applyWeaponMastery(stats, skill, level);
  }

  // Special handling for Weapon Mastery (skill 141) for Overlord and Warcryer
  if (skill.id === 141 && (skill.code === "OL_0141" || skill.code === "WC_0141") && modifiers) {
    return applyWeaponMastery141(stats, skill, level);
  }

  // Special handling for Weapon Mastery (skill 142) for Elven Wizard and Elven Oracle - pAtk and mAtk values
  if (skill.id === 142 && (skill.code === "EW_0142" || skill.code === "EO_0142") && modifiers) {
    return applyWeaponMastery142(stats, skill, level);
  }

  // Special handling for Armor Mastery (skill 142) for Orc Fighter - evasion only for levels 4-5
  if (skill.id === 142 && skill.code === "OF_0142" && modifiers) {
    modifiers.forEach((mod) => {
      if (mod.stat === "evasion" && mod.mode === "flat") {
        // Evasion: 0 for levels 1-3, 3 for levels 4-5
        const evasionValue = level.level >= 4 ? 3 : 0;
        stats.evasion = (stats.evasion ?? 0) + evasionValue;
        return; // Skip default processing for this modifier
      }
    });
  }

  // Special handling for Light Armor Mastery (skill 227) for OrcMonk - different evasion values per level
  if (skill.id === 227 && skill.code === "OM_0227" && modifiers) {
    modifiers.forEach((mod) => {
      if (mod.stat === "evasion" && mod.mode === "flat") {
        // Evasion: 4 for levels 1-2, 6 for levels 3-4, 7 for levels 5-10
        const evasionValue = level.level <= 2 ? 4 : level.level <= 4 ? 6 : 7;
        stats.evasion = (stats.evasion ?? 0) + evasionValue;
        return; // Skip default processing for this modifier
      }
    });
  }

  // Special handling for Light Armor Mastery (skill 227) for Artisan - different evasion values per level
  if (skill.id === 227 && skill.code === "AR_0227" && modifiers) {
    modifiers.forEach((mod) => {
      if (mod.stat === "evasion" && mod.mode === "flat") {
        // Evasion: 3 for levels 1-2, 5 for levels 3-4, 6 for levels 5-13
        const evasionValue = level.level <= 2 ? 3 : level.level <= 4 ? 5 : 6;
        stats.evasion = (stats.evasion ?? 0) + evasionValue;
        return; // Skip default processing for this modifier
      }
    });
  }

  // Special handling for Vital Force (skill 148) for Artisan - different mpRegen values per level
  if (skill.id === 148 && skill.code === "AR_0148" && modifiers) {
    modifiers.forEach((mod) => {
      if (mod.stat === "mpRegen" && mod.mode === "flat") {
        // mpRegen: 0.9 for level 1, 1.1 for level 2
        const mpRegenValue = level.level === 1 ? 0.9 : 1.1;
        stats.mpRegen = (stats.mpRegen ?? 0) + mpRegenValue;
        return; // Skip default processing for this modifier
      }
    });
  }

  // Special handling for Vital Force (skill 148) for Warsmith - different mpRegen values per level
  if (skill.id === 148 && skill.code === "WS_0148" && modifiers) {
    modifiers.forEach((mod) => {
      if (mod.stat === "mpRegen" && mod.mode === "flat") {
        // mpRegen: 1.2 for level 3, 1.5 for level 4, 1.7 for level 5, 1.8 for level 6, 2.1 for level 7, 2.5 for level 8
        const mpRegenValues: Record<number, number> = { 3: 1.2, 4: 1.5, 5: 1.7, 6: 1.8, 7: 2.1, 8: 2.5 };
        const mpRegenValue = mpRegenValues[level.level] ?? 0;
        stats.mpRegen = (stats.mpRegen ?? 0) + mpRegenValue;
        return; // Skip default processing for this modifier
      }
    });
  }

  // Special handling for Esprit (skill 171) for Phantom Ranger - different hpRegen and mpRegen values per level
  if (skill.id === 171 && skill.code === "PR_0171" && modifiers) {
    modifiers.forEach((mod) => {
      if (mod.stat === "hpRegen" && mod.mode === "flat") {
        // hpRegen: 3 for level 2, 3.5 for level 3, 4 for level 4, 4.5 for level 5, 5 for level 6, 5.5 for level 7, 6 for level 8
        const hpRegenValues: Record<number, number> = { 2: 3, 3: 3.5, 4: 4, 5: 4.5, 6: 5, 7: 5.5, 8: 6 };
        const hpRegenValue = hpRegenValues[level.level] ?? 0;
        stats.hpRegen = (stats.hpRegen ?? 0) + hpRegenValue;
        return; // Skip default processing for this modifier
      }
      if (mod.stat === "mpRegen" && mod.mode === "flat") {
        // mpRegen: 0.9 for level 2, 1 for level 3, 1.1 for level 4, 1.2 for level 5, 1.3 for level 6, 1.4 for level 7, 1.5 for level 8
        const mpRegenValues: Record<number, number> = { 2: 0.9, 3: 1, 4: 1.1, 5: 1.2, 6: 1.3, 7: 1.4, 8: 1.5 };
        const mpRegenValue = mpRegenValues[level.level] ?? 0;
        stats.mpRegen = (stats.mpRegen ?? 0) + mpRegenValue;
        return; // Skip default processing for this modifier
      }
    });
  }

  // Special handling for Light Armor Mastery (skill 227) for Warsmith - evasion is always 6
  if (skill.id === 227 && skill.code === "WS_0227" && modifiers) {
    modifiers.forEach((mod) => {
      if (mod.stat === "evasion" && mod.mode === "flat") {
        // Evasion: 6 for all levels
        stats.evasion = (stats.evasion ?? 0) + 6;
        return; // Skip default processing for this modifier
      }
    });
  }

  // Синхронізуємо attackSpeed та atkSpeed перед застосуванням модифікаторів
  if (typeof stats["attackSpeed"] === "number" && typeof stats["atkSpeed"] !== "number") {
    stats["atkSpeed"] = stats["attackSpeed"];
  } else if (typeof stats["atkSpeed"] === "number" && typeof stats["attackSpeed"] !== "number") {
    stats["attackSpeed"] = stats["atkSpeed"];
  }

  // Універсальна логіка для всіх інших пасивних скілів
  if (modifiers) {
    modifiers.forEach((mod) => {
      // Маппінг статів для сумісності (як в applyBuffsToStats)
      let stat = mod.stat;
      let targetStat = mod.stat;
      
      if (stat === "attackSpeed") {
        targetStat = "atkSpeed";
      } else if (stat === "critDamage") {
        // critDamage використовується напряму (синхронізація з critPower відбувається пізніше)
        targetStat = "critDamage";
      } else if (stat === "critRate") {
        // critRate використовується напряму (синхронізація з crit відбувається пізніше)
        targetStat = "critRate";
      } else if (stat === "skillCritRate") {
        // skillCritRate використовується напряму (синхронізація з mCrit відбувається пізніше)
        targetStat = "skillCritRate";
      }
      
      // Використовуємо mod.value якщо є, інакше level.power, інакше 0
      const modValue = mod.value !== undefined 
        ? mod.value 
        : (level.power !== undefined && !isNaN(level.power) ? level.power : 0);
      
      // Для attackSpeed перевіряємо обидва ключі (attackSpeed та atkSpeed)
      // Для critDamage перевіряємо обидва ключі (critDamage та critPower)
      let current: number;
      if (targetStat === "atkSpeed") {
        current = typeof (stats as any)["atkSpeed"] === "number" 
          ? (stats as any)["atkSpeed"] 
          : typeof stats["attackSpeed"] === "number"
          ? stats["attackSpeed"]
          : 0;
      } else if (targetStat === "critDamage") {
        current = typeof stats["critDamage"] === "number"
          ? stats["critDamage"]
          : typeof (stats as any)["critPower"] === "number"
          ? (stats as any)["critPower"]
          : 0;
      } else {
        current = stats[targetStat as keyof typeof stats] ?? 0;
      }

      // 🔍 ДІАГНОСТИКА для Anti Magic, Fast Spell Casting, Fast HP Recovery та Critical Power
      if (skill.id === 146 || skill.id === 228 || skill.id === 212 || skill.id === 193) {
        console.log(`[applySinglePassive] Skill ${skill.id} (${skill.name}) processing:`, {
          stat,
          mod,
          modValue,
          levelPower: level.power,
          levelNumber: level.level,
          current,
          mode: mod.mode,
        });
      }
      
      // 🔍 ДІАГНОСТИКА для додаткових скілів
      if (skill.id === 130 || skill.id === 429 || skill.id === 401) {
        console.log(`[applySinglePassive] Додатковий скіл ${skill.id} (${skill.name}) processing:`, {
          stat,
          targetStat,
          mod,
          modValue,
          levelPower: level.power,
          levelNumber: level.level,
          current,
          mode: mod.mode,
          statsBefore: { ...stats },
        });
      }

      // Перевірка на валідність значення
      if (modValue === undefined || isNaN(modValue)) {
        console.warn(`[applySinglePassive] Invalid modValue for skill ${skill.id} level ${level.level}, stat ${stat}:`, { 
          modValue, 
          levelPower: level.power, 
          modValueFromEffect: mod.value 
        });
        return;
      }

      // Застосовуємо модифікатор залежно від режиму
      if (mod.mode === "flat") {
        // Flat додавання - використовуємо level.power (який містить значення з XML)
        const newValue = current + modValue;
        stats[targetStat] = newValue;
        
        // Синхронізуємо attackSpeed та atkSpeed після застосування flat модифікатора
        if (targetStat === "atkSpeed") {
          (stats as any).attackSpeed = stats[targetStat];
        } else if (stat === "attackSpeed") {
          (stats as any).atkSpeed = stats[targetStat];
        }
        
        // Синхронізуємо critDamage та critPower після застосування flat модифікатора
        if (targetStat === "critDamage") {
          (stats as any).critPower = stats[targetStat];
        }
        
        // 🔍 ДІАГНОСТИКА для Anti Magic, Fast HP Recovery та Critical Power
        if (skill.id === 146 || skill.id === 212 || skill.id === 193) {
          console.log(`[applySinglePassive] ${skill.name} FLAT applied:`, {
            stat,
            targetStat,
            current,
            modValue,
            newValue,
            statsValue: stats[targetStat],
            critDamage: stats.critDamage,
            critPower: stats.critPower,
          });
        }
      } else if (mod.mode === "percent") {
        // Percent mode: завжди множимо поточне значення
        // Якщо current = 0, то результат також буде 0 (це нормально для percent mode)
        // Але для castSpeed, atkSpeed, crit та mCrit потрібно мати базове значення > 0, щоб percent працював
        if (current > 0) {
          stats[targetStat] = current * (1 + modValue / 100);
        } else if ((targetStat === "castSpeed" || targetStat === "atkSpeed" || targetStat === "critRate" || targetStat === "skillCritRate") && modValue > 0) {
          // Для castSpeed, atkSpeed, crit та mCrit, якщо поточне значення = 0, встановлюємо базове значення з percent бонусу
          // Це дозволяє percent скілам працювати навіть якщо базова castSpeed/atkSpeed/crit/mCrit = 0
          stats[targetStat] = modValue;
        }
        
        // Синхронізуємо attackSpeed та atkSpeed після застосування percent модифікатора
        if (targetStat === "atkSpeed") {
          (stats as any).attackSpeed = stats[targetStat];
        } else if (stat === "attackSpeed") {
          (stats as any).atkSpeed = stats[targetStat];
        }
        
        // Синхронізуємо critDamage та critPower після застосування percent модифікатора
        if (targetStat === "critDamage") {
          (stats as any).critPower = stats[targetStat];
        }
        
        // Синхронізуємо critRate та crit після застосування percent модифікатора
        if (targetStat === "critRate") {
          (stats as any).crit = stats[targetStat];
        }
        
        // Синхронізуємо skillCritRate та mCrit після застосування percent модифікатора
        // ❗ ВАЖЛИВО: mCrit має синхронізуватися з skillCritRate, але не перезаписуватися
        // Якщо mCrit вже має значення, воно має залишатися, а skillCritRate має бути джерелом правди
        if (targetStat === "skillCritRate") {
          // Синхронізуємо mCrit з skillCritRate, але тільки якщо skillCritRate має значення
          if (stats[targetStat] !== undefined && stats[targetStat] !== null) {
            (stats as any).mCrit = stats[targetStat];
          }
        }
        
        // 🔍 ДІАГНОСТИКА для Fast Spell Casting, Boost Attack Speed та Critical Chance
        if (skill.id === 228 || skill.id === 168 || skill.id === 137) {
          console.log(`[applySinglePassive] ${skill.name} percent applied:`, {
            stat,
            targetStat,
            current,
            modValue,
            newValue: stats[targetStat],
            levelNumber: level.level,
            attackSpeed: stats.attackSpeed,
            atkSpeed: stats.atkSpeed,
            critRate: stats.critRate,
          });
        }
        
        // 🔍 ДІАГНОСТИКА для додаткових скілів
        if (skill.id === 130 || skill.id === 429 || skill.id === 401) {
          console.log(`[applySinglePassive] Додатковий скіл ${skill.name} percent applied:`, {
            stat,
            targetStat,
            current,
            modValue,
            newValue: stats[targetStat],
            levelNumber: level.level,
            calculation: `${current} * (1 + ${modValue} / 100) = ${stats[targetStat]}`,
          });
        }
      } else if (mod.mode === "multiplier") {
        // Multiplier - використовуємо mod.multiplier якщо є, інакше level.power
        const multiplier = mod.multiplier !== undefined ? mod.multiplier : (level.power !== undefined && !isNaN(level.power) ? level.power : 1);
        stats[targetStat] = current * multiplier;
        
        // Синхронізуємо attackSpeed та atkSpeed після застосування multiplier модифікатора
        if (targetStat === "atkSpeed") {
          (stats as any).attackSpeed = stats[targetStat];
        } else if (stat === "attackSpeed") {
          (stats as any).atkSpeed = stats[targetStat];
        }
        
        // Синхронізуємо critDamage та critPower після застосування multiplier модифікатора
        if (targetStat === "critDamage") {
          (stats as any).critPower = stats[targetStat];
        }
        
        // Синхронізуємо attackSpeed та atkSpeed після застосування multiplier модифікатора
        if (stat === "atkSpeed") {
          (stats as any).attackSpeed = stats[stat];
        } else if ((stat as string) === "attackSpeed") {
          (stats as any).atkSpeed = stats[stat];
        }
        
        // 🔍 ДІАГНОСТИКА для Boost Attack Speed
        if (skill.id === 168) {
          console.log(`[applySinglePassive] Boost Attack Speed multiplier applied:`, {
            stat,
            current,
            multiplier,
            levelPower: level.power,
            newValue: stats[stat],
            levelNumber: level.level,
            attackSpeed: stats["attackSpeed"],
            atkSpeed: stats["atkSpeed"],
          });
        }
      }
    });
  }

  // Fallback для старих скілів без effects
  if (!modifiers && skill.name.includes("Mastery")) {
    stats.pDef = (stats.pDef ?? 0) + (level.power ?? 0);
  }

  return stats;
}

/**
 * Спеціальна обробка для Weapon Mastery (skill 249)
 */
function applyWeaponMastery(
  baseStats: BattleStats,
  skill: SkillDefinition,
  level: SkillLevelDefinition
): BattleStats {
  const stats = { ...baseStats };
  const levelIndex = level.level - 1;
  
  // Перевірка на валідність levelIndex
  if (levelIndex < 0 || levelIndex >= WEAPON_MASTERY_PATK.length) {
    console.warn(`[applyWeaponMastery] Invalid levelIndex: level ${level.level}, levelIndex ${levelIndex}, array length ${WEAPON_MASTERY_PATK.length}`);
    return stats;
  }
  
  const pAtkValue = WEAPON_MASTERY_PATK[levelIndex];
  const mAtkValue = WEAPON_MASTERY_MATK[levelIndex];
  
  // Спочатку застосовуємо percent модифікатори
  if (stats.pAtk > 0) {
    stats.pAtk = stats.pAtk * (1 + pAtkValue / 100);
  }
  if (stats.mAtk > 0) {
    stats.mAtk = stats.mAtk * (1 + mAtkValue / 100);
  }
  
  // Потім застосовуємо multiplier модифікатори
  stats.pAtk = stats.pAtk * 1.45;
  stats.mAtk = stats.mAtk * 1.17;
  
  return stats;
}

/**
 * Спеціальна обробка для Weapon Mastery (skill 141) для Overlord і Warcryer
 * Levels 10-42: pAtk flat + mAtk flat + pAtk 45% + mAtk 17%
 */
function applyWeaponMastery141(
  baseStats: BattleStats,
  skill: SkillDefinition,
  level: SkillLevelDefinition
): BattleStats {
  const stats = { ...baseStats };
  // Level 10-42: levelIndex = level.level - 10 (для масиву, який починається з level 10)
  const levelIndex = level.level - 10;
  
  // Перевірка на валідність levelIndex
  if (levelIndex < 0 || levelIndex >= WEAPON_MASTERY_141_PATK.length) {
    console.warn(`[applyWeaponMastery141] Invalid levelIndex: level ${level.level}, levelIndex ${levelIndex}, array length ${WEAPON_MASTERY_141_PATK.length}`);
    return stats;
  }
  
  const pAtkValue = WEAPON_MASTERY_141_PATK[levelIndex];
  const mAtkValue = WEAPON_MASTERY_141_MATK[levelIndex];
  
  // Спочатку застосовуємо flat модифікатори
  stats.pAtk = (stats.pAtk ?? 0) + pAtkValue;
  stats.mAtk = (stats.mAtk ?? 0) + mAtkValue;
  
  // Потім застосовуємо percent модифікатори (45% для pAtk, 17% для mAtk)
  if (stats.pAtk > 0) {
    stats.pAtk = stats.pAtk * 1.45;
  }
  if (stats.mAtk > 0) {
    stats.mAtk = stats.mAtk * 1.17;
  }
  
  return stats;
}

/**
 * Спеціальна обробка для Weapon Mastery (skill 142) для Elven Wizard
 * Levels 3-9: pAtk flat + mAtk flat + pAtk 45% + mAtk 17%
 */
function applyWeaponMastery142(
  baseStats: BattleStats,
  skill: SkillDefinition,
  level: SkillLevelDefinition
): BattleStats {
  const stats = { ...baseStats };
  // Level 3-9: levelIndex = level.level - 3 (для масиву, який починається з level 3)
  const levelIndex = level.level - 3;
  
  // Перевірка на валідність levelIndex
  if (levelIndex < 0 || levelIndex >= WEAPON_MASTERY_142_PATK.length) {
    console.warn(`[applyWeaponMastery142] Invalid levelIndex: level ${level.level}, levelIndex ${levelIndex}, array length ${WEAPON_MASTERY_142_PATK.length}`);
    return stats;
  }
  
  const pAtkValue = WEAPON_MASTERY_142_PATK[levelIndex];
  const mAtkValue = WEAPON_MASTERY_142_MATK[levelIndex];
  
  // Спочатку застосовуємо flat модифікатори
  stats.pAtk = (stats.pAtk ?? 0) + pAtkValue;
  stats.mAtk = (stats.mAtk ?? 0) + mAtkValue;
  
  // Потім застосовуємо percent модифікатори (45% для pAtk, 17% для mAtk)
  if (stats.pAtk > 0) {
    stats.pAtk = stats.pAtk * 1.45;
  }
  if (stats.mAtk > 0) {
    stats.mAtk = stats.mAtk * 1.17;
  }
  
  return stats;
}

// ❌ DELETED: applySkillPassives - більше не потрібна
// Вся логіка тепер йде через recalculateAllStats → applySinglePassive
// ЖОДНА мутація hero або hero.battleStats
