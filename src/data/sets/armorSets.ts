// src/data/sets/armorSets.ts
// Визначення сетів броні та їх бонусів

import type { CombatStats } from "../../utils/stats/calcCombatStats";
import { convertSetStatsToBonuses } from "./statBonusFormulas";

export interface ArmorSetPiece {
  itemId: string;
  slot: "head" | "armor" | "legs" | "gloves" | "boots";
}

/** Set stat bonuses (STR, DEX, CON, INT, WIT, MEN) — separate from base stats, use statBonusFormulas. */
export interface SetStatBonuses {
  STR?: number;
  DEX?: number;
  CON?: number;
  INT?: number;
  WIT?: number;
  MEN?: number;
}

const COMBAT_BONUS_KEYS = [
  "maxHp", "maxMp", "maxCp", "critRate", "skillCritRate", "critDamage", "skillCritPower",
  "maxHpPercent", "pDefPercent", "mDefPercent", "pAtkPercent", "mAtkPercent",
  "pAtk", "mAtk", "pDef", "mDef", "accuracy", "evasion", "crit", "mCrit",
  "critPower", "attackSpeed", "castSpeed", "hpRegen", "mpRegen", "cpRegen",
  "magicSkillPower", "shieldBlockRate", "shieldBlockPower",
] as const;

export interface ArmorSetBonus {
  /** Stat bonuses from set (e.g. +4 STR, +2 DEX) — converted via statBonusFormulas. */
  setStats?: SetStatBonuses;
  fullSet?: Partial<CombatStats> & {
    maxHp?: number;
    maxMp?: number;
    maxCp?: number;
    critRate?: number;
    skillCritRate?: number;
    critDamage?: number;
    skillCritPower?: number;
    maxHpPercent?: number;
    pDefPercent?: number;
    mDefPercent?: number;
    pAtkPercent?: number;
    mAtkPercent?: number;
    magicSkillPower?: number;
  };
  partialSet?: Array<{
    pieces: number;
    setStats?: SetStatBonuses;
    bonuses: Partial<CombatStats> & {
      maxHp?: number;
      maxMp?: number;
      maxCp?: number;
      critRate?: number;
      skillCritRate?: number;
      critDamage?: number;
      skillCritPower?: number;
      maxHpPercent?: number;
      pDefPercent?: number;
      mDefPercent?: number;
      pAtkPercent?: number;
      mAtkPercent?: number;
      magicSkillPower?: number;
    };
  }>;
}

export interface ArmorSet {
  id: string;
  name: string;
  grade: "NG" | "D" | "C" | "B" | "A" | "S";
  pieces: ArmorSetPiece[];
  bonuses: ArmorSetBonus;
}

