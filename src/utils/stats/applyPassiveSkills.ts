/**
 * Застосовує пасивні скіли до статів
 * Порядок: passive skills -> buffs (пізніше)
 * 
 * ❗ ПРИНЦИП: ЖОДНА мутація hero або hero.battleStats
 * Тільки копії, тільки return new object
 */
import { getSkillDef } from "../../state/battle/loadout";
import { applyBuffsToStats } from "../../state/battle/helpers";
import { applySinglePassive } from "../../data/skills/effects/applySkillPassives";
import type { BattleBuff } from "../../state/battle/types";
import type { CombatStats } from "./calcCombatStats";
import type { Resources } from "./calcResources";
import { itemsDB, itemsDBWithStarter } from "../../data/items/itemsDB";
import { getArmorTypeWithAutoDetect } from "../items/autoDetectArmorType";

export interface FinalStats {
  combat: CombatStats;
  resources: Resources;
}

/**
 * Визначає тип броні за екіпіровкою
 * Повертає "light", "heavy", "robe" або null
 */
export function getArmorTypeFromEquipment(equipment?: Record<string, string | null>): "light" | "heavy" | "robe" | null {
  if (!equipment) {
    if (import.meta.env.DEV) {
      console.log(`[getArmorTypeFromEquipment] No equipment object provided, returning null`);
    }
    return null;
  }
  
  // Перевіряємо слот броні (armor - це грудь, найважливіший слот)
  const armorSlot = equipment.armor || equipment.chest;
  if (!armorSlot) {
    if (import.meta.env.DEV) {
      console.log(`[getArmorTypeFromEquipment] No armor slot found (armor: ${equipment.armor}, chest: ${equipment.chest}), returning null`);
    }
    return null;
  }
  
  // Використовуємо функцію з автоматичним визначенням (спочатку перевіряє itemsDB, потім auto-detect)
  const armorType = getArmorTypeWithAutoDetect(armorSlot);
  if (import.meta.env.DEV) {
    console.log(`[getArmorTypeFromEquipment] Armor slot: ${armorSlot}, detected type: ${armorType}`);
  }
  return armorType;
}

/**
 * Визначає тип зброї за екіпіровкою
 * Повертає тип зброї або null
 */
export function getWeaponTypeFromEquipment(
  equipment?: Record<string, string | null>
): "sword" | "bow" | "staff" | "club" | "dagger" | "polearm" | "fist" | "dualsword" | "dualdagger" | null {
  if (!equipment) return null;
  
  const weaponSlot = equipment.weapon;
  if (!weaponSlot) return null;
  
  // Використовуємо itemsDB з імпорту
  const weaponItem = itemsDBWithStarter[weaponSlot] || itemsDB[weaponSlot];
  if (!weaponItem) return null;
  
  const itemId = weaponSlot.toLowerCase();
  const itemName = (weaponItem.name || "").toLowerCase();
  
  // Sword: sword, blade, saber
  if (itemId.includes("sword") || itemName.includes("меч") || itemName.includes("sword")) {
    return "sword";
  }
  
  // Bow: bow, crossbow
  if (itemId.includes("bow") || itemName.includes("лук") || itemName.includes("bow") || itemName.includes("crossbow")) {
    return "bow";
  }
  
  // Staff: staff, wand
  if (itemId.includes("staff") || itemId.includes("wand") || itemName.includes("посох") || itemName.includes("staff") || itemName.includes("wand")) {
    return "staff";
  }
  
  // Club: club, mace, hammer
  if (itemId.includes("club") || itemId.includes("mace") || itemId.includes("hammer") || itemName.includes("дубина") || itemName.includes("club") || itemName.includes("mace")) {
    return "club";
  }
  
  // Dagger: dagger, knife
  if (itemId.includes("dagger") || itemId.includes("knife") || itemName.includes("кинжал") || itemName.includes("dagger")) {
    return "dagger";
  }
  
  // Polearm: polearm, spear, lance
  if (itemId.includes("polearm") || itemId.includes("spear") || itemId.includes("lance") || itemName.includes("копье") || itemName.includes("spear")) {
    return "polearm";
  }
  
  // Fist: fist, gauntlet
  if (itemId.includes("fist") || itemId.includes("gauntlet") || itemName.includes("кастет") || itemName.includes("fist")) {
    return "fist";
  }
  
  // Dual Sword: dualsword, dual sword
  if (itemId.includes("dualsword") || itemId.includes("dual_sword") || itemName.includes("dual sword")) {
    return "dualsword";
  }
  
  // Dual Dagger: dualdagger, dual dagger
  if (itemId.includes("dualdagger") || itemId.includes("dual_dagger") || itemName.includes("dual dagger")) {
    return "dualdagger";
  }
  
  return null;
}

