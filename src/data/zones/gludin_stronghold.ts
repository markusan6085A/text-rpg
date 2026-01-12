// src/data/zones/gludin_stronghold.ts
import type { Mob } from "../world/types";
import type { DropEntry } from "../combat/types";
import type { RaidBoss } from "../bosses/floran_overlord";

// Ресурси для дропу та спойлу (Gludin Stronghold: 40-50 лвл)
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

// Функція для генерації базових статів моба за рівнем (посилені моби)
function createMobStats(level: number, isChampion: boolean = false) {
  // Посилені стати
  const baseHp = 400 + level * 100;
  const basePAtk = 350 + (level - 40) * 20; // Починається від 350 для 40 лвл
  const basePDef = 250 + level * 10;
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
    const count = isChampion ? max * 3 : 1;
    
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

// Генеруємо 150 мобів 40-50 лвл, розділених на 7 груп
const normalMobs: Mob[] = [];
// 7 груп з унікальними назвами (не повторюються з іншими локаціями)
const mobNameGroups = [
  { name: "Stronghold Raider", count: 22 },
  { name: "Stronghold Invader", count: 21 },
  { name: "Stronghold Assailant", count: 22 },
  { name: "Stronghold Aggressor", count: 21 },
  { name: "Stronghold Attacker", count: 22 },
  { name: "Stronghold Assailer", count: 21 },
  { name: "Stronghold Marauder", count: 21 },
];

let mobIndex = 0;
let groupIndex = 0;
let currentGroupCount = 0;

for (let i = 0; i < 150; i++) {
  // Розподіл рівнів: 40-50
  const level = Math.floor(i / 15) + 40;
  const clampedLevel = Math.min(50, Math.max(40, level));
  const stats = createMobStats(clampedLevel, false);
  
  if (currentGroupCount >= mobNameGroups[groupIndex].count) {
    groupIndex++;
    currentGroupCount = 0;
  }
  
  const mobName = mobNameGroups[groupIndex].name;
  currentGroupCount++;
  
  const resourceDropsList = generateResourceDrops(i, mobName, false);
  
  normalMobs.push({
    id: `gl_stronghold_mob_${i + 1}`,
    name: mobName,
    ...stats,
    drops: resourceDropsList,
    spoil: generateResourceSpoils(i, mobName, false),
  });
  
  mobIndex++;
}

// Додаємо 20 чемпіонів з унікальними назвами
const championIndices = [6, 13, 20, 27, 34, 41, 48, 55, 62, 69, 76, 83, 90, 97, 104, 111, 118, 125, 132, 139];
const championNames = [
  "[Champion] Stronghold Baron",
  "[Champion] Stronghold Viscount",
  "[Champion] Stronghold Count",
  "[Champion] Stronghold Marquis",
  "[Champion] Stronghold Duke",
  "[Champion] Stronghold Prince",
  "[Champion] Stronghold King",
  "[Champion] Stronghold Emperor",
  "[Champion] Stronghold Tsar",
  "[Champion] Stronghold Kaiser",
  "[Champion] Stronghold Sultan",
  "[Champion] Stronghold Caliph",
  "[Champion] Stronghold Shah",
  "[Champion] Stronghold Raja",
  "[Champion] Stronghold Maharaja",
  "[Champion] Stronghold Archduke",
  "[Champion] Stronghold Grand Duke",
  "[Champion] Stronghold Elector",
  "[Champion] Stronghold Viceroy",
  "[Champion] Stronghold Governor",
];

championIndices.forEach((index, i) => {
  const championLevels = [41, 41, 42, 42, 43, 43, 44, 44, 45, 45, 46, 46, 47, 47, 48, 48, 49, 49, 50, 50];
  const level = championLevels[i];
  const stats = createMobStats(level, true);
  
  const championResourceDrops = generateResourceDrops(index, championNames[i], true);
  
  normalMobs[index] = {
    id: `gl_stronghold_champion_${i + 1}`,
    name: championNames[i],
    ...stats,
    drops: championResourceDrops,
    spoil: generateResourceSpoils(index, championNames[i], true),
  };
});

// Додаємо 8 РБ з респавном 6 годин (40-50 лвл)
const raidBosses: RaidBoss[] = [
  {
    id: "rb_gludin_stronghold_guardian",
    name: "Raid Boss: Ancient Stronghold Guardian",
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
    dropProfileId: "rb_gludin_stronghold_guardian_drop",
    aiProfileId: "rb_floran_ai",
    zoneId: "gludin_stronghold",
    drops: [
      ...generateResourceDrops(0, "rb_gludin_stronghold_guardian", false).map(drop => ({
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
    id: "rb_gludin_stronghold_warlord",
    name: "Raid Boss: Ancient Stronghold Warlord",
    level: 42,
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
    dropProfileId: "rb_gludin_stronghold_warlord_drop",
    aiProfileId: "rb_floran_ai",
    zoneId: "gludin_stronghold",
    drops: [
      ...generateResourceDrops(1, "rb_gludin_stronghold_warlord", false).map(drop => ({
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
    id: "rb_gludin_stronghold_overlord",
    name: "Raid Boss: Ancient Stronghold Overlord",
    level: 44,
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
    dropProfileId: "rb_gludin_stronghold_overlord_drop",
    aiProfileId: "rb_floran_ai",
    zoneId: "gludin_stronghold",
    drops: [
      ...generateResourceDrops(2, "rb_gludin_stronghold_overlord", false).map(drop => ({
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
    id: "rb_gludin_stronghold_conqueror",
    name: "Raid Boss: Ancient Stronghold Conqueror",
    level: 45,
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
    dropProfileId: "rb_gludin_stronghold_conqueror_drop",
    aiProfileId: "rb_floran_ai",
    zoneId: "gludin_stronghold",
    drops: [
      ...generateResourceDrops(3, "rb_gludin_stronghold_conqueror", false).map(drop => ({
        ...drop,
        chance: Math.min(0.5, drop.chance * 1.5),
        min: drop.min * 5,
        max: drop.max * 10,
      })),
      ...generateCGradeWeaponDrops(3),
      ...generateCGradeArmorDrops(3),
      ...generateCGradeBlessStoneDrops(3),
      { id: "coin_of_luck", kind: "resource" as const, chance: 0.10, min: 1, max: 1 },
      { id: "coin_of_fair", kind: "resource" as const, chance: 1.0, min: 1, max: 1 },
    ],
  },
  {
    id: "rb_gludin_stronghold_titan",
    name: "Raid Boss: Ancient Stronghold Titan",
    level: 46,
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
    dropProfileId: "rb_gludin_stronghold_titan_drop",
    aiProfileId: "rb_floran_ai",
    zoneId: "gludin_stronghold",
    drops: [
      ...generateResourceDrops(4, "rb_gludin_stronghold_titan", false).map(drop => ({
        ...drop,
        chance: Math.min(0.5, drop.chance * 1.5),
        min: drop.min * 5,
        max: drop.max * 10,
      })),
      ...generateCGradeWeaponDrops(4),
      ...generateCGradeArmorDrops(4),
      ...generateCGradeBlessStoneDrops(4),
      { id: "coin_of_luck", kind: "resource" as const, chance: 0.10, min: 1, max: 1 },
      { id: "coin_of_fair", kind: "resource" as const, chance: 1.0, min: 1, max: 1 },
    ],
  },
  {
    id: "rb_gludin_stronghold_destroyer",
    name: "Raid Boss: Ancient Stronghold Destroyer",
    level: 47,
    hp: 975_000,
    mp: 0,
    pAtk: 1125,
    mAtk: 0,
    pDef: 925,
    mDef: 1025,
    exp: 8_750_000,
    sp: 875_000,
    adenaMin: 175_000,
    adenaMax: 185_000,
    dropChance: 1.0,
    isRaidBoss: true,
    respawnTime: 6 * 60 * 60,
    dropProfileId: "rb_gludin_stronghold_destroyer_drop",
    aiProfileId: "rb_floran_ai",
    zoneId: "gludin_stronghold",
    drops: [
      ...generateResourceDrops(5, "rb_gludin_stronghold_destroyer", false).map(drop => ({
        ...drop,
        chance: Math.min(0.5, drop.chance * 1.5),
        min: drop.min * 5,
        max: drop.max * 10,
      })),
      ...generateCGradeWeaponDrops(5),
      ...generateCGradeArmorDrops(5),
      ...generateCGradeBlessStoneDrops(5),
      { id: "coin_of_luck", kind: "resource" as const, chance: 0.10, min: 1, max: 1 },
      { id: "coin_of_fair", kind: "resource" as const, chance: 1.0, min: 1, max: 1 },
    ],
  },
  {
    id: "rb_gludin_stronghold_tyrant",
    name: "Raid Boss: Ancient Stronghold Tyrant",
    level: 49,
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
    dropProfileId: "rb_gludin_stronghold_tyrant_drop",
    aiProfileId: "rb_floran_ai",
    zoneId: "gludin_stronghold",
    drops: [
      ...generateResourceDrops(6, "rb_gludin_stronghold_tyrant", false).map(drop => ({
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
    id: "rb_gludin_stronghold_legion",
    name: "Raid Boss: Ancient Stronghold Legion",
    level: 50,
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
    dropProfileId: "rb_gludin_stronghold_legion_drop",
    aiProfileId: "rb_floran_ai",
    zoneId: "gludin_stronghold",
    drops: [
      ...generateResourceDrops(7, "rb_gludin_stronghold_legion", false).map(drop => ({
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
];

export const GLUDIN_STRONGHOLD_MOBS: Mob[] = [...normalMobs, ...raidBosses];
