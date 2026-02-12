// src/data/items/itemsDB.ts
// AUTO-GENERATED from XML files
// DO NOT EDIT MANUALLY - use tools/split_itemsdb.mjs

import type { ItemDefinition } from './itemsDB.types';
import { itemsDBChunk0 } from './itemsDB_chunk_0';
import { itemsDBChunk1 } from './itemsDB_chunk_1';
import { itemsDBChunk2 } from './itemsDB_chunk_2';
import { itemsDBChunk3 } from './itemsDB_chunk_3';
import { itemsDBChunk4 } from './itemsDB_chunk_4';
import { itemsDBNG } from './itemsDB_ng';
import { itemsDBD } from './itemsDB_d';
import { itemsDBC } from './itemsDB_c';
import { itemsDBB } from './itemsDB_b';
import { itemsDBA } from './itemsDB_a';
import { itemsDBS } from './itemsDB_s';
import { itemsDBQuestShop } from './itemsDB_quest_shop';
import { starterKitItems } from '../starterKitItems';

// Експортуємо тип для зручності використання
export type { ItemDefinition } from './itemsDB.types';

// Об'єднуємо всі частини
export const itemsDB: Record<string, ItemDefinition> = {
  ...itemsDBChunk0,
  ...itemsDBChunk1,
  ...itemsDBChunk2,
  ...itemsDBChunk3,
  ...itemsDBChunk4,
  ...itemsDBNG,
  ...itemsDBD,
  ...itemsDBC,
  ...itemsDBB,
  ...itemsDBA,
  ...itemsDBS,
  ...itemsDBQuestShop,
};

// Об'єднуємо itemsDB з starterKitItems для стартового набору
export const itemsDBWithStarter: Record<string, ItemDefinition> = {
  ...itemsDB,
  ...starterKitItems,
};

export const starterKitDefault = {
  adena: 200,

  // Для магів (Devotion set)
  itemsMage: [
    "tunic_of_devotion",
    "stockings_of_devotion",
    "devotion_gloves",
    "devotion_boots",
    "devotion_helmet",
    "weapon_mace_ng",
    "shield_leather_ng",
    "spiritshot_ng",
    "lesser_healing_potion",
    "lesser_mana_potion",
  ],
  
  // Для воїнів (Native set)
  itemsFighter: [
    "native_tunic",
    "native_helmet",
    "native_pants",
    "native_gloves",
    "native_boots",
    "weapon_iron_hammer_ng",
    "shield_leather_ng",
    "soulshot_ng",
    "lesser_healing_potion",
    "lesser_mana_potion",
  ],

  quantities: {
    soulshot_ng: 500,
    spiritshot_ng: 500,
    lesser_healing_potion: 20,
    lesser_mana_potion: 20,
  },
  
  // Для сумісності (буде використовуватись itemsMage або itemsFighter)
  items: [],
};
