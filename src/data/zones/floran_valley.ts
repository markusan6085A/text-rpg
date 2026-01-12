// src/data/zones/floran_valley.ts
import type { Mob } from "../world/types";
import type { DropEntry } from "../combat/types";

// Ресурси для дропу та спойлу (Floran Valley: 6-20 лвл)
// Базові ресурси + Silver Nugget + Adamantite Nugget + Mithril Ore
const resourceDrops: string[] = [
  "coal", "animal_bone", "animal_skin", "charcoal", "varnish", "iron_ore",
  "stem", "thread", "suede", "silver_nugget", "adamantite_nugget", "mithril_ore"
];

const resourceSpoils: string[] = [
  "coal", "animal_bone", "animal_skin", "charcoal", "varnish", "iron_ore",
  "stem", "thread", "suede", "silver_nugget", "adamantite_nugget", "mithril_ore"
];

// Функція для генерації базових статів моба за рівнем
function createMobStats(level: number, isChampion: boolean = false) {
  const baseHp = 100 + level * 50;
  const basePAtk = 20 + level * 5;
  const basePDef = 15 + level * 4;
  const baseMDef = 10 + level * 3;
  const baseExp = 50 + level * 20;
  const baseAdena = 20 + level * 10;

  // Множник для чемпіонів (трохи посилено)
  const championMult = isChampion ? 3.0 : 1.0;

  // Збільшуємо HP, pAtk, pDef, mDef у 2 рази
  return {
    level,
    hp: Math.round(baseHp * championMult * 2),
    mp: 0,
    pAtk: Math.round(basePAtk * championMult * 2),
    mAtk: 0,
    pDef: Math.round(basePDef * championMult * 2),
    mDef: Math.round(baseMDef * championMult * 2),
    exp: isChampion ? Math.round(baseExp * championMult * 10) : Math.round(baseExp * championMult),
    sp: isChampion ? Math.round(level * 5 * 10) : Math.round(level * 2), // SP х10 для чемпіонів
    adenaMin: isChampion ? Math.round(baseAdena * championMult * 10) : Math.round(baseAdena * championMult),
    adenaMax: isChampion ? Math.round(baseAdena * 1.5 * championMult * 10) : Math.round(baseAdena * 1.5 * championMult),
    dropChance: isChampion ? 0.6 : 0.25,
  };
}

// Функція для генерації дропу ресурсів (3-6 ресурсів для кожного моба)
function generateResourceDrops(mobIndex: number, mobName: string, isChampion: boolean = false): DropEntry[] {
  const count = isChampion ? 10 : 1;
  const nameHash = mobName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const numResources = 3 + (nameHash % 4); // 3-6 ресурсів
  
  const selectedResources: string[] = [];
  const usedIndices = new Set<number>();
  
  for (let i = 0; i < numResources; i++) {
    let attempts = 0;
    while (attempts < resourceDrops.length) {
      const resourceIndex = (nameHash + i * 7 + attempts) % resourceDrops.length;
      if (!usedIndices.has(resourceIndex)) {
        selectedResources.push(resourceDrops[resourceIndex]);
        usedIndices.add(resourceIndex);
        break;
      }
      attempts++;
    }
  }
  
  return selectedResources.map((resource, idx) => {
    const baseChance = 0.20 + (idx % 4) * 0.05; // 20%, 25%, 30%, 35%
    const chance = isChampion ? Math.min(0.8, baseChance + 0.2) : baseChance;
    
    return {
      id: resource,
      kind: "resource" as const,
      chance: Math.min(0.35, chance),
      min: count,
      max: count * 2,
    };
  });
}

// Функція для генерації спойлу ресурсів (3-6 ресурсів) - шанс на 20% більший
function generateResourceSpoils(mobIndex: number, mobName: string, isChampion: boolean = false): DropEntry[] {
  const count = isChampion ? 10 : 1;
  const nameHash = mobName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const numResources = 3 + ((nameHash + 13) % 4); // 3-6 ресурсів
  
  const selectedResources: string[] = [];
  const usedIndices = new Set<number>();
  
  for (let i = 0; i < numResources; i++) {
    let attempts = 0;
    while (attempts < resourceSpoils.length) {
      const resourceIndex = (nameHash + i * 11 + attempts + 5) % resourceSpoils.length;
      if (!usedIndices.has(resourceIndex)) {
        selectedResources.push(resourceSpoils[resourceIndex]);
        usedIndices.add(resourceIndex);
        break;
      }
      attempts++;
    }
  }
  
  return selectedResources.map((resource, idx) => {
    const baseChance = 0.40 + (idx % 4) * 0.05; // 40%, 45%, 50%, 55%
    const chance = isChampion ? Math.min(0.9, baseChance + 0.2) : baseChance;
    
    return {
      id: resource,
      kind: "resource" as const,
      chance: Math.min(0.55, chance),
      min: count,
      max: count * 2,
    };
  });
}