/**
 * Перевіряє, чи виконуються умови для скіла (броня/зброя)
 * Використовується як для пасивних, так і для активних скілів
 */
export function checkSkillConditions(
  skillDef: any,
  equipment?: Record<string, string | null>
): boolean {
  // Безпечна перевірка - якщо щось не так, дозволяємо використати скіл
  if (!skillDef) return true;
  
  try {
    // Якщо немає умов, скіл завжди активний
    if (!skillDef.requiresArmor && !skillDef.requiresWeapon) {
      return true;
    }
    
    // Перевіряємо умову броні
    if (skillDef.requiresArmor) {
      try {
        const armorType = getArmorTypeFromEquipment(equipment);
        
        // Детальна діагностика для ВСІХ скілів з requiresArmor
        console.log(`[checkSkillConditions] 🔍 Armor Check:`, {
          skillId: skillDef.id,
          skillName: skillDef.name,
          requiresArmor: skillDef.requiresArmor,
          detectedArmorType: armorType,
          equipment: equipment,
          equipmentArmor: equipment?.armor,
          equipmentChest: equipment?.chest,
          equipmentIsNull: equipment === null,
          equipmentIsUndefined: equipment === undefined,
          willReturn: armorType === null ? false : (armorType !== skillDef.requiresArmor ? false : true),
        });
        
        // Якщо немає броні (armorType === null), скіл НЕ має працювати
        if (armorType === null) {
          console.log(`[checkSkillConditions] ❌ No armor equipped, skill ${skillDef.name} (ID: ${skillDef.id}) should NOT work - returning FALSE`);
          return false;
        }
        
        // Якщо тип броні не відповідає вимогам скіла, скіл НЕ працює
        if (armorType !== skillDef.requiresArmor) {
          console.log(`[checkSkillConditions] ❌ Armor type mismatch: required ${skillDef.requiresArmor}, got ${armorType} - returning FALSE`);
          return false;
        }
        
        // Якщо все співпадає, скіл працює
        console.log(`[checkSkillConditions] ✅ Armor type matches: ${armorType} === ${skillDef.requiresArmor} - returning TRUE`);
      } catch (e) {
        // Якщо помилка при перевірці броні, НЕ дозволяємо скіл (безпечніше)
        if (import.meta.env.DEV) {
          console.warn(`[checkSkillConditions] Error checking armor:`, e);
        }
        return false; // Змінив з true на false - якщо помилка, скіл не працює
      }
    }
    
    // Перевіряємо умову зброї
    if (skillDef.requiresWeapon) {
      try {
        // Перевіряємо, чи itemsDB доступний
        if (!itemsDB || typeof itemsDB !== 'object') {
          if (import.meta.env.DEV) {
            console.warn(`[checkSkillConditions] itemsDB not available`);
          }
          return true; // Дозволяємо скіл, якщо itemsDB недоступний
        }
        
        const weaponType = getWeaponTypeFromEquipment(equipment);
        if (weaponType !== skillDef.requiresWeapon) {
          return false;
        }
      } catch (e) {
        // Якщо помилка при перевірці зброї, дозволяємо скіл
        if (import.meta.env.DEV) {
          console.warn(`[checkSkillConditions] Error checking weapon:`, e);
        }
        return true;
      }
    }
    
    return true;
  } catch (error) {
    // Якщо виникла помилка, повертаємо true (дозволяємо використати скіл)
    if (import.meta.env.DEV) {
      console.error(`[checkSkillConditions] Error:`, error);
    }
    return true;
  }
}

/**
 * Застосовує пасивні скіли до бойових статів
 * Повертає НОВИЙ об'єкт, не мутує вхідний
 */
