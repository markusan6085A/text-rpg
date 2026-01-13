// src/data/zones/gludin_plateau.ts
import type { Mob } from "../world/types";
import type { DropEntry } from "../combat/types";
import type { RaidBoss } from "../bosses/floran_overlord";

// Ресурси для дропу та спойлу (Gludin Plateau: 35-46 лвл)
// Всі ресурси включаючи найвищі: Enria, Asofe, Thons (як у Floran Peaks)
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

// Функція для генерації дропу ресурсів (3-6 ресурсів для кожного моба) - як у Floran
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
      chance: Math.min(0.35, chance), // Max 35% для drops
      min: count,
      max: count * 2,
    };
  });
}

// Функція для генерації спойлу ресурсів (3-6 ресурсів) - шанс на 20% більший (як у Floran)
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

// Функція для генерації C-grade зброї (4-7 різних зброй, шанс 15% на кожну)
function generateCGradeWeaponDrops(rbIndex: number): DropEntry[] {
  const allCGradeWeapons = [
    "c_akat_long_bow",
    "c_apprentices_spellbook",
    "c_battle_axe",
    "c_berserker_blade",
    "c_big_hammer",
    "c_crystal_dagger",
    "c_dark_screamer",
    "c_demon_staff",
    "c_dwarven_hammer",
    "c_ecliptic_sword",
    "c_eminence_bow",
    "c_fisted_blade",
    "c_great_pata",
    "c_heathens_book",
    "c_heavy_doom_axe",
    "c_heavy_doom_hammer",
    "c_homunkulus_sword",
    "c_knuckle_duster",
    "c_orcish_poleaxe",
    "c_paagrian_sword",
    "c_paagrian_hammer",
    "c_paagrian_axe",
    "c_samurai_longsword",
    "c_scorpion",
    "c_war_axe",
    "c_widow_maker",
    "c_yaksa_mace",
  ];

  // Вибираємо 4-7 різних зброй на основі rbIndex
  const numWeapons = 4 + (rbIndex % 4); // 4-7 зброї
  const selectedWeapons: string[] = [];
  const usedIndices = new Set<number>();

  for (let i = 0; i < numWeapons; i++) {
    let attempts = 0;
    while (attempts < allCGradeWeapons.length) {
      const weaponIndex = (rbIndex * 3 + i * 7 + attempts) % allCGradeWeapons.length;
      if (!usedIndices.has(weaponIndex)) {
        selectedWeapons.push(allCGradeWeapons[weaponIndex]);
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

// Функція для генерації C-grade броні (1 сет на РБ, шанс 5% на кожну частинку)
function generateCGradeArmorDrops(rbIndex: number): DropEntry[] {
  // Demon's Set (C-grade Magic Armor - Robe)
  const demonsSet = [
    "demons_helmet",
    "demons_tunic",
    "demons_stockings",
    "demons_gloves",
    "demons_boots",
  ];

  // Karmian Set (C-grade Magic Armor - Robe)
  const karmianSet = [
    "karmian_helmet",
    "karmian_tunic",
    "karmian_stockings",
    "karmian_gloves",
    "karmian_boots",
  ];

  // Plated Leather Set (C-grade Light Armor)
  const platedLeatherSet = [
    "plated_leather_helmet",
    "plated_leather",
    "plated_leather_gaiters",
    "plated_leather_gloves",
    "plated_leather_boots",
  ];

  // Divine Set (C-grade Magic Armor - Robe)
  const divineSet = [
    "divine_helmet",
    "divine_tunic",
    "divine_stockings",
    "divine_gloves",
    "divine_boots",
  ];

  // Drake Leather Set (C-grade Light Armor)
  const drakeLeatherSet = [
    "drake_leather_helmet",
    "drake_leather_armor",
    "drake_leather_gloves",
    "drake_leather_boots",
  ];

  // Вибираємо один сет на основі rbIndex
  const allSets = [demonsSet, karmianSet, platedLeatherSet, divineSet, drakeLeatherSet];
  const selectedSet = allSets[rbIndex % allSets.length];

  return selectedSet.map(armorId => ({
    id: armorId,
    kind: "equipment" as const,
    chance: 0.05, // 5% шанс на кожну частинку
    min: 1,
    max: 1,
  }));
}

// Функція для генерації Bless Stone C-grade (для урону 1-2 шт шанс 5%, для броні 1-3 шт шанс 5%)
function generateCGradeBlessStoneDrops(rbIndex: number): DropEntry[] {
  return [
    {
      id: "blessed_scroll_enchant_weapon_grade_c",
      kind: "other" as const,
      chance: 0.05, // 5% шанс
      min: 1,
      max: 2, // 1-2 шт
    },
    {
      id: "blessed_scroll_enchant_armor_grade_c",
      kind: "other" as const,
      chance: 0.05, // 5% шанс
      min: 1,
      max: 3, // 1-3 шт
    },
  ];
}

// Генеруємо мобів 35-46 лвл
const normalMobs: Mob[] = [];
// Різні назви мобів для Gludin Plateau (8 груп)
const mobNameGroups = [
  { name: "Plateau Warrior", count: 13 },
  { name: "Plateau Fighter", count: 13 },
  { name: "Plateau Guard", count: 13 },
  { name: "Plateau Soldier", count: 13 },
  { name: "Plateau Knight", count: 12 },
  { name: "Plateau Defender", count: 12 },
  { name: "Plateau Berserker", count: 12 },
  { name: "Plateau Guardian", count: 12 },
];

let mobIndex = 0;
let groupIndex = 0;
let currentGroupCount = 0;

for (let i = 0; i < 100; i++) {
  // Розподіл рівнів: 0-8 -> 35, 9-17 -> 36, 18-26 -> 37, 27-35 -> 38, 36-44 -> 39, 45-53 -> 40, 54-62 -> 41, 63-71 -> 42, 72-80 -> 43, 81-89 -> 44, 90-99 -> 45, 100 -> 46
  const level = Math.floor(i / 8.33) + 35;
  const clampedLevel = Math.min(46, Math.max(35, level));
  const stats = createMobStats(clampedLevel, false);
  
  // Визначаємо назву на основі групування
  if (currentGroupCount >= mobNameGroups[groupIndex].count) {
    groupIndex++;
    currentGroupCount = 0;
  }
  
  const mobName = mobNameGroups[groupIndex].name;
  currentGroupCount++;
  
  // Додаємо ресурси для дропу та спойлу (як у Floran)
  const resourceDropsList = generateResourceDrops(i, mobName, false);
  
  normalMobs.push({
    id: `gl_plateau_mob_${i + 1}`,
    name: mobName,
    ...stats,
    drops: resourceDropsList,
    spoil: generateResourceSpoils(i, mobName, false),
  });
  
  mobIndex++;
}

// Додаємо 10 чемпіонів в розброс
const championIndices = [8, 17, 26, 35, 44, 53, 62, 71, 80, 89];
const championNames = [
  "[Champion] Plateau Warlord",
  "[Champion] Plateau Chieftain",
  "[Champion] Plateau Captain",
  "[Champion] Plateau Leader",
  "[Champion] Plateau Commander",
  "[Champion] Plateau Master",
  "[Champion] Plateau Elite",
  "[Champion] Plateau Veteran",
  "[Champion] Plateau Champion",
  "[Champion] Plateau Hero",
];

championIndices.forEach((index, i) => {
  // Різні рівні для чемпіонів: 36-46
  const championLevels = [36, 37, 38, 39, 40, 41, 42, 43, 44, 45];
  const level = championLevels[i];
  const stats = createMobStats(level, true);
  
  // Додаємо ресурси для дропу та спойлу для чемпіонів (як у Floran)
  const championResourceDrops = generateResourceDrops(index, championNames[i], true);
  
  normalMobs[index] = {
    id: `gl_plateau_champion_${i + 1}`,
    name: championNames[i],
    ...stats,
    drops: championResourceDrops,
    spoil: generateResourceSpoils(index, championNames[i], true),
  };
});

// Додаємо 5 РБ з респавном 6 годин
const raidBosses: RaidBoss[] = [
  {
    id: "rb_gludin_plateau_guardian",
    name: "Raid Boss: Ancient Plateau Guardian",
    level: 40,
    hp: 700_000,
    mp: 0,
    pAtk: 900,
    mAtk: 0,
    pDef: 700,
    mDef: 800,
    exp: 6_000_000,
    sp: 600_000,
    adenaMin: 120_000,
    adenaMax: 130_000,
    dropChance: 1.0,
    isRaidBoss: true,
    respawnTime: 6 * 60 * 60, // 6 годин
    dropProfileId: "rb_gludin_plateau_guardian_drop",
    aiProfileId: "rb_floran_ai",
    zoneId: "gludin_plateau",
    drops: [
      ...generateResourceDrops(0, "rb_gludin_plateau_guardian", false),
      ...generateCGradeWeaponDrops(0), // C-grade зброя (4-7 різних)
      ...generateCGradeArmorDrops(0), // C-grade броня (1 сет, 5% на кожну частинку)
      ...generateCGradeBlessStoneDrops(0), // Bless Stone C-grade (на урон 1-2 шт 5%, на броню 1-3 шт 5%)
      { id: "coin_of_luck", kind: "resource" as const, chance: 0.10, min: 1, max: 1 }, // Coin of Luck 10%
      { id: "coin_of_fair", kind: "resource" as const, chance: 1.0, min: 1, max: 1 }, // Festival Adena 100%
    ],
  },
  {
    id: "rb_gludin_plateau_warlord",
    name: "Raid Boss: Ancient Plateau Warlord",
    level: 41,
    hp: 750_000,
    mp: 0,
    pAtk: 950,
    mAtk: 0,
    pDef: 750,
    mDef: 850,
    exp: 6_500_000,
    sp: 650_000,
    adenaMin: 130_000,
    adenaMax: 140_000,
    dropChance: 1.0,
    isRaidBoss: true,
    respawnTime: 6 * 60 * 60, // 6 годин
    dropProfileId: "rb_gludin_plateau_warlord_drop",
    aiProfileId: "rb_floran_ai",
    zoneId: "gludin_plateau",
    drops: [
      ...generateResourceDrops(1, "rb_gludin_plateau_warlord", false),
      ...generateCGradeWeaponDrops(1), // C-grade зброя (4-7 різних)
      ...generateCGradeArmorDrops(1), // C-grade броня (1 сет, 5% на кожну частинку)
      ...generateCGradeBlessStoneDrops(1), // Bless Stone C-grade (на урон 1-2 шт 5%, на броню 1-3 шт 5%)
      { id: "coin_of_luck", kind: "resource" as const, chance: 0.10, min: 1, max: 1 }, // Coin of Luck 10%
      { id: "coin_of_fair", kind: "resource" as const, chance: 1.0, min: 1, max: 1 }, // Festival Adena 100%
    ],
  },
  {
    id: "rb_gludin_plateau_overlord",
    name: "Raid Boss: Ancient Plateau Overlord",
    level: 42,
    hp: 800_000,
    mp: 0,
    pAtk: 1000,
    mAtk: 0,
    pDef: 800,
    mDef: 900,
    exp: 7_000_000,
    sp: 700_000,
    adenaMin: 140_000,
    adenaMax: 150_000,
    dropChance: 1.0,
    isRaidBoss: true,
    respawnTime: 6 * 60 * 60, // 6 годин
    dropProfileId: "rb_gludin_plateau_overlord_drop",
    aiProfileId: "rb_floran_ai",
    zoneId: "gludin_plateau",
    drops: [
      ...generateResourceDrops(2, "rb_gludin_plateau_overlord", false),
      ...generateCGradeWeaponDrops(2), // C-grade зброя (4-7 різних)
      ...generateCGradeArmorDrops(2), // C-grade броня (1 сет, 5% на кожну частинку)
      ...generateCGradeBlessStoneDrops(2), // Bless Stone C-grade (на урон 1-2 шт 5%, на броню 1-3 шт 5%)
      { id: "coin_of_luck", kind: "resource" as const, chance: 0.10, min: 1, max: 1 }, // Coin of Luck 10%
      { id: "coin_of_fair", kind: "resource" as const, chance: 1.0, min: 1, max: 1 }, // Festival Adena 100%
    ],
  },
  {
    id: "rb_gludin_plateau_titan",
    name: "Raid Boss: Ancient Plateau Titan",
    level: 43,
    hp: 850_000,
    mp: 0,
    pAtk: 1050,
    mAtk: 0,
    pDef: 850,
    mDef: 950,
    exp: 7_500_000,
    sp: 750_000,
    adenaMin: 150_000,
    adenaMax: 160_000,
    dropChance: 1.0,
    isRaidBoss: true,
    respawnTime: 6 * 60 * 60, // 6 годин
    dropProfileId: "rb_gludin_plateau_titan_drop",
    aiProfileId: "rb_floran_ai",
    zoneId: "gludin_plateau",
    drops: [
      ...generateResourceDrops(3, "rb_gludin_plateau_titan", false),
      ...generateCGradeWeaponDrops(3), // C-grade зброя (4-7 різних)
      ...generateCGradeArmorDrops(3), // C-grade броня (1 сет, 5% на кожну частинку)
      ...generateCGradeBlessStoneDrops(3), // Bless Stone C-grade (на урон 1-2 шт 5%, на броню 1-3 шт 5%)
      { id: "coin_of_luck", kind: "resource" as const, chance: 0.10, min: 1, max: 1 }, // Coin of Luck 10%
      { id: "coin_of_fair", kind: "resource" as const, chance: 1.0, min: 1, max: 1 }, // Festival Adena 100%
    ],
  },
  {
    id: "rb_gludin_plateau_destroyer",
    name: "Raid Boss: Ancient Plateau Destroyer",
    level: 44,
    hp: 900_000,
    mp: 0,
    pAtk: 1100,
    mAtk: 0,
    pDef: 900,
    mDef: 1000,
    exp: 8_000_000,
    sp: 800_000,
    adenaMin: 160_000,
    adenaMax: 170_000,
    dropChance: 1.0,
    isRaidBoss: true,
    respawnTime: 6 * 60 * 60, // 6 годин
    dropProfileId: "rb_gludin_plateau_destroyer_drop",
    aiProfileId: "rb_floran_ai",
    zoneId: "gludin_plateau",
    drops: [
      ...generateResourceDrops(4, "rb_gludin_plateau_destroyer", false),
      ...generateCGradeWeaponDrops(4), // C-grade зброя (4-7 різних)
      ...generateCGradeArmorDrops(4), // C-grade броня (1 сет, 5% на кожну частинку)
      ...generateCGradeBlessStoneDrops(4), // Bless Stone C-grade (на урон 1-2 шт 5%, на броню 1-3 шт 5%)
      { id: "coin_of_luck", kind: "resource" as const, chance: 0.10, min: 1, max: 1 }, // Coin of Luck 10%
      { id: "coin_of_fair", kind: "resource" as const, chance: 1.0, min: 1, max: 1 }, // Festival Adena 100%
    ],
  },
  {
    id: "rb_gludin_plateau_tyrant",
    name: "Raid Boss: Ancient Plateau Tyrant",
    level: 46,
    hp: 950_000,
    mp: 0,
    pAtk: 1150,
    mAtk: 0,
    pDef: 950,
    mDef: 1050,
    exp: 8_500_000,
    sp: 850_000,
    adenaMin: 170_000,
    adenaMax: 180_000,
    dropChance: 1.0,
    isRaidBoss: true,
    respawnTime: 6 * 60 * 60, // 6 годин
    dropProfileId: "rb_gludin_plateau_tyrant_drop",
    aiProfileId: "rb_floran_ai",
    zoneId: "gludin_plateau",
    drops: [
      ...generateResourceDrops(5, "rb_gludin_plateau_tyrant", false),
      ...generateCGradeWeaponDrops(5), // C-grade зброя (4-7 різних)
      ...generateCGradeArmorDrops(5), // C-grade броня (1 сет, 5% на кожну частинку)
      ...generateCGradeBlessStoneDrops(5), // Bless Stone C-grade (на урон 1-2 шт 5%, на броню 1-3 шт 5%)
      { id: "coin_of_luck", kind: "resource" as const, chance: 0.10, min: 1, max: 1 }, // Coin of Luck 10%
      { id: "coin_of_fair", kind: "resource" as const, chance: 1.0, min: 1, max: 1 }, // Festival Adena 100%
    ],
  },
];

export const GLUDIN_PLATEAU_MOBS: Mob[] = [...normalMobs, ...raidBosses];