export const ARMOR_SETS: ArmorSet[] = [
  // ===== D-GRADE СЕТ MITHRIL (Heavy Armor Set) =====
  {
    id: "mithril_set_d",
    name: "Mithril Set (D-grade)",
    grade: "D",
    pieces: [
      { itemId: "mithril_helmet", slot: "head" },
      { itemId: "mithril_breastplate", slot: "armor" },
      { itemId: "mithril_gaiters", slot: "legs" },
      { itemId: "mithril_gloves", slot: "gloves" },
      { itemId: "mithril_boots", slot: "boots" },
    ],
    bonuses: {
      setStats: { STR: 1, CON: 1, MEN: 1 },
    },
  },

  // ===== D-GRADE СЕТ REINFORCED (Light Armor Set) =====
  {
    id: "reinforced_set_d",
    name: "Reinforced Set (D-grade)",
    grade: "D",
    pieces: [
      { itemId: "leather_helmet", slot: "head" }, // Використовуємо Leather Helmet як Reinforced Helmet
      { itemId: "reinforced_leather_shirt", slot: "armor" },
      { itemId: "reinforced_leather_gaiters", slot: "legs" },
      { itemId: "reinforced_gloves", slot: "gloves" },
      { itemId: "reinforced_leather_boots", slot: "boots" },
    ],
    bonuses: {
      setStats: { STR: 1, DEX: 1, MEN: 1 },
    },
  },

  // ===== D-GRADE СЕТ KNOWLEDGE (Magic Armor Set) =====
  {
    id: "knowledge_set_d",
    name: "Knowledge Set (D-grade)",
    grade: "D",
    pieces: [
      { itemId: "cloth_cap", slot: "head" }, // Використовуємо Cloth Cap як Knowledge Helmet
      { itemId: "tunic_of_knowledge", slot: "armor" },
      { itemId: "stockings_of_knowledge", slot: "legs" },
      { itemId: "gloves_of_knowledge", slot: "gloves" },
      { itemId: "boots_of_knowledge", slot: "boots" },
    ],
    bonuses: {
      setStats: { MEN: 1, WIT: 1, INT: 1 },
    },
  },

  // ===== D-GRADE СЕТ OATH (Magic Armor Set - Robe) =====
  {
    id: "oath_set_d",
    name: "Oath Set (D-grade)",
    grade: "D",
    pieces: [
      { itemId: "clan_oath_helm", slot: "head" },
      { itemId: "clan_oath_aketon", slot: "armor" },
      { itemId: "clan_oath_padded_gloves_robe", slot: "gloves" },
      { itemId: "clan_oath_sandals_robe", slot: "boots" },
    ],
    bonuses: {
      setStats: { MEN: 1, WIT: 1, INT: 1 },
    },
  },

  // ===== D-GRADE СЕТ SHADOW (Light Armor Set) =====
  {
    id: "shadow_set_d",
    name: "Shadow Set (D-grade)",
    grade: "D",
    pieces: [
      { itemId: "shadow_helm", slot: "head" },
      { itemId: "shadow_brigandine", slot: "armor" },
      { itemId: "shadow_gloves", slot: "gloves" },
      { itemId: "shadow_boots", slot: "boots" },
    ],
    bonuses: {
      setStats: { STR: 1, DEX: 1, MEN: 1 },
    },
  },

  // ===== D-GRADE СЕТ SHADOW OATH (Heavy Armor Set) =====
  {
    id: "shadow_oath_set_d",
    name: "Shadow Oath Set (D-grade)",
    grade: "D",
    pieces: [
      { itemId: "shadow_oath_helm", slot: "head" },
      { itemId: "shadow_oath_armor", slot: "armor" },
      { itemId: "shadow_oath_gauntlets", slot: "gloves" },
      { itemId: "shadow_oath_sabaton", slot: "boots" },
    ],
    bonuses: {
      setStats: { STR: 1, CON: 1, MEN: 1 },
    },
  },

  // ===== C-GRADE СЕТ DEMON'S (Magic Armor Set - Robe) =====
  {
    id: "demons_set_c",
    name: "Demon's Set (C-grade)",
    grade: "C",
    pieces: [
      { itemId: "demons_helmet", slot: "head" },
      { itemId: "demons_tunic", slot: "armor" },
      { itemId: "demons_stockings", slot: "legs" },
      { itemId: "demons_gloves", slot: "gloves" },
      { itemId: "demons_boots", slot: "boots" },
    ],
    bonuses: {
      setStats: { INT: 1, MEN: 1, CON: 1 },
    },
  },

  // ===== C-GRADE СЕТ KARMIAN (Magic Armor Set - Robe) =====
  {
    id: "karmian_set_c",
    name: "Karmian Set (C-grade)",
    grade: "C",
    pieces: [
      { itemId: "karmian_helmet", slot: "head" },
      { itemId: "karmian_tunic", slot: "armor" },
      { itemId: "karmian_stockings", slot: "legs" },
      { itemId: "karmian_gloves", slot: "gloves" },
      { itemId: "karmian_boots", slot: "boots" },
    ],
    bonuses: {
      setStats: { WIT: 3, CON: 1, MEN: 1 },
    },
  },

  // ===== C-GRADE СЕТ PLATED LEATHER (Light Armor Set) =====
  {
    id: "plated_leather_set_c",
    name: "Plated Leather Set (C-grade)",
    grade: "C",
    pieces: [
      { itemId: "plated_leather_helmet", slot: "head" },
      { itemId: "plated_leather", slot: "armor" },
      { itemId: "plated_leather_gaiters", slot: "legs" },
      { itemId: "plated_leather_gloves", slot: "gloves" },
      { itemId: "plated_leather_boots", slot: "boots" },
    ],
    bonuses: {
      setStats: { STR: 3, DEX: 2, CON: 1 },
    },
  },

  // ===== C-GRADE СЕТ DIVINE (Magic Armor Set - Robe) =====
  {
    id: "divine_set_c",
    name: "Divine Set (C-grade)",
    grade: "C",
    pieces: [
      { itemId: "divine_helmet", slot: "head" },
      { itemId: "divine_tunic", slot: "armor" },
      { itemId: "divine_stockings", slot: "legs" },
      { itemId: "divine_gloves", slot: "gloves" },
      { itemId: "divine_boots", slot: "boots" },
    ],
    bonuses: {
      setStats: { INT: 1, MEN: 1, CON: 1 },
    },
  },

  // ===== C-GRADE СЕТ DRAKE LEATHER (Light Armor Set) =====
  {
    id: "drake_leather_set_c",
    name: "Drake Leather Set (C-grade)",
    grade: "C",
    pieces: [
      { itemId: "drake_leather_helmet", slot: "head" },
      { itemId: "drake_leather_armor", slot: "armor" },
      { itemId: "drake_leather_gloves", slot: "gloves" },
      { itemId: "drake_leather_boots", slot: "boots" },
    ],
    bonuses: {
      setStats: { STR: 3, DEX: 2, CON: 1 },
    },
  },

  // ===== B-GRADE СЕТ AVADON (Magic Armor Set - Robe) =====
  {
    id: "avadon_set_b",
    name: "Avadon Set (B-grade)",
    grade: "B",
    pieces: [
      { itemId: "avadon_circlet", slot: "head" },
      { itemId: "avadon_robe", slot: "armor" },
      { itemId: "avadon_gloves", slot: "gloves" },
      { itemId: "avadon_boots", slot: "boots" },
    ],
    bonuses: {
      setStats: { CON: 2, INT: 1, WIT: 3, MEN: 3 },
    },
  },

  // ===== B-GRADE СЕТ DOOM (Magic Armor Set - Robe) =====
  {
    id: "doom_set_b",
    name: "Doom Set (B-grade)",
    grade: "B",
    pieces: [
      { itemId: "doom_helmet", slot: "head" },
      { itemId: "doom_tunic", slot: "armor" },
      { itemId: "doom_stockings", slot: "legs" },
      { itemId: "doom_gloves", slot: "gloves" },
      { itemId: "doom_boots", slot: "boots" },
    ],
    bonuses: {
      setStats: { CON: 2, INT: 1, WIT: 3, MEN: 3 },
    },
  },

  // ===== B-GRADE СЕТ BLUE WOLF (Heavy Armor Set) =====
  {
    id: "blue_wolf_set_b",
    name: "Blue Wolf Set (B-grade)",
    grade: "B",
    pieces: [
      { itemId: "blue_wolf_helmet", slot: "head" },
      { itemId: "blue_wolf_breastplate", slot: "armor" },
      { itemId: "blue_wolf_gaiters", slot: "legs" },
      { itemId: "blue_wolf_gloves", slot: "gloves" },
      { itemId: "blue_wolf_boots", slot: "boots" },
    ],
    bonuses: {
      setStats: { STR: 3, DEX: 1, CON: 3 },
    },
  },

  // ===== B-GRADE СЕТ BOUND BLUE WOLF (Light Armor Set) =====
  {
    id: "bound_blue_wolf_set_b",
    name: "Bound Blue Wolf Set (B-grade)",
    grade: "B",
    pieces: [
      { itemId: "bound_blue_wolf_helmet", slot: "head" },
      { itemId: "bound_blue_wolf_armor", slot: "armor" },
      { itemId: "bound_blue_wolf_gloves", slot: "gloves" },
      { itemId: "bound_blue_wolf_boots", slot: "boots" },
    ],
    bonuses: {
      setStats: { STR: 3, DEX: 1, CON: 3 },
    },
  },

  // ===== B-GRADE СЕТ ZUBEI'S (Heavy Armor Set) =====
  {
    id: "zubeis_set_b",
    name: "Zubei's Set (B-grade)",
    grade: "B",
    pieces: [
      { itemId: "zubeis_helmet", slot: "head" },
      { itemId: "zubeis_breastplate", slot: "armor" },
      { itemId: "zubeis_gaiters", slot: "legs" },
      { itemId: "zubeis_gauntlets", slot: "gloves" },
      { itemId: "zubeis_boots", slot: "boots" },
    ],
    bonuses: {
      setStats: { STR: 3, DEX: 1, CON: 3 },
    },
  },

  // ===== B-GRADE СЕТ DOOM OF FORTUNE (Light Armor Set) =====
  {
    id: "doom_of_fortune_set_b",
    name: "Doom of Fortune Set (B-grade)",
    grade: "B",
    pieces: [
      { itemId: "doom_helmet_of_fortune", slot: "head" },
      { itemId: "leather_armor_of_doom_of_fortune", slot: "armor" },
      { itemId: "doom_gloves_of_fortune", slot: "gloves" },
      { itemId: "doom_boots_of_fortune", slot: "boots" },
    ],
    bonuses: {
      setStats: { STR: 5, DEX: 3, CON: 1, MEN: 1 },
    },
  },

  // ===== A-GRADE СЕТ MAJESTIC (Magic Armor Set - Robe) =====
  {
    id: "majestic_set_a",
    name: "Majestic Set (A-grade)",
    grade: "A",
    pieces: [
      { itemId: "majestic_circlet", slot: "head" },
      { itemId: "majestic_robe", slot: "armor" },
      { itemId: "majestic_gauntlets", slot: "gloves" },
      { itemId: "majestic_boots", slot: "boots" },
    ],
    bonuses: {
      setStats: { CON: 2, WIT: 4, INT: 3, MEN: 3 },
    },
  },

  // ===== A-GRADE СЕТ APELLA (Light Armor Set) =====
  {
    id: "apella_set_a",
    name: "Apella Set (A-grade)",
    grade: "A",
    pieces: [
      { itemId: "apella_helm", slot: "head" },
      { itemId: "apella_brigandine", slot: "armor" },
      { itemId: "apella_leather_gloves_light_armor", slot: "gloves" },
      { itemId: "apella_boots_light_armor", slot: "boots" },
    ],
    bonuses: {
      setStats: { STR: 6, DEX: 5, CON: 3, MEN: 2 },
    },
  },

  // ===== A-GRADE СЕТ DARK CRYSTAL (Heavy Armor Set) =====
  {
    id: "dark_crystal_set_a",
    name: "Dark Crystal Set (A-grade)",
    grade: "A",
    pieces: [
      { itemId: "dark_crystal_helmet", slot: "head" },
      { itemId: "dark_crystal_breastplate", slot: "armor" },
      { itemId: "dark_crystal_gaiters", slot: "legs" },
      { itemId: "dark_crystal_gloves", slot: "gloves" },
      { itemId: "dark_crystal_boots", slot: "boots" },
    ],
    bonuses: {
      setStats: { STR: 4, DEX: 3, CON: 6, MEN: 3 },
    },
  },

  // ===== A-GRADE СЕТ MAJESTIC HEAVY (Heavy Armor Set - Quest Shop) =====
  {
    id: "majestic_heavy_set_a",
    name: "Majestic Heavy Set (A-grade)",
    grade: "A",
    pieces: [
      { itemId: "majestic_heavy_circlet", slot: "head" },
      { itemId: "majestic_heavy_plate_armor", slot: "armor" },
      { itemId: "majestic_heavy_gauntlets", slot: "gloves" },
      { itemId: "majestic_heavy_boots", slot: "boots" },
    ],
    bonuses: {
      setStats: { STR: 4, DEX: 3, CON: 6, MEN: 3 },
    },
  },

  // ===== A-GRADE СЕТ NIGHTMARE LIGHT (Light Armor Set - Quest Shop) =====
  {
    id: "nightmare_light_set_a",
    name: "Nightmare Light Set (A-grade)",
    grade: "A",
    pieces: [
      { itemId: "nightmare_light_helm", slot: "head" },
      { itemId: "nightmare_light_leather_armor", slot: "armor" },
      { itemId: "nightmare_light_gauntlets", slot: "gloves" },
      { itemId: "nightmare_light_boots", slot: "boots" },
    ],
    bonuses: {
      setStats: { STR: 6, DEX: 5, CON: 3, MEN: 2 },
    },
  },

  // ===== A-GRADE СЕТ BOUND DARK CRYSTAL (Magic Armor Set - Robe - Quest Shop) =====
  {
    id: "bound_dark_crystal_set_a",
    name: "Bound Dark Crystal Set (A-grade)",
    grade: "A",
    pieces: [
      { itemId: "bound_dark_crystal_helmet", slot: "head" },
      { itemId: "bound_dark_crystal_robe", slot: "armor" },
      { itemId: "bound_dark_crystal_gloves", slot: "gloves" },
      { itemId: "bound_dark_crystal_boots", slot: "boots" },
    ],
    bonuses: {
      setStats: { CON: 2, WIT: 4, INT: 3, MEN: 3 },
    },
  },

  // ===== S-GRADE СЕТ MAJOR ARCANA (Magic Armor Set - Robe) =====
  {
    id: "major_arcana_set_s",
    name: "Major Arcana Set (S-grade)",
    grade: "S",
    pieces: [
      { itemId: "major_arcana_circlet", slot: "head" },
      { itemId: "major_arcana_robe", slot: "armor" },
      { itemId: "major_arcana_gloves", slot: "gloves" },
      { itemId: "major_arcana_boots", slot: "boots" },
    ],
    bonuses: {
      setStats: { CON: 5, WIT: 7, INT: 5, MEN: 5 },
    },
  },

  // ===== S-GRADE СЕТ DRACONIC LEATHER (Light Armor Set) =====
  {
    id: "draconic_leather_set_s",
    name: "Draconic Leather Set (S-grade)",
    grade: "S",
    pieces: [
      { itemId: "draconic_leather_helmet", slot: "head" },
      { itemId: "draconic_leather_armor", slot: "armor" },
      { itemId: "draconic_leather_gloves", slot: "gloves" },
      { itemId: "draconic_leather_boots", slot: "boots" },
    ],
    bonuses: {
      setStats: { STR: 9, DEX: 7, CON: 5, MEN: 4 },
    },
  },

  // ===== S-GRADE СЕТ IMPERIAL CRUSADER (Heavy Armor Set) =====
  {
    id: "imperial_crusader_set_s",
    name: "Imperial Crusader Set (S-grade)",
    grade: "S",
    pieces: [
      { itemId: "imperial_crusader_helmet", slot: "head" },
      { itemId: "imperial_crusader_breastplate", slot: "armor" },
      { itemId: "imperial_crusader_gaiters", slot: "legs" },
      { itemId: "imperial_crusader_gauntlets", slot: "gloves" },
      { itemId: "imperial_crusader_boots", slot: "boots" },
    ],
    bonuses: {
      setStats: { STR: 5, MEN: 4, DEX: 5, CON: 10 },
    },
  },

  // ===== S-GRADE СЕТ MOIRAI (Magic Armor Set - Robe - Quest Shop) =====
  {
    id: "moirai_set_s",
    name: "Moirai Set (S-grade)",
    grade: "S",
    pieces: [
      { itemId: "moirai_circlet", slot: "head" },
      { itemId: "moirai_tunic", slot: "armor" },
      { itemId: "moirai_stockings", slot: "legs" },
      { itemId: "moirai_gloves", slot: "gloves" },
      { itemId: "moirai_shoes", slot: "boots" },
    ],
    bonuses: {
      setStats: { CON: 5, WIT: 7, INT: 5, MEN: 5 },
    },
  },

  // ===== S-GRADE СЕТ VESPER (Heavy Armor Set - Quest Shop) =====
  {
    id: "vesper_set_s",
    name: "Vesper Set (S-grade)",
    grade: "S",
    pieces: [
      { itemId: "vesper_helmet", slot: "head" },
      { itemId: "vesper_breastplate", slot: "armor" },
      { itemId: "vesper_gaiters", slot: "legs" },
      { itemId: "vesper_gauntlets", slot: "gloves" },
      { itemId: "vesper_boots", slot: "boots" },
    ],
    bonuses: {
      setStats: { STR: 5, MEN: 4, DEX: 5, CON: 10 },
    },
  },

  // ===== S-GRADE СЕТ VESPER LEATHER (Light Armor Set - Quest Shop) =====
  {
    id: "vesper_leather_set_s_quest",
    name: "Vesper Leather Set (S-grade)",
    grade: "S",
    pieces: [
      { itemId: "vesper_leather_helmet_quest", slot: "head" },
      { itemId: "vesper_leather_breastplate_quest", slot: "armor" },
      { itemId: "vesper_leather_leggings_quest", slot: "legs" },
      { itemId: "vesper_leather_gloves_quest", slot: "gloves" },
      { itemId: "vesper_leather_boots_quest", slot: "boots" },
    ],
    bonuses: {
      setStats: { STR: 9, DEX: 7, CON: 5, MEN: 4 },
    },
  },
];

