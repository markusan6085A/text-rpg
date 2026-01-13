// src/data/zones/floran_forest.ts
import type { Mob } from "../world/types";
import type { DropEntry } from "../combat/types";
import type { RaidBoss } from "../bosses/floran_overlord";

// Ресурси для дропу та спойлу (Floran Forest: 7-16 лвл)
// Базові ресурси + Silver Nugget + Adamantite Nugget
const resourceDrops: string[] = [
  "coal", "animal_bone", "animal_skin", "charcoal", "varnish", "iron_ore",
  "stem", "thread", "suede", "silver_nugget", "adamantite_nugget"
];

const resourceSpoils: string[] = [
  "coal", "animal_bone", "animal_skin", "charcoal", "varnish", "iron_ore",
  "stem", "thread", "suede", "silver_nugget", "adamantite_nugget"
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

// Генеруємо 60 звичайних мобів 7-16 лвл
const normalMobs: Mob[] = [];
// Різні назви мобів для Floran Forest (групування: 8, 6, 8, 6, 8, 6, 8, 6, 8, 4)
const mobNameGroups = [
  { name: "Forest Stalker", count: 8 },
  { name: "Forest Watcher", count: 6 },
  { name: "Forest Predator", count: 8 },
  { name: "Forest Hunter", count: 6 },
  { name: "Forest Tracker", count: 8 },
  { name: "Forest Scout", count: 6 },
  { name: "Forest Ranger", count: 8 },
  { name: "Forest Warden", count: 6 },
  { name: "Forest Guardian", count: 8 },
  { name: "Forest Keeper", count: 4 },
];

let mobIndex = 0;
let groupIndex = 0;
let currentGroupCount = 0;

for (let i = 0; i < 60; i++) {
  // Розподіл рівнів: 0-5 -> 7, 6-11 -> 8, 12-17 -> 9, 18-23 -> 10, 24-29 -> 11, 30-35 -> 12, 36-41 -> 13, 42-47 -> 14, 48-53 -> 15, 54-59 -> 16
  const level = Math.floor(i / 6) + 7;
  const clampedLevel = Math.min(16, Math.max(7, level));
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
    id: `fl_forest_mob_${i + 1}`,
    name: mobName,
    ...stats,
    drops: baseDrops, // Тільки ресурси, квестові предмети додаються в processDrops.ts якщо квест активний
    spoil: generateResourceSpoils(i, mobName, false),
  });
  
  mobIndex++;
}

// Додаємо 8 чемпіонів в розброс (на позиціях: 6, 14, 22, 30, 38, 46, 52, 58)
const championIndices = [6, 14, 22, 30, 38, 46, 52, 58];
const championNames = [
  "[Champion] Forest Master",
  "[Champion] Forest Lord",
  "[Champion] Forest Champion",
  "[Champion] Forest Elite",
  "[Champion] Forest Commander",
  "[Champion] Forest General",
  "[Champion] Forest Archon",
  "[Champion] Forest Overlord",
];

championIndices.forEach((index, i) => {
  // Різні рівні для чемпіонів: 8, 9, 10, 11, 12, 13, 14, 15
  const championLevels = [8, 9, 10, 11, 12, 13, 14, 15];
  const level = championLevels[i];
  const stats = createMobStats(level, true);
  
  const baseChampionDrops = generateResourceDrops(index, championNames[i], true);
  
  // Квестові предмети НЕ додаємо до mob.drops - вони додаються автоматично в processDrops.ts тільки якщо квест активний
  
  normalMobs[index] = {
    id: `fl_forest_champion_${i + 1}`,
    name: championNames[i],
    ...stats,
    drops: baseChampionDrops, // Тільки ресурси, квестові предмети додаються в processDrops.ts якщо квест активний
    spoil: generateResourceSpoils(index, championNames[i], true),
  };
});

// Додаємо 3 РБ з респавном 6 годин
const raidBosses: RaidBoss[] = [
  {
    id: "rb_floran_forest_guardian",
    name: "Raid Boss: Ancient Forest Keeper",
    level: 12,
    hp: 75_000,
    mp: 0,
    pAtk: 275,
    mAtk: 0,
    pDef: 190,
    mDef: 250,
    exp: 250_000, // Більше опиту
    sp: 25_000, // Більше SP
    adenaMin: 5_000, // Трошки більше адени
    adenaMax: 8_000,
    dropChance: 1.0,
    isRaidBoss: true,
    respawnTime: 6 * 60 * 60, // 6 годин
    dropProfileId: "rb_floran_forest_guardian_drop",
    aiProfileId: "rb_floran_ai",
    zoneId: "floran_forest",
    drops: generateResourceDrops(0, "Raid Boss: Ancient Forest Keeper", false).map(drop => ({
      ...drop,
      chance: Math.min(0.5, drop.chance * 1.5), // Вищі шанси для РБ
      min: drop.min * 5, // Більше ресурсів для РБ
      max: drop.max * 10,
    })),
  },
  {
    id: "rb_floran_forest_warlord",
    name: "Raid Boss: Ancient Forest Warlord",
    level: 14,
    hp: 100_000,
    mp: 0,
    pAtk: 300,
    mAtk: 0,
    pDef: 207,
    mDef: 275,
    exp: 350_000, // Більше опиту
    sp: 35_000, // Більше SP
    adenaMin: 7_000, // Трошки більше адени
    adenaMax: 11_000,
    dropChance: 1.0,
    isRaidBoss: true,
    respawnTime: 6 * 60 * 60, // 6 годин
    dropProfileId: "rb_floran_forest_warlord_drop",
    aiProfileId: "rb_floran_ai",
    zoneId: "floran_forest",
    drops: generateResourceDrops(1, "Raid Boss: Ancient Forest Warlord", false).map(drop => ({
      ...drop,
      chance: Math.min(0.5, drop.chance * 1.5),
      min: drop.min * 5,
      max: drop.max * 10,
    })),
  },
  {
    id: "rb_floran_forest_overlord",
    name: "Raid Boss: Ancient Forest Overlord",
    level: 16,
    hp: 140_000,
    mp: 0,
    pAtk: 325,
    mAtk: 0,
    pDef: 225,
    mDef: 300,
    exp: 500_000, // Більше опиту
    sp: 50_000, // Більше SP
    adenaMin: 10_000, // Трошки більше адени
    adenaMax: 15_000,
    dropChance: 1.0,
    isRaidBoss: true,
    respawnTime: 6 * 60 * 60, // 6 годин
    dropProfileId: "rb_floran_forest_overlord_drop",
    aiProfileId: "rb_floran_ai",
    zoneId: "floran_forest",
    drops: generateResourceDrops(2, "Raid Boss: Ancient Forest Overlord", false).map(drop => ({
      ...drop,
      chance: Math.min(0.5, drop.chance * 1.5),
      min: drop.min * 5,
      max: drop.max * 10,
    })),
  },
];

export const FLORAN_FOREST_MOBS: Mob[] = [...normalMobs, ...raidBosses];




