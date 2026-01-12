// src/data/zones/floran_peaks.ts
import type { Mob } from "../world/types";
import type { DropEntry } from "../combat/types";
import type { RaidBoss } from "../bosses/floran_overlord";

// Ресурси для дропу та спойлу (Floran Peaks: 25-36 лвл)
// Всі ресурси включаючи найвищі: Enria, Asofe, Thons
const resourceDrops: string[] = [
  "coal", "animal_bone", "animal_skin", "charcoal", "varnish", "iron_ore",
  "stem", "thread", "suede", "silver_nugget", "adamantite_nugget", "mithril_ore",
  "stone_of_purity", "oriharukon_ore", "mold_glue", "mold_lubricant", "mold_hardener",
  "enria", "asofe", "thons"
];

const resourceSpoils: string[] = [
  "coal", "animal_bone", "animal_skin", "charcoal", "varnish", "iron_ore",
  "stem", "thread", "suede", "silver_nugget", "adamantite_nugget", "mithril_ore",
  "stone_of_purity", "oriharukon_ore", "mold_glue", "mold_lubricant", "mold_hardener",
  "enria", "asofe", "thons"
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

// Генеруємо мобів 25-36 лвл
const normalMobs: Mob[] = [];
// Різні назви мобів для Floran Peaks (групування: 7, 6, 7, 6, 7, 6, 7, 6, 7, 6)
const mobNameGroups = [
  { name: "Peaks Climber", count: 7 },
  { name: "Peaks Explorer", count: 6 },
  { name: "Peaks Wanderer", count: 7 },
  { name: "Peaks Seeker", count: 6 },
  { name: "Peaks Pathfinder", count: 7 },
  { name: "Peaks Tracker", count: 6 },
  { name: "Peaks Guide", count: 7 },
  { name: "Peaks Navigator", count: 6 },
  { name: "Peaks Scout", count: 7 },
  { name: "Peaks Ranger", count: 6 },
];

let mobIndex = 0;
let groupIndex = 0;
let currentGroupCount = 0;

for (let i = 0; i < 60; i++) {
  // Розподіл рівнів: 0-4 -> 25, 5-9 -> 26, 10-14 -> 27, 15-19 -> 28, 20-24 -> 29, 25-29 -> 30, 30-34 -> 31, 35-39 -> 32, 40-44 -> 33, 45-49 -> 34, 50-54 -> 35, 55-59 -> 36
  const level = Math.floor(i / 5) + 25;
  const clampedLevel = Math.min(36, Math.max(25, level));
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
    id: `fl_peaks_mob_${i + 1}`,
    name: mobName,
    ...stats,
    drops: baseDrops, // Тільки ресурси, квестові предмети додаються в processDrops.ts якщо квест активний
    spoil: generateResourceSpoils(i, mobName, false),
  });
  
  mobIndex++;
}

// Додаємо 5 чемпіонів в розброс (на позиціях: 12, 24, 36, 48, 56)
const championIndices = [12, 24, 36, 48, 56];
const championNames = [
  "[Champion] Peaks Warlord",
  "[Champion] Peaks Chieftain",
  "[Champion] Peaks Captain",
  "[Champion] Peaks Leader",
  "[Champion] Peaks Commander",
];

championIndices.forEach((index, i) => {
  // Різні рівні для чемпіонів: 28, 30, 32, 34, 36
  const championLevels = [28, 30, 32, 34, 36];
  const level = championLevels[i];
  const stats = createMobStats(level, true);
  
  const baseChampionDrops = generateResourceDrops(index, championNames[i], true);
  
  // Квестові предмети НЕ додаємо до mob.drops - вони додаються автоматично в processDrops.ts тільки якщо квест активний
  
  normalMobs[index] = {
    id: `fl_peaks_champion_${i + 1}`,
    name: championNames[i],
    ...stats,
    drops: baseChampionDrops, // Тільки ресурси, квестові предмети додаються в processDrops.ts якщо квест активний
    spoil: generateResourceSpoils(index, championNames[i], true),
  };
});

