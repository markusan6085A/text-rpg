// src/data/zones/gludin_highlands.ts
import type { Mob } from "../world/types";
import type { DropEntry } from "../combat/types";
import type { RaidBoss } from "../bosses/floran_overlord";

// Ресурси для дропу та спойлу (Gludin Highlands: 32-40 лвл)
// Базові ресурси + всі середні та вищі ресурси (як у Floran Highlands)
const resourceDrops: string[] = [
  "coal", "animal_bone", "animal_skin", "charcoal", "varnish", "iron_ore",
  "stem", "thread", "suede", "silver_nugget", "adamantite_nugget", "mithril_ore",
  "stone_of_purity", "oriharukon_ore", "mold_glue", "mold_lubricant", "mold_hardener"
];

const resourceSpoils: string[] = [
  "coal", "animal_bone", "animal_skin", "charcoal", "varnish", "iron_ore",
  "stem", "thread", "suede", "silver_nugget", "adamantite_nugget", "mithril_ore",
  "stone_of_purity", "oriharukon_ore", "mold_glue", "mold_lubricant", "mold_hardener"
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

// Генеруємо мобів 32-40 лвл
const normalMobs: Mob[] = [];
// Різні назви мобів для Gludin Highlands (6 груп)
const mobNameGroups = [
  { name: "Highlands Warrior", count: 17 },
  { name: "Highlands Fighter", count: 17 },
  { name: "Highlands Guard", count: 17 },
  { name: "Highlands Soldier", count: 17 },
  { name: "Highlands Knight", count: 16 },
  { name: "Highlands Defender", count: 16 },
];

let mobIndex = 0;
let groupIndex = 0;
let currentGroupCount = 0;

for (let i = 0; i < 100; i++) {
  // Розподіл рівнів: 0-11 -> 32, 12-23 -> 33, 24-35 -> 34, 36-47 -> 35, 48-59 -> 36, 60-71 -> 37, 72-83 -> 38, 84-95 -> 39, 96-99 -> 40
  const level = Math.floor(i / 11.11) + 32;
  const clampedLevel = Math.min(40, Math.max(32, level));
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
    id: `gl_highlands_mob_${i + 1}`,
    name: mobName,
    ...stats,
    drops: resourceDropsList,
    spoil: generateResourceSpoils(i, mobName, false),
  });
  
  mobIndex++;
}

// Додаємо 13 чемпіонів в розброс
const championIndices = [7, 15, 23, 31, 39, 47, 55, 63, 71, 79, 87, 93, 99];
const championNames = [
  "[Champion] Highlands Warlord",
  "[Champion] Highlands Chieftain",
  "[Champion] Highlands Captain",
  "[Champion] Highlands Leader",
  "[Champion] Highlands Commander",
  "[Champion] Highlands Master",
  "[Champion] Highlands Elite",
  "[Champion] Highlands Veteran",
  "[Champion] Highlands Champion",
  "[Champion] Highlands Hero",
  "[Champion] Highlands Protector",
  "[Champion] Highlands Guardian",
  "[Champion] Highlands Legend",
];

championIndices.forEach((index, i) => {
  // Різні рівні для чемпіонів: 33-40
  const championLevels = [33, 34, 35, 36, 37, 38, 39, 40, 40, 40, 40, 40, 40];
  const level = championLevels[i];
  const stats = createMobStats(level, true);
  
  // Додаємо ресурси для дропу та спойлу для чемпіонів (як у Floran)
  const championResourceDrops = generateResourceDrops(index, championNames[i], true);
  
  normalMobs[index] = {
    id: `gl_highlands_champion_${i + 1}`,
    name: championNames[i],
    ...stats,
    drops: championResourceDrops,
    spoil: generateResourceSpoils(index, championNames[i], true),
  };
});

