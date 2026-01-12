// src/data/starterKitItems.ts
// Предмети для стартового набору (якщо їх немає в itemsDB)

import type { ItemDefinition } from './items/itemsDB.types';

export const starterKitItems: Record<string, ItemDefinition> = {
  // Devotion Set (для магів)
  tunic_of_devotion: {
    id: "tunic_of_devotion",
    name: "Tunic of Devotion",
    kind: "armor",
    icon: "/items/drops/arrom_ng/Tunic of Devotion.jpg",
    description: "Стартовий одяг для магів",
    slot: "armor",
    armorType: "robe",
    grade: "NG",
    stats: {
      pDef: 18,
      mDef: 35,
    },
  },
  stockings_of_devotion: {
    id: "stockings_of_devotion",
    name: "Stockings of Devotion",
    kind: "armor",
    icon: "/items/drops/arrom_ng/Stockings of Devotion.jpg",
    description: "Стартові штани для магів",
    slot: "legs",
    armorType: "robe",
    grade: "NG",
    stats: {
      pDef: 12,
      mDef: 28,
    },
  },
  devotion_gloves: {
    id: "devotion_gloves",
    name: "Devotion Gloves",
    kind: "armor",
    icon: "/items/drops/arrom_ng/Devotion Gloves.jpg",
    description: "Стартові рукавиці для магів",
    slot: "gloves",
    armorType: "robe",
    grade: "NG",
    stats: {
      pDef: 8,
      mDef: 18,
    },
  },
  devotion_boots: {
    id: "devotion_boots",
    name: "Devotion Boots",
    kind: "armor",
    icon: "/items/drops/arrom_ng/Devotion_bots.jpg",
    description: "Стартові ботинки для магів",
    slot: "boots",
    armorType: "robe",
    grade: "NG",
    stats: {
      pDef: 8,
      mDef: 18,
    },
  },
  devotion_helmet: {
    id: "devotion_helmet",
    name: "Devotion Helmet",
    kind: "armor",
    icon: "/items/drops/arrom_ng/Devotion_halmet.jpg",
    description: "Стартовий шолом для магів",
    slot: "head",
    armorType: "robe",
    grade: "NG",
    stats: {
      pDef: 12,
      mDef: 28,
    },
  },
  weapon_mace_ng: {
    id: "weapon_mace_ng",
    name: "Mace",
    kind: "weapon",
    icon: "/items/drops/arrom_ng/Weapon_mace_i00_0.jpg",
    description: "Стартова зброя для магів",
    slot: "weapon",
    grade: "NG",
    stats: {
      pAtk: 11,
      mAtk: 9,
      rCrit: 4,
      pAtkSpd: 379,
    },
  },
  
  // Native Set (для воїнів)
  native_tunic: {
    id: "native_tunic",
    name: "Native Tunic",
    kind: "armor",
    icon: "/items/drops/arrom_ng/Native Tunic.jpg",
    description: "Стартовий одяг для воїнів",
    slot: "armor",
    armorType: "light",
    grade: "NG",
    stats: {
      pDef: 38,
      mDef: 12,
    },
  },
  native_helmet: {
    id: "native_helmet",
    name: "Native Helmet",
    kind: "armor",
    icon: "/items/drops/arrom_ng/Native Helmet.jpg",
    description: "Стартовий шолом для воїнів",
    slot: "head",
    armorType: "light",
    grade: "NG",
    stats: {
      pDef: 28,
      mDef: 10,
    },
  },
  native_pants: {
    id: "native_pants",
    name: "Native Pants",
    kind: "armor",
    icon: "/items/drops/arrom_ng/Native Pants.jpg",
    description: "Стартові штани для воїнів",
    slot: "legs",
    armorType: "light",
    grade: "NG",
    stats: {
      pDef: 27,
      mDef: 10,
    },
  },
  native_gloves: {
    id: "native_gloves",
    name: "Native Gloves",
    kind: "armor",
    icon: "/items/drops/arrom_ng/Native Gloves.jpg",
    description: "Стартові рукавиці для воїнів",
    slot: "gloves",
    armorType: "light",
    grade: "NG",
    stats: {
      pDef: 15,
      mDef: 6,
    },
  },
  native_boots: {
    id: "native_boots",
    name: "Native Boots",
    kind: "armor",
    icon: "/items/drops/arrom_ng/Native_bots.jpg",
    description: "Стартові ботинки для воїнів",
    slot: "boots",
    armorType: "light",
    grade: "NG",
    stats: {
      pDef: 13,
      mDef: 5,
    },
  },
  weapon_iron_hammer_ng: {
    id: "weapon_iron_hammer_ng",
    name: "Iron Hammer",
    kind: "weapon",
    icon: "/items/drops/arrom_ng/Weapon_iron_hammer_i00_0.jpg",
    description: "Стартова зброя для воїнів",
    slot: "weapon",
    grade: "NG",
    stats: {
      pAtk: 13,
      mAtk: 7,
      rCrit: 4,
      pAtkSpd: 379,
    },
  },
  
  // Щит (для обох)
  shield_leather_ng: {
    id: "shield_leather_ng",
    name: "Leather Shield",
    kind: "armor",
    icon: "/items/drops/arrom_ng/Shield_leather_shield_i00_0.jpg",
    description: "Стартовий щит",
    slot: "shield",
    grade: "NG",
    stats: {
      sDef: 67,
      pDef: 47,
      shieldBlockRate: 20,
    },
  },
  
  // Заряди
  soulshot_ng: {
    id: "soulshot_ng",
    name: "Soulshot: No Grade",
    kind: "consumable",
    icon: "/items/drops/resources/etc_spirit_bullet_white_i00.png",
    description: "Соулшот для NG-grade зброї",
    slot: "consumable",
    grade: "NG",
  },
  spiritshot_ng: {
    id: "spiritshot_ng",
    name: "Spiritshot: No Grade",
    kind: "consumable",
    icon: "/items/drops/resources/Etc_spell_shot_white_i01_0.jpg",
    description: "Спірітшот для NG-grade зброї",
    slot: "consumable",
    grade: "NG",
  },
  
  // Банки
  lesser_healing_potion: {
    id: "lesser_healing_potion",
    name: "Lesser Healing Potion",
    kind: "consumable",
    icon: "/items/drops/resources/etc_lesser_potion_red_i00.png",
    description: "Мала банка HP (200 HP)",
    slot: "consumable",
    restoreHp: 200,
    grade: "NG",
  },
  lesser_mana_potion: {
    id: "lesser_mana_potion",
    name: "Lesser Mana Potion",
    kind: "consumable",
    icon: "/items/drops/resources/etc_reagent_blue_i00.png",
    description: "Мала банка MP (200 MP)",
    slot: "consumable",
    restoreMp: 200,
    grade: "NG",
  },
};

