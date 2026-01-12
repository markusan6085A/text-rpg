// src/data/zones/floran_outskirts.ts
import type { Mob } from "../world/types";
import type { DropEntry } from "../combat/types";

// Ресурси для дропу та спойлу (Floran Outskirts: 1-6 лвл)
// Базові ресурси для низьких рівнів
const resourceDrops: string[] = [
  "coal", "animal_bone", "animal_skin", "charcoal", "varnish", "iron_ore", "stem", "thread", "suede"
];

const resourceSpoils: string[] = [
  "coal", "animal_bone", "animal_skin", "charcoal", "varnish", "iron_ore", "stem", "thread", "suede"
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
  // Використовуємо назву моба для детермінованого вибору ресурсів
  const nameHash = mobName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const numResources = 3 + (nameHash % 4); // 3-6 ресурсів
  
  // Створюємо унікальний набір ресурсів для кожного типу моба
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

// Генеруємо 50 звичайних мобів 1-6 лвл
const normalMobs: Mob[] = [];

// Визначаємо позиції для квестових мобів (по 4-5 кожен, уникаючи чемпіонів на позиціях: 5, 12, 20, 28, 37, 45)
const questMobPositions: { name: string; indices: number[] }[] = [
  { name: "Floran Bandit", indices: [0, 1, 2, 3, 4] },      // 5 мобів (0-4)
  { name: "Floran Warrior", indices: [6, 7, 8, 9, 10] },    // 5 мобів (6-10, уникаємо 5 і 12)
  { name: "Floran Cleric", indices: [21, 22, 23, 24] },     // 4 моби (21-24, уникаємо 20 і 28)
];

// Створюємо мапу позицій для квестових мобів
const questMobMap = new Map<number, string>();
questMobPositions.forEach(({ name, indices }) => {
  indices.forEach(idx => questMobMap.set(idx, name));
});

// Різні назви мобів для Floran Outskirts (групування: 7, 6, 7, 6, 7, 6, 7, 6, 6)
const mobNameGroups = [
  { name: "Outskirts Wanderer", count: 7 },
  { name: "Outskirts Nomad", count: 6 },
  { name: "Outskirts Traveler", count: 7 },
  { name: "Outskirts Drifter", count: 6 },
  { name: "Outskirts Rover", count: 7 },
  { name: "Outskirts Vagabond", count: 6 },
  { name: "Outskirts Wayfarer", count: 7 },
  { name: "Outskirts Pilgrim", count: 6 },
  { name: "Outskirts Explorer", count: 6 },
];

let mobIndex = 0;
let groupIndex = 0;
let currentGroupCount = 0;

for (let i = 0; i < 50; i++) {
  const level = Math.floor(i / 8.33) + 1; // Розподіл: 0-8 -> 1, 9-16 -> 2, 17-25 -> 3, 26-33 -> 4, 34-41 -> 5, 42-49 -> 6
  const clampedLevel = Math.min(6, Math.max(1, level));
  const stats = createMobStats(clampedLevel, false);
  
  // Перевіряємо, чи це квестовий моб
  let mobName: string;
  if (questMobMap.has(i)) {
    mobName = questMobMap.get(i)!;
  } else {
    // Визначаємо назву на основі групування для неквестових мобів
    if (currentGroupCount >= mobNameGroups[groupIndex].count) {
      groupIndex++;
      currentGroupCount = 0;
    }
    mobName = mobNameGroups[groupIndex].name;
    currentGroupCount++;
  }
  
  const baseDrops = generateResourceDrops(i, mobName, false);
  
  // Квестові предмети НЕ додаємо до mob.drops - вони додаються автоматично в processDrops.ts тільки якщо квест активний
  
  normalMobs.push({
    id: `fl_outskirts_mob_${i + 1}`,
    name: mobName,
    ...stats,
    drops: baseDrops, // Тільки ресурси, квестові предмети додаються в processDrops.ts якщо квест активний
    spoil: generateResourceSpoils(i, mobName, false),
  });
  
  mobIndex++;
}

// Додаємо 6 чемпіонів в розброс (на позиціях: 5, 12, 20, 28, 37, 45)
const championIndices = [5, 12, 20, 28, 37, 45];
const championNames = [
  "[Champion] Floran Elite Warrior", // Перший чемпіон для квесту
  "[Champion] Outskirts Warlord",
  "[Champion] Outskirts Chieftain",
  "[Champion] Outskirts Leader",
  "[Champion] Outskirts Commander",
  "[Champion] Outskirts Master",
];

championIndices.forEach((index, i) => {
  const level = Math.floor(index / 8.33) + 1;
  const clampedLevel = Math.min(6, Math.max(1, level));
  const stats = createMobStats(clampedLevel, true);
  
  const baseChampionDrops = generateResourceDrops(index, championNames[i], true); // х10 для чемпіонів
  
  // Квестові предмети НЕ додаємо до mob.drops - вони додаються автоматично в processDrops.ts тільки якщо квест активний
  
  normalMobs[index] = {
    id: `fl_outskirts_champion_${i + 1}`,
    name: championNames[i],
    ...stats,
    drops: baseChampionDrops, // Тільки ресурси, квестові предмети додаються в processDrops.ts якщо квест активний
    spoil: generateResourceSpoils(index, championNames[i], true), // х10 для чемпіонів
  };
});

export const FLORAN_OUTSKIRTS_MOBS: Mob[] = normalMobs;