// Додаємо 5 РБ з респавном 6 годин
const raidBosses: RaidBoss[] = [
  {
    id: "rb_floran_peaks_guardian",
    name: "Raid Boss: Ancient Peaks Guardian",
    level: 30,
    hp: 225_000, // Зменшено вдвічі
    mp: 0,
    pAtk: 300, // Зменшено вдвічі
    mAtk: 0,
    pDef: 210, // Зменшено вдвічі
    mDef: 275, // Зменшено вдвічі
    exp: 4_000_000,
    sp: 400_000,
    adenaMin: 80_000,
    adenaMax: 100_000,
    dropChance: 1.0,
    isRaidBoss: true,
    respawnTime: 6 * 60 * 60, // 6 годин
    dropProfileId: "rb_floran_peaks_guardian_drop",
    aiProfileId: "rb_floran_ai",
    zoneId: "floran_peaks",
    drops: [
      ...generateResourceDrops(0, "Raid Boss: Ancient Peaks Guardian", false).map(drop => ({
        ...drop,
        chance: Math.min(0.5, drop.chance * 1.5),
        min: drop.min * 5,
        max: drop.max * 10,
      })),
      ...generateDGradeWeaponDrops(0), // D-grade зброя (4-7 різних)
      ...generateDGradeArmorDrops(0), // D-grade броня (1 сет, 5% на кожну частинку)
      ...generateBlessedScrollDrops(0), // Blessed scrolls (1-3 шт, 10% шанс)
      { id: "coin_of_luck", kind: "resource" as const, chance: 0.10, min: 1, max: 1 }, // Coin of Luck 10%
      { id: "coin_of_fair", kind: "resource" as const, chance: 1.0, min: 1, max: 1 }, // Coin of Fair 100%
    ],
  },
  {
    id: "rb_floran_peaks_warlord",
    name: "Raid Boss: Ancient Peaks Warlord",
    level: 32,
    hp: 275_000, // Зменшено вдвічі
    mp: 0,
    pAtk: 350, // Зменшено вдвічі
    mAtk: 0,
    pDef: 250, // Зменшено вдвічі
    mDef: 325, // Зменшено вдвічі
    exp: 5_000_000,
    sp: 500_000,
    adenaMin: 100_000,
    adenaMax: 120_000,
    dropChance: 1.0,
    isRaidBoss: true,
    respawnTime: 6 * 60 * 60, // 6 годин
    dropProfileId: "rb_floran_peaks_warlord_drop",
    aiProfileId: "rb_floran_ai",
    zoneId: "floran_peaks",
    drops: [
      ...generateResourceDrops(1, "Raid Boss: Ancient Peaks Warlord", false).map(drop => ({
        ...drop,
        chance: Math.min(0.5, drop.chance * 1.5),
        min: drop.min * 5,
        max: drop.max * 10,
      })),
      ...generateDGradeWeaponDrops(1), // D-grade зброя (4-7 різних)
      ...generateDGradeArmorDrops(1), // D-grade броня (1 сет, 5% на кожну частинку)
      ...generateBlessedScrollDrops(1), // Blessed scrolls (1-3 шт, 10% шанс)
      { id: "coin_of_luck", kind: "resource" as const, chance: 0.10, min: 1, max: 1 }, // Coin of Luck 10%
      { id: "coin_of_fair", kind: "resource" as const, chance: 1.0, min: 1, max: 1 }, // Coin of Fair 100%
    ],
  },
  {
    id: "rb_floran_peaks_overlord",
    name: "Raid Boss: Ancient Peaks Overlord",
    level: 34,
    hp: 325_000, // Зменшено вдвічі
    mp: 0,
    pAtk: 400, // Зменшено вдвічі
    mAtk: 0,
    pDef: 290, // Зменшено вдвічі
    mDef: 375, // Зменшено вдвічі
    exp: 6_000_000,
    sp: 600_000,
    adenaMin: 120_000,
    adenaMax: 140_000,
    dropChance: 1.0,
    isRaidBoss: true,
    respawnTime: 6 * 60 * 60, // 6 годин
    dropProfileId: "rb_floran_peaks_overlord_drop",
    aiProfileId: "rb_floran_ai",
    zoneId: "floran_peaks",
    drops: [
      ...generateResourceDrops(2, "Raid Boss: Ancient Peaks Overlord", false).map(drop => ({
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
    id: "rb_floran_peaks_titan",
    name: "Raid Boss: Ancient Peaks Titan",
    level: 35,
    hp: 375_000, // Зменшено вдвічі
    mp: 0,
    pAtk: 450, // Зменшено вдвічі
    mAtk: 0,
    pDef: 330, // Зменшено вдвічі
    mDef: 425, // Зменшено вдвічі
    exp: 7_000_000,
    sp: 700_000,
    adenaMin: 140_000,
    adenaMax: 170_000,
    dropChance: 1.0,
    isRaidBoss: true,
    respawnTime: 6 * 60 * 60, // 6 годин
    dropProfileId: "rb_floran_peaks_titan_drop",
    aiProfileId: "rb_floran_ai",
    zoneId: "floran_peaks",
    drops: [
      ...generateResourceDrops(3, "Raid Boss: Ancient Peaks Titan", false).map(drop => ({
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
  {
    id: "rb_floran_peaks_destroyer",
    name: "Raid Boss: Ancient Peaks Destroyer",
    level: 36,
    hp: 425_000, // Зменшено вдвічі
    mp: 0,
    pAtk: 500, // Зменшено вдвічі
    mAtk: 0,
    pDef: 370, // Зменшено вдвічі
    mDef: 475, // Зменшено вдвічі
    exp: 8_000_000,
    sp: 800_000,
    adenaMin: 160_000,
    adenaMax: 200_000,
    dropChance: 1.0,
    isRaidBoss: true,
    respawnTime: 6 * 60 * 60, // 6 годин
    dropProfileId: "rb_floran_peaks_destroyer_drop",
    aiProfileId: "rb_floran_ai",
    zoneId: "floran_peaks",
    drops: [
      ...generateResourceDrops(4, "Raid Boss: Ancient Peaks Destroyer", false).map(drop => ({
        ...drop,
        chance: Math.min(0.5, drop.chance * 1.5),
        min: drop.min * 5,
        max: drop.max * 10,
      })),
      ...generateDGradeWeaponDrops(4), // D-grade зброя (4-7 різних)
      ...generateDGradeArmorDrops(4), // D-grade броня (1 сет, 5% на кожну частинку)
      ...generateBlessedScrollDrops(4), // Blessed scrolls (1-3 шт, 10% шанс)
      { id: "coin_of_luck", kind: "resource" as const, chance: 0.10, min: 1, max: 1 }, // Coin of Luck 10%
      { id: "coin_of_fair", kind: "resource" as const, chance: 1.0, min: 1, max: 1 }, // Coin of Fair 100%
    ],
  },
];

export const FLORAN_PEAKS_MOBS: Mob[] = [...normalMobs, ...raidBosses];




