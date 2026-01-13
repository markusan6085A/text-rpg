// src/utils/mobResources.ts
// Утиліта для генерації дропів та спойлів ресурсів для мобів на основі XML файлів

import type { DropEntry } from "../data/combat/types";

// Ресурси з XML файлів, згруповані по рівнях (на основі ціни)
// Рівень 1: 0-500 (1-20 лвл мобів)
// Рівень 20: 500-1500 (20-30 лвл мобів)
// Рівень 30: 1500-3000 (30-40 лвл мобів)
// Рівень 40: 3000-6000 (40-50 лвл мобів)
// Рівень 50: 6000-12000 (50-60 лвл мобів)
// Рівень 60: 12000-25000 (60-70 лвл мобів)
// Рівень 70: 25000+ (70+ лвл мобів)

// Функція для визначення рівня ресурсів на основі рівня моба
function getResourceLevel(mobLevel: number): number {
  if (mobLevel < 20) return 1;
  if (mobLevel < 30) return 20;
  if (mobLevel < 40) return 30;
  if (mobLevel < 50) return 40;
  if (mobLevel < 60) return 50;
  if (mobLevel < 70) return 60;
  return 70;
}

// Приклад ресурсів (будуть замінені на реальні з XML)
// Тут використовуються ID у форматі "item_2000", "item_2001" тощо
// Або можна використовувати числові ID, якщо itemsDB підтримує

// Поки що використовуємо загальні ресурси, які вже є в системі
const resourceIdsByLevel: Record<number, string[]> = {
  1: [
    "animal_skin", "animal_bone", "coal", "charcoal", "crafted_leather", 
    "bone_powder", "thread", "cord", "suede", "iron_ore", "steel"
  ],
  20: [
    "animal_skin", "animal_bone", "coal", "charcoal", "crafted_leather", 
    "bone_powder", "thread", "cord", "suede", "iron_ore", "steel",
    "varnish", "thick_leather", "hard_leather"
  ],
  30: [
    "coal", "charcoal", "varnish", "thick_leather", "hard_leather",
    "bronze", "steel", "fine_steel", "silver", "gold"
  ],
  40: [
    "thick_leather", "hard_leather", "bronze", "steel", "fine_steel",
    "silver", "gold", "mithril", "oriharukon", "adamantite"
  ],
  50: [
    "bronze", "steel", "fine_steel", "silver", "gold",
    "mithril", "oriharukon", "adamantite", "blackmithril"
  ],
  60: [
    "fine_steel", "silver", "gold", "mithril", "oriharukon",
    "adamantite", "blackmithril", "crystal"
  ],
  70: [
    "gold", "mithril", "oriharukon", "adamantite", "blackmithril",
    "crystal", "dragon_scale", "dragon_bone"
  ]
};

/**
 * Генерує дропи ресурсів для моба на основі його рівня
 * @param mobLevel - рівень моба
 * @param mobIndex - індекс моба (для різноманітності)
 * @param isChampion - чи це чемпіон
 * @returns масив DropEntry для дропів
 */
export function generateResourceDrops(
  mobLevel: number,
  mobIndex: number,
  isChampion: boolean = false
): DropEntry[] {
  const resourceLevel = getResourceLevel(mobLevel);
  const resources = resourceIdsByLevel[resourceLevel] || resourceIdsByLevel[1];
  
  // Генеруємо 1-3 ресурси
  const numResources = (mobIndex % 3) + 1;
  const selectedResources: string[] = [];
  
  for (let i = 0; i < numResources; i++) {
    const resourceIndex = (mobIndex * 3 + i) % resources.length;
    const resource = resources[resourceIndex];
    if (!selectedResources.includes(resource)) {
      selectedResources.push(resource);
    } else {
      const nextResource = resources[(resourceIndex + 1) % resources.length];
      if (!selectedResources.includes(nextResource)) {
        selectedResources.push(nextResource);
      }
    }
  }
  
  const count = isChampion ? 10 : 1;
  const dropChance = isChampion ? 0.6 : 0.25;
  
  return selectedResources.map(resource => ({
    id: resource,
    kind: "resource" as const,
    chance: dropChance,
    min: count,
    max: count * 2,
  }));
}

/**
 * Генерує спойли ресурсів для моба на основі його рівня
 * @param mobLevel - рівень моба
 * @param mobIndex - індекс моба (для різноманітності)
 * @param isChampion - чи це чемпіон
 * @returns масив DropEntry для спойлів
 */
export function generateResourceSpoils(
  mobLevel: number,
  mobIndex: number,
  isChampion: boolean = false
): DropEntry[] {
  const resourceLevel = getResourceLevel(mobLevel);
  const resources = resourceIdsByLevel[resourceLevel] || resourceIdsByLevel[1];
  
  // Генеруємо 1-3 ресурси
  const numResources = (mobIndex % 3) + 1;
  const selectedResources: string[] = [];
  
  for (let i = 0; i < numResources; i++) {
    const resourceIndex = (mobIndex * 5 + i) % resources.length;
    const resource = resources[resourceIndex];
    if (!selectedResources.includes(resource)) {
      selectedResources.push(resource);
    } else {
      const nextResource = resources[(resourceIndex + 1) % resources.length];
      if (!selectedResources.includes(nextResource)) {
        selectedResources.push(nextResource);
      }
    }
  }
  
  const count = isChampion ? 10 : 1;
  const spoilChance = isChampion ? 0.8 : 0.35;
  
  return selectedResources.map(resource => ({
    id: resource,
    kind: "resource" as const,
    chance: spoilChance,
    min: count,
    max: count * 2,
  }));
}

/**
 * Генерує дропи ресурсів для рейд-боса
 * @param mobLevel - рівень рейд-боса
 * @param mobIndex - індекс рейд-боса (для різноманітності)
 * @returns масив DropEntry для дропів (шанс 80%)
 */
export function generateRaidBossResourceDrops(
  mobLevel: number,
  mobIndex: number
): DropEntry[] {
  const resourceLevel = getResourceLevel(mobLevel);
  const resources = resourceIdsByLevel[resourceLevel] || resourceIdsByLevel[60];
  
  // Для рейд-босів генеруємо 2-4 ресурси
  const numResources = (mobIndex % 3) + 2;
  const selectedResources: string[] = [];
  
  for (let i = 0; i < numResources; i++) {
    const resourceIndex = (mobIndex * 3 + i) % resources.length;
    const resource = resources[resourceIndex];
    if (!selectedResources.includes(resource)) {
      selectedResources.push(resource);
    } else {
      const nextResource = resources[(resourceIndex + 1) % resources.length];
      if (!selectedResources.includes(nextResource)) {
        selectedResources.push(nextResource);
      }
    }
  }
  
  return selectedResources.map(resource => ({
    id: resource,
    kind: "resource" as const,
    chance: 0.8, // 80% шанс для рейд-босів
    min: 5,
    max: 15,
  }));
}


