// src/data/zones/floran_hills.ts
import type { Mob } from "../world/types";
import type { DropEntry } from "../combat/types";
import type { RaidBoss } from "../bosses/floran_overlord";

// Ресурси для дропу та спойлу (Floran Hills: 12-24 лвл)
// Базові ресурси + Silver Nugget + Adamantite Nugget + Mithril Ore + Stone of Purity + Oriharukon Ore
const resourceDrops: string[] = [
  "coal", "animal_bone", "animal_skin", "charcoal", "varnish", "iron_ore",
  "stem", "thread", "suede", "silver_nugget", "adamantite_nugget", "mithril_ore",
  "stone_of_purity", "oriharukon_ore"
];

const resourceSpoils: string[] = [
  "coal", "animal_bone", "animal_skin", "charcoal", "varnish", "iron_ore",
  "stem", "thread", "suede", "silver_nugget", "adamantite_nugget", "mithril_ore",
  "stone_of_purity", "oriharukon_ore"
];

// Функція для генерації базових статів моба за рівнем (без х2)
function createMobStats(level: number, isChampion: boolean = false) {
  const baseHp = 100 + level * 50;
  const basePAtk = 20 + level * 5;
  const basePDef = 15 + level * 4;
  const baseMDef = 10 + level * 3;
  const baseExp = 50 + level * 20;
  const baseAdena = 20 + level * 10;

  // Множник для чемпіонів (трохи посилено)
  const championMult = isChampion ? 3.0 : 1.0;

  // Без х2 для статів
  return {
    level,
    hp: Math.round(baseHp * championMult),
    mp: 0,
    pAtk: Math.round(basePAtk * championMult),
    mAtk: 0,
    pDef: Math.round(basePDef * championMult),
    mDef: Math.round(baseMDef * championMult),
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

// Функція для генерації D-grade зброї (4-7 різних пушок, шанс 15% на кожну)
function generateDGradeWeaponDrops(rbIndex: number): DropEntry[] {
  const allDGradeWeapons = [
    "d_atuba_hammer",
    "d_baguette_dual_sword",
    "d_dark_elven_bow",
    "d_knights_sword",
    "d_shilen_knife",
    "d_tomahawk",
    "d_triple_edged_jamadhr",
    "d_two_handed_sword",
    "d_war_hammer",
  ];

  // Вибираємо 4-7 різних зброй на основі rbIndex
  const numWeapons = 4 + (rbIndex % 4); // 4-7 зброї
  const selectedWeapons: string[] = [];
  const usedIndices = new Set<number>();

  for (let i = 0; i < numWeapons; i++) {
    let attempts = 0;
    while (attempts < allDGradeWeapons.length) {
      const weaponIndex = (rbIndex * 3 + i * 7 + attempts) % allDGradeWeapons.length;
      if (!usedIndices.has(weaponIndex)) {
        selectedWeapons.push(allDGradeWeapons[weaponIndex]);
        usedIndices.add(weaponIndex);
        break;
      }
      attempts++;
    }
  }

  return selectedWeapons.map(weaponId => ({
    id: weaponId,
    kind: "equipment" as const,
    chance: 0.15, // 15% шанс
    min: 1,
    max: 1,
  }));
}

// Функція для генерації D-grade броні (1 сет на РБ, шанс 5% на кожну частинку)
function generateDGradeArmorDrops(rbIndex: number): DropEntry[] {
  // Mithril Set (Heavy Armor)
  const mithrilSet = [
    "mithril_helmet",
    "mithril_breastplate",
    "mithril_gaiters",
    "mithril_gloves",
    "mithril_boots",
  ];

  // Reinforced Set (Light Armor)
  const reinforcedSet = [
    "leather_helmet",
    "reinforced_leather_shirt",
    "reinforced_leather_gaiters",
    "reinforced_gloves",
    "reinforced_leather_boots",
  ];

  // Knowledge Set (Magic Armor/Robe)
  const knowledgeSet = [
    "cloth_cap",
    "tunic_of_knowledge",
    "stockings_of_knowledge",
    "gloves_of_knowledge",
    "boots_of_knowledge",
  ];

  // Вибираємо один сет на основі rbIndex
  const allSets = [mithrilSet, reinforcedSet, knowledgeSet];
  const selectedSet = allSets[rbIndex % allSets.length];

  return selectedSet.map(armorId => ({
    id: armorId,
    kind: "equipment" as const,
    chance: 0.05, // 5% шанс на кожну частинку
    min: 1,
    max: 1,
  }));
}

// Функція для генерації blessed scrolls (D-grade, 1-3 шт, шанс 10%)
function generateBlessedScrollDrops(rbIndex: number): DropEntry[] {
  const scrolls = [
    { id: "blessed_scroll_enchant_weapon_grade_d", kind: "other" as const },
    { id: "blessed_scroll_enchant_armor_grade_d", kind: "other" as const },
  ];

  // Випадкова кількість (1-3) на основі rbIndex
  const numScrolls = 1 + (rbIndex % 3); // 1-3 скроли
  const selectedScrolls: typeof scrolls = [];
  const usedIndices = new Set<number>();

  for (let i = 0; i < numScrolls; i++) {
    let attempts = 0;
    while (attempts < scrolls.length) {
      const scrollIndex = (rbIndex * 2 + i * 5 + attempts) % scrolls.length;
      if (!usedIndices.has(scrollIndex)) {
        selectedScrolls.push(scrolls[scrollIndex]);
        usedIndices.add(scrollIndex);
        break;
      }
      attempts++;
    }
  }

  return selectedScrolls.map(scroll => ({
    id: scroll.id,
    kind: scroll.kind,
    chance: 0.10, // 10% шанс
    min: 1,
    max: 3, // 1-3 шт
  }));
}

// Генеруємо мобів 12-24 лвл (кількість буде визначена після додавання чемпіонів і РБ)
const normalMobs: Mob[] = [];
// Різні назви мобів для Floran Hills (групування: 9, 6, 9, 6, 9, 6, 9, 6, 6)
const mobNameGroups = [
  { name: "Hills Raider", count: 9 },
  { name: "Hills Marauder", count: 6 },
  { name: "Hills Bandit", count: 9 },
  { name: "Hills Outlaw", count: 6 },
  { name: "Hills Reaver", count: 9 },
  { name: "Hills Pillager", count: 6 },
  { name: "Hills Ravager", count: 9 },
  { name: "Hills Brigand", count: 6 },
  { name: "Hills Despoiler", count: 6 },
];

let mobIndex = 0;
let groupIndex = 0;
let currentGroupCount = 0;

for (let i = 0; i < 60; i++) {
  // Розподіл рівнів: 0-4 -> 12, 5-9 -> 13, 10-14 -> 14, 15-19 -> 15, 20-24 -> 16, 25-29 -> 17, 30-34 -> 18, 35-39 -> 19, 40-44 -> 20, 45-49 -> 21, 50-54 -> 22, 55-59 -> 23, 60 -> 24
  const level = Math.floor(i / 5) + 12;
  const clampedLevel = Math.min(24, Math.max(12, level));
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
    id: `fl_hills_mob_${i + 1}`,
    name: mobName,
    ...stats,
    drops: baseDrops, // Тільки ресурси, квестові предмети додаються в processDrops.ts якщо квест активний
    spoil: generateResourceSpoils(i, mobName, false),
  });
  
  mobIndex++;
}