// Генеруємо 70 звичайних мобів 6-20 лвл
const normalMobs: Mob[] = [];
// Різні назви мобів для Floran Valley (групування: 8, 6, 8, 6, 8, 6, 8, 6, 8, 6, 8, 6)
const mobNameGroups = [
  { name: "Valley Dweller", count: 8 },
  { name: "Valley Inhabitant", count: 6 },
  { name: "Valley Resident", count: 8 },
  { name: "Valley Settler", count: 6 },
  { name: "Valley Native", count: 8 },
  { name: "Valley Local", count: 6 },
  { name: "Valley Citizen", count: 8 },
  { name: "Valley Villager", count: 6 },
  { name: "Valley Commoner", count: 8 },
  { name: "Valley Peasant", count: 6 },
  { name: "Valley Farmer", count: 8 },
  { name: "Valley Worker", count: 6 },
];

let mobIndex = 0;
let groupIndex = 0;
let currentGroupCount = 0;

for (let i = 0; i < 70; i++) {
  // Розподіл рівнів: 0-4 -> 6, 5-9 -> 7, 10-14 -> 8, 15-19 -> 9, 20-24 -> 10, 25-29 -> 11, 30-34 -> 12, 35-39 -> 13, 40-44 -> 14, 45-49 -> 15, 50-54 -> 16, 55-59 -> 17, 60-64 -> 18, 65-69 -> 19, 70 -> 20
  const level = Math.floor(i / 5) + 6;
  const clampedLevel = Math.min(20, Math.max(6, level));
  const stats = createMobStats(clampedLevel, false);
  
  // Визначаємо назву на основі групування
  if (currentGroupCount >= mobNameGroups[groupIndex].count) {
    groupIndex++;
    currentGroupCount = 0;
  }
  
  const mobName = mobNameGroups[groupIndex].name;
  currentGroupCount++;
  
  const baseDrops = generateResourceDrops(i, mobName, false);
  
  // Квестові предмети НЕ додаємо до mob.drops - вони додаються автоматично в processDrops.ts тільки якщо квест активний
  
  normalMobs.push({
    id: `fl_valley_mob_${i + 1}`,
    name: mobName,
    ...stats,
    drops: baseDrops, // Тільки ресурси, квестові предмети додаються в processDrops.ts якщо квест активний
    spoil: generateResourceSpoils(i, mobName, false),
  });
  
  mobIndex++;
}

// Додаємо 10 чемпіонів в розброс (на позиціях: 7, 15, 23, 31, 39, 47, 55, 62, 66, 69)
const championIndices = [7, 15, 23, 31, 39, 47, 55, 62, 66, 69];
const championNames = [
  "[Champion] Valley Warlord",
  "[Champion] Valley Chieftain",
  "[Champion] Valley Captain",
  "[Champion] Valley Leader",
  "[Champion] Valley Commander",
  "[Champion] Valley Master",
  "[Champion] Valley General",
  "[Champion] Valley Archon",
  "[Champion] Valley Overlord",
  "[Champion] Valley Champion",
];

championIndices.forEach((index, i) => {
  // Різні рівні для чемпіонів: 8, 10, 12, 14, 16, 18, 20, 17, 19, 20
  const championLevels = [8, 10, 12, 14, 16, 18, 20, 17, 19, 20];
  const level = championLevels[i];
  const stats = createMobStats(level, true);
  
  const baseChampionDrops = generateResourceDrops(index, championNames[i], true); // х10 для чемпіонів
  
  // Квестові предмети НЕ додаємо до mob.drops - вони додаються автоматично в processDrops.ts тільки якщо квест активний
  
  normalMobs[index] = {
    id: `fl_valley_champion_${i + 1}`,
    name: championNames[i],
    ...stats,
    drops: baseChampionDrops, // Тільки ресурси, квестові предмети додаються в processDrops.ts якщо квест активний
    spoil: generateResourceSpoils(index, championNames[i], true), // х10 для чемпіонів
  };
});

export const FLORAN_VALLEY_MOBS: Mob[] = normalMobs;




