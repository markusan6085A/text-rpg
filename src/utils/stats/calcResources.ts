/**
 * Обчислює ресурси героя (HP, MP, CP) на основі базових статів та рівня
 * Порядок: baseStats -> level scaling -> equipment bonuses -> set bonuses
 */
import type { HeroBaseStats } from "../../state/heroFactory";
import { getActiveSetBonuses } from "../../data/sets/armorSets";
import { itemsDB, itemsDBWithStarter } from "../../data/items/itemsDB";
import {
  EARRING_OF_ANTHARAS_ID,
  EARRING_OF_ORFEN_ID,
  EARRING_OF_ZAKEN_ID,
  NECKLACE_OF_FRINTEZZA_ID,
  NECKLACE_OF_VALAKAS_ID,
  primaryEquipmentSlotForItem,
  RING_OF_BAIUM_ID,
  RING_OF_CORE_ID,
  RING_OF_QUEEN_ANT_ID,
} from "./calcCombatStats";
import { getArmorEnchantHpFlatFromPiece } from "./armorEnchantBonuses";

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
  equipmentEnchantLevels?: Record<string, number>
): Resources {
  const lvl = Math.max(1, level);
  
  // Level scaling для ресурсів
  // CON/MEN дають бонус від бази 40/25
  const conBonus = 1 + (baseStats.CON - 40) * 0.01;
  const menBonus = 1 + (baseStats.MEN - 25) * 0.01;
  
  // HP/MP: L2-стиль поліноми (base + a*lvl + b*lvl²), на 80 рівні ~4.5k-5.5k HP, ~700-900 MP
  // calc_stats.php подібна логіка: квадратичний ріст від рівня
  const baseHp = 150 + 50 * lvl + 0.2 * lvl * lvl;
  const baseMp = 80 + 5 * lvl + 0.06 * lvl * lvl;
  
  let maxHp = Math.round(baseHp * conBonus);
  let maxMp = Math.round(baseMp * menBonus);
  let maxCp = Math.round(maxHp * 0.6);

  // Equipment bonuses для ресурсів (maxMp з броні)
  // Спочатку додаємо flat бонуси
  let flatMaxHpBonus = 0;
  const queenAntPrimarySlot = primaryEquipmentSlotForItem(equipment, RING_OF_QUEEN_ANT_ID);
  const ringOfCorePrimarySlot = primaryEquipmentSlotForItem(equipment, RING_OF_CORE_ID);
  const ringOfBaiumPrimarySlot = primaryEquipmentSlotForItem(equipment, RING_OF_BAIUM_ID);
  const orfenPrimarySlot = primaryEquipmentSlotForItem(equipment, EARRING_OF_ORFEN_ID);
  const zakenEarringPrimarySlot = primaryEquipmentSlotForItem(equipment, EARRING_OF_ZAKEN_ID);
  const antharasEarringPrimarySlot = primaryEquipmentSlotForItem(equipment, EARRING_OF_ANTHARAS_ID);
  const valakasNecklacePrimarySlot = primaryEquipmentSlotForItem(equipment, NECKLACE_OF_VALAKAS_ID);
  const frintezzaNecklacePrimarySlot = primaryEquipmentSlotForItem(equipment, NECKLACE_OF_FRINTEZZA_ID);
  if (equipment) {
    Object.entries(equipment).forEach(([slot, itemId]: [string, any]) => {
      if (itemId === RING_OF_QUEEN_ANT_ID && queenAntPrimarySlot != null && slot !== queenAntPrimarySlot) {
        return;
      }
      if (itemId === RING_OF_CORE_ID && ringOfCorePrimarySlot != null && slot !== ringOfCorePrimarySlot) {
        return;
      }
      if (itemId === RING_OF_BAIUM_ID && ringOfBaiumPrimarySlot != null && slot !== ringOfBaiumPrimarySlot) {
        return;
      }
      if (itemId === EARRING_OF_ORFEN_ID && orfenPrimarySlot != null && slot !== orfenPrimarySlot) {
        return;
      }
      if (itemId === EARRING_OF_ZAKEN_ID && zakenEarringPrimarySlot != null && slot !== zakenEarringPrimarySlot) {
        return;
      }
      if (itemId === EARRING_OF_ANTHARAS_ID && antharasEarringPrimarySlot != null && slot !== antharasEarringPrimarySlot) {
        return;
      }
      if (itemId === NECKLACE_OF_VALAKAS_ID && valakasNecklacePrimarySlot != null && slot !== valakasNecklacePrimarySlot) {
        return;
      }
      if (itemId === NECKLACE_OF_FRINTEZZA_ID && frintezzaNecklacePrimarySlot != null && slot !== frintezzaNecklacePrimarySlot) {
        return;
      }
      const itemDef = itemsDBWithStarter[itemId] || itemsDB[itemId];
      if (itemId && itemDef && itemDef.stats) {
        const itemStats = itemDef.stats;
        if (itemStats.maxHp) flatMaxHpBonus += itemStats.maxHp;
        if (itemStats.maxMp) maxMp += itemStats.maxMp;
        if (itemStats.maxCp) maxCp += itemStats.maxCp;
        const enc = equipmentEnchantLevels?.[slot] ?? 0;
        if (enc > 0) {
          flatMaxHpBonus += getArmorEnchantHpFlatFromPiece(itemId, itemDef, enc);
        }
      }
    });
  }
  
  // Додаємо flat бонуси до maxHp
  maxHp += flatMaxHpBonus;
  
  // Потім застосовуємо відсоткові бонуси (від базового maxHp + flat бонусів)
  if (equipment) {
    Object.entries(equipment).forEach(([slot, itemId]: [string, any]) => {
      if (itemId === RING_OF_QUEEN_ANT_ID && queenAntPrimarySlot != null && slot !== queenAntPrimarySlot) {
        return;
      }
      if (itemId === RING_OF_CORE_ID && ringOfCorePrimarySlot != null && slot !== ringOfCorePrimarySlot) {
        return;
      }
      if (itemId === RING_OF_BAIUM_ID && ringOfBaiumPrimarySlot != null && slot !== ringOfBaiumPrimarySlot) {
        return;
      }
      if (itemId === EARRING_OF_ORFEN_ID && orfenPrimarySlot != null && slot !== orfenPrimarySlot) {
        return;
      }
      if (itemId === EARRING_OF_ZAKEN_ID && zakenEarringPrimarySlot != null && slot !== zakenEarringPrimarySlot) {
        return;
      }
      if (itemId === EARRING_OF_ANTHARAS_ID && antharasEarringPrimarySlot != null && slot !== antharasEarringPrimarySlot) {
        return;
      }
      if (itemId === NECKLACE_OF_VALAKAS_ID && valakasNecklacePrimarySlot != null && slot !== valakasNecklacePrimarySlot) {
        return;
      }
      if (itemId === NECKLACE_OF_FRINTEZZA_ID && frintezzaNecklacePrimarySlot != null && slot !== frintezzaNecklacePrimarySlot) {
        return;
      }
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
  
  // Краски (CON/MEN): зміна HP/MP/CP лише через baseStats → conBonus/menBonus після recalculateAllStats.
  // Окремі flat тут давали подвійний рахунок разом із базою (як було з -MEN на MP).
  
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

