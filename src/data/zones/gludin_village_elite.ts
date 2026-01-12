// src/data/zones/gludin_village_elite.ts
import type { Mob } from "../world/types";
import type { DropEntry } from "../combat/types";
import type { RaidBoss } from "../bosses/floran_overlord";

// Ресурси для дропу та спойлу (Gludin Village Elite: 40-46 лвл)
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

// Функція для генерації базових статів моба за рівнем (посилені моби - від 312 урону)
function createMobStats(level: number, isChampion: boolean = false) {
  // Ще більш посилені стати: від 312 урону для 40 лвл
  const baseHp = 400 + level * 100; // Ще більше HP
  const basePAtk = 350 + (level - 40) * 20; // Починається від 350 для 40 лвл (було 312)
  const basePDef = 250 + level * 10; // Ще більше броні
  const baseMDef = 200 + level * 8;
  const baseExp = 150 + level * 35;
  const baseAdena = 70 + level * 18;

  // Множник для чемпіонів
  const championMult = isChampion ? 4.0 : 1.0;

  return {
    level,
    hp: Math.round(baseHp * championMult),
    mp: 0,
    pAtk: Math.round(basePAtk * championMult),
    mAtk: 0,
    pDef: Math.round(basePDef * championMult),
    mDef: Math.round(baseMDef * championMult),
    exp: isChampion ? Math.round(baseExp * championMult * 12) : Math.round(baseExp * championMult),
    sp: isChampion ? Math.round(level * 6 * 12) : Math.round(level * 3),
    adenaMin: isChampion ? Math.round(baseAdena * championMult * 12) : Math.round(baseAdena * championMult),
    adenaMax: isChampion ? Math.round(baseAdena * 1.5 * championMult * 12) : Math.round(baseAdena * 1.5 * championMult),
    dropChance: isChampion ? 0.7 : 0.3,
  };
}

// Функція для генерації дропу ресурсів (4-8 видів, кількість 1-4 або 2-6 рандомно)
function generateResourceDrops(mobIndex: number, mobName: string, isChampion: boolean = false): DropEntry[] {
  const nameHash = mobName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const numResources = 4 + (nameHash % 5); // 4-8 ресурсів
  
  const selectedResources: string[] = [];
  const usedIndices = new Set<number>();
  
  for (let i = 0; i < numResources; i++) {
    let attempts = 0;
    while (attempts < resourceDrops.length) {
      const resourceIndex = (nameHash + i * 11 + attempts) % resourceDrops.length;
      if (!usedIndices.has(resourceIndex)) {
        selectedResources.push(resourceDrops[resourceIndex]);
        usedIndices.add(resourceIndex);
        break;
      }
      attempts++;
    }
  }
  
  return selectedResources.map((resource, idx) => {
    // Рандомна кількість: 1-4 або 2-6
    const countType = (nameHash + idx) % 2; // 0 або 1
    const min = countType === 0 ? 1 : 2;
    const max = countType === 0 ? 4 : 6;
    const count = isChampion ? max * 3 : 1; // Для чемпіонів більше
    
    const baseChance = 0.25 + (idx % 6) * 0.05; // 25%-50%
    const chance = isChampion ? Math.min(0.85, baseChance + 0.25) : baseChance;
    
    return {
      id: resource,
      kind: "resource" as const,
      chance: Math.min(0.50, chance),
      min: count * min,
      max: count * max,
    };
  });
}

// Функція для генерації спойлу ресурсів
function generateResourceSpoils(mobIndex: number, mobName: string, isChampion: boolean = false): DropEntry[] {
  const nameHash = mobName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const numResources = 4 + ((nameHash + 17) % 5); // 4-8 ресурсів (інший offset)
  
  const selectedResources: string[] = [];
  const usedIndices = new Set<number>();
  
  for (let i = 0; i < numResources; i++) {
    let attempts = 0;
    while (attempts < resourceSpoils.length) {
      const resourceIndex = (nameHash + i * 13 + attempts + 7) % resourceSpoils.length;
      if (!usedIndices.has(resourceIndex)) {
        selectedResources.push(resourceSpoils[resourceIndex]);
        usedIndices.add(resourceIndex);
        break;
      }
      attempts++;
    }
  }
  
  return selectedResources.map((resource, idx) => {
    const countType = (nameHash + idx + 3) % 2;
    const min = countType === 0 ? 1 : 2;
    const max = countType === 0 ? 4 : 6;
    const count = isChampion ? max * 3 : 1;
    
    const baseChance = 0.45 + (idx % 6) * 0.05; // 45%-70%
    const chance = isChampion ? Math.min(0.95, baseChance + 0.25) : baseChance;
    
    return {
      id: resource,
      kind: "resource" as const,
      chance: Math.min(0.70, chance),
      min: count * min,
      max: count * max,
    };
  });
}

