// src/data/zones/gludio_territory.ts
import type { Mob } from "../world/types";
import type { DropEntry } from "../combat/types";
import type { RaidBoss } from "../bosses/floran_overlord";

// Ресурси для дропу та спойлу (більше ресурсів)
const resourceDrops: string[] = [
  "animal_skin", "animal_bone", "coal", "charcoal", "crafted_leather", "bone_powder",
  "thread", "cord", "suede", "iron_ore", "steel", "mithril_ore",
  "silver_mold", "artisans_frame", "blacksmiths_frame", "compound_braid",
  "synthetic_cokes", "rind_leather_boot_lining", "crafted_leather",
  "high_grade_suede", "metallic_fiber", "looted_goods_brown_pouch"
];

const resourceSpoils: string[] = [
  "animal_skin", "animal_bone", "coal", "charcoal", "crafted_leather", "bone_powder",
  "thread", "cord", "suede", "iron_ore", "steel", "mithril_ore",
  "silver_mold", "artisans_frame", "blacksmiths_frame", "compound_braid",
  "synthetic_cokes", "rind_leather_boot_lining", "crafted_leather",
  "high_grade_suede", "metallic_fiber", "looted_goods_brown_pouch"
];

// Ресурси для крафту зброї та броні (8% шанс)
const craftingResources: string[] = [
  "mithril_ore", "silver_mold",
  "artisans_frame", "blacksmiths_frame", "compound_braid", "synthetic_cokes", 
  "steel", "rind_leather_boot_lining", "crafted_leather",
  "high_grade_suede", "metallic_fiber", "looted_goods_brown_pouch"
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

// Функція для генерації дропу ресурсів (1-3 ресурси) - фіксовано для кожного моба
function generateResourceDrops(mobIndex: number, isChampion: boolean = false): DropEntry[] {
  const count = isChampion ? 10 : 1; // Для чемпіонів х10
  const numResources = (mobIndex % 3) + 1; // 1-3 ресурси
  const selectedResources: string[] = [];
  
  for (let i = 0; i < numResources; i++) {
    const resourceIndex = (mobIndex * 3 + i) % resourceDrops.length;
    const resource = resourceDrops[resourceIndex];
    if (!selectedResources.includes(resource)) {
      selectedResources.push(resource);
    } else {
      const nextResource = resourceDrops[(resourceIndex + 1) % resourceDrops.length];
      if (!selectedResources.includes(nextResource)) {
        selectedResources.push(nextResource);
      }
    }
  }
  
  return selectedResources.map(resource => ({
    id: resource,
    kind: "resource" as const,
    chance: isChampion ? 0.8 : 0.4,
    min: count,
    max: count * 2,
  }));
}

// Функція для генерації спойлу ресурсів (1-3 ресурси) - фіксовано для кожного моба
function generateResourceSpoils(mobIndex: number, isChampion: boolean = false): DropEntry[] {
  const count = isChampion ? 10 : 1; // Для чемпіонів х10
  const numResources = (mobIndex % 3) + 1; // 1-3 ресурси
  const selectedResources: string[] = [];
  
  for (let i = 0; i < numResources; i++) {
    const resourceIndex = (mobIndex * 5 + i) % resourceSpoils.length;
    const resource = resourceSpoils[resourceIndex];
    if (!selectedResources.includes(resource)) {
      selectedResources.push(resource);
    } else {
      const nextResource = resourceSpoils[(resourceIndex + 1) % resourceSpoils.length];
      if (!selectedResources.includes(nextResource)) {
        selectedResources.push(nextResource);
      }
    }
  }
  
  return selectedResources.map(resource => ({
    id: resource,
    kind: "resource" as const,
    chance: isChampion ? 0.9 : 0.5,
    min: count,
    max: count * 2,
  }));
}

// Функція для генерації ресурсів для крафту (8% шанс)
function generateCraftingDrops(mobIndex: number): DropEntry[] {
  const resourceIndex = mobIndex % craftingResources.length;
  const resource = craftingResources[resourceIndex];
  
  return [{
    id: resource,
    kind: "resource" as const,
    chance: 0.08, // 8% шанс
    min: 1,
    max: 2,
  }];
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

// Генеруємо мобів 40-52 лвл
const normalMobs: Mob[] = [];
// Різні назви мобів для Gludio Territory (9 груп)
const mobNameGroups = [
  { name: "Territory Warrior", count: 13 },
  { name: "Territory Fighter", count: 13 },
  { name: "Territory Guard", count: 13 },
  { name: "Territory Soldier", count: 13 },
  { name: "Territory Knight", count: 13 },
  { name: "Territory Defender", count: 13 },
  { name: "Territory Berserker", count: 13 },
  { name: "Territory Guardian", count: 13 },
  { name: "Territory Sentinel", count: 13 },
];

let mobIndex = 0;
let groupIndex = 0;
let currentGroupCount = 0;

for (let i = 0; i < 120; i++) {
  // Розподіл рівнів: 40-52
  const level = Math.floor(i / 9.23) + 40;
  const clampedLevel = Math.min(52, Math.max(40, level));
  const stats = createMobStats(clampedLevel, false);
  
  // Визначаємо назву на основі групування
  if (groupIndex < mobNameGroups.length && currentGroupCount >= mobNameGroups[groupIndex].count) {
    groupIndex++;
    currentGroupCount = 0;
  }
  
  // Якщо вийшли за межі масиву, використовуємо останню групу
  const safeGroupIndex = Math.min(groupIndex, mobNameGroups.length - 1);
  const mobName = mobNameGroups[safeGroupIndex].name;
  currentGroupCount++;
  
  // Додаємо ресурси для крафту
  const craftingDrops = generateCraftingDrops(i);
  
  normalMobs.push({
    id: `gl_territory_mob_${i + 1}`,
    name: mobName,
    ...stats,
    drops: [],
    spoil: [],
  });
  
  mobIndex++;
}

// Додаємо 11 чемпіонів в розброс
const championIndices = [9, 19, 29, 39, 49, 59, 69, 79, 89, 99, 109];
const championNames = [
  "[Champion] Territory Warlord",
  "[Champion] Territory Chieftain",
  "[Champion] Territory Captain",
  "[Champion] Territory Leader",
  "[Champion] Territory Commander",
  "[Champion] Territory Master",
  "[Champion] Territory Elite",
  "[Champion] Territory Veteran",
  "[Champion] Territory Champion",
  "[Champion] Territory Hero",
  "[Champion] Territory Legend",
];

championIndices.forEach((index, i) => {
  // Різні рівні для чемпіонів: 41-51
  const championLevels = [41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51];
  const level = championLevels[i];
  const stats = createMobStats(level, true);
  
  // Додаємо ресурси для крафту для чемпіонів
  const craftingChampionDrops = generateCraftingDrops(index);
  
  normalMobs[index] = {
    id: `gl_territory_champion_${i + 1}`,
    name: championNames[i],
    ...stats,
    drops: [],
    spoil: [],
  };
});

// Додаємо 8 РБ з респавном 6 годин
const raidBosses: RaidBoss[] = [
  {
    id: "rb_gludio_territory_guardian",
    name: "Raid Boss: Ancient Territory Guardian",
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
    dropProfileId: "rb_gludio_territory_guardian_drop",
    aiProfileId: "rb_floran_ai",
    zoneId: "gludio_territory",
    drops: [
      { id: "elemental_bow", kind: "equipment", chance: 0.03264, min: 1, max: 1 },
      { id: "noble_elven_bow", kind: "equipment", chance: 0.03264, min: 1, max: 1 },
      { id: "plated_leather", kind: "equipment", chance: 0.07001, min: 1, max: 1 },
      { id: "rind_leather_armor", kind: "equipment", chance: 0.06465, min: 1, max: 1 },
      { id: "plated_leather_gaiters", kind: "equipment", chance: 0.11191, min: 1, max: 1 },
      { id: "rind_leather_gaiters", kind: "equipment", chance: 0.10339, min: 1, max: 1 },
      { id: "plated_leather_fragment", kind: "equipment", chance: 0.17812, min: 16, max: 48 },
      { id: "plated_leather_gaiters_material", kind: "equipment", chance: 0.03686, min: 116, max: 346 },
      { id: "rind_leather_armor_design", kind: "equipment", chance: 0.11395, min: 23, max: 67 },
      { id: "rind_leather_gaiters_material", kind: "equipment", chance: 0.07911, min: 60, max: 180 },
      { id: "crossbow_shaft", kind: "equipment", chance: 0.40499, min: 4, max: 12 },
      { id: "scroll_enchant_armor_grade_c", kind: "other", chance: 0.67457, min: 12, max: 36 },
      { id: "elven_bow_of_nobility_shaft", kind: "equipment", chance: 0.21600, min: 8, max: 22 },
      ...generateCGradeWeaponDrops(0), // C-grade зброя (4-7 різних)
      ...generateCGradeArmorDrops(0), // C-grade броня (1 сет, 5% на кожну частинку)
      ...generateCGradeBlessStoneDrops(0), // Bless Stone C-grade (на урон 1-2 шт 5%, на броню 1-3 шт 5%)
      { id: "coin_of_luck", kind: "resource" as const, chance: 0.10, min: 1, max: 1 }, // Coin of Luck 10%
      { id: "coin_of_fair", kind: "resource" as const, chance: 1.0, min: 1, max: 1 }, // Festival Adena 100%
    ],
  },
  {
    id: "rb_gludio_territory_warlord",
    name: "Raid Boss: Territory Warlord",
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
    respawnTime: 6 * 60 * 60,
    dropProfileId: "rb_gludio_territory_warlord_drop",
    aiProfileId: "rb_floran_ai",
    zoneId: "gludio_territory",
    drops: [
      { id: "earring_of_binding", kind: "equipment", chance: 0.02748, min: 7, max: 19 },
      { id: "ring_of_ages", kind: "equipment", chance: 0.04480, min: 6, max: 18 },
      { id: "necklace_of_mermaid", kind: "equipment", chance: 0.26814, min: 1, max: 1 },
      { id: "scroll_enchant_weapon_grade_c", kind: "other", chance: 0.11177, min: 3, max: 7 },
      { id: "earring_of_binding_gemstone", kind: "equipment", chance: 0.18272, min: 81, max: 243 },
      { id: "ring_of_ages_gemstone", kind: "equipment", chance: 0.08290, min: 280, max: 840 },
      { id: "necklace_of_mermaid_teardrop", kind: "equipment", chance: 0.05096, min: 220, max: 660 },
      { id: "greater_dye_of_str_str3_con3", kind: "equipment", chance: 0.34151, min: 1, max: 3 },
      { id: "greater_dye_of_str_str3_dex3", kind: "equipment", chance: 0.22767, min: 2, max: 4 },
      { id: "greater_dye_of_con_con3_str3", kind: "equipment", chance: 0.17075, min: 2, max: 6 },
      { id: "egg_of_earth_cgrade", kind: "equipment", chance: 0.25000, min: 3, max: 3 },
      ...generateCGradeWeaponDrops(1), // C-grade зброя (4-7 різних)
      ...generateCGradeArmorDrops(1), // C-grade броня (1 сет, 5% на кожну частинку)
      ...generateCGradeBlessStoneDrops(1), // Bless Stone C-grade (на урон 1-2 шт 5%, на броню 1-3 шт 5%)
      { id: "coin_of_luck", kind: "resource" as const, chance: 0.10, min: 1, max: 1 }, // Coin of Luck 10%
      { id: "coin_of_fair", kind: "resource" as const, chance: 1.0, min: 1, max: 1 }, // Festival Adena 100%
    ],
  },
  {
    id: "rb_gludio_territory_overlord",
    name: "Raid Boss: Territory Overlord",
    level: 46,
    hp: 1_000_000,
    mp: 0,
    pAtk: 1200,
    mAtk: 0,
    pDef: 1000,
    mDef: 1100,
    exp: 9_000_000,
    sp: 900_000,
    adenaMin: 180_000,
    adenaMax: 190_000,
    dropChance: 1.0,
    isRaidBoss: true,
    respawnTime: 6 * 60 * 60,
    dropProfileId: "rb_gludio_territory_overlord_drop",
    aiProfileId: "rb_floran_ai",
    zoneId: "gludio_territory",
    drops: [
      { id: "grace_dagger", kind: "equipment", chance: 0.01242, min: 1, max: 1 },
      { id: "dark_screamer", kind: "equipment", chance: 0.01242, min: 1, max: 1 },
      { id: "composite_boots", kind: "equipment", chance: 0.14535, min: 1, max: 1 },
      { id: "mithril_gauntlets", kind: "equipment", chance: 0.14535, min: 1, max: 1 },
      { id: "mithril_gauntlets_design", kind: "equipment", chance: 0.09975, min: 53, max: 157 },
      { id: "grace_dagger_edge", kind: "equipment", chance: 0.18193, min: 4, max: 12 },
      { id: "dark_screamer_edge", kind: "equipment", chance: 0.48516, min: 2, max: 4 },
      { id: "composite_boots_part", kind: "equipment", chance: 0.21820, min: 24, max: 72 },
      { id: "scroll_enchant_armor_grade_c", kind: "other", chance: 0.38468, min: 3, max: 9 },
      { id: "greater_dye_of_con_con3_dex3", kind: "equipment", chance: 0.09617, min: 2, max: 6 },
      { id: "greater_dye_of_dex_dex3_str3", kind: "equipment", chance: 0.07694, min: 3, max: 7 },
      { id: "greater_dye_of_dex_dex3_con3", kind: "equipment", chance: 0.38468, min: 1, max: 1 },
      { id: "egg_of_earth_cgrade", kind: "equipment", chance: 0.25000, min: 5, max: 5 },
      { id: "destruction_tombstone", kind: "equipment", chance: 0.25000, min: 2, max: 2 },
      ...generateCGradeWeaponDrops(2), // C-grade зброя (4-7 різних)
      ...generateCGradeArmorDrops(2), // C-grade броня (1 сет, 5% на кожну частинку)
      ...generateCGradeBlessStoneDrops(2), // Bless Stone C-grade (на урон 1-2 шт 5%, на броню 1-3 шт 5%)
      { id: "coin_of_luck", kind: "resource" as const, chance: 0.10, min: 1, max: 1 }, // Coin of Luck 10%
      { id: "coin_of_fair", kind: "resource" as const, chance: 1.0, min: 1, max: 1 }, // Festival Adena 100%
    ],
  },
  {
    id: "rb_gludio_territory_titan",
    name: "Raid Boss: Territory Titan",
    level: 48,
    hp: 1_100_000,
    mp: 0,
    pAtk: 1300,
    mAtk: 0,
    pDef: 1100,
    mDef: 1200,
    exp: 10_000_000,
    sp: 1_000_000,
    adenaMin: 200_000,
    adenaMax: 210_000,
    dropChance: 1.0,
    isRaidBoss: true,
    respawnTime: 6 * 60 * 60,
    dropProfileId: "rb_gludio_territory_titan_drop",
    aiProfileId: "rb_floran_ai",
    zoneId: "gludio_territory",
    drops: [
      { id: "samurai_longsword", kind: "equipment", chance: 0.01571, min: 1, max: 1 },
      { id: "berserker_blade", kind: "equipment", chance: 0.01571, min: 1, max: 1 },
      { id: "theca_leather_armor", kind: "equipment", chance: 0.05188, min: 1, max: 1 },
      { id: "drake_leather_armor", kind: "equipment", chance: 0.02726, min: 1, max: 1 },
      { id: "theca_leather_gaiters", kind: "equipment", chance: 0.08294, min: 1, max: 1 },
      { id: "theca_leather_armor_pattern", kind: "equipment", chance: 0.25484, min: 9, max: 27 },
      { id: "theca_leather_gaiters_pattern", kind: "equipment", chance: 0.13177, min: 28, max: 84 },
      { id: "drake_leather_armor_texture", kind: "equipment", chance: 0.08162, min: 20, max: 60 },
      { id: "samurai_longsword_blade", kind: "equipment", chance: 0.14706, min: 8, max: 22 },
      { id: "berserker_blade_edge", kind: "equipment", chance: 0.27608, min: 4, max: 12 },
      { id: "greater_dye_of_men_men3_wit3", kind: "equipment", chance: 0.34674, min: 1, max: 3 },
      { id: "greater_dye_of_wit_wit3_int3", kind: "equipment", chance: 0.23116, min: 2, max: 4 },
      { id: "greater_dye_of_wit_wit3_men3", kind: "equipment", chance: 0.17337, min: 2, max: 6 },
      { id: "blessed_scroll_enchant_armor_grade_c", kind: "other", chance: 0.17832, min: 1, max: 1 },
      { id: "false_nucleus_of_life_cgrade", kind: "equipment", chance: 0.25000, min: 1, max: 1 },
      { id: "destruction_tombstone", kind: "equipment", chance: 0.25000, min: 1, max: 1 },
      ...generateCGradeWeaponDrops(3), // C-grade зброя (4-7 різних)
      ...generateCGradeArmorDrops(3), // C-grade броня (1 сет, 5% на кожну частинку)
      ...generateCGradeBlessStoneDrops(3), // Bless Stone C-grade (на урон 1-2 шт 5%, на броню 1-3 шт 5%)
      { id: "coin_of_luck", kind: "resource" as const, chance: 0.10, min: 1, max: 1 }, // Coin of Luck 10%
      { id: "coin_of_fair", kind: "resource" as const, chance: 1.0, min: 1, max: 1 }, // Festival Adena 100%
    ],
  },
  {
    id: "rb_gludio_territory_destroyer",
    name: "Raid Boss: Territory Destroyer",
    level: 50,
    hp: 1_200_000,
    mp: 0,
    pAtk: 1400,
    mAtk: 0,
    pDef: 1200,
    mDef: 1300,
    exp: 11_000_000,
    sp: 1_100_000,
    adenaMin: 220_000,
    adenaMax: 230_000,
    dropChance: 1.0,
    isRaidBoss: true,
    respawnTime: 6 * 60 * 60,
    dropProfileId: "rb_gludio_territory_destroyer_drop",
    aiProfileId: "rb_floran_ai",
    zoneId: "gludio_territory",
    drops: [
      { id: "great_axe", kind: "equipment", chance: 0.02635, min: 1, max: 1 },
      { id: "zubeis_leather_shirt", kind: "equipment", chance: 0.03259, min: 1, max: 1 },
      { id: "zubeis_leather_gaiters", kind: "equipment", chance: 0.05224, min: 1, max: 1 },
      { id: "avadon_leather_armor", kind: "equipment", chance: 0.02230, min: 1, max: 1 },
      { id: "scroll_enchant_armor_grade_c", kind: "other", chance: 0.11767, min: 21, max: 63 },
      { id: "zubeis_leather_shirt_fabric", kind: "equipment", chance: 0.33291, min: 9, max: 27 },
      { id: "zubeis_leather_gaiter_texture", kind: "equipment", chance: 0.11373, min: 40, max: 120 },
      { id: "avadon_leather_armor_lining", kind: "equipment", chance: 0.16442, min: 14, max: 42 },
      { id: "great_axe_head", kind: "equipment", chance: 0.24523, min: 12, max: 36 },
      { id: "greater_dye_of_con_con3_dex3", kind: "equipment", chance: 0.20592, min: 2, max: 6 },
      { id: "greater_dye_of_dex_dex3_str3", kind: "equipment", chance: 0.16474, min: 3, max: 7 },
      { id: "greater_dye_of_dex_dex3_con3", kind: "equipment", chance: 0.13728, min: 3, max: 9 },
      { id: "skull_of_the_dead_bgrade", kind: "equipment", chance: 0.25000, min: 4, max: 4 },
      { id: "destruction_tombstone", kind: "equipment", chance: 0.25000, min: 7, max: 7 },
      ...generateCGradeWeaponDrops(4), // C-grade зброя (4-7 різних)
      ...generateCGradeArmorDrops(4), // C-grade броня (1 сет, 5% на кожну частинку)
      ...generateCGradeBlessStoneDrops(4), // Bless Stone C-grade (на урон 1-2 шт 5%, на броню 1-3 шт 5%)
      { id: "coin_of_luck", kind: "resource" as const, chance: 0.10, min: 1, max: 1 }, // Coin of Luck 10%
      { id: "coin_of_fair", kind: "resource" as const, chance: 1.0, min: 1, max: 1 }, // Festival Adena 100%
    ],
  },
  {
    id: "rb_gludio_territory_tyrant",
    name: "Raid Boss: Territory Tyrant",
    level: 50,
    hp: 1_300_000,
    mp: 0,
    pAtk: 1500,
    mAtk: 0,
    pDef: 1300,
    mDef: 1400,
    exp: 12_000_000,
    sp: 1_200_000,
    adenaMin: 240_000,
    adenaMax: 250_000,
    dropChance: 1.0,
    isRaidBoss: true,
    respawnTime: 6 * 60 * 60,
    dropProfileId: "rb_gludio_territory_tyrant_drop",
    aiProfileId: "rb_floran_ai",
    zoneId: "gludio_territory",
    drops: [
      { id: "great_axe", kind: "equipment", chance: 0.02635, min: 1, max: 1 },
      { id: "zubeis_leather_shirt", kind: "equipment", chance: 0.03259, min: 1, max: 1 },
      { id: "zubeis_leather_gaiters", kind: "equipment", chance: 0.05224, min: 1, max: 1 },
      { id: "avadon_leather_armor", kind: "equipment", chance: 0.02230, min: 1, max: 1 },
      { id: "scroll_enchant_armor_grade_c", kind: "other", chance: 0.11767, min: 21, max: 63 },
      { id: "zubeis_leather_shirt_fabric", kind: "equipment", chance: 0.33291, min: 9, max: 27 },
      { id: "zubeis_leather_gaiter_texture", kind: "equipment", chance: 0.11373, min: 40, max: 120 },
      { id: "avadon_leather_armor_lining", kind: "equipment", chance: 0.16442, min: 14, max: 42 },
      { id: "great_axe_head", kind: "equipment", chance: 0.24523, min: 12, max: 36 },
      { id: "greater_dye_of_con_con3_dex3", kind: "equipment", chance: 0.20592, min: 2, max: 6 },
      { id: "greater_dye_of_dex_dex3_str3", kind: "equipment", chance: 0.16474, min: 3, max: 7 },
      { id: "greater_dye_of_dex_dex3_con3", kind: "equipment", chance: 0.13728, min: 3, max: 9 },
      { id: "skull_of_the_dead_bgrade", kind: "equipment", chance: 0.25000, min: 4, max: 4 },
      { id: "destruction_tombstone", kind: "equipment", chance: 0.25000, min: 7, max: 7 },
      ...generateCGradeWeaponDrops(5), // C-grade зброя (4-7 різних)
      ...generateCGradeArmorDrops(5), // C-grade броня (1 сет, 5% на кожну частинку)
      ...generateCGradeBlessStoneDrops(5), // Bless Stone C-grade (на урон 1-2 шт 5%, на броню 1-3 шт 5%)
      { id: "coin_of_luck", kind: "resource" as const, chance: 0.10, min: 1, max: 1 }, // Coin of Luck 10%
      { id: "coin_of_fair", kind: "resource" as const, chance: 1.0, min: 1, max: 1 }, // Festival Adena 100%
    ],
  },
  {
    id: "rb_gludio_territory_behemoth",
    name: "Raid Boss: Territory Behemoth",
    level: 51,
    hp: 1_400_000,
    mp: 0,
    pAtk: 1600,
    mAtk: 0,
    pDef: 1400,
    mDef: 1500,
    exp: 13_000_000,
    sp: 1_300_000,
    adenaMin: 260_000,
    adenaMax: 270_000,
    dropChance: 1.0,
    isRaidBoss: true,
    respawnTime: 6 * 60 * 60,
    dropProfileId: "rb_gludio_territory_behemoth_drop",
    aiProfileId: "rb_floran_ai",
    zoneId: "gludio_territory",
    drops: [
      { id: "zubeis_leather_shirt", kind: "equipment", chance: 0.03945, min: 1, max: 1 },
      { id: "zubeis_leather_gaiters", kind: "equipment", chance: 0.06324, min: 1, max: 1 },
      { id: "avadon_leather_armor", kind: "equipment", chance: 0.02699, min: 1, max: 1 },
      { id: "zubeis_leather_shirt_fabric", kind: "equipment", chance: 0.04478, min: 81, max: 243 },
      { id: "zubeis_leather_gaiter_texture", kind: "equipment", chance: 0.13768, min: 40, max: 120 },
      { id: "avadon_leather_armor_lining", kind: "equipment", chance: 0.19904, min: 14, max: 42 },
      { id: "greater_dye_of_wit_wit3_men3", kind: "equipment", chance: 0.39885, min: 1, max: 1 },
      { id: "blessed_scroll_enchant_armor_grade_c", kind: "other", chance: 0.10256, min: 1, max: 1 },
      { id: "greater_dye_of_men_men3_wit3", kind: "equipment", chance: 0.19943, min: 1, max: 3 },
      { id: "greater_dye_of_wit_wit3_int3", kind: "equipment", chance: 0.13295, min: 2, max: 4 },
      { id: "skull_of_the_dead_bgrade", kind: "equipment", chance: 0.25000, min: 2, max: 3 },
      { id: "destruction_tombstone", kind: "equipment", chance: 0.25000, min: 2, max: 2 },
      ...generateCGradeWeaponDrops(6), // C-grade зброя (4-7 різних)
      ...generateCGradeArmorDrops(6), // C-grade броня (1 сет, 5% на кожну частинку)
      ...generateCGradeBlessStoneDrops(6), // Bless Stone C-grade (на урон 1-2 шт 5%, на броню 1-3 шт 5%)
      { id: "coin_of_luck", kind: "resource" as const, chance: 0.10, min: 1, max: 1 }, // Coin of Luck 10%
      { id: "coin_of_fair", kind: "resource" as const, chance: 1.0, min: 1, max: 1 }, // Festival Adena 100%
    ],
  },
  {
    id: "rb_gludio_territory_legend",
    name: "Raid Boss: Territory Legend",
    level: 52,
    hp: 1_500_000,
    mp: 0,
    pAtk: 1700,
    mAtk: 0,
    pDef: 1500,
    mDef: 1600,
    exp: 14_000_000,
    sp: 1_400_000,
    adenaMin: 280_000,
    adenaMax: 290_000,
    dropChance: 1.0,
    isRaidBoss: true,
    respawnTime: 6 * 60 * 60,
    dropProfileId: "rb_gludio_territory_legend_drop",
    aiProfileId: "rb_floran_ai",
    zoneId: "gludio_territory",
    drops: [
      { id: "great_sword", kind: "equipment", chance: 0.01050, min: 1, max: 1 },
      { id: "keshanberk", kind: "equipment", chance: 0.01050, min: 1, max: 1 },
      { id: "sword_of_valhalla", kind: "equipment", chance: 0.01050, min: 1, max: 1 },
      { id: "tunic_of_zubei", kind: "equipment", chance: 0.03895, min: 1, max: 1 },
      { id: "stockings_of_zubei", kind: "equipment", chance: 0.06245, min: 1, max: 1 },
      { id: "avadon_robe", kind: "equipment", chance: 0.02665, min: 1, max: 1 },
      { id: "tunic_of_zubei_fabric", kind: "equipment", chance: 0.04422, min: 81, max: 243 },
      { id: "stockings_of_zubei_fabric", kind: "equipment", chance: 0.13595, min: 40, max: 120 },
      { id: "avadon_robe_fabric", kind: "equipment", chance: 0.19654, min: 14, max: 42 },
      { id: "great_sword_blade", kind: "equipment", chance: 0.26078, min: 5, max: 15 },
      { id: "keshanberk_blade", kind: "equipment", chance: 0.14264, min: 9, max: 27 },
      { id: "sword_of_valhalla_blade", kind: "equipment", chance: 0.09169, min: 14, max: 42 },
      { id: "scroll_enchant_armor_grade_c", kind: "other", chance: 0.14066, min: 21, max: 63 },
      { id: "greater_dye_of_con_con3_dex3", kind: "equipment", chance: 0.24615, min: 2, max: 6 },
      { id: "greater_dye_of_dex_dex3_str3", kind: "equipment", chance: 0.19692, min: 3, max: 7 },
      { id: "greater_dye_of_dex_dex3_con3", kind: "equipment", chance: 0.16410, min: 3, max: 9 },
      { id: "egg_of_earth_bgrade", kind: "equipment", chance: 0.25000, min: 1, max: 1 },
      { id: "destruction_tombstone", kind: "equipment", chance: 0.25000, min: 1, max: 1 },
      ...generateCGradeWeaponDrops(7), // C-grade зброя (4-7 різних)
      ...generateCGradeArmorDrops(7), // C-grade броня (1 сет, 5% на кожну частинку)
      ...generateCGradeBlessStoneDrops(7), // Bless Stone C-grade (на урон 1-2 шт 5%, на броню 1-3 шт 5%)
      { id: "coin_of_luck", kind: "resource" as const, chance: 0.10, min: 1, max: 1 }, // Coin of Luck 10%
      { id: "coin_of_fair", kind: "resource" as const, chance: 1.0, min: 1, max: 1 }, // Festival Adena 100%
    ],
  },
];

export const GLUDIO_TERRITORY_MOBS: Mob[] = [...normalMobs, ...raidBosses];

