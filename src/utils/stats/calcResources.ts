/**
 * Обчислює ресурси героя (HP, MP, CP) на основі базових статів та рівня
 * Порядок: baseStats -> level scaling -> equipment bonuses -> set bonuses
 */
import type { HeroBaseStats } from "../../state/heroFactory";
import { getActiveSetBonuses } from "../../data/sets/armorSets";
import { itemsDB, itemsDBWithStarter } from "../../data/items/itemsDB";

export interface Resources {
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  cp: number;
  maxCp: number;
}

export function calcResources(
  baseStats: HeroBaseStats,
  level: number,
  equipment?: Record<string, string | null>,
  activeDyes?: Array<{
    id: string;
    statPlus: "STR" | "CON" | "DEX" | "INT" | "MEN" | "WIT";
    statMinus: "STR" | "CON" | "DEX" | "INT" | "MEN" | "WIT";
    effect: number;
    grade: "D" | "C" | "B" | "A" | "S";
  }>
): Resources {
  const lvl = Math.max(1, level);
  
  // Level scaling для ресурсів
  // CON/MEN дають бонус від бази 40/25
  const conBonus = 1 + (baseStats.CON - 40) * 0.01;
  const menBonus = 1 + (baseStats.MEN - 25) * 0.01;
  
  // HP: на 80 рівні ~4k для магів, ~5k+ для танків (різниця через conBonus)
  // baseHp таке, щоб при CON 24 виходило ~4k, при CON 47 ~5k+
  const baseHp = 200 + lvl * 56;
  const baseMp = 100 + lvl * 8;
  
  let maxHp = Math.round(baseHp * conBonus);
  let maxMp = Math.round(baseMp * menBonus);
  let maxCp = Math.round(maxHp * 0.6);

  // Equipment bonuses для ресурсів (maxMp з броні)
  // Спочатку додаємо flat бонуси
  let flatMaxHpBonus = 0;
  if (equipment) {
    Object.values(equipment).forEach((itemId: any) => {
      const itemDef = itemsDBWithStarter[itemId] || itemsDB[itemId];
      if (itemId && itemDef && itemDef.stats) {
        const itemStats = itemDef.stats;
        if (itemStats.maxHp) flatMaxHpBonus += itemStats.maxHp;
        if (itemStats.maxMp) maxMp += itemStats.maxMp;
        if (itemStats.maxCp) maxCp += itemStats.maxCp;
      }
    });
  }
  
  // Додаємо flat бонуси до maxHp
  maxHp += flatMaxHpBonus;
  
  // Потім застосовуємо відсоткові бонуси (від базового maxHp + flat бонусів)
  if (equipment) {
    Object.values(equipment).forEach((itemId: any) => {
      const itemDef = itemsDBWithStarter[itemId] || itemsDB[itemId];
      if (itemId && itemDef && itemDef.stats) {
        const itemStats = itemDef.stats;
        if (itemStats.maxHpPercent) {
          maxHp = Math.round(maxHp * (1 + itemStats.maxHpPercent / 100));
        }
      }
    });
  }

  // Set bonuses для ресурсів
  if (equipment) {
    const setBonuses = getActiveSetBonuses(equipment);
    if (setBonuses.maxHp) maxHp += setBonuses.maxHp;
    if (setBonuses.maxMp) maxMp += setBonuses.maxMp;
    if (setBonuses.maxCp) maxCp += setBonuses.maxCp;
    // Відсотковий бонус HP з сетів (застосовується після flat бонусів)
    if (setBonuses.maxHpPercent) {
      maxHp = Math.round(maxHp * (1 + setBonuses.maxHpPercent / 100));
    }
  }
  
  // Прямі бонуси від тату (dyes) - додаються після всіх інших бонусів
  // CON тату дає прямий бонус до HP, MEN тату дає прямий бонус до MP
  if (activeDyes && activeDyes.length > 0) {
    for (const dye of activeDyes) {
      const effectMultiplier = dye.effect;
      
      switch (dye.statPlus) {
        case "CON":
          // CON впливає на HP: +1 = +100 HP, +5 = +500 HP
          maxHp += Math.round(100 * effectMultiplier);
          maxCp += Math.round(60 * effectMultiplier); // CP також збільшується (60% від HP)
          break;
        case "MEN":
          // MEN впливає на MP: +1 = +50 MP, +5 = +250 MP
          maxMp += Math.round(50 * effectMultiplier);
          break;
      }
      
      // Мінусові стати також впливають (віднімаються)
      switch (dye.statMinus) {
        case "CON":
          // Від'ємне HP зменшено вдвічі: -1 = -25 HP, -5 = -125 HP (було -50/-250)
          maxHp -= Math.round(25 * effectMultiplier);
          maxCp -= Math.round(15 * effectMultiplier);
          break;
        case "MEN":
          maxMp -= Math.round(50 * effectMultiplier);
          break;
      }
    }
    
    // Гарантуємо мінімальні значення після застосування тату
    maxHp = Math.max(1, maxHp);
    maxMp = Math.max(1, maxMp);
    maxCp = Math.max(1, maxCp);
  }
  
  // ❗ calcResources = формула MAX, не поточний стан. HP/MP/CP — runtime state, не задаємо тут.
  return {
    hp: 0,
    maxHp,
    mp: 0,
    maxMp,
    cp: 0,
    maxCp,
  };
}