export function applyPassiveSkillsToCombat(
  combatStats: CombatStats,
  learnedSkills: any[],
  buffs: BattleBuff[] = [],
  currentHp?: number,
  maxHp?: number,
  equipment?: Record<string, string | null>
): CombatStats {
  // Діагностика для перевірки передачі параметрів HP
  const hasHpThresholdSkill = learnedSkills.some((s: any) => {
    const skillDef = getSkillDef(s.id);
    return skillDef?.hpThreshold !== undefined;
  });
  if (hasHpThresholdSkill) {
    console.log(`[applyPassiveSkillsToCombat] HP parameters:`, {
      currentHp,
      maxHp,
      currentHpDefined: currentHp !== undefined,
      maxHpDefined: maxHp !== undefined,
      learnedSkillsCount: learnedSkills.length,
    });
  }
  // Починаємо з копії базових статів
  let stats: any = { ...combatStats };
  
  // Синхронізуємо critRate з crit перед застосуванням пасивних скілів
  if (stats.crit !== undefined && stats.critRate === undefined) {
    stats.critRate = stats.crit;
  } else if (stats.critRate !== undefined && stats.crit === undefined) {
    stats.crit = stats.critRate;
  }
  
  // ❗ ВАЖЛИВО: Синхронізуємо skillCritRate з mCrit перед застосуванням пасивних скілів
  // Це гарантує, що percent модифікатори працюють правильно
  if (stats.mCrit !== undefined && stats.skillCritRate === undefined) {
    stats.skillCritRate = stats.mCrit;
  } else if (stats.skillCritRate !== undefined && stats.mCrit === undefined) {
    stats.mCrit = stats.skillCritRate;
  }

  const ADDITIONAL_SKILL_IDS = [130, 279, 401, 429, 481, 763, 794, 820, 6319, 9999];

  for (const learned of learnedSkills) {
    const skillId = Number(learned.id);
    if (!skillId || isNaN(skillId)) continue;
    const skillDef = getSkillDef(skillId);
    if (!skillDef) {
      if (ADDITIONAL_SKILL_IDS.includes(skillId)) {
        console.warn(`[applyPassiveSkillsToCombat] ⚠️ Додатковий скіл ID ${skillId} не знайдено через getSkillDef!`);
      }
      continue;
    }
    if (skillDef.category !== "passive") continue;

    // 🔍 ДІАГНОСТИКА для скіла 231 (Heavy Armor Mastery) - завжди виводимо
    if (skillId === 231) {
      console.log(`[applyPassiveSkillsToCombat] 🔍 Skill 231 (Heavy Armor Mastery) DEBUG:`, {
        skillId,
        skillDefId: skillDef.id,
        skillName: skillDef.name,
        requiresArmor: skillDef.requiresArmor,
        hasRequiresArmor: skillDef.requiresArmor !== undefined,
        skillDefKeys: Object.keys(skillDef),
        equipment: equipment,
        equipmentArmor: equipment?.armor,
        equipmentChest: equipment?.chest,
      });
    }
    
    // 🔍 ДІАГНОСТИКА ПЕРЕД перевіркою умов для ВСІХ скілів з requiresArmor
    if (skillDef.requiresArmor) {
      console.log(`[applyPassiveSkillsToCombat] 🔍 BEFORE checkSkillConditions:`, {
        skillId,
        skillDefId: skillDef.id,
        skillName: skillDef.name,
        requiresArmor: skillDef.requiresArmor,
        equipment: equipment,
        equipmentArmor: equipment?.armor,
        equipmentChest: equipment?.chest,
        equipmentKeys: equipment ? Object.keys(equipment) : [],
      });
    }
    
    // Перевіряємо умови для пасивного скіла (броня/зброя)
    const conditionsMet = checkSkillConditions(skillDef, equipment);
    
    // 🔍 ДІАГНОСТИКА ПІСЛЯ перевірки умов для ВСІХ скілів з requiresArmor
    if (skillDef.requiresArmor) {
      console.log(`[applyPassiveSkillsToCombat] 🔍 AFTER checkSkillConditions:`, {
        skillId,
        skillName: skillDef.name,
        requiresArmor: skillDef.requiresArmor,
        conditionsMet: conditionsMet,
        willApply: conditionsMet,
      });
    }
    
    // Діагностика для Light/Heavy Armor Mastery
    if (skillDef.requiresArmor && (skillId === 227 || skillId === 231)) {
      const armorType = getArmorTypeFromEquipment(equipment);
      if (!conditionsMet) {
        console.log(`[applyPassiveSkillsToCombat] ❌ Armor Mastery SKIPPED:`, {
          skillId,
          skillName: skillDef.name,
          requiresArmor: skillDef.requiresArmor,
          detectedArmorType: armorType,
          equipment: equipment,
          conditionsMet: conditionsMet,
          reason: armorType === null ? "No armor equipped" : `Armor type mismatch: ${armorType} !== ${skillDef.requiresArmor}`,
        });
      } else {
        console.log(`[applyPassiveSkillsToCombat] ✅ Armor Mastery WILL BE APPLIED:`, {
          skillId,
          skillName: skillDef.name,
          requiresArmor: skillDef.requiresArmor,
          detectedArmorType: armorType,
          conditionsMet: conditionsMet,
        });
      }
    }
    
    if (!conditionsMet) {
      if (skillDef.requiresArmor && (skillId === 227 || skillId === 231)) {
        console.log(`[applyPassiveSkillsToCombat] ⛔ SKIPPING skill ${skillDef.name} (ID: ${skillId}) - conditions not met`);
      }
      continue;
    }

    const learnedLevel = Number(learned.level) || 1;
    const foundLevelDef = skillDef.levels.find((l) => l.level === learnedLevel);

    let levelDef = foundLevelDef;
    if (!levelDef) {
      const sortedLevels = [...skillDef.levels].sort((a, b) => b.level - a.level);
      levelDef = sortedLevels.find((l) => l.level <= learnedLevel) ?? skillDef.levels[0];
    }

    if (!levelDef) {
      console.warn(`[applyPassiveSkillsToCombat] LevelDef not found for skill ${skillId} level ${learnedLevel}`);
      continue;
    }

    // 🔍 ДІАГНОСТИКА для Fast Spell Casting (skill 228)
    if (skillId === 228) {
      console.log(`[applyPassiveSkillsToCombat] Fast Spell Casting DEBUG:`, {
        learnedLevel,
        foundLevelDef: foundLevelDef ? { level: foundLevelDef.level, power: foundLevelDef.power } : null,
        fallbackLevelDef: skillDef.levels[0] ? { level: skillDef.levels[0].level, power: skillDef.levels[0].power } : null,
        usedLevelDef: { level: levelDef.level, power: levelDef.power },
        allLevels: skillDef.levels.map(l => ({ level: l.level, power: l.power })),
        currentCastSpeed: stats.castSpeed,
      });
    }

    // 🔍 ДІАГНОСТИКА для Anti Magic: перевіряємо всі рівні
    if (skillId === 146) {
      console.log(`[PASSIVE] Anti Magic DEBUG:`, {
        learnedLevel: learned.level,
        foundLevelDef: foundLevelDef ? { level: foundLevelDef.level, power: foundLevelDef.power } : null,
        fallbackLevelDef: skillDef.levels[0] ? { level: skillDef.levels[0].level, power: skillDef.levels[0].power } : null,
        usedLevelDef: { level: levelDef.level, power: levelDef.power },
        allLevels: skillDef.levels.map(l => ({ level: l.level, power: l.power })).slice(0, 25), // Перші 25 рівнів
      });
    }

    // ❗ ВАЖЛИВО: Перевірка HP має бути ПЕРЕД застосуванням скілу
    // Перевіряємо умову HP для скілів з hpThreshold
    if (skillDef.hpThreshold !== undefined && currentHp !== undefined && maxHp !== undefined) {
      const hpPercent = maxHp > 0 ? currentHp / maxHp : 1;
      
      // Діагностика для скілів з hpThreshold
      if (skillDef.id === 290) { // Final Frenzy
        // Обчислюємо умови ПЕРЕД логуванням, щоб переконатися що вони правильні
        const condition1 = hpPercent <= skillDef.hpThreshold;
        const condition2 = hpPercent > skillDef.hpThreshold;
        const shouldActivate = condition1;
        const willSkip = condition2;
        
        // Додаткова перевірка типів
        const hpPercentType = typeof hpPercent;
        const thresholdType = typeof skillDef.hpThreshold;
        const directComparison = hpPercent <= skillDef.hpThreshold;
        
        console.log(`[PASSIVE HP CHECK] Final Frenzy (skillId: ${skillDef.id}):`, {
          currentHp,
          maxHp,
          hpPercentRaw: hpPercent,
          hpPercentType,
          hpThresholdRaw: skillDef.hpThreshold,
          thresholdType,
          hpPercentFormatted: (hpPercent * 100).toFixed(2) + '%',
          hpThresholdFormatted: (skillDef.hpThreshold * 100).toFixed(2) + '%',
          comparison: `${hpPercent} <= ${skillDef.hpThreshold}`,
          directComparison,
          condition1,
          condition2,
          shouldActivate,
          willSkip,
        });
      }
      
      // ❗ ВАЖЛИВО: Перевірка має бути ПЕРЕД застосуванням скілу
      // Якщо HP > порогу, скіл НЕ активується
      if (hpPercent > skillDef.hpThreshold) {
        // HP вище порогу - скіл не активується
        if (skillDef.id === 290) {
          console.log(`[PASSIVE HP CHECK] Final Frenzy SKIPPED - HP too high (${(hpPercent * 100).toFixed(2)}% > ${(skillDef.hpThreshold * 100).toFixed(2)}%)`);
        }
        continue;
      }
      
      if (skillDef.id === 290) {
        console.log(`[PASSIVE HP CHECK] Final Frenzy ACTIVATED - HP is low enough (${(hpPercent * 100).toFixed(2)}% <= ${(skillDef.hpThreshold * 100).toFixed(2)}%)`);
      }
    } else {
      // Якщо немає hpThreshold або HP не передано, скіл застосовується завжди
      // (для зворотної сумісності зі старими скілами)
    }

    // 🔍 ДІАГНОСТИЧНИЙ ЛОГ для всіх пасивних скілів (ПІСЛЯ перевірки HP)
    console.log(`[PASSIVE] ${skillDef.name} lvl ${learned.level} power ${levelDef.power}`, {
      skillId: learned.id,
      category: skillDef.category,
      effects: skillDef.effects,
      currentMDef: stats.mDef,
      currentPAtk: stats.pAtk,
      currentMAtk: stats.mAtk,
      foundLevelDef: !!foundLevelDef,
      usedLevel: levelDef.level,
    });

    // Застосовуємо скіл до stats - повертає НОВИЙ об'єкт
    const statsBefore = { ...stats };
    stats = applySinglePassive(stats, skillDef, levelDef);

    // Діагностика для Anti Magic
    if (skillId === 146) {
      console.log(`[applyPassiveSkillsToCombat] Anti Magic AFTER applySinglePassive:`, {
        mDefBefore: statsBefore.mDef,
        mDefAfter: stats.mDef,
        difference: stats.mDef - statsBefore.mDef,
        levelPower: levelDef.power,
        statsKeys: Object.keys(stats),
      });
    }

    // Синхронізуємо critDamage з critPower для сумісності
    if (stats.critDamage !== undefined && stats.critPower === undefined) {
      stats.critPower = stats.critDamage;
    } else if (stats.critPower !== undefined && stats.critDamage === undefined) {
      stats.critDamage = stats.critPower;
    }
    
    // Синхронізуємо critRate з crit для сумісності
    if (stats.critRate !== undefined && stats.crit === undefined) {
      stats.crit = stats.critRate;
    } else if (stats.crit !== undefined && stats.critRate === undefined) {
      stats.critRate = stats.crit;
    }
    
    // ❗ ВАЖЛИВО: Синхронізуємо skillCritRate з mCrit для сумісності
    // skillCritRate є джерелом правди для mCrit
    if (stats.skillCritRate !== undefined) {
      stats.mCrit = stats.skillCritRate;
    } else if (stats.mCrit !== undefined && stats.skillCritRate === undefined) {
      stats.skillCritRate = stats.mCrit;
    }
    
    // Округлюємо бойові стати
    if (stats.pAtk !== undefined) stats.pAtk = Math.round(stats.pAtk * 10) / 10;
    if (stats.mAtk !== undefined) stats.mAtk = Math.round(stats.mAtk * 10) / 10;
    if (stats.pDef !== undefined) stats.pDef = Math.round(stats.pDef * 10) / 10;
    if (stats.mDef !== undefined) stats.mDef = Math.round(stats.mDef * 10) / 10;
    if (stats.attackSpeed !== undefined) stats.attackSpeed = Math.round(stats.attackSpeed * 10) / 10;
    if (stats.atkSpeed !== undefined) stats.atkSpeed = Math.round(stats.atkSpeed * 10) / 10;
    if (stats.castSpeed !== undefined) stats.castSpeed = Math.round(stats.castSpeed * 10) / 10;
    if (stats.critPower !== undefined) stats.critPower = Math.round(stats.critPower * 10) / 10;
    if (stats.critDamage !== undefined) stats.critDamage = Math.round(stats.critDamage * 10) / 10;
  }

  // ❗ ВАЖЛИВО: Бафи НЕ застосовуються тут!
  // Бафи застосовуються в бою через applyBuffsToStats(hero.battleStats, activeBuffs)
  // Це гарантує, що hero.battleStats містить стати БЕЗ бафів (базові + екіпіровка + сетові бонуси + пасивні скіли)
  // А бафи застосовуються динамічно в бою на основі поточних activeBuffs
  
  // Діагностика для shieldBlockRate
  if (import.meta.env.DEV) {
    const shieldBuffs = buffs.filter(b => 
      b.effects?.some(e => e.stat === "shieldBlockRate")
    );
    if (shieldBuffs.length > 0) {
      console.log(`[applyPassiveSkillsToCombat] shieldBlockRate buffs (не застосовуються тут, будуть застосовані в бою):`, {
        buffsCount: shieldBuffs.length,
        buffs: shieldBuffs.map(b => ({
          name: b.name,
          id: b.id,
          effects: b.effects,
        })),
        statsBefore: stats.shieldBlockRate,
        statsAfter: stats.shieldBlockRate,
      });
    }
  }

  // Повертаємо стати БЕЗ бафів (бафи застосовуються в бою)
  return stats as CombatStats;
}