// Функції для генерації C-grade дропу (як для РБ 40+)
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
    chance: 0.15,
    min: 1,
    max: 1,
  }));
}

function generateCGradeArmorDrops(rbIndex: number): DropEntry[] {
  const demonsSet = [
    "demons_helmet",
    "demons_tunic",
    "demons_stockings",
    "demons_gloves",
    "demons_boots",
  ];

  const karmianSet = [
    "karmian_helmet",
    "karmian_tunic",
    "karmian_stockings",
    "karmian_gloves",
    "karmian_boots",
  ];

  const platedLeatherSet = [
    "plated_leather_helmet",
    "plated_leather",
    "plated_leather_gaiters",
    "plated_leather_gloves",
    "plated_leather_boots",
  ];

  const divineSet = [
    "divine_helmet",
    "divine_tunic",
    "divine_stockings",
    "divine_gloves",
    "divine_boots",
  ];

  const drakeLeatherSet = [
    "drake_leather_helmet",
    "drake_leather_armor",
    "drake_leather_gloves",
    "drake_leather_boots",
  ];

  const allSets = [demonsSet, karmianSet, platedLeatherSet, divineSet, drakeLeatherSet];
  const selectedSet = allSets[rbIndex % allSets.length];

  return selectedSet.map(armorId => ({
    id: armorId,
    kind: "equipment" as const,
    chance: 0.05,
    min: 1,
    max: 1,
  }));
}

function generateCGradeBlessStoneDrops(rbIndex: number): DropEntry[] {
  return [
    {
      id: "blessed_scroll_enchant_weapon_grade_c",
      kind: "other" as const,
      chance: 0.05,
      min: 1,
      max: 2,
    },
    {
      id: "blessed_scroll_enchant_armor_grade_c",
      kind: "other" as const,
      chance: 0.05,
      min: 1,
      max: 3,
    },
  ];
}

// Генеруємо 130 мобів 40-46 лвл, розділених на 7 груп
const normalMobs: Mob[] = [];
// 7 груп з унікальними назвами (не повторюються з іншими локаціями)
const mobNameGroups = [
  { name: "Settler Crusher", count: 19 },
  { name: "Settler Punisher", count: 18 },
  { name: "Settler Obliterator", count: 19 },
  { name: "Settler Eradicator", count: 18 },
  { name: "Settler Terminator", count: 19 },
  { name: "Settler Exterminator", count: 18 },
  { name: "Settler Vanquisher", count: 19 },
];

let mobIndex = 0;
let groupIndex = 0;
let currentGroupCount = 0;

for (let i = 0; i < 130; i++) {
  // Розподіл рівнів: 40-46
  const level = Math.floor(i / 18.57) + 40;
  const clampedLevel = Math.min(46, Math.max(40, level));
  const stats = createMobStats(clampedLevel, false);
  
  if (currentGroupCount >= mobNameGroups[groupIndex].count) {
    groupIndex++;
    currentGroupCount = 0;
  }
  
  const mobName = mobNameGroups[groupIndex].name;
  currentGroupCount++;
  
  const resourceDropsList = generateResourceDrops(i, mobName, false);
  
  normalMobs.push({
    id: `gl_village_elite_mob_${i + 1}`,
    name: mobName,
    ...stats,
    drops: resourceDropsList,
    spoil: generateResourceSpoils(i, mobName, false),
  });
  
  mobIndex++;
}

// Додаємо 14 чемпіонів з унікальними назвами
const championIndices = [8, 17, 26, 35, 44, 53, 62, 71, 80, 89, 98, 107, 116, 125];
const championNames = [
  "[Champion] Settler Champion",
  "[Champion] Settler Destroyer",
  "[Champion] Settler Mastermind",
  "[Champion] Settler Vanguard",
  "[Champion] Settler Harbinger",
  "[Champion] Settler Ascendant",
  "[Champion] Settler Paragon",
  "[Champion] Settler Colossus",
  "[Champion] Settler Leviathan",
  "[Champion] Settler Behemoth",
  "[Champion] Settler Titan",
  "[Champion] Settler Primarch",
  "[Champion] Settler Overlord",
  "[Champion] Settler Supreme",
];

championIndices.forEach((index, i) => {
  const championLevels = [41, 41, 42, 42, 43, 43, 44, 44, 45, 45, 45, 46, 46, 46];
  const level = championLevels[i];
  const stats = createMobStats(level, true);
  
  const championResourceDrops = generateResourceDrops(index, championNames[i], true);
  
  normalMobs[index] = {
    id: `gl_village_elite_champion_${i + 1}`,
    name: championNames[i],
    ...stats,
    drops: championResourceDrops,
    spoil: generateResourceSpoils(index, championNames[i], true),
  };
});

