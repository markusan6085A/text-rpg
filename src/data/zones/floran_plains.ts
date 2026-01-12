// src/data/zones/floran_plains.ts
import type { Mob } from "../world/types";
import type { DropEntry } from "../combat/types";

// Ресурси для дропу та спойлу (Floran Plains: 3-10 лвл)
// Базові ресурси + Silver Nugget
const resourceDrops: string[] = [
  "coal", "animal_bone", "animal_skin", "charcoal", "varnish", "iron_ore", 
  "stem", "thread", "suede", "silver_nugget"
];

const resourceSpoils: string[] = [
  "coal", "animal_bone", "animal_skin", "charcoal", "varnish", "iron_ore",
  "stem", "thread", "suede", "silver_nugget"
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

// Функція для генерації дропу ресурсів (3-6 ресурсів для кожного моба) - фіксовано для кожного моба
function generateResourceDrops(mobIndex: number, mobName: string, isChampion: boolean = false): DropEntry[] {
  const count = isChampion ? 10 : 1; // Для чемпіонів х10
  
  // Для кожного типу моба - 3-6 різних ресурсів
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
    // Шанс: 20-35% для звичайних, вище для чемпіонів
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

// Функція для генерації спойлу ресурсів (3-6 ресурсів для кожного моба) - шанс на 20% більший
function generateResourceSpoils(mobIndex: number, mobName: string, isChampion: boolean = false): DropEntry[] {
  const count = isChampion ? 10 : 1; // Для чемпіонів х10
  
  // Для кожного типу моба - 3-6 різних ресурсів (може відрізнятися від дропу)
  const nameHash = mobName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const numResources = 3 + ((nameHash + 13) % 4); // 3-6 ресурсів (інший offset)
  
  const selectedResources: string[] = [];
  const usedIndices = new Set<number>();
  
  for (let i = 0; i < numResources; i++) {
    let attempts = 0;
    while (attempts < resourceSpoils.length) {
      const resourceIndex = (nameHash + i * 11 + attempts + 5) % resourceSpoils.length; // Інший offset
      if (!usedIndices.has(resourceIndex)) {
        selectedResources.push(resourceSpoils[resourceIndex]);
        usedIndices.add(resourceIndex);
        break;
      }
      attempts++;
    }
  }
  
  return selectedResources.map((resource, idx) => {
    // Шанс: на 20% більший ніж дроп (40-55% або менше)
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

// Генеруємо 60 звичайних мобів 3-10 лвл
const normalMobs: Mob[] = [];
// Різні назви мобів для Floran Plains (групування: 9, 6, 9, 6, 9, 6, 9, 6, 6)
const mobNameGroups = [
  { name: "Plains Wanderer", count: 9 },
  { name: "Plains Nomad", count: 6 },
  { name: "Plains Traveler", count: 9 },
  { name: "Plains Drifter", count: 6 },
  { name: "Plains Rover", count: 9 },
  { name: "Plains Vagabond", count: 6 },
  { name: "Plains Wayfarer", count: 9 },
  { name: "Plains Pilgrim", count: 6 },
  { name: "Plains Explorer", count: 6 },
];

let mobIndex = 0;
let groupIndex = 0;
let currentGroupCount = 0;

for (let i = 0; i < 60; i++) {
  // Розподіл рівнів: 0-7 -> 3, 8-15 -> 4, 16-23 -> 5, 24-31 -> 6, 32-39 -> 7, 40-47 -> 8, 48-55 -> 9, 56-59 -> 10
  const level = Math.floor(i / 8.57) + 3;
  const clampedLevel = Math.min(10, Math.max(3, level));
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
    id: `fl_plains_mob_${i + 1}`,
    name: mobName,
    ...stats,
    drops: baseDrops, // Тільки ресурси, квестові предмети додаються в processDrops.ts якщо квест активний
    spoil: generateResourceSpoils(i, mobName, false),
  });
  
  mobIndex++;
}

// Додаємо 10 чемпіонів в розброс (на позиціях: 5, 12, 20, 28, 37, 45, 52, 55, 57, 59)
const championIndices = [5, 12, 20, 28, 37, 45, 52, 55, 57, 59];
const championNames = [
  "[Champion] Plains Warlord",
  "[Champion] Plains Chieftain",
  "[Champion] Plains Captain",
  "[Champion] Plains Leader",
  "[Champion] Plains Commander",
  "[Champion] Plains Master",
  "[Champion] Plains General",
  "[Champion] Plains Archon",
  "[Champion] Plains Overlord",
  "[Champion] Plains Champion",
];

championIndices.forEach((index, i) => {
  // Різні рівні для чемпіонів: 4, 5, 6, 7, 8, 9, 10, 8, 9, 10
  const championLevels = [4, 5, 6, 7, 8, 9, 10, 8, 9, 10];
  const level = championLevels[i];
  const stats = createMobStats(level, true);
  
  const baseChampionDrops = generateResourceDrops(index, championNames[i], true); // х10 для чемпіонів
  
  // Квестові предмети НЕ додаємо до mob.drops - вони додаються автоматично в processDrops.ts тільки якщо квест активний
  
  normalMobs[index] = {
    id: `fl_plains_champion_${i + 1}`,
    name: championNames[i],
    ...stats,
    drops: baseChampionDrops, // Тільки ресурси, квестові предмети додаються в processDrops.ts якщо квест активний
    spoil: generateResourceSpoils(index, championNames[i], true), // х10 для чемпіонів
  };
});

export const FLORAN_PLAINS_MOBS: Mob[] = normalMobs;




