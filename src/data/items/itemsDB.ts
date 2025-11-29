// src/data/items/itemsDB.ts

export interface ItemDefinition {
  id: string;
  name: string;
  kind: string; // "weapon", "armor", "helmet", "boots", "gloves", "consumable", etc
  icon: string;
  description: string;
  stats?: any;
  slot: string; // ✅ ДОДАНО, НІЧОГО НЕ ВИДАЛЕНО
}

export const itemsDB: Record<string, ItemDefinition> = {
  // ------------------------
  // NG ARMOR SET (LEATHER)
  // ------------------------
  ng_helmet_leather: {
    id: "ng_helmet_leather",
    name: "Кожаный Шлем (NG)",
    kind: "helmet", // було "armor"
    slot: "head", // ✅ ДОДАНО
    icon: "/items/ng_helmet_leather.png",
    description: "Легкий шлем новичка.",
    stats: { pDef: 3 },
  },

  ng_armor_leather: {
    id: "ng_armor_leather",
    name: "Кожаная Броня (NG)",
    kind: "armor", // грудь
    slot: "armor", // ✅ ДОДАНО
    icon: "/items/ng_armor_leather.png",
    description: "Простая кожаная броня для начинающих.",
    stats: { pDef: 8 },
  },

  ng_gaiters_leather: {
    id: "ng_gaiters_leather",
    name: "Кожаные Штаны (NG)",
    kind: "armor", // тип залишаємо armor, слот визначимо по id
    slot: "legs", // ✅ ДОДАНО
    icon: "/items/ng_gaiters_leather.png",
    description: "Прочные кожаные штаны.",
    stats: { pDef: 5 },
  },

  ng_gloves_leather: {
    id: "ng_gloves_leather",
    name: "Кожаные Перчатки (NG)",
    kind: "gloves",
    slot: "gloves", // ✅ ДОДАНО
    icon: "/items/ng_gloves_leather.png",
    description: "Простые кожаные перчатки.",
    stats: { pDef: 2 },
  },

  ng_boots_leather: {
    id: "ng_boots_leather",
    name: "Кожаные Ботинки (NG)",
    kind: "boots",
    slot: "boots", // ✅ ДОДАНО
    icon: "/items/ng_boots_leather.png",
    description: "Легкие ботинки новичка.",
    stats: { pDef: 2 },
  },

  // ------------------------
  // NG WEAPONS
  // ------------------------
  ng_sword_training: {
    id: "ng_sword_training",
    name: "Тренировочный Меч (NG)",
    kind: "weapon",
    slot: "weapon", // ✅ ДОДАНО
    icon: "/items/ng_sword_training.png",
    description: "Простой меч новичка.",
    stats: { pAtk: 7, mAtk: 0 },
  },

  ng_staff_beginner: {
    id: "ng_staff_beginner",
    name: "Посох Новичка (NG)",
    kind: "weapon",
    slot: "weapon", // ✅ ДОДАНО
    icon: "/items/ng_staff_beginner.png",
    description: "Лёгкий магический обучающий посох.",
    stats: { pAtk: 3, mAtk: 9 },
  },

  // ------------------------
  // POTIONS / CONSUMABLES
  // ------------------------
  potion_hp_small: {
    id: "potion_hp_small",
    name: "Зелье HP (м.)",
    kind: "consumable", // було "potion"
    slot: "consumable", // ✅ ДОДАНО
    icon: "/items/potion_hp_small.png",
    description: "Малое восстановление HP.",
  },

  potion_mp_small: {
    id: "potion_mp_small",
    name: "Зелье MP (м.)",
    kind: "consumable",
    slot: "consumable", // ✅ ДОДАНО
    icon: "/items/potion_mp_small.png",
    description: "Малое восстановление MP.",
  },

  soulshot_ng: {
    id: "soulshot_ng",
    name: "Soulshot NG",
    kind: "consumable",
    slot: "consumable", // ✅ ДОДАНО
    icon: "/items/soulshot_ng.png",
    description: "Увеличивает физическую атаку.",
  },

  spiritshot_ng: {
    id: "spiritshot_ng",
    name: "Spiritshot NG",
    kind: "consumable",
    slot: "consumable", // ✅ ДОДАНО
    icon: "/items/spiritshot_ng.png",
    description: "Усиливает магическую атаку.",
  },
};

// ---------------------------------------------
// 🎒 СТАРТОВЫЙ НАБОР
// ---------------------------------------------
export const starterKitDefault = {
  adena: 200,

  items: [
    "ng_helmet_leather",
    "ng_armor_leather",
    "ng_gaiters_leather",
    "ng_gloves_leather",
    "ng_boots_leather",

    "ng_sword_training",
    "ng_staff_beginner",

    "potion_hp_small",
    "potion_mp_small",

    "soulshot_ng",
    "spiritshot_ng",
  ],

  quantities: {
    potion_hp_small: 20,
    potion_mp_small: 20,
    soulshot_ng: 200,
    spiritshot_ng: 200,
  },
};