// Додаємо 7 РБ з респавном 6 годин (40-46 лвл)
const raidBosses: RaidBoss[] = [
  {
    id: "rb_gludin_village_elite_guardian",
    name: "Raid Boss: Ancient Village Elite Guardian",
    level: 40,
    hp: 800_000,
    mp: 0,
    pAtk: 950,
    mAtk: 0,
    pDef: 750,
    mDef: 850,
    exp: 7_000_000,
    sp: 700_000,
    adenaMin: 140_000,
    adenaMax: 150_000,
    dropChance: 1.0,
    isRaidBoss: true,
    respawnTime: 6 * 60 * 60,
    dropProfileId: "rb_gludin_village_elite_guardian_drop",
    aiProfileId: "rb_floran_ai",
    zoneId: "gludin_village_elite",
    drops: [
      ...generateResourceDrops(0, "rb_gludin_village_elite_guardian", false).map(drop => ({
        ...drop,
        chance: Math.min(0.5, drop.chance * 1.5),
        min: drop.min * 5,
        max: drop.max * 10,
      })),
      ...generateCGradeWeaponDrops(0),
      ...generateCGradeArmorDrops(0),
      ...generateCGradeBlessStoneDrops(0),
      { id: "coin_of_luck", kind: "resource" as const, chance: 0.10, min: 1, max: 1 },
      { id: "coin_of_fair", kind: "resource" as const, chance: 1.0, min: 1, max: 1 },
    ],
  },
  {
    id: "rb_gludin_village_elite_warlord",
    name: "Raid Boss: Ancient Village Elite Warlord",
    level: 41,
    hp: 850_000,
    mp: 0,
    pAtk: 1000,
    mAtk: 0,
    pDef: 800,
    mDef: 900,
    exp: 7_500_000,
    sp: 750_000,
    adenaMin: 150_000,
    adenaMax: 160_000,
    dropChance: 1.0,
    isRaidBoss: true,
    respawnTime: 6 * 60 * 60,
    dropProfileId: "rb_gludin_village_elite_warlord_drop",
    aiProfileId: "rb_floran_ai",
    zoneId: "gludin_village_elite",
    drops: [
      ...generateResourceDrops(1, "rb_gludin_village_elite_warlord", false).map(drop => ({
        ...drop,
        chance: Math.min(0.5, drop.chance * 1.5),
        min: drop.min * 5,
        max: drop.max * 10,
      })),
      ...generateCGradeWeaponDrops(1),
      ...generateCGradeArmorDrops(1),
      ...generateCGradeBlessStoneDrops(1),
      { id: "coin_of_luck", kind: "resource" as const, chance: 0.10, min: 1, max: 1 },
      { id: "coin_of_fair", kind: "resource" as const, chance: 1.0, min: 1, max: 1 },
    ],
  },
  {
    id: "rb_gludin_village_elite_overlord",
    name: "Raid Boss: Ancient Village Elite Overlord",
    level: 42,
    hp: 900_000,
    mp: 0,
    pAtk: 1050,
    mAtk: 0,
    pDef: 850,
    mDef: 950,
    exp: 8_000_000,
    sp: 800_000,
    adenaMin: 160_000,
    adenaMax: 170_000,
    dropChance: 1.0,
    isRaidBoss: true,
    respawnTime: 6 * 60 * 60,
    dropProfileId: "rb_gludin_village_elite_overlord_drop",
    aiProfileId: "rb_floran_ai",
    zoneId: "gludin_village_elite",
    drops: [
      ...generateResourceDrops(2, "rb_gludin_village_elite_overlord", false).map(drop => ({
        ...drop,
        chance: Math.min(0.5, drop.chance * 1.5),
        min: drop.min * 5,
        max: drop.max * 10,
      })),
      ...generateCGradeWeaponDrops(2),
      ...generateCGradeArmorDrops(2),
      ...generateCGradeBlessStoneDrops(2),
      { id: "coin_of_luck", kind: "resource" as const, chance: 0.10, min: 1, max: 1 },
      { id: "coin_of_fair", kind: "resource" as const, chance: 1.0, min: 1, max: 1 },
    ],
  },
  {
    id: "rb_gludin_village_elite_conqueror",
    name: "Raid Boss: Ancient Village Elite Conqueror",
    level: 43,
    hp: 925_000,
    mp: 0,
    pAtk: 1075,
    mAtk: 0,
    pDef: 875,
    mDef: 975,
    exp: 8_250_000,
    sp: 825_000,
    adenaMin: 165_000,
    adenaMax: 175_000,
    dropChance: 1.0,
    isRaidBoss: true,
    respawnTime: 6 * 60 * 60,
    dropProfileId: "rb_gludin_village_elite_conqueror_drop",
    aiProfileId: "rb_floran_ai",
    zoneId: "gludin_village_elite",
    drops: [
      ...generateResourceDrops(6, "rb_gludin_village_elite_conqueror", false).map(drop => ({
        ...drop,
        chance: Math.min(0.5, drop.chance * 1.5),
        min: drop.min * 5,
        max: drop.max * 10,
      })),
      ...generateCGradeWeaponDrops(6),
      ...generateCGradeArmorDrops(6),
      ...generateCGradeBlessStoneDrops(6),
      { id: "coin_of_luck", kind: "resource" as const, chance: 0.10, min: 1, max: 1 },
      { id: "coin_of_fair", kind: "resource" as const, chance: 1.0, min: 1, max: 1 },
    ],
  },
  {
    id: "rb_gludin_village_elite_titan",
    name: "Raid Boss: Ancient Village Elite Titan",
    level: 44,
    hp: 950_000,
    mp: 0,
    pAtk: 1100,
    mAtk: 0,
    pDef: 900,
    mDef: 1000,
    exp: 8_500_000,
    sp: 850_000,
    adenaMin: 170_000,
    adenaMax: 180_000,
    dropChance: 1.0,
    isRaidBoss: true,
    respawnTime: 6 * 60 * 60,
    dropProfileId: "rb_gludin_village_elite_titan_drop",
    aiProfileId: "rb_floran_ai",
    zoneId: "gludin_village_elite",
    drops: [
      ...generateResourceDrops(7, "rb_gludin_village_elite_titan", false).map(drop => ({
        ...drop,
        chance: Math.min(0.5, drop.chance * 1.5),
        min: drop.min * 5,
        max: drop.max * 10,
      })),
      ...generateCGradeWeaponDrops(7),
      ...generateCGradeArmorDrops(7),
      ...generateCGradeBlessStoneDrops(7),
      { id: "coin_of_luck", kind: "resource" as const, chance: 0.10, min: 1, max: 1 },
      { id: "coin_of_fair", kind: "resource" as const, chance: 1.0, min: 1, max: 1 },
    ],
  },
  {
    id: "rb_gludin_village_elite_destroyer",
    name: "Raid Boss: Ancient Village Elite Destroyer",
    level: 45,
    hp: 1_000_000,
    mp: 0,
    pAtk: 1150,
    mAtk: 0,
    pDef: 950,
    mDef: 1050,
    exp: 9_000_000,
    sp: 900_000,
    adenaMin: 180_000,
    adenaMax: 190_000,
    dropChance: 1.0,
    isRaidBoss: true,
    respawnTime: 6 * 60 * 60,
    dropProfileId: "rb_gludin_village_elite_destroyer_drop",
    aiProfileId: "rb_floran_ai",
    zoneId: "gludin_village_elite",
    drops: [
      ...generateResourceDrops(8, "rb_gludin_village_elite_destroyer", false).map(drop => ({
        ...drop,
        chance: Math.min(0.5, drop.chance * 1.5),
        min: drop.min * 5,
        max: drop.max * 10,
      })),
      ...generateCGradeWeaponDrops(8),
      ...generateCGradeArmorDrops(8),
      ...generateCGradeBlessStoneDrops(8),
      { id: "coin_of_luck", kind: "resource" as const, chance: 0.10, min: 1, max: 1 },
      { id: "coin_of_fair", kind: "resource" as const, chance: 1.0, min: 1, max: 1 },
    ],
  },
  {
    id: "rb_gludin_village_elite_tyrant",
    name: "Raid Boss: Ancient Village Elite Tyrant",
    level: 46,
    hp: 1_050_000,
    mp: 0,
    pAtk: 1200,
    mAtk: 0,
    pDef: 1000,
    mDef: 1100,
    exp: 9_500_000,
    sp: 950_000,
    adenaMin: 190_000,
    adenaMax: 200_000,
    dropChance: 1.0,
    isRaidBoss: true,
    respawnTime: 6 * 60 * 60,
    dropProfileId: "rb_gludin_village_elite_tyrant_drop",
    aiProfileId: "rb_floran_ai",
    zoneId: "gludin_village_elite",
    drops: [
      ...generateResourceDrops(9, "rb_gludin_village_elite_tyrant", false).map(drop => ({
        ...drop,
        chance: Math.min(0.5, drop.chance * 1.5),
        min: drop.min * 5,
        max: drop.max * 10,
      })),
      ...generateCGradeWeaponDrops(9),
      ...generateCGradeArmorDrops(9),
      ...generateCGradeBlessStoneDrops(9),
      { id: "coin_of_luck", kind: "resource" as const, chance: 0.10, min: 1, max: 1 },
      { id: "coin_of_fair", kind: "resource" as const, chance: 1.0, min: 1, max: 1 },
    ],
  },
];

export const GLUDIN_VILLAGE_ELITE_MOBS: Mob[] = [...normalMobs, ...raidBosses];
