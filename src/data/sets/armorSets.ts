// src/data/sets/armorSets.ts
// Визначення сетів броні та їх бонусів

import type { CombatStats } from "../../utils/stats/calcCombatStats";

export interface ArmorSetPiece {
  itemId: string;
  slot: "head" | "armor" | "legs" | "gloves" | "boots";
}

export interface ArmorSetBonus {
  fullSet?: Partial<CombatStats> & {
    maxHp?: number;
    maxMp?: number;
    maxCp?: number;
    critRate?: number; // Alias for crit
    skillCritRate?: number; // Alias for mCrit
    critDamage?: number; // Alias for critPower
    skillCritPower?: number; // Alias for critPower (magic)
    maxHpPercent?: number;
    pDefPercent?: number;
    mDefPercent?: number;
    pAtkPercent?: number;
    mAtkPercent?: number;
  };
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
      fullSet: {
        attackSpeed: 50, // +50 скорости атаки
        maxHp: 350, // +350 HP
        pDef: 50, // +50 физ защ
        mDef: 50, // +50 маг защ
      },
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
      fullSet: {
        attackSpeed: 75, // +75 скорости атаки
        critRate: 5, // +5% шанса крита
        critDamage: 50, // +50 сили крита
        maxHp: 100, // +100 HP
      },
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
      fullSet: {
        skillCritRate: 4, // +4% шанс маг крита
        maxMp: 100, // +100 MP
        maxHp: 150, // +150 HP
        pDef: 50, // +50 физ защ
        mDef: 50, // +50 маг защ
      },
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
      fullSet: {
        maxHp: 250, // +250 HP
        castSpeed: 100, // +100 скорости каста
        skillCritRate: 5, // +5% шанс маг крита
        skillCritPower: 50, // +50 критичного удара
        pDef: 50, // +50 физ защ
        mDef: 50, // +50 маг защ
        maxMp: 150, // +150 MP
      },
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
      fullSet: {
        attackSpeed: 100, // +100 скорости атаки
        pAtk: 50, // +50 урона
        critRate: 5, // +5% шанс крита
        maxHp: 250, // +250 HP
        critDamage: 100, // +100 сили крита
        pDef: 30, // +30 физ защ
        mDef: 30, // +30 маг защ
      },
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
      fullSet: {
        maxHp: 350, // +350 HP
        pAtk: 50, // +50 урона
        pDef: 100, // +100 физ защ
        mDef: 100, // +100 маг защ
      },
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
      fullSet: {
        castSpeed: 150, // +150 скорости каста
        mAtk: 100, // +100 маг урона
        maxHp: 200, // +200 HP
        pDef: 50, // +50 физ защ
        mDef: 50, // +50 маг защ
        skillCritRate: 5, // +5% шанс маг крита
      },
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
      fullSet: {
        skillCritRate: 10, // +10% шанс маг крита
        castSpeed: 150, // +150 скорости каста
        maxHp: 250, // +250 HP
      },
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
      fullSet: {
        maxHp: 300, // +300 HP
        pDef: 60, // +60 физ защ
        mDef: 60, // +60 маг защ
        pAtk: 50, // +50 урона
        attackSpeed: 150, // +150 скорости атаки
        critRate: 5, // +5% шанс крита
      },
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
      fullSet: {
        skillCritRate: 10, // +10% шанс маг крита
        mAtk: 100, // +100 маг урона
        pDef: 60, // +60 физ защ
        mDef: 60, // +60 маг защ
        mpRegen: 5, // +5 реген MP
        castSpeed: 150, // +150 скорости каста
      },
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
      fullSet: {
        maxHp: 250, // +250 HP
        pAtk: 100, // +100 физ урона
        attackSpeed: 100, // +100 скорости атаки
        critRate: 7, // +7% шанс крита
        pDef: 100, // +100 физ защ
        mDef: 100, // +100 маг защ
      },
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
      fullSet: {
        maxHp: 300, // +300 HP
        mAtk: 100, // +100 маг урона
        castSpeed: 180, // +180 скорости каста
        skillCritRate: 7, // +7% маг крита
        maxMp: 200, // +200 MP
        mpRegen: 6, // +6 реген MP
        hpRegen: 6, // +6 реген HP
      },
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
      fullSet: {
        pDef: 100, // +100 физ защ
        mDef: 100, // +100 маг защ
        castSpeed: 200, // +200 скорости каста
        mAtk: 150, // +150 маг урона
        skillCritRate: 9, // +9% шанс маг крита
        maxHp: 300, // +300 HP
      },
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
      fullSet: {
        pDef: 150, // +150 физ защ
        mDef: 150, // +150 маг защ
        maxHp: 500, // +500 HP
        attackSpeed: 150, // +150 скорости атаки
        critRate: 8, // +8% шанс физ крита (конвертується в flat: 8 * 10 = 80)
      },
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
      fullSet: {
        pDef: 100, // +100 физ защ
        mDef: 100, // +100 маг защ
        maxHp: 350, // +350 HP
        attackSpeed: 200, // +200 скорости атаки
        critDamage: 200, // +200 сили крита
      },
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
      fullSet: {
        pDef: 200, // +200 физ защ
        mDef: 200, // +200 маг защ
        maxHp: 650, // +650 HP
        attackSpeed: 170, // +170 скорости атаки
        critDamage: 200, // +200 сили крита
        maxCp: 1000, // +1000 CP
      },
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
      fullSet: {
        pDef: 80, // +80 физ защ
        mDef: 80, // +80 маг защ
        maxHp: 300, // +300 HP
        attackSpeed: 180, // +180 скорости атаки
        critDamage: 100, // +100 сила крита
        critRate: 5, // +5% шанс крита
      },
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
      fullSet: {
        pDef: 150, // +150 физ защ
        mDef: 150, // +150 маг защ
        maxHp: 350, // +350 HP
        maxMp: 300, // +300 MP
        castSpeed: 200, // +200 скорости касти
        skillCritRate: 5, // +5% шанс маг кріта
      },
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
      fullSet: {
        pDef: 180, // +180 физ защ
        mDef: 180, // +180 маг защ
        maxHp: 450, // +450 HP
        attackSpeed: 220, // +220 скорости атаки
        critRate: 14, // +14% шанс физ крита
        maxCp: 500, // +500 CP
      },
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
      fullSet: {
        pDef: 200, // +200 физ защ
        mDef: 300, // +300 маг защ
        maxHp: 700, // +700 HP
        maxCp: 600, // +600 CP
        attackSpeed: 200, // +200 скорости атаки
        critRate: 5, // +5% шанс крита
        critDamage: 150, // +150 сили крита
      },
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
      fullSet: {
        pDef: 250, // +250 физ защ
        mDef: 350, // +350 маг защ
        maxHp: 800, // +800 HP
        maxCp: 1000, // +1000 CP
        attackSpeed: 200, // +200 скорости атаки
      },
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
      fullSet: {
        pDef: 180, // +180 физ защ
        mDef: 180, // +180 маг защ
        pAtk: 150, // +150 физ урона
        critDamage: 250, // +250 сили крита
        attackSpeed: 200, // +200 скорости атаки
        critRate: 10, // +10% шанс крита
      },
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
      fullSet: {
        pDef: 150, // +150 физ защ
        mDef: 150, // +150 маг защ
        maxHp: 500, // +500 HP
        castSpeed: 200, // +200 скорости касти
        critDamage: 200, // +200 сили крита
        maxCp: 500, // +500 CP
        mAtk: 200, // +200 маг урона
        skillCritRate: 10, // +10% шанс маг крита
      },
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
      fullSet: {
        pDef: 200, // +200 физ защ
        mDef: 200, // +200 маг защ
        maxHp: 400, // +400 HP
        maxCp: 500, // +500 CP
        maxMp: 400, // +400 MP
        castSpeed: 250, // +250 скорости касти
        skillCritRate: 10, // +10% шанс маг крита
        critDamage: 200, // +200 сили крита
      },
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
      fullSet: {
        maxHp: 600, // +600 HP
        maxCp: 500, // +500 CP
        attackSpeed: 250, // +250 скорости атаки
        critRate: 16, // +16% шанс крита
        pDef: 200, // +200 физ защ
        mDef: 200, // +200 маг защ
        critDamage: 200, // +200 сили крита
      },
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
      fullSet: {
        maxHp: 1000, // +1000 HP
        pDef: 250, // +250 физ защ
        mDef: 350, // +350 маг защ
        attackSpeed: 230, // +230 скорости атаки
        critDamage: 180, // +180 сили крита
        critRate: 7, // +7% шанс крита
      },
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
      fullSet: {
        pDef: 150, // +150 физ защ
        mDef: 150, // +150 маг защ
        maxHp: 500, // +500 HP
        maxCp: 500, // +500 CP
        castSpeed: 200, // +200 скорости касти
        mAtk: 200, // +200 маг урона
        critDamage: 300, // +300 сили крита
        skillCritRate: 15, // +15% шанс маг крита
        pDefPercent: 5, // +5% физ защ
        maxHpPercent: 10, // +10% HP
      },
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
      fullSet: {
        pDef: 290, // +290 физ защ
        mDef: 390, // +390 маг защ
        maxHp: 1500, // +1500 HP
        maxCp: 1000, // +1000 CP
        attackSpeed: 200, // +200 скорости атаки
        maxHpPercent: 10, // +10% HP
        pDefPercent: 5, // +5% физ защ
        mDefPercent: 5, // +5% маг защ
        critDamage: 200, // +200 сили крита
      },
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
      fullSet: {
        pDef: 200, // +200 физ защ
        mDef: 200, // +200 маг защ
        maxHp: 650, // +650 HP
        maxCp: 500, // +500 CP
        attackSpeed: 250, // +250 скорости атаки
        critRate: 19, // +19% шанс крита
        critDamage: 250, // +250 сили крита
        maxHpPercent: 5, // +5% HP
        pDefPercent: 5, // +5% физ защ
        mDefPercent: 5, // +5% маг защ
      },
    },
  },
];

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
} {
  const bonuses: any = {};

  for (const set of ARMOR_SETS) {
    // Перевіряємо чи всі частини сету екіпіровані
    const allPiecesEquipped = set.pieces.every(piece => {
      const slot = piece.slot === "armor" ? "armor" : piece.slot;
      const equippedItemId = equipment[slot];
      return equippedItemId === piece.itemId;
    });

    if (allPiecesEquipped && set.bonuses.fullSet) {
      // Додаємо бонуси повного сету
      Object.assign(bonuses, set.bonuses.fullSet);
    }
  }

  return bonuses;
}