// Додаємо 6 чемпіонів в розброс (на позиціях: 8, 18, 28, 38, 48, 58)
const championIndices = [8, 18, 28, 38, 48, 58];
const championNames = [
  "[Champion] Hills Warlord",
  "[Champion] Hills Chieftain",
  "[Champion] Hills Captain",
  "[Champion] Hills Leader",
  "[Champion] Hills Commander",
  "[Champion] Hills Master",
];

championIndices.forEach((index, i) => {
  // Різні рівні для чемпіонів: 14, 16, 18, 20, 22, 24
  const championLevels = [14, 16, 18, 20, 22, 24];
  const level = championLevels[i];
  const stats = createMobStats(level, true);
  
  normalMobs[index] = {
    id: `fl_hills_champion_${i + 1}`,
    name: championNames[i],
    ...stats,
    drops: generateResourceDrops(index, championNames[i], true),
    spoil: generateResourceSpoils(index, championNames[i], true),
  };
});

// Додаємо 4 РБ з респавном 6 годин
const raidBosses: RaidBoss[] = [
  {
    id: "rb_floran_hills_guardian",
    name: "Raid Boss: Ancient Hills Guardian",
    level: 16,
    hp: 150_000,
    mp: 0,
    pAtk: 325,
    mAtk: 0,
    pDef: 225,
    mDef: 300,
    exp: 600_000,
    sp: 60_000,
    adenaMin: 12_000,
    adenaMax: 18_000,
    dropChance: 1.0,
    isRaidBoss: true,
    respawnTime: 6 * 60 * 60, // 6 годин
    dropProfileId: "rb_floran_hills_guardian_drop",
    aiProfileId: "rb_floran_ai",
    zoneId: "floran_hills",
    drops: [
      ...generateResourceDrops(0, "Raid Boss: Ancient Hills Guardian", false).map(drop => ({
        ...drop,
        chance: Math.min(0.5, drop.chance * 1.5),
        min: drop.min * 5,
        max: drop.max * 10,
      })),
      { id: "coin_of_fair", kind: "resource" as const, chance: 1.0, min: 1, max: 1 }, // Coin of Fair 100% для всіх РБ
    ],
  },
  {
    id: "rb_floran_hills_warlord",
    name: "Raid Boss: Ancient Hills Warlord",
    level: 18,
    hp: 175_000,
    mp: 0,
    pAtk: 325,
    mAtk: 0,
    pDef: 225,
    mDef: 300,
    exp: 750_000,
    sp: 75_000,
    adenaMin: 15_000,
    adenaMax: 22_000,
    dropChance: 1.0,
    isRaidBoss: true,
    respawnTime: 6 * 60 * 60, // 6 годин
    dropProfileId: "rb_floran_hills_warlord_drop",
    aiProfileId: "rb_floran_ai",
    zoneId: "floran_hills",
    drops: [
      ...generateResourceDrops(1, "Raid Boss: Ancient Hills Warlord", false).map(drop => ({
        ...drop,
        chance: Math.min(0.5, drop.chance * 1.5),
        min: drop.min * 5,
        max: drop.max * 10,
      })),
      { id: "coin_of_fair", kind: "resource" as const, chance: 1.0, min: 1, max: 1 }, // Coin of Fair 100% для всіх РБ
    ],
  },
  {
    id: "rb_floran_hills_overlord",
    name: "Raid Boss: Ancient Hills Overlord",
    level: 20,
    hp: 200_000,
    mp: 0,
    pAtk: 325,
    mAtk: 0,
    pDef: 225,
    mDef: 300,
    exp: 900_000,
    sp: 90_000,
    adenaMin: 18_000,
    adenaMax: 26_000,
    dropChance: 1.0,
    isRaidBoss: true,
    respawnTime: 6 * 60 * 60, // 6 годин
    dropProfileId: "rb_floran_hills_overlord_drop",
    aiProfileId: "rb_floran_ai",
    zoneId: "floran_hills",
    drops: [
      ...generateResourceDrops(2, "Raid Boss: Ancient Hills Overlord", false).map(drop => ({
        ...drop,
        chance: Math.min(0.5, drop.chance * 1.5),
        min: drop.min * 5,
        max: drop.max * 10,
      })),
      ...generateDGradeWeaponDrops(2), // D-grade зброя (4-7 різних)
      ...generateDGradeArmorDrops(2), // D-grade броня (1 сет, 5% на кожну частинку)
      ...generateBlessedScrollDrops(2), // Blessed scrolls (1-3 шт, 10% шанс)
      { id: "coin_of_luck", kind: "resource" as const, chance: 0.10, min: 1, max: 1 }, // Coin of Luck 10%
      { id: "coin_of_fair", kind: "resource" as const, chance: 1.0, min: 1, max: 1 }, // Coin of Fair 100%
    ],
  },
  {
    id: "rb_floran_hills_titan",
    name: "Raid Boss: Ancient Hills Titan",
    level: 22,
    hp: 225_000,
    mp: 0,
    pAtk: 325,
    mAtk: 0,
    pDef: 225,
    mDef: 300,
    exp: 1_100_000,
    sp: 110_000,
    adenaMin: 22_000,
    adenaMax: 32_000,
    dropChance: 1.0,
    isRaidBoss: true,
    respawnTime: 6 * 60 * 60, // 6 годин
    dropProfileId: "rb_floran_hills_titan_drop",
    aiProfileId: "rb_floran_ai",
    zoneId: "floran_hills",
    drops: [
      ...generateResourceDrops(3, "Raid Boss: Ancient Hills Titan", false).map(drop => ({
        ...drop,
        chance: Math.min(0.5, drop.chance * 1.5),
        min: drop.min * 5,
        max: drop.max * 10,
      })),
      ...generateDGradeWeaponDrops(3), // D-grade зброя (4-7 різних)
      ...generateDGradeArmorDrops(3), // D-grade броня (1 сет, 5% на кожну частинку)
      ...generateBlessedScrollDrops(3), // Blessed scrolls (1-3 шт, 10% шанс)
      { id: "coin_of_luck", kind: "resource" as const, chance: 0.10, min: 1, max: 1 }, // Coin of Luck 10%
      { id: "coin_of_fair", kind: "resource" as const, chance: 1.0, min: 1, max: 1 }, // Coin of Fair 100%
    ],
  },
];

export const FLORAN_HILLS_MOBS: Mob[] = [...normalMobs, ...raidBosses];