// Додаємо 7 РБ з респавном 6 годин
const raidBosses: RaidBoss[] = [
  {
    id: "rb_gludin_highlands_guardian",
    name: "Raid Boss: Ancient Highlands Guardian",
    level: 35,
    hp: 500_000,
    mp: 0,
    pAtk: 700,
    mAtk: 0,
    pDef: 500,
    mDef: 600,
    exp: 4_000_000,
    sp: 400_000,
    adenaMin: 80_000,
    adenaMax: 90_000,
    dropChance: 1.0,
    isRaidBoss: true,
    respawnTime: 6 * 60 * 60, // 6 годин
    dropProfileId: "rb_gludin_highlands_guardian_drop",
    aiProfileId: "rb_floran_ai",
    zoneId: "gludin_highlands",
    drops: [
      ...generateResourceDrops(0, "rb_gludin_highlands_guardian", false).map(drop => ({
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
    id: "rb_gludin_highlands_warlord",
    name: "Raid Boss: Ancient Highlands Warlord",
    level: 36,
    hp: 550_000,
    mp: 0,
    pAtk: 750,
    mAtk: 0,
    pDef: 550,
    mDef: 650,
    exp: 4_500_000,
    sp: 450_000,
    adenaMin: 90_000,
    adenaMax: 100_000,
    dropChance: 1.0,
    isRaidBoss: true,
    respawnTime: 6 * 60 * 60, // 6 годин
    dropProfileId: "rb_gludin_highlands_warlord_drop",
    aiProfileId: "rb_floran_ai",
    zoneId: "gludin_highlands",
    drops: [
      ...generateResourceDrops(1, "rb_gludin_highlands_warlord", false).map(drop => ({
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
    id: "rb_gludin_highlands_overlord",
    name: "Raid Boss: Ancient Highlands Overlord",
    level: 37,
    hp: 600_000,
    mp: 0,
    pAtk: 800,
    mAtk: 0,
    pDef: 600,
    mDef: 700,
    exp: 5_000_000,
    sp: 500_000,
    adenaMin: 100_000,
    adenaMax: 110_000,
    dropChance: 1.0,
    isRaidBoss: true,
    respawnTime: 6 * 60 * 60, // 6 годин
    dropProfileId: "rb_gludin_highlands_overlord_drop",
    aiProfileId: "rb_floran_ai",
    zoneId: "gludin_highlands",
    drops: [
      ...generateResourceDrops(2, "rb_gludin_highlands_overlord", false).map(drop => ({
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
    id: "rb_gludin_highlands_titan",
    name: "Raid Boss: Ancient Highlands Titan",
    level: 38,
    hp: 650_000,
    mp: 0,
    pAtk: 850,
    mAtk: 0,
    pDef: 650,
    mDef: 750,
    exp: 5_500_000,
    sp: 550_000,
    adenaMin: 110_000,
    adenaMax: 120_000,
    dropChance: 1.0,
    isRaidBoss: true,
    respawnTime: 6 * 60 * 60, // 6 годин
    dropProfileId: "rb_gludin_highlands_titan_drop",
    aiProfileId: "rb_floran_ai",
    zoneId: "gludin_highlands",
    drops: [
      ...generateResourceDrops(3, "rb_gludin_highlands_titan", false).map(drop => ({
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
    id: "rb_gludin_highlands_destroyer",
    name: "Raid Boss: Ancient Highlands Destroyer",
    level: 39,
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
    dropProfileId: "rb_gludin_highlands_destroyer_drop",
    aiProfileId: "rb_floran_ai",
    zoneId: "gludin_highlands",
    drops: [
      ...generateResourceDrops(4, "rb_gludin_highlands_destroyer", false).map(drop => ({
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
  {
    id: "rb_gludin_highlands_tyrant",
    name: "Raid Boss: Ancient Highlands Tyrant",
    level: 40,
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
    dropProfileId: "rb_gludin_highlands_tyrant_drop",
    aiProfileId: "rb_floran_ai",
    zoneId: "gludin_highlands",
    drops: [
      ...generateResourceDrops(5, "rb_gludin_highlands_tyrant", false).map(drop => ({
        ...drop,
        chance: Math.min(0.5, drop.chance * 1.5),
        min: drop.min * 5,
        max: drop.max * 10,
      })),
      ...generateCGradeWeaponDrops(5), // C-grade зброя (4-7 різних)
      ...generateCGradeArmorDrops(5), // C-grade броня (1 сет, 5% на кожну частинку)
      ...generateCGradeBlessStoneDrops(5), // Bless Stone C-grade (на урон 1-2 шт 5%, на броню 1-3 шт 5%)
      { id: "coin_of_luck", kind: "resource" as const, chance: 0.10, min: 1, max: 1 }, // Coin of Luck 10%
      { id: "coin_of_fair", kind: "resource" as const, chance: 1.0, min: 1, max: 1 }, // Festival Adena 100%
    ],
  },
  {
    id: "rb_gludin_highlands_legend",
    name: "Raid Boss: Ancient Highlands Legend",
    level: 40,
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
    dropProfileId: "rb_gludin_highlands_legend_drop",
    aiProfileId: "rb_floran_ai",
    zoneId: "gludin_highlands",
    drops: [
      ...generateResourceDrops(6, "rb_gludin_highlands_legend", false).map(drop => ({
        ...drop,
        chance: Math.min(0.5, drop.chance * 1.5),
        min: drop.min * 5,
        max: drop.max * 10,
      })),
      ...generateCGradeWeaponDrops(6), // C-grade зброя (4-7 різних)
      ...generateCGradeArmorDrops(6), // C-grade броня (1 сет, 5% на кожну частинку)
      ...generateCGradeBlessStoneDrops(6), // Bless Stone C-grade (на урон 1-2 шт 5%, на броню 1-3 шт 5%)
      { id: "coin_of_luck", kind: "resource" as const, chance: 0.10, min: 1, max: 1 }, // Coin of Luck 10%
      { id: "coin_of_fair", kind: "resource" as const, chance: 1.0, min: 1, max: 1 }, // Festival Adena 100%
    ],
  },
];

export const GLUDIN_HIGHLANDS_MOBS: Mob[] = [...normalMobs, ...raidBosses];





