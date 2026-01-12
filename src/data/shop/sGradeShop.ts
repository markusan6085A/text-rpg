// src/data/shop/sGradeShop.ts
// S Grade предмети для магазину

import type { ShopItem } from "./shopTypes";

export const S_GRADE_SHOP_ITEMS: ShopItem[] = [
  // ===== БРОНЯ - СЕТ MAJOR ARCANA (Magic Armor Set - Robe) =====
  {
    id: "shop_armor_s_major_arcana_circlet",
    itemId: 6386, // Major Arcana Circlet ID
    name: "Major Arcana Circlet",
    grade: "S",
    type: "armor",
    category: "helmet",
    price: 15000000,
    bodypart: "head",
    icon: "/items/drops/arrom_s/Major_Arcana_Circlet.jpg",
    stats: {
      pDef: 200,
      mDef: 160,
    },
    description: "Діадема великої аркани S-grade (Major Arcana Set).",
  },
  {
    id: "shop_armor_s_major_arcana_robe",
    itemId: 6383, // Major Arcana Robe ID
    name: "Major Arcana Robe",
    grade: "S",
    type: "armor",
    category: "chest",
    price: 25000000,
    bodypart: "chest",
    icon: "/items/drops/arrom_s/Major_Arcana_Robe.jpg",
    stats: {
      pDef: 280,
      mDef: 230,
    },
    description: "Мантія великої аркани S-grade (Major Arcana Set).",
  },
  {
    id: "shop_armor_s_major_arcana_gloves",
    itemId: 6384, // Major Arcana Gloves ID
    name: "Major Arcana Gloves",
    grade: "S",
    type: "armor",
    category: "gloves",
    price: 10000000,
    bodypart: "gloves",
    icon: "/items/drops/arrom_s/Major_Arcana_Gloves.jpg",
    stats: {
      pDef: 120,
      mDef: 100,
    },
    description: "Рукавиці великої аркани S-grade (Major Arcana Set).",
  },
  {
    id: "shop_armor_s_major_arcana_boots",
    itemId: 6385, // Major Arcana Boots ID
    name: "Major Arcana Boots",
    grade: "S",
    type: "armor",
    category: "boots",
    price: 9000000,
    bodypart: "feet",
    icon: "/items/drops/arrom_s/Major_Arcana_Boots.jpg",
    stats: {
      pDef: 110,
      mDef: 90,
    },
    description: "Черевики великої аркани S-grade (Major Arcana Set).",
  },

  // ===== БРОНЯ - СЕТ DRACONIC LEATHER (Light Armor Set) =====
  {
    id: "shop_armor_s_draconic_leather_helmet",
    itemId: 6382, // Draconic Leather Helmet ID
    name: "Draconic Leather Helmet",
    grade: "S",
    type: "armor",
    category: "helmet",
    price: 12000000,
    bodypart: "head",
    icon: "/items/drops/arrom_s/Draconic_Leather_Helmet.jpg",
    stats: {
      pDef: 190,
    },
    description: "Шолом драконічної шкіри S-grade (Draconic Set).",
  },
  {
    id: "shop_armor_s_draconic_leather_armor",
    itemId: 6379, // Draconic Leather Armor ID
    name: "Draconic Leather Armor",
    grade: "S",
    type: "armor",
    category: "chest",
    price: 20000000,
    bodypart: "chest",
    icon: "/items/drops/arrom_s/Draconic_Leather_Armo.jpg",
    stats: {
      pDef: 270,
    },
    description: "Броня драконічної шкіри S-grade (Draconic Set).",
  },
  {
    id: "shop_armor_s_draconic_leather_gloves",
    itemId: 6380, // Draconic Leather Gloves ID
    name: "Draconic Leather Gloves",
    grade: "S",
    type: "armor",
    category: "gloves",
    price: 8000000,
    bodypart: "gloves",
    icon: "/items/drops/arrom_s/Draconic_Leather_Gloves.jpg",
    stats: {
      pDef: 110,
    },
    description: "Рукавиці драконічної шкіри S-grade (Draconic Set).",
  },
  {
    id: "shop_armor_s_draconic_leather_boots",
    itemId: 6381, // Draconic Leather Boots ID
    name: "Draconic Leather Boots",
    grade: "S",
    type: "armor",
    category: "boots",
    price: 7000000,
    bodypart: "feet",
    icon: "/items/drops/arrom_s/Draconic_Leather_Boots.jpg",
    stats: {
      pDef: 100,
    },
    description: "Черевики драконічної шкіри S-grade (Draconic Set).",
  },

  // ===== БРОНЯ - СЕТ IMPERIAL CRUSADER (Heavy Armor Set) =====
  {
    id: "shop_armor_s_imperial_crusader_helmet",
    itemId: 6378, // Imperial Crusader Helmet ID
    name: "Imperial Crusader Helmet",
    grade: "S",
    type: "armor",
    category: "helmet",
    price: 14000000,
    bodypart: "head",
    icon: "/items/drops/arrom_s/Imperial_Crusader_Helmet.jpg",
    stats: {
      pDef: 220,
    },
    description: "Шолом імперського хрестоносця S-grade (Imperial Crusader Set).",
  },
  {
    id: "shop_armor_s_imperial_crusader_breastplate",
    itemId: 6373, // Imperial Crusader Breastplate ID
    name: "Imperial Crusader Breastplate",
    grade: "S",
    type: "armor",
    category: "chest",
    price: 28000000,
    bodypart: "chest",
    icon: "/items/drops/arrom_s/Imperial_Crusader_Breastplate.jpg",
    stats: {
      pDef: 320,
    },
    description: "Нагрудник імперського хрестоносця S-grade (Imperial Crusader Set).",
  },
  {
    id: "shop_armor_s_imperial_crusader_gaiters",
    itemId: 6374, // Imperial Crusader Gaiters ID
    name: "Imperial Crusader Gaiters",
    grade: "S",
    type: "armor",
    category: "legs",
    price: 18000000,
    bodypart: "legs",
    icon: "/items/drops/arrom_s/Bound_Imperial_Crusader.jpg",
    stats: {
      pDef: 200,
    },
    description: "Штани імперського хрестоносця S-grade (Imperial Crusader Set).",
  },
  {
    id: "shop_armor_s_imperial_crusader_gauntlets",
    itemId: 6375, // Imperial Crusader Gauntlets ID
    name: "Imperial Crusader Gauntlets",
    grade: "S",
    type: "armor",
    category: "gloves",
    price: 11000000,
    bodypart: "gloves",
    icon: "/items/drops/arrom_s/Imperial_Crusader_Gauntlets.jpg",
    stats: {
      pDef: 130,
    },
    description: "Рукавиці імперського хрестоносця S-grade (Imperial Crusader Set).",
  },
  {
    id: "shop_armor_s_imperial_crusader_boots",
    itemId: 6376, // Imperial Crusader Boots ID
    name: "Imperial Crusader Boots",
    grade: "S",
    type: "armor",
    category: "boots",
    price: 10000000,
    bodypart: "feet",
    icon: "/items/drops/arrom_s/Bound_Imperial_Boots.jpg",
    stats: {
      pDef: 120,
    },
    description: "Черевики імперського хрестоносця S-grade (Imperial Crusader Set).",
  },

  // ===== ЩИТИ =====
  {
    id: "shop_shield_s_imperial_crusader_shield",
    itemId: 6377, // Imperial Crusader Shield ID
    name: "Imperial Crusader Shield",
    grade: "S",
    type: "armor",
    category: "shield",
    price: 15000000,
    bodypart: "lhand",
    icon: "/items/drops/arrom_s/Imperial_Crusader_Shield.jpg",
    stats: {
      pDef: 400,
    },
    description: "Щит імперського хрестоносця S-grade.",
  },

  // ===== БІЖУТЕРІЯ - КІЛЬЦЯ (Rings) =====
  {
    id: "shop_jewelry_s_tateossian_ring",
    itemId: 889,
    name: "Tateossian Ring",
    grade: "S",
    type: "jewelry",
    category: "ring",
    price: 20000000,
    bodypart: "rfinger;lfinger",
    icon: "/items/drops/Earring_S/accessory_tateossian_ring_i00.png",
    stats: {
      mDef: 48,
    },
    description: "Кільце Татеосіана S-grade.",
  },

  // ===== БІЖУТЕРІЯ - СЕРЕЖКИ (Earrings) =====
  {
    id: "shop_jewelry_s_tateossian_earring",
    itemId: 858,
    name: "Tateossian Earring",
    grade: "S",
    type: "jewelry",
    category: "earring",
    price: 30000000,
    bodypart: "rear;lear",
    icon: "/items/drops/Earring_S/accessory_tateossian_earring_i00.png",
    stats: {
      mDef: 71,
    },
    description: "Сережка Татеосіана S-grade.",
  },

  // ===== БІЖУТЕРІЯ - НАМИСТА (Necklaces) =====
  {
    id: "shop_jewelry_s_tateossian_necklace",
    itemId: 920,
    name: "Tateossian Necklace",
    grade: "S",
    type: "jewelry",
    category: "necklace",
    price: 40000000,
    bodypart: "necklace",
    icon: "/items/drops/Earring_S/accessory_tateossian_necklace_i00.png",
    stats: {
      mDef: 95,
    },
    description: "Намисто Татеосіана S-grade.",
  },
  
  // ===== SHOTS (СОСКИ) =====
  // Для воїнів
  {
    id: "shop_soulshot_s",
    itemId: 2015, // Унікальний ID для S-grade soulshot
    name: "Soulshot (S-grade)",
    grade: "S",
    type: "consumable",
    category: "soulshot",
    price: 150, // Ціна за 1 соулшот
    icon: "/items/drops/resources/Etc_spirit_bullet_gold_i00_0.jpg",
    description: "Соулшот S-грейду для воїнів",
    soulshots: 1,
  },
  // Для магів
  {
    id: "shop_spiritshot_s",
    itemId: 2016, // Унікальний ID для S-grade spiritshot
    name: "Spiritshot (S-grade)",
    grade: "S",
    type: "consumable",
    category: "spiritshot",
    price: 150, // Ціна за 1 спірітшот
    icon: "/items/drops/resources/Etc_spell_shot_gold_i01_0.jpg",
    description: "Спірітшот S-грейду для магів",
    spiritshots: 1,
  },
  
  // ===== ARROWS (СТРІЛИ) =====
  {
    id: "shop_shining_arrow",
    itemId: 2017, // Унікальний ID для S-grade стріли
    name: "Shining Arrow",
    grade: "S",
    type: "consumable",
    category: "dagger",
    price: 120, // Ціна за 1 стрілу
    icon: "/items/drops/resources/etc_shining_quiver_i00.png",
    description: "Сяюча стріла S-грейду",
  },
  
  // ===== ЗБРОЯ S-GRADE =====
  {
    id: "shop_weapon_s_angel_slayer",
    itemId: 20167, // Angel Slayer ID (з XML)
    name: "Angel Slayer",
    grade: "S",
    type: "weapon",
    category: "staff",
    price: 38000000,
    bodypart: "rhand",
    weaponType: "DAGGER",
    icon: "/items/drops/weapon_s/Angel_Slayer.jpg",
    stats: { pAtk: 246, mAtk: 132, rCrit: 12, pAtkSpd: 433 },
    description: "Вбивця янголів S-grade.",
    soulshots: 1,
    spiritshots: 1,
  },
  {
    id: "shop_weapon_s_apprentices_spellbook",
    itemId: 2500, // TODO: Знайти правильний ID
    name: "Apprentice's Spellbook",
    grade: "S",
    type: "weapon",
    category: "blunt",
    price: 35000000,
    bodypart: "rhand",
    weaponType: "ETC",
    icon: "/items/drops/weapon_s/apprentices_spellbook.jpg",
    stats: { pAtk: 250, mAtk: 220, rCrit: 8, pAtkSpd: 379 },
    description: "Книга заклинань учня S-grade.",
    soulshots: 1,
    spiritshots: 1,
  },
  {
    id: "shop_weapon_s_arcana_mace",
    itemId: 20170, // Arcana Mace ID (з XML)
    name: "Arcana Mace",
    grade: "S",
    type: "weapon",
    category: "dualsword",
    price: 35000000,
    bodypart: "rhand",
    weaponType: "BLUNT",
    icon: "/items/drops/weapon_s/Arcana_Mace.jpg",
    stats: { pAtk: 225, mAtk: 175, rCrit: 4, pAtkSpd: 379 },
    description: "Булава аркани S-grade.",
    soulshots: 1,
    spiritshots: 1,
  },
  {
    id: "shop_weapon_s_baguette_s_dualsword",
    itemId: 2500, // TODO: Знайти правильний ID
    name: "Baguette's Dualsword",
    grade: "S",
    type: "weapon",
    category: "blunt",
    price: 40000000,
    bodypart: "lrhand",
    weaponType: "DUALSWORD",
    icon: "/items/drops/weapon_s/Baguette_s_Dualsword.jpg",
    stats: { pAtk: 350, mAtk: 135, rCrit: 8, pAtkSpd: 325 },
    description: "Дворучний меч Багет S-grade.",
    soulshots: 1,
    spiritshots: 1,
  },
  {
    id: "shop_weapon_s_basalt_battlehammer",
    itemId: 20168, // Basalt Battlehammer ID (з XML)
    name: "Basalt Battlehammer",
    grade: "S",
    type: "weapon",
    category: "dualfist",
    price: 35000000,
    bodypart: "rhand",
    weaponType: "BLUNT",
    icon: "/items/drops/weapon_s/Basalt_Battlehammer.jpg",
    stats: { pAtk: 281, mAtk: 132, rCrit: 4, pAtkSpd: 379 },
    description: "Базальтовий бойовий молот S-grade.",
    soulshots: 1,
    spiritshots: 1,
  },
  {
    id: "shop_weapon_s_demon_splinter",
    itemId: 20172, // Demon Splinter ID (з XML)
    name: "Demon Splinter",
    grade: "S",
    type: "weapon",
    category: "bow",
    price: 40000000,
    bodypart: "lrhand",
    weaponType: "DUALFIST",
    icon: "/items/drops/weapon_s/Demon_Splinter.jpg",
    stats: { pAtk: 342, mAtk: 132, rCrit: 4, pAtkSpd: 325 },
    description: "Уламок демона S-grade.",
    soulshots: 1,
    spiritshots: 1,
  },
  {
    id: "shop_weapon_s_draconic_bow",
    itemId: 20173, // Draconic Bow ID (з XML)
    name: "Draconic Bow",
    grade: "S",
    type: "weapon",
    category: "bigblunt",
    price: 40000000,
    bodypart: "lrhand",
    weaponType: "BOW",
    icon: "/items/drops/weapon_s/Draconic_Bow.jpg",
    stats: { pAtk: 581, mAtk: 132, rCrit: 12, pAtkSpd: 293 },
    description: "Драконічний лук S-grade.",
    soulshots: 1,
    spiritshots: 1,
  },
  {
    id: "shop_weapon_s_dragon_hunter_axe",
    itemId: 20169, // Dragon Hunter Axe ID (з XML)
    name: "Dragon Hunter Axe",
    grade: "S",
    type: "weapon",
    category: "sword",
    price: 40000000,
    bodypart: "lrhand",
    weaponType: "BIGBLUNT",
    icon: "/items/drops/weapon_s/Dragon_Hunter_Axe.jpg",
    stats: { pAtk: 342, mAtk: 132, rCrit: 4, pAtkSpd: 325 },
    description: "Сокира мисливця на драконів S-grade.",
    soulshots: 1,
    spiritshots: 1,
  },
  {
    id: "shop_weapon_s_god_s_blade",
    itemId: 82, // God's Blade ID (з XML)
    name: "God's Blade",
    grade: "S",
    type: "weapon",
    category: "bigsword",
    price: 38000000,
    bodypart: "rhand",
    weaponType: "SWORD",
    icon: "/items/drops/weapon_s/God_s_Blade.jpg",
    stats: { pAtk: 257, mAtk: 124, rCrit: 8, pAtkSpd: 379 },
    description: "Клинок бога S-grade.",
    soulshots: 1,
    spiritshots: 1,
  },
  {
    id: "shop_weapon_s_heaven_s_divider",
    itemId: 20166, // Heaven's Divider ID (з XML)
    name: "Heaven's Divider",
    grade: "S",
    type: "weapon",
    category: "bigblunt",
    price: 40000000,
    bodypart: "lrhand",
    weaponType: "BIGSWORD",
    icon: "/items/drops/weapon_s/Heaven_s_Divider.jpg",
    stats: { pAtk: 342, mAtk: 132, rCrit: 8, pAtkSpd: 325 },
    description: "Роздільник небес S-grade.",
    soulshots: 1,
    spiritshots: 1,
  },
  {
    id: "shop_weapon_s_imperial_staff",
    itemId: 20171, // Imperial Staff ID (з XML)
    name: "Imperial Staff",
    grade: "S",
    type: "weapon",
    category: "pole",
    price: 40000000,
    bodypart: "lrhand",
    weaponType: "BIGBLUNT",
    icon: "/items/drops/weapon_s/Imperial_Staff.jpg",
    stats: { pAtk: 274, mAtk: 175, rCrit: 4, pAtkSpd: 325 },
    description: "Імператорський посох S-grade.",
    soulshots: 1,
    spiritshots: 1,
  },
  {
    id: "shop_weapon_s_saint_spear",
    itemId: 20174, // Saint Spear ID (з XML)
    name: "Saint Spear",
    grade: "S",
    type: "weapon",
    category: "bow",
    price: 40000000,
    bodypart: "lrhand",
    weaponType: "POLE",
    icon: "/items/drops/weapon_s/Saint_Spear.jpg",
    stats: { pAtk: 281, mAtk: 132, rCrit: 8, pAtkSpd: 325 },
    description: "Святий спіс S-grade.",
    soulshots: 1,
    spiritshots: 1,
  },
  {
    id: "shop_weapon_s_shining_bow",
    itemId: 2500, // TODO: Знайти правильний ID
    name: "Shining Bow",
    grade: "S",
    type: "weapon",
    category: "sword",
    price: 40000000,
    bodypart: "lrhand",
    weaponType: "BOW",
    icon: "/items/drops/weapon_s/Shining_Bow.jpg",
    stats: { pAtk: 580, mAtk: 135, rCrit: 12, pAtkSpd: 293 },
    description: "Сяючий лук S-grade.",
    soulshots: 1,
    spiritshots: 1,
  },
];