/**
 * Застосовує пасивні скіли до ресурсів
 * Повертає НОВИЙ об'єкт, не мутує вхідний
 */
export function applyPassiveSkillsToResources(
  resources: Resources,
  learnedSkills: any[],
  buffs: BattleBuff[] = [],
  equipment?: Record<string, string | null>
): Resources {
  // ❗ ВАЖЛИВО: hero.maxHp має містити БАЗОВЕ значення БЕЗ бафів
  // Бафи застосовуються тільки в computeBuffedMaxResources, а не тут
  // Тому тут застосовуємо ТІЛЬКИ пасивні скіли, БЕЗ бафів
  let stats: any = {
    maxHp: resources.maxHp,
    maxMp: resources.maxMp,
    maxCp: resources.maxCp,
  };

  if (import.meta.env.DEV) {
    console.log("[applyPassiveSkillsToResources] before passive apply:", {
      maxHp: stats.maxHp,
      maxMp: stats.maxMp,
      maxCp: stats.maxCp,
      keys: Object.keys(stats),
    });
  }

  // ID/level з API або localStorage можуть бути рядками — нормалізуємо до числа, щоб getSkillDef і levelDef знаходили скіл
  const ADDITIONAL_SKILL_IDS = [130, 279, 401, 429, 481, 763, 794, 820, 6319, 9999];

  for (const learned of learnedSkills) {
    const skillId = Number(learned.id);
    if (!skillId || isNaN(skillId)) continue;
    const skillDef = getSkillDef(skillId);
    if (!skillDef) {
      if (ADDITIONAL_SKILL_IDS.includes(skillId)) {
        console.warn(`[applyPassiveSkillsToResources] ⚠️ Додатковий скіл ID ${skillId} не знайдено через getSkillDef!`);
      }
      continue;
    }
    if (skillDef.category !== "passive") continue;

    if (!checkSkillConditions(skillDef, equipment)) continue;

    const learnedLevel = Number(learned.level) || 1;
    const levelDef = skillDef.levels.find((l) => l.level === learnedLevel) ?? skillDef.levels[0];
    if (!levelDef) continue;

    stats = applySinglePassive(stats, skillDef, levelDef);
  }

  // ❗ НЕ застосовуємо бафи тут - вони застосовуються в computeBuffedMaxResources
  // Це гарантує, що hero.maxHp містить базове значення БЕЗ бафів

  const finalMaxHp = Math.max(1, Math.round(Number(stats.maxHp) || resources.maxHp || 1));
  const finalMaxMp = Math.max(1, Math.round(Number(stats.maxMp) || resources.maxMp || 1));
  const finalMaxCp = Math.max(1, Math.round(Number(stats.maxCp) || resources.maxCp || 1));

  if (import.meta.env.DEV) {
    console.log("[applyPassiveSkillsToResources] after passive apply:", {
      maxHp: finalMaxHp,
      maxMp: finalMaxMp,
      maxCp: finalMaxCp,
    });
  }

  return {
    ...resources,
    maxHp: finalMaxHp,
    maxMp: finalMaxMp,
    maxCp: finalMaxCp,
  };
}