/**
 * Format setStats for UI display (e.g. "+1 MEN", "+2 STR")
 */
export function formatSetStatsForDisplay(setStats: SetStatBonuses | undefined): string[] {
  if (!setStats) return [];
  const result: string[] = [];
  (["STR", "DEX", "CON", "INT", "WIT", "MEN"] as const).forEach((stat) => {
    const v = setStats[stat];
    if (typeof v === "number" && v > 0) result.push(`+${v} ${stat}`);
  });
  return result;
}

/**
 * Знаходить сет, до якого належить предмет
 * @param itemId - ID предмета з itemsDB
 * @returns Сет, до якого належить предмет, або null
 */
export function findSetForItem(itemId: string): ArmorSet | null {
  for (const set of ARMOR_SETS) {
    if (set.pieces.some(piece => piece.itemId === itemId)) {
      return set;
    }
  }
  return null;
}

/**
 * Отримує активні бонуси сетів на основі екіпірованих предметів
 * @param equipment - Об'єкт з екіпірованими предметами (slot -> itemId)
 * @returns Бонуси активних сетів
 */
export function getActiveSetBonuses(
  equipment: Record<string, string | null>
): Partial<CombatStats> & {
  maxHp?: number;
  maxMp?: number;
  maxCp?: number;
  critRate?: number;
  skillCritRate?: number;
  critDamage?: number;
  skillCritPower?: number;
  maxHpPercent?: number;
  pDefPercent?: number;
  mDefPercent?: number;
  pAtkPercent?: number;
  mAtkPercent?: number;
  magicSkillPower?: number;
} {
  const bonuses: any = {};

  for (const set of ARMOR_SETS) {
    const allPiecesEquipped = set.pieces.every(piece => {
      const slot = piece.slot === "armor" ? "armor" : piece.slot;
      const equippedItemId = equipment[slot];
      return equippedItemId === piece.itemId;
    });

    if (!allPiecesEquipped) continue;

    const b = set.bonuses;
    if (b.fullSet) Object.assign(bonuses, b.fullSet);
    if (b.setStats) {
      const converted = convertSetStatsToBonuses(b.setStats);
      for (const k of COMBAT_BONUS_KEYS) {
        const v = (converted as any)[k];
        if (typeof v === "number") bonuses[k] = ((bonuses[k] as number) ?? 0) + v;
      }
    }
  }

  return bonuses;
}
