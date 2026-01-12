// src/data/shop/questShop.ts
// Квест-шоп

import type { ShopItem } from "./shopTypes";

// ===== КВЕСТ-ШОП ЗБРОЯ (з папки kv_shop) =====
// Усі D-grade зброї мають: +20 урону, +50 швидкості бою (загальна, для всіх)
export const QUEST_SHOP_WEAPONS: ShopItem[] = [
  {
    id: "quest_weapon_apprentices_spellbook",
    itemId: 99, // XML ID
    name: "Apprentice's Spellbook",
    grade: "D",
    type: "weapon",
    category: "staff",
    price: 50, // Ціна в Серебряных Монетах
    bodypart: "rhand",
    weaponType: "ETC",
    icon: "/items/drops/weapon_d/kv_shop/apprentices_spellbook.jpg",
    stats: {
      pAtk: 29, // 9 + 20
      mAtk: 32, // 12 + 20
      rCrit: 8,
      pAtkSpd: 429, // 379 + 50 швидкості бою
    },
    description: "Книга заклинань учня D-grade. Покращена версія з більшою швидкістю бою.",
    soulshots: 1,
    spiritshots: 1,
  },
  {
    id: "quest_weapon_baguette_dual_sword",
    itemId: 261, // Bich'Hwa ID
    name: "Baguette's Dualsword",
    grade: "D",
    type: "weapon",
    category: "dualfist",
    price: 50,
    bodypart: "lrhand",
    weaponType: "DUALFIST",
    icon: "/items/drops/weapon_d/kv_shop/Baguette_s_Dualsword.jpg",
    stats: {
      pAtk: 116, // 96 + 20
      mAtk: 67, // 47 + 20
      rCrit: 4,
      pAtkSpd: 375, // 325 + 50
    },
    description: "Подвійний меч Багет D-grade. Покращена версія з більшим уроном та швидкістю атаки.",
    soulshots: 3,
    spiritshots: 3,
  },
  {
    id: "quest_weapon_bonebreaker",
    itemId: 159, // XML ID
    name: "Bonebreaker",
    grade: "D",
    type: "weapon",
    category: "blunt",
    price: 50,
    bodypart: "rhand",
    weaponType: "BLUNT",
    icon: "/items/drops/weapon_d/kv_shop/Bonebreaker.jpg",
    stats: {
      pAtk: 112, // 92 + 20
      mAtk: 74, // 54 + 20
      rCrit: 4,
      pAtkSpd: 429, // 379 + 50
    },
    description: "Ламач кісток D-grade. Покращена версія з більшим уроном та швидкістю атаки.",
    soulshots: 3,
    spiritshots: 3,
  },
  {
    id: "quest_weapon_claymore",
    itemId: 70, // XML ID
    name: "Claymore",
    grade: "D",
    type: "weapon",
    category: "bigsword",
    price: 50,
    bodypart: "lrhand",
    weaponType: "BIGSWORD",
    icon: "/items/drops/weapon_d/kv_shop/Claymore.jpg",
    stats: {
      pAtk: 132, // 112 + 20
      mAtk: 74, // 54 + 20
      rCrit: 8,
      pAtkSpd: 375, // 325 + 50
    },
    description: "Клеймор D-grade. Покращена версія з більшим уроном та швидкістю атаки.",
    soulshots: 3,
    spiritshots: 3,
  },
  {
    id: "quest_weapon_elven_long_sword",
    itemId: 2499, // XML ID
    name: "Elven Long Sword",
    grade: "D",
    type: "weapon",
    category: "sword",
    price: 50,
    bodypart: "rhand",
    weaponType: "SWORD",
    icon: "/items/drops/weapon_d/kv_shop/Elven_Long_Sword.jpg",
    stats: {
      pAtk: 112, // 92 + 20
      mAtk: 74, // 54 + 20
      rCrit: 8,
      pAtkSpd: 429, // 379 + 50
    },
    description: "Ельфійський довгий меч D-grade. Покращена версія з більшим уроном та швидкістю атаки.",
    soulshots: 3,
    spiritshots: 3,
  },
  {
    id: "quest_weapon_glaive",
    itemId: 297, // XML ID
    name: "Glaive",
    grade: "D",
    type: "weapon",
    category: "pole",
    price: 50,
    bodypart: "lrhand",
    weaponType: "POLE",
    icon: "/items/drops/weapon_d/kv_shop/Glaive.jpg",
    stats: {
      pAtk: 112, // 92 + 20
      mAtk: 74, // 54 + 20
      rCrit: 8,
      pAtkSpd: 375, // 325 + 50
    },
    description: "Глефа D-grade. Покращена версія з більшим уроном та швидкістю атаки.",
    soulshots: 3,
    spiritshots: 3,
  },
  {
    id: "quest_weapon_light_crossbow",
    itemId: 280, // XML ID
    name: "Light Crossbow",
    grade: "D",
    type: "weapon",
    category: "bow",
    price: 50,
    bodypart: "lrhand",
    weaponType: "BOW",
    icon: "/items/drops/weapon_d/kv_shop/Light_Crossbow.jpg",
    stats: {
      pAtk: 211, // 191 + 20
      mAtk: 74, // 54 + 20
      rCrit: 12,
      pAtkSpd: 343, // 293 + 50
    },
    description: "Легкий арбалет D-grade. Покращена версія з більшим уроном та швидкістю атаки.",
    soulshots: 10,
    spiritshots: 3,
  },
  {
    id: "quest_weapon_mithril_dagger",
    itemId: 225, // XML ID
    name: "Mithril Dagger",
    grade: "D",
    type: "weapon",
    category: "dagger",
    price: 50,
    bodypart: "rhand",
    weaponType: "DAGGER",
    icon: "/items/drops/weapon_d/kv_shop/Mithril_Dagger.jpg",
    stats: {
      pAtk: 100, // 80 + 20
      mAtk: 74, // 54 + 20
      rCrit: 12,
      pAtkSpd: 483, // 433 + 50
    },
    description: "Мітриловий кинджал D-grade. Покращена версія з більшим уроном та швидкістю атаки.",
    soulshots: 3,
    spiritshots: 3,
  },
  {
    id: "quest_weapon_scallop_jamadhr",
    itemId: 262, // XML ID
    name: "Scallop Jamadhr",
    grade: "D",
    type: "weapon",
    category: "dualfist",
    price: 50,
    bodypart: "lrhand",
    weaponType: "DUALFIST",
    icon: "/items/drops/weapon_d/kv_shop/Scallop_Jamadhr.jpg",
    stats: {
      pAtk: 132, // 112 + 20
      mAtk: 74, // 54 + 20
      rCrit: 4,
      pAtkSpd: 375, // 325 + 50
    },
    description: "Гребінчастий джамадхр D-grade. Покращена версія з більшим уроном та швидкістю атаки.",
    soulshots: 3,
    spiritshots: 3,
  },
  {
    id: "quest_weapon_titan_hammer",
    itemId: 187, // Використовуємо Atuba Hammer як основу
    name: "Titan Hammer",
    grade: "D",
    type: "weapon",
    category: "bigblunt",
    price: 50,
    bodypart: "lrhand",
    weaponType: "BIGBLUNT",
    icon: "/items/drops/weapon_d/kv_shop/Titan_Hammer.jpg",
    stats: {
      pAtk: 110, // 90 + 20
      mAtk: 92, // 72 + 20
      rCrit: 4,
      pAtkSpd: 375, // 325 + 50 швидкості бою
    },
    description: "Молот титана D-grade. Покращена версія з більшим уроном та швидкістю бою.",
    soulshots: 3,
    spiritshots: 3,
  },
  
  // ===== C-GRADE WEAPONS (з звичайного магазину) =====
  // Усі C-grade зброї мають: +30 урону, +60 швидкості бою (загальна, для всіх)
  {
    id: "quest_weapon_c_akat_long_bow",
    itemId: 283,
    name: "Akat Long Bow",
    grade: "C",
    type: "weapon",
    category: "bow",
    price: 50,
    bodypart: "lrhand",
    weaponType: "BOW",
    icon: "/items/drops/weapon_c/Akat_Long_Bow.jpg",
    stats: {
      pAtk: 346, // 316 + 30
      mAtk: 114, // 84 + 30
      rCrit: 12,
      pAtkSpd: 287, // 227 + 60
    },
    description: "Довгий лук Акат C-grade. Покращена версія з більшим уроном та швидкістю бою.",
    soulshots: 9,
    spiritshots: 3,
  },
  {
    id: "quest_weapon_c_apprentices_spellbook",
    itemId: 99,
    name: "Apprentice's Spellbook",
    grade: "C",
    type: "weapon",
    category: "spellbook",
    price: 50,
    bodypart: "rhand",
    weaponType: "ETC",
    icon: "/items/drops/weapon_c/apprentices_spellbook.jpg",
    stats: {
      pAtk: 141, // 111 + 30
      mAtk: 131, // 101 + 30
      rCrit: 8,
      pAtkSpd: 439, // 379 + 60
    },
    description: "Заклинання учня C-grade. Покращена версія з більшим уроном та швидкістю бою.",
    soulshots: 1,
    spiritshots: 1,
  },
  {
    id: "quest_weapon_c_battle_axe",
    itemId: 160,
    name: "Battle Axe",
    grade: "C",
    type: "weapon",
    category: "blunt",
    price: 50,
    bodypart: "rhand",
    weaponType: "BLUNT",
    icon: "/items/drops/weapon_c/Battle_Axe.jpg",
    stats: {
      pAtk: 137, // 107 + 30
      mAtk: 91, // 61 + 30
      rCrit: 4,
      pAtkSpd: 439, // 379 + 60
    },
    description: "Бойова сокира C-grade. Покращена версія з більшим уроном та швидкістю бою.",
    soulshots: 2,
    spiritshots: 2,
  },
  {
    id: "quest_weapon_c_berserker_blade",
    itemId: 5286,
    name: "Berserker Blade",
    grade: "C",
    type: "weapon",
    category: "bigsword",
    price: 50,
    bodypart: "lrhand",
    weaponType: "BIGSWORD",
    icon: "/items/drops/weapon_c/Berserker_Blade.jpg",
    stats: {
      pAtk: 220, // 190 + 30
      mAtk: 113, // 83 + 30
      rCrit: 8,
      pAtkSpd: 385, // 325 + 60
    },
    description: "Клинок берсерка C-grade. Покращена версія з більшим уроном та швидкістю бою.",
    soulshots: 3,
    spiritshots: 3,
  },
  {
    id: "quest_weapon_c_big_hammer",
    itemId: 89,
    name: "Big Hammer",
    grade: "C",
    type: "weapon",
    category: "blunt",
    price: 50,
    bodypart: "rhand",
    weaponType: "BLUNT",
    icon: "/items/drops/weapon_c/Big_Hammer.jpg",
    stats: {
      pAtk: 137, // 107 + 30
      mAtk: 91, // 61 + 30
      rCrit: 4,
      pAtkSpd: 439, // 379 + 60
    },
    description: "Великий молот C-grade. Покращена версія з більшим уроном та швидкістю бою.",
    soulshots: 2,
    spiritshots: 2,
  },
  {
    id: "quest_weapon_c_crystal_dagger",
    itemId: 228,
    name: "Crystal Dagger",
    grade: "C",
    type: "weapon",
    category: "dagger",
    price: 50,
    bodypart: "rhand",
    weaponType: "DAGGER",
    icon: "/items/drops/weapon_c/Crystal_Dagger.jpg",
    stats: {
      pAtk: 166, // 136 + 30
      mAtk: 113, // 83 + 30
      rCrit: 12,
      pAtkSpd: 493, // 433 + 60
    },
    description: "Кришталевий кинджал C-grade. Покращена версія з більшим уроном та швидкістю бою.",
    soulshots: 3,
    spiritshots: 3,
  },
  {
    id: "quest_weapon_c_dark_screamer",
    itemId: 233,
    name: "Dark Screamer",
    grade: "C",
    type: "weapon",
    category: "dagger",
    price: 50,
    bodypart: "rhand",
    weaponType: "DAGGER",
    icon: "/items/drops/weapon_c/Dark_Screamer.jpg",
    stats: {
      pAtk: 152, // 122 + 30
      mAtk: 106, // 76 + 30
      rCrit: 12,
      pAtkSpd: 493, // 433 + 60
    },
    description: "Темний викрик C-grade. Покращена версія з більшим уроном та швидкістю бою.",
    soulshots: 3,
    spiritshots: 3,
  },
  {
    id: "quest_weapon_c_demon_staff",
    itemId: 206,
    name: "Demon's Staff",
    grade: "C",
    type: "weapon",
    category: "bigblunt",
    price: 50,
    bodypart: "lrhand",
    weaponType: "BIGBLUNT",
    icon: "/items/drops/weapon_c/Demon_s_Staff.jpg",
    stats: {
      pAtk: 182, // 152 + 30
      mAtk: 141, // 111 + 30
      rCrit: 4,
      pAtkSpd: 385, // 325 + 60
    },
    description: "Посох демона C-grade. Покращена версія з більшим уроном та швидкістю бою.",
    soulshots: 3,
    spiritshots: 3,
  },
  {
    id: "quest_weapon_c_dwarven_hammer",
    itemId: 7897,
    name: "Dwarven Hammer",
    grade: "C",
    type: "weapon",
    category: "bigblunt",
    price: 50,
    bodypart: "lrhand",
    weaponType: "BIGBLUNT",
    icon: "/items/drops/weapon_c/Dwarven_Hammer.jpg",
    stats: {
      pAtk: 220, // 190 + 30
      mAtk: 113, // 83 + 30
      rCrit: 4,
      pAtkSpd: 385, // 325 + 60
    },
    description: "Дворфський молот C-grade. Покращена версія з більшим уроном та швидкістю бою.",
    soulshots: 3,
    spiritshots: 3,
  },
  {
    id: "quest_weapon_c_ecliptic_sword",
    itemId: 7888,
    name: "Ecliptic Sword",
    grade: "C",
    type: "weapon",
    category: "sword",
    price: 50,
    bodypart: "rhand",
    weaponType: "SWORD",
    icon: "/items/drops/weapon_c/Ecliptic_Sword.jpg",
    stats: {
      pAtk: 155, // 125 + 30
      mAtk: 141, // 111 + 30
      rCrit: 8,
      pAtkSpd: 439, // 379 + 60
    },
    description: "Екліптичний меч C-grade. Покращена версія з більшим уроном та швидкістю бою.",
    soulshots: 3,
    spiritshots: 3,
  },
  {
    id: "quest_weapon_c_eminence_bow",
    itemId: 286,
    name: "Eminence Bow",
    grade: "C",
    type: "weapon",
    category: "bow",
    price: 50,
    bodypart: "lrhand",
    weaponType: "BOW",
    icon: "/items/drops/weapon_c/Eminence_Bow.jpg",
    stats: {
      pAtk: 353, // 323 + 30
      mAtk: 113, // 83 + 30
      rCrit: 12,
      pAtkSpd: 353, // 293 + 60
    },
    description: "Лук Еміненс C-grade. Покращена версія з більшим уроном та швидкістю бою.",
    soulshots: 10,
    spiritshots: 3,
  },
  {
    id: "quest_weapon_c_fisted_blade",
    itemId: 265,
    name: "Fisted Blade",
    grade: "C",
    type: "weapon",
    category: "dualfist",
    price: 50,
    bodypart: "lrhand",
    weaponType: "DUALFIST",
    icon: "/items/drops/weapon_c/Fisted_Blade.jpg",
    stats: {
      pAtk: 199, // 169 + 30
      mAtk: 106, // 76 + 30
      rCrit: 4,
      pAtkSpd: 385, // 325 + 60
    },
    description: "Клинок-рукавиця C-grade. Покращена версія з більшим уроном та швидкістю бою.",
    soulshots: 3,
    spiritshots: 3,
  },
  {
    id: "quest_weapon_c_great_pata",
    itemId: 266,
    name: "Great Pata",
    grade: "C",
    type: "weapon",
    category: "dualfist",
    price: 50,
    bodypart: "lrhand",
    weaponType: "DUALFIST",
    icon: "/items/drops/weapon_c/Great_Pata.jpg",
    stats: {
      pAtk: 220, // 190 + 30
      mAtk: 113, // 83 + 30
      rCrit: 4,
      pAtkSpd: 385, // 325 + 60
    },
    description: "Велика пата C-grade. Покращена версія з більшим уроном та швидкістю бою.",
    soulshots: 3,
    spiritshots: 3,
  },
  {
    id: "quest_weapon_c_heathens_book",
    itemId: 326,
    name: "Heathen's Book",
    grade: "C",
    type: "weapon",
    category: "spellbook",
    price: 50,
    bodypart: "rhand",
    weaponType: "ETC",
    icon: "/items/drops/weapon_c/heathens_book.jpg",
    stats: {
      pAtk: 141, // 111 + 30
      mAtk: 131, // 101 + 30
      rCrit: 8,
      pAtkSpd: 439, // 379 + 60
    },
    description: "Книга язичника C-grade. Покращена версія з більшим уроном та швидкістю бою.",
    soulshots: 3,
    spiritshots: 3,
  },
  {
    id: "quest_weapon_c_heavy_doom_axe",
    itemId: 194,
    name: "Heavy Doom Axe",
    grade: "C",
    type: "weapon",
    category: "bigblunt",
    price: 50,
    bodypart: "lrhand",
    weaponType: "BIGBLUNT",
    icon: "/items/drops/weapon_c/Heavy_Doom_Axe.jpg",
    stats: {
      pAtk: 133, // 103 + 30
      mAtk: 111, // 81 + 30
      rCrit: 4,
      pAtkSpd: 385, // 325 + 60
    },
    description: "Важка сокира загибелі C-grade. Покращена версія з більшим уроном та швидкістю бою.",
    soulshots: 2,
    spiritshots: 2,
  },
  {
    id: "quest_weapon_c_heavy_doom_hammer",
    itemId: 191,
    name: "Heavy Doom Hammer",
    grade: "C",
    type: "weapon",
    category: "bigblunt",
    price: 50,
    bodypart: "lrhand",
    weaponType: "BIGBLUNT",
    icon: "/items/drops/weapon_c/Heavy_Doom_Hammer.jpg",
    stats: {
      pAtk: 133, // 103 + 30
      mAtk: 111, // 81 + 30
      rCrit: 4,
      pAtkSpd: 385, // 325 + 60
    },
    description: "Важкий молот загибелі C-grade. Покращена версія з більшим уроном та швидкістю бою.",
    soulshots: 2,
    spiritshots: 2,
  },
  {
    id: "quest_weapon_c_homunkulus_sword",
    itemId: 84,
    name: "Homunkulus's Sword",
    grade: "C",
    type: "weapon",
    category: "sword",
    price: 50,
    bodypart: "rhand",
    weaponType: "SWORD",
    icon: "/items/drops/weapon_c/Homunkulus_s_Sword.jpg",
    stats: {
      pAtk: 141, // 111 + 30
      mAtk: 131, // 101 + 30
      rCrit: 8,
      pAtkSpd: 439, // 379 + 60
    },
    description: "Меч гомункула C-grade. Покращена версія з більшим уроном та швидкістю бою.",
    soulshots: 3,
    spiritshots: 3,
  },
  {
    id: "quest_weapon_c_knuckle_duster",
    itemId: 4233,
    name: "Knuckle Duster",
    grade: "C",
    type: "weapon",
    category: "dualfist",
    price: 50,
    bodypart: "lrhand",
    weaponType: "DUALFIST",
    icon: "/items/drops/weapon_c/Knuckle_Duster.jpg",
    stats: {
      pAtk: 178, // 148 + 30
      mAtk: 98, // 68 + 30
      rCrit: 4,
      pAtkSpd: 385, // 325 + 60
    },
    description: "Кастет C-grade. Покращена версія з більшим уроном та швидкістю бою.",
    soulshots: 2,
    spiritshots: 2,
  },
  {
    id: "quest_weapon_c_orcish_poleaxe",
    itemId: 299,
    name: "Orcish Poleaxe",
    grade: "C",
    type: "weapon",
    category: "pole",
    price: 50,
    bodypart: "lrhand",
    weaponType: "POLE",
    icon: "/items/drops/weapon_c/Orcish_Poleaxe.jpg",
    stats: {
      pAtk: 186, // 156 + 30
      mAtk: 113, // 83 + 30
      rCrit: 8,
      pAtkSpd: 385, // 325 + 60
    },
    description: "Оркська алебарда C-grade. Покращена версія з більшим уроном та швидкістю бою.",
    soulshots: 3,
    spiritshots: 3,
  },
  {
    id: "quest_weapon_c_paagrian_sword",
    itemId: 7882,
    name: "Pa'agrian Sword",
    grade: "C",
    type: "weapon",
    category: "bigsword",
    price: 50,
    bodypart: "lrhand",
    weaponType: "BIGSWORD",
    icon: "/items/drops/weapon_c/Pa_agrian_Sword.jpg",
    stats: {
      pAtk: 199, // 169 + 30
      mAtk: 106, // 76 + 30
      rCrit: 8,
      pAtkSpd: 385, // 325 + 60
    },
    description: "Меч Паагріан C-grade. Покращена версія з більшим уроном та швидкістю бою.",
    soulshots: 3,
    spiritshots: 3,
  },
  {
    id: "quest_weapon_c_paagrian_hammer",
    itemId: 199,
    name: "Pa'agrian Hammer",
    grade: "C",
    type: "weapon",
    category: "bigblunt",
    price: 50,
    bodypart: "lrhand",
    weaponType: "BIGBLUNT",
    icon: "/items/drops/weapon_c/Heavy_Doom_Hammer.jpg",
    stats: {
      pAtk: 165, // 135 + 30
      mAtk: 131, // 101 + 30
      rCrit: 4,
      pAtkSpd: 385, // 325 + 60
    },
    description: "Молот Паагріан C-grade. Покращена версія з більшим уроном та швидкістю бою.",
    soulshots: 3,
    spiritshots: 3,
  },
  {
    id: "quest_weapon_c_paagrian_axe",
    itemId: 203,
    name: "Pa'agrian Axe",
    grade: "C",
    type: "weapon",
    category: "bigblunt",
    price: 50,
    bodypart: "lrhand",
    weaponType: "BIGBLUNT",
    icon: "/items/drops/weapon_c/Heavy_Doom_Axe.jpg",
    stats: {
      pAtk: 171, // 141 + 30
      mAtk: 134, // 104 + 30
      rCrit: 4,
      pAtkSpd: 385, // 325 + 60
    },
    description: "Сокира Паагріан C-grade. Покращена версія з більшим уроном та швидкістю бою.",
    soulshots: 3,
    spiritshots: 3,
  },
  {
    id: "quest_weapon_c_samurai_longsword",
    itemId: 135,
    name: "Samurai Longsword",
    grade: "C",
    type: "weapon",
    category: "sword",
    price: 50,
    bodypart: "rhand",
    weaponType: "SWORD",
    icon: "/items/drops/weapon_c/Samurai_Longsword.jpg",
    stats: {
      pAtk: 186, // 156 + 30
      mAtk: 113, // 83 + 30
      rCrit: 8,
      pAtkSpd: 439, // 379 + 60
    },
    description: "Довгий меч самурая C-grade. Покращена версія з більшим уроном та швидкістю бою.",
    soulshots: 3,
    spiritshots: 3,
  },
  {
    id: "quest_weapon_c_scorpion",
    itemId: 301,
    name: "Scorpion",
    grade: "C",
    type: "weapon",
    category: "pole",
    price: 50,
    bodypart: "lrhand",
    weaponType: "POLE",
    icon: "/items/drops/weapon_c/Scorpion.jpg",
    stats: {
      pAtk: 174, // 144 + 30
      mAtk: 108, // 78 + 30
      rCrit: 8,
      pAtkSpd: 385, // 325 + 60
    },
    description: "Скорпіон C-grade. Покращена версія з більшим уроном та швидкістю бою.",
    soulshots: 3,
    spiritshots: 3,
  },
  {
    id: "quest_weapon_c_war_axe",
    itemId: 162,
    name: "War Axe",
    grade: "C",
    type: "weapon",
    category: "blunt",
    price: 50,
    bodypart: "rhand",
    weaponType: "BLUNT",
    icon: "/items/drops/weapon_c/War_Axe.jpg",
    stats: {
      pAtk: 169, // 139 + 30
      mAtk: 106, // 76 + 30
      rCrit: 4,
      pAtkSpd: 439, // 379 + 60
    },
    description: "Військова сокира C-grade. Покращена версія з більшим уроном та швидкістю бою.",
    soulshots: 3,
    spiritshots: 3,
  },
  {
    id: "quest_weapon_c_widow_maker",
    itemId: 303,
    name: "Widow Maker",
    grade: "C",
    type: "weapon",
    category: "pole",
    price: 50,
    bodypart: "lrhand",
    weaponType: "POLE",
    icon: "/items/drops/weapon_c/Widow_Maker.jpg",
    stats: {
      pAtk: 174, // 144 + 30
      mAtk: 108, // 78 + 30
      rCrit: 8,
      pAtkSpd: 385, // 325 + 60
    },
    description: "Творець вдови C-grade. Покращена версія з більшим уроном та швидкістю бою.",
    soulshots: 3,
    spiritshots: 3,
  },
  {
    id: "quest_weapon_c_yaksa_mace",
    itemId: 2503,
    name: "Yaksa Mace",
    grade: "C",
    type: "weapon",
    category: "blunt",
    price: 50,
    bodypart: "rhand",
    weaponType: "BLUNT",
    icon: "/items/drops/weapon_c/Yaksa_Mace.jpg",
    stats: {
      pAtk: 186, // 156 + 30
      mAtk: 113, // 83 + 30
      rCrit: 4,
      pAtkSpd: 439, // 379 + 60
    },
    description: "Булава Якса C-grade. Покращена версія з більшим уроном та швидкістю бою.",
    soulshots: 3,
    spiritshots: 3,
  },
  
  // ===== B-GRADE ЗБРОЯ (з папки weapon_b) =====
  // Усі B-grade зброї мають: +30 урону, +60 швидкості бою
  {
    id: "quest_weapon_b_apprentices_spellbook",
    itemId: 78,
    name: "Apprentice's Spellbook",
    grade: "B",
    type: "weapon",
    category: "spellbook",
    price: 100,
    bodypart: "rhand",
    weaponType: "ETC",
    icon: "/items/drops/weapon_b/apprentices_spellbook.jpg",
    stats: {
      pAtk: 178, // 148 + 30
      mAtk: 172, // 142 + 30
      rCrit: 8,
      pAtkSpd: 439, // 379 + 60
    },
    description: "Книга заклинань учня B-grade. Покращена версія з більшим уроном та швидкістю атаки.",
    soulshots: 1,
    spiritshots: 1,
  },
  {
    id: "quest_weapon_b_art_of_battle_axe",
    itemId: 7834,
    name: "Art of Battle Axe",
    grade: "B",
    type: "weapon",
    category: "blunt",
    price: 100,
    bodypart: "rhand",
    weaponType: "BLUNT",
    icon: "/items/drops/weapon_b/Art_of_Battle_Axe.jpg",
    stats: {
      pAtk: 178, // 148 + 30
      mAtk: 115, // 85 + 30
      rCrit: 4,
      pAtkSpd: 439, // 379 + 60
    },
    description: "Бойова сокира мистецтва B-grade. Покращена версія з більшим уроном та швидкістю атаки.",
    soulshots: 3,
    spiritshots: 3,
  },
  {
    id: "quest_weapon_b_arthro_nail",
    itemId: 7788,
    name: "Arthro Nail",
    grade: "B",
    type: "weapon",
    category: "dualfist",
    price: 100,
    bodypart: "dwhand",
    weaponType: "DUALFIST",
    icon: "/items/drops/weapon_b/Arthro_Nail.jpg",
    stats: {
      pAtk: 178, // 148 + 30
      mAtk: 115, // 85 + 30
      rCrit: 12,
      pAtkSpd: 493, // 433 + 60
    },
    description: "Кіготь Артро B-grade. Покращена версія з більшим уроном та швидкістю атаки.",
    soulshots: 3,
    spiritshots: 3,
  },
  {
    id: "quest_weapon_b_baguette_s_dualsword",
    itemId: 7792,
    name: "Baguette's Dualsword",
    grade: "B",
    type: "weapon",
    category: "dualsword",
    price: 100,
    bodypart: "dwhand",
    weaponType: "DUALSWORD",
    icon: "/items/drops/weapon_b/Baguette_s_Dualsword.jpg",
    stats: {
      pAtk: 178, // 148 + 30
      mAtk: 115, // 85 + 30
      rCrit: 8,
      pAtkSpd: 385, // 325 + 60
    },
    description: "Дворучний меч Багет B-grade. Покращена версія з більшим уроном та швидкістю атаки.",
    soulshots: 3,
    spiritshots: 3,
  },
  {
    id: "quest_weapon_b_bellion_cestus",
    itemId: 7893,
    name: "Bellion Cestus",
    grade: "B",
    type: "weapon",
    category: "dualfist",
    price: 100,
    bodypart: "dwhand",
    weaponType: "DUALFIST",
    icon: "/items/drops/weapon_b/Bellion_Cestus.jpg",
    stats: {
      pAtk: 178, // 148 + 30
      mAtk: 115, // 85 + 30
      rCrit: 12,
      pAtkSpd: 493, // 433 + 60
    },
    description: "Цестус Белліона B-grade. Покращена версія з більшим уроном та швидкістю атаки.",
    soulshots: 3,
    spiritshots: 3,
  },
  {
    id: "quest_weapon_b_bow_of_peril",
    itemId: 7891,
    name: "Bow of Peril",
    grade: "B",
    type: "weapon",
    category: "bow",
    price: 100,
    bodypart: "lrhand",
    weaponType: "BOW",
    icon: "/items/drops/weapon_b/Bow_of_Peril.jpg",
    stats: {
      pAtk: 472, // 442 + 30
      mAtk: 148, // 118 + 30
      rCrit: 12,
      pAtkSpd: 287, // 227 + 60
    },
    description: "Лук небезпеки B-grade. Покращена версія з більшим уроном та швидкістю атаки.",
    soulshots: 1,
    spiritshots: 1,
  },
  {
    id: "quest_weapon_b_dark_elven_long_bow",
    itemId: 7890,
    name: "Dark Elven Long Bow",
    grade: "B",
    type: "weapon",
    category: "bow",
    price: 100,
    bodypart: "lrhand",
    weaponType: "BOW",
    icon: "/items/drops/weapon_b/Dark_Elven_Long_Bow.jpg",
    stats: {
      pAtk: 472, // 442 + 30
      mAtk: 148, // 118 + 30
      rCrit: 12,
      pAtkSpd: 287, // 227 + 60
    },
    description: "Довгий лук темних ельфів B-grade. Покращена версія з більшим уроном та швидкістю атаки.",
    soulshots: 1,
    spiritshots: 1,
  },
  {
    id: "quest_weapon_b_deadman_s_glory",
    itemId: 7791,
    name: "Deadman's Glory",
    grade: "B",
    type: "weapon",
    category: "bigsword",
    price: 100,
    bodypart: "lrhand",
    weaponType: "BIGSWORD",
    icon: "/items/drops/weapon_b/Deadman_s_Glory.jpg",
    stats: {
      pAtk: 297, // 267 + 30
      mAtk: 146, // 116 + 30
      rCrit: 8,
      pAtkSpd: 385, // 325 + 60
    },
    description: "Слава мертвого B-grade. Покращена версія з більшим уроном та швидкістю атаки.",
    soulshots: 3,
    spiritshots: 3,
  },
  {
    id: "quest_weapon_b_great_axe",
    itemId: 7894,
    name: "Great Axe",
    grade: "B",
    type: "weapon",
    category: "bigblunt",
    price: 100,
    bodypart: "lrhand",
    weaponType: "BIGBLUNT",
    icon: "/items/drops/weapon_b/Great_Axe.jpg",
    stats: {
      pAtk: 297, // 267 + 30
      mAtk: 185, // 155 + 30
      rCrit: 4,
      pAtkSpd: 385, // 325 + 60
    },
    description: "Велика сокира B-grade. Покращена версія з більшим уроном та швидкістю атаки.",
    soulshots: 3,
    spiritshots: 3,
  },
  {
    id: "quest_weapon_b_great_sword",
    itemId: 7895,
    name: "Great Sword",
    grade: "B",
    type: "weapon",
    category: "bigsword",
    price: 100,
    bodypart: "lrhand",
    weaponType: "BIGSWORD",
    icon: "/items/drops/weapon_b/Great_Sword.jpg",
    stats: {
      pAtk: 297, // 267 + 30
      mAtk: 146, // 116 + 30
      rCrit: 8,
      pAtkSpd: 385, // 325 + 60
    },
    description: "Великий меч B-grade. Покращена версія з більшим уроном та швидкістю атаки.",
    soulshots: 3,
    spiritshots: 3,
  },
  {
    id: "quest_weapon_b_guardian_sword",
    itemId: 7883,
    name: "Guardian Sword",
    grade: "B",
    type: "weapon",
    category: "sword",
    price: 100,
    bodypart: "rhand",
    weaponType: "SWORD",
    icon: "/items/drops/weapon_b/Guardian_Sword.jpg",
    stats: {
      pAtk: 178, // 148 + 30
      mAtk: 115, // 85 + 30
      rCrit: 8,
      pAtkSpd: 439, // 379 + 60
    },
    description: "Меч вартового B-grade. Покращена версія з більшим уроном та швидкістю атаки.",
    soulshots: 3,
    spiritshots: 3,
  },
  {
    id: "quest_weapon_b_hell_knife",
    itemId: 7813,
    name: "Hell Knife",
    grade: "B",
    type: "weapon",
    category: "dagger",
    price: 100,
    bodypart: "rhand",
    weaponType: "DAGGER",
    icon: "/items/drops/weapon_b/Hell_Knife.jpg",
    stats: {
      pAtk: 221, // 191 + 30
      mAtk: 146, // 116 + 30
      rCrit: 12,
      pAtkSpd: 493, // 433 + 60
    },
    description: "Кинджал пекла B-grade. Покращена версія з більшим уроном та швидкістю атаки.",
    soulshots: 3,
    spiritshots: 3,
  },
  {
    id: "quest_weapon_b_ice_storm_hammer",
    itemId: 7900,
    name: "Ice Storm Hammer",
    grade: "B",
    type: "weapon",
    category: "bigblunt",
    price: 100,
    bodypart: "lrhand",
    weaponType: "BIGBLUNT",
    icon: "/items/drops/weapon_b/Ice_Storm_Hammer.jpg",
    stats: {
      pAtk: 297, // 267 + 30
      mAtk: 185, // 155 + 30
      rCrit: 4,
      pAtkSpd: 385, // 325 + 60
    },
    description: "Молот крижаної бурі B-grade. Покращена версія з більшим уроном та швидкістю атаки.",
    soulshots: 3,
    spiritshots: 3,
  },
  {
    id: "quest_weapon_b_kaim_vanul_s_bones",
    itemId: 7893,
    name: "Kaim Vanul's Bones",
    grade: "B",
    type: "weapon",
    category: "bigblunt",
    price: 100,
    bodypart: "lrhand",
    weaponType: "BIGBLUNT",
    icon: "/items/drops/weapon_b/Kaim_Vanul_s_Bones.jpg",
    stats: {
      pAtk: 297, // 267 + 30
      mAtk: 225, // 195 + 30
      rCrit: 4,
      pAtkSpd: 385, // 325 + 60
    },
    description: "Кістки Кайма Ванула B-grade. Покращена версія з більшим уроном та швидкістю атаки.",
    soulshots: 3,
    spiritshots: 3,
  },
  {
    id: "quest_weapon_b_kris",
    itemId: 7783,
    name: "Kris",
    grade: "B",
    type: "weapon",
    category: "dagger",
    price: 100,
    bodypart: "rhand",
    weaponType: "DAGGER",
    icon: "/items/drops/weapon_b/Kris.jpg",
    stats: {
      pAtk: 221, // 191 + 30
      mAtk: 146, // 116 + 30
      rCrit: 12,
      pAtkSpd: 493, // 433 + 60
    },
    description: "Крис B-grade. Покращена версія з більшим уроном та швидкістю атаки.",
    soulshots: 3,
    spiritshots: 3,
  },
  {
    id: "quest_weapon_b_lance",
    itemId: 7784,
    name: "Lance",
    grade: "B",
    type: "weapon",
    category: "pole",
    price: 100,
    bodypart: "lrhand",
    weaponType: "POLE",
    icon: "/items/drops/weapon_b/Lance.jpg",
    stats: {
      pAtk: 251, // 221 + 30
      mAtk: 157, // 127 + 30
      rCrit: 8,
      pAtkSpd: 385, // 325 + 60
    },
    description: "Спіс B-grade. Покращена версія з більшим уроном та швидкістю атаки.",
    soulshots: 3,
    spiritshots: 3,
  },
  {
    id: "quest_weapon_b_spell_breaker",
    itemId: 7892,
    name: "Spell Breaker",
    grade: "B",
    type: "weapon",
    category: "rapier",
    price: 100,
    bodypart: "rhand",
    weaponType: "RAPIER",
    icon: "/items/drops/weapon_b/Spell_Breaker.jpg",
    stats: {
      pAtk: 178, // 148 + 30
      mAtk: 115, // 85 + 30
      rCrit: 8,
      pAtkSpd: 439, // 379 + 60
    },
    description: "Руйнівник заклинань B-grade. Покращена версія з більшим уроном та швидкістю атаки.",
    soulshots: 3,
    spiritshots: 3,
  },
  {
    id: "quest_weapon_b_spirit_s_staff",
    itemId: 7889,
    name: "Spirit's Staff",
    grade: "B",
    type: "weapon",
    category: "bigblunt",
    price: 100,
    bodypart: "lrhand",
    weaponType: "BIGBLUNT",
    icon: "/items/drops/weapon_b/Spirit_s_Staff.jpg",
    stats: {
      pAtk: 297, // 267 + 30
      mAtk: 225, // 195 + 30
      rCrit: 4,
      pAtkSpd: 385, // 325 + 60
    },
    description: "Посох духа B-grade. Покращена версія з більшим уроном та швидкістю атаки.",
    soulshots: 3,
    spiritshots: 3,
  },
  {
    id: "quest_weapon_b_staff_of_evil_spirits",
    itemId: 7896,
    name: "Staff of Evil Spirits",
    grade: "B",
    type: "weapon",
    category: "bigblunt",
    price: 100,
    bodypart: "lrhand",
    weaponType: "BIGBLUNT",
    icon: "/items/drops/weapon_b/Staff_of_Evil_Spirits.jpg",
    stats: {
      pAtk: 297, // 267 + 30
      mAtk: 225, // 195 + 30
      rCrit: 4,
      pAtkSpd: 385, // 325 + 60
    },
    description: "Посох злих духів B-grade. Покращена версія з більшим уроном та швидкістю атаки.",
    soulshots: 3,
    spiritshots: 3,
  },
  {
    id: "quest_weapon_b_star_buster",
    itemId: 7901,
    name: "Star Buster",
    grade: "B",
    type: "weapon",
    category: "bigblunt",
    price: 100,
    bodypart: "lrhand",
    weaponType: "BIGBLUNT",
    icon: "/items/drops/weapon_b/Star_Buster.jpg",
    stats: {
      pAtk: 297, // 267 + 30
      mAtk: 225, // 195 + 30
      rCrit: 4,
      pAtkSpd: 385, // 325 + 60
    },
    description: "Руйнівник зірок B-grade. Покращена версія з більшим уроном та швидкістю атаки.",
    soulshots: 3,
    spiritshots: 3,
  },
  {
    id: "quest_weapon_b_sword_of_damascus",
    itemId: 7897,
    name: "Sword of Damascus",
    grade: "B",
    type: "weapon",
    category: "sword",
    price: 100,
    bodypart: "rhand",
    weaponType: "SWORD",
    icon: "/items/drops/weapon_b/Sword_of_Damascus.jpg",
    stats: {
      pAtk: 178, // 148 + 30
      mAtk: 115, // 85 + 30
      rCrit: 8,
      pAtkSpd: 439, // 379 + 60
    },
    description: "Меч Дамаска B-grade. Покращена версія з більшим уроном та швидкістю атаки.",
    soulshots: 3,
    spiritshots: 3,
  },
  {
    id: "quest_weapon_b_sword_of_valhalla",
    itemId: 7722,
    name: "Sword of Valhalla",
    grade: "B",
    type: "weapon",
    category: "sword",
    price: 100,
    bodypart: "rhand",
    weaponType: "SWORD",
    icon: "/items/drops/weapon_b/Sword_of_Valhalla.jpg",
    stats: {
      pAtk: 178, // 148 + 30
      mAtk: 115, // 85 + 30
      rCrit: 8,
      pAtkSpd: 439, // 379 + 60
    },
    description: "Меч Вальгалли B-grade. Покращена версія з більшим уроном та швидкістю атаки.",
    soulshots: 3,
    spiritshots: 3,
  },
  {
    id: "quest_weapon_b_wizard_s_tear",
    itemId: 7889,
    name: "Wizard's Tear",
    grade: "B",
    type: "weapon",
    category: "bigblunt",
    price: 100,
    bodypart: "lrhand",
    weaponType: "BIGBLUNT",
    icon: "/items/drops/weapon_b/Wizard_s_Tear.jpg",
    stats: {
      pAtk: 297, // 267 + 30
      mAtk: 225, // 195 + 30
      rCrit: 4,
      pAtkSpd: 385, // 325 + 60
    },
    description: "Сльоза чарівника B-grade. Покращена версія з більшим уроном та швидкістю атаки.",
    soulshots: 3,
    spiritshots: 3,
  },
  
  // ===== A-GRADE ЗБРОЯ (з папки weapon_a) =====
  // Усі A-grade зброї мають: +40 урону, +50 швидкості бою
  {
    id: "quest_weapon_a_dark_legions_edge",
    itemId: 2500,
    name: "Dark Legion's Edge",
    grade: "A",
    type: "weapon",
    category: "sword",
    price: 100,
    bodypart: "rhand",
    weaponType: "SWORD",
    icon: "/items/drops/weapon_a/Dark_Legion_s_Edge.jpg",
    stats: {
      pAtk: 272, // 232 + 40
      mAtk: 154, // 114 + 40
      rCrit: 8,
      pAtkSpd: 429, // 379 + 50
    },
    description: "Клинок темного легіону A-grade. Покращена версія з більшим уроном та швидкістю атаки.",
    soulshots: 1,
    spiritshots: 1,
  },
  {
    id: "quest_weapon_a_meteor_shower",
    itemId: 2504,
    name: "Meteor Shower",
    grade: "A",
    type: "weapon",
    category: "blunt",
    price: 100,
    bodypart: "rhand",
    weaponType: "BLUNT",
    icon: "/items/drops/weapon_a/Meteor_Shower.jpg",
    stats: {
      pAtk: 253, // 213 + 40
      mAtk: 147, // 107 + 40
      rCrit: 4,
      pAtkSpd: 429, // 379 + 50
    },
    description: "Метеорний дощ A-grade. Покращена версія з більшим уроном та швидкістю атаки.",
    soulshots: 1,
    spiritshots: 1,
  },
  {
    id: "quest_weapon_a_apprentices_spellbook",
    itemId: 2500,
    name: "Apprentice's Spellbook",
    grade: "A",
    type: "weapon",
    category: "staff",
    price: 100,
    bodypart: "rhand",
    weaponType: "ETC",
    icon: "/items/drops/weapon_a/apprentices_spellbook.jpg",
    stats: {
      pAtk: 260, // 220 + 40
      mAtk: 240, // 200 + 40
      rCrit: 8,
      pAtkSpd: 429, // 379 + 50
    },
    description: "Книга заклинань учня A-grade. Покращена версія з більшим уроном та швидкістю атаки.",
    soulshots: 1,
    spiritshots: 1,
  },
  {
    id: "quest_weapon_a_baguette_s_dualsword",
    itemId: 2500,
    name: "Baguette's Dualsword",
    grade: "A",
    type: "weapon",
    category: "dualsword",
    price: 100,
    bodypart: "lrhand",
    weaponType: "DUALSWORD",
    icon: "/items/drops/weapon_a/Baguette_s_Dualsword.jpg",
    stats: {
      pAtk: 345, // 305 + 40
      mAtk: 161, // 121 + 40
      rCrit: 8,
      pAtkSpd: 375, // 325 + 50
    },
    description: "Дворучний меч Багет A-grade. Покращена версія з більшим уроном та швидкістю атаки.",
    soulshots: 1,
    spiritshots: 1,
  },
  {
    id: "quest_weapon_a_barakiel_s_axe",
    itemId: 2500,
    name: "Barakiel's Axe",
    grade: "A",
    type: "weapon",
    category: "blunt",
    price: 100,
    bodypart: "rhand",
    weaponType: "BLUNT",
    icon: "/items/drops/weapon_a/Barakiel_s_Axe.jpg",
    stats: {
      pAtk: 272, // 232 + 40
      mAtk: 154, // 114 + 40
      rCrit: 4,
      pAtkSpd: 429, // 379 + 50
    },
    description: "Сокира Баракіеля A-grade. Покращена версія з більшим уроном та швидкістю атаки.",
    soulshots: 1,
    spiritshots: 1,
  },
  {
    id: "quest_weapon_a_behemoth_s_tuning_fork",
    itemId: 2500,
    name: "Behemoth's Tuning Fork",
    grade: "A",
    type: "weapon",
    category: "bigblunt",
    price: 100,
    bodypart: "lrhand",
    weaponType: "BIGBLUNT",
    icon: "/items/drops/weapon_a/Behemoth_s_Tuning_Fork.jpg",
    stats: {
      pAtk: 320, // 280 + 40
      mAtk: 240, // 200 + 40
      rCrit: 4,
      pAtkSpd: 375, // 325 + 50
    },
    description: "Камертон Бегемота A-grade. Покращена версія з більшим уроном та швидкістю атаки.",
    soulshots: 1,
    spiritshots: 1,
  },
  {
    id: "quest_weapon_a_blood_tornado",
    itemId: 2500,
    name: "Blood Tornado",
    grade: "A",
    type: "weapon",
    category: "bigsword",
    price: 100,
    bodypart: "lrhand",
    weaponType: "BIGSWORD",
    icon: "/items/drops/weapon_a/Blood_Tornado.jpg",
    stats: {
      pAtk: 345, // 305 + 40
      mAtk: 161, // 121 + 40
      rCrit: 8,
      pAtkSpd: 375, // 325 + 50
    },
    description: "Кривавий торнадо A-grade. Покращена версія з більшим уроном та швидкістю атаки.",
    soulshots: 1,
    spiritshots: 1,
  },
  {
    id: "quest_weapon_a_bloody_orchid",
    itemId: 2500,
    name: "Bloody Orchid",
    grade: "A",
    type: "weapon",
    category: "dagger",
    price: 100,
    bodypart: "rhand",
    weaponType: "DAGGER",
    icon: "/items/drops/weapon_a/Bloody_Orchid.jpg",
    stats: {
      pAtk: 320, // 280 + 40
      mAtk: 161, // 121 + 40
      rCrit: 12,
      pAtkSpd: 483, // 433 + 50
    },
    description: "Кривава орхідея A-grade. Покращена версія з більшим уроном та швидкістю атаки.",
    soulshots: 1,
    spiritshots: 1,
  },
  {
    id: "quest_weapon_a_branch_of_the_mother_tree",
    itemId: 2500,
    name: "Branch of The Mother Tree",
    grade: "A",
    type: "weapon",
    category: "bigblunt",
    price: 100,
    bodypart: "lrhand",
    weaponType: "BIGBLUNT",
    icon: "/items/drops/weapon_a/Branch_of_The_Mother_Tree.jpg",
    stats: {
      pAtk: 320, // 280 + 40
      mAtk: 240, // 200 + 40
      rCrit: 4,
      pAtkSpd: 375, // 325 + 50
    },
    description: "Гілка материнського дерева A-grade. Покращена версія з більшим уроном та швидкістю атаки.",
    soulshots: 1,
    spiritshots: 1,
  },
  {
    id: "quest_weapon_a_cabrio_s_hand",
    itemId: 2500,
    name: "Cabrio's Hand",
    grade: "A",
    type: "weapon",
    category: "dualfist",
    price: 100,
    bodypart: "lrhand",
    weaponType: "DUALFIST",
    icon: "/items/drops/weapon_a/Cabrio_s _Hand.jpg",
    stats: {
      pAtk: 322, // 282 + 40
      mAtk: 154, // 114 + 40
      rCrit: 12,
      pAtkSpd: 483, // 433 + 50
    },
    description: "Рука Кабріо A-grade. Покращена версія з більшим уроном та швидкістю атаки.",
    soulshots: 1,
    spiritshots: 1,
  },
  {
    id: "quest_weapon_a_carnage_bow",
    itemId: 2500,
    name: "Carnage Bow",
    grade: "A",
    type: "weapon",
    category: "bow",
    price: 100,
    bodypart: "lrhand",
    weaponType: "BOW",
    icon: "/items/drops/weapon_a/Carnage_Bow.jpg",
    stats: {
      pAtk: 568, // 528 + 40
      mAtk: 165, // 125 + 40
      rCrit: 12,
      pAtkSpd: 317, // 267 + 50
    },
    description: "Лук різанини A-grade. Покращена версія з більшим уроном та швидкістю атаки.",
    soulshots: 10,
    spiritshots: 1,
  },
  {
    id: "quest_weapon_a_daimon_crystal",
    itemId: 2500,
    name: "Daimon Crystal",
    grade: "A",
    type: "weapon",
    category: "bigblunt",
    price: 100,
    bodypart: "lrhand",
    weaponType: "BIGBLUNT",
    icon: "/items/drops/weapon_a/Daimon_Crystal.jpg",
    stats: {
      pAtk: 320, // 280 + 40
      mAtk: 240, // 200 + 40
      rCrit: 4,
      pAtkSpd: 375, // 325 + 50
    },
    description: "Кристал Даймона A-grade. Покращена версія з більшим уроном та швидкістю атаки.",
    soulshots: 1,
    spiritshots: 1,
  },
  {
    id: "quest_weapon_a_dasparion_s_staff",
    itemId: 210,
    name: "Dasparion's Staff",
    grade: "A",
    type: "weapon",
    category: "bigblunt",
    price: 100,
    bodypart: "lrhand",
    weaponType: "BIGBLUNT",
    icon: "/items/drops/weapon_a/Dasparion_s_Staff.jpg",
    stats: {
      pAtk: 320, // 280 + 40
      mAtk: 290, // 250 + 40
      rCrit: 4,
      pAtkSpd: 375, // 325 + 50
    },
    description: "Посох Даспаріона A-grade. Покращена версія з більшим уроном та швидкістю атаки.",
    soulshots: 1,
    spiritshots: 1,
  },
  {
    id: "quest_weapon_a_dragon_grinder",
    itemId: 231,
    name: "Dragon Grinder",
    grade: "A",
    type: "weapon",
    category: "dualfist",
    price: 100,
    bodypart: "lrhand",
    weaponType: "DUALFIST",
    icon: "/items/drops/weapon_a/Dragon_Grinder.jpg",
    stats: {
      pAtk: 322, // 282 + 40
      mAtk: 154, // 114 + 40
      rCrit: 4,
      pAtkSpd: 375, // 325 + 50
    },
    description: "Подрібнювач дракона A-grade. Покращена версія з більшим уроном та швидкістю атаки.",
    soulshots: 1,
    spiritshots: 1,
  },
  {
    id: "quest_weapon_a_dragon_slayer",
    itemId: 2500,
    name: "Dragon Slayer",
    grade: "A",
    type: "weapon",
    category: "bigsword",
    price: 100,
    bodypart: "lrhand",
    weaponType: "BIGSWORD",
    icon: "/items/drops/weapon_a/Dragon_Slayer.jpg",
    stats: {
      pAtk: 322, // 282 + 40
      mAtk: 154, // 114 + 40
      rCrit: 8,
      pAtkSpd: 375, // 325 + 50
    },
    description: "Вбивця драконів A-grade. Покращена версія з більшим уроном та швидкістю атаки.",
    soulshots: 1,
    spiritshots: 1,
  },
  {
    id: "quest_weapon_a_elysian",
    itemId: 290,
    name: "Elysian",
    grade: "A",
    type: "weapon",
    category: "bow",
    price: 100,
    bodypart: "lrhand",
    weaponType: "BOW",
    icon: "/items/drops/weapon_a/Elysian.jpg",
    stats: {
      pAtk: 568, // 528 + 40
      mAtk: 165, // 125 + 40
      rCrit: 12,
      pAtkSpd: 317, // 267 + 50
    },
    description: "Елізійський лук A-grade. Покращена версія з більшим уроном та швидкістю атаки.",
    soulshots: 10,
    spiritshots: 1,
  },
  {
    id: "quest_weapon_a_halberd",
    itemId: 304,
    name: "Halberd",
    grade: "A",
    type: "weapon",
    category: "pole",
    price: 100,
    bodypart: "lrhand",
    weaponType: "POLE",
    icon: "/items/drops/weapon_a/Halberd.jpg",
    stats: {
      pAtk: 320, // 280 + 40
      mAtk: 161, // 121 + 40
      rCrit: 12,
      pAtkSpd: 375, // 325 + 50
    },
    description: "Алебарда A-grade. Покращена версія з більшим уроном та швидкістю атаки.",
    soulshots: 1,
    spiritshots: 1,
  },
  {
    id: "quest_weapon_a_infernal_master",
    itemId: 2500,
    name: "Infernal Master",
    grade: "A",
    type: "weapon",
    category: "bigblunt",
    price: 100,
    bodypart: "lrhand",
    weaponType: "BIGBLUNT",
    icon: "/items/drops/weapon_a/Infernal_Master.jpg",
    stats: {
      pAtk: 320, // 280 + 40
      mAtk: 240, // 200 + 40
      rCrit: 4,
      pAtkSpd: 375, // 325 + 50
    },
    description: "Інфернальний майстер A-grade. Покращена версія з більшим уроном та швидкістю атаки.",
    soulshots: 1,
    spiritshots: 1,
  },
  {
    id: "quest_weapon_a_naga_storm",
    itemId: 2500,
    name: "Naga Storm",
    grade: "A",
    type: "weapon",
    category: "bigsword",
    price: 100,
    bodypart: "lrhand",
    weaponType: "BIGSWORD",
    icon: "/items/drops/weapon_a/Naga_Storm.jpg",
    stats: {
      pAtk: 345, // 305 + 40
      mAtk: 161, // 121 + 40
      rCrit: 8,
      pAtkSpd: 375, // 325 + 50
    },
    description: "Буря наги A-grade. Покращена версія з більшим уроном та швидкістю атаки.",
    soulshots: 1,
    spiritshots: 1,
  },
  {
    id: "quest_weapon_a_shyeed_s_bow",
    itemId: 2500,
    name: "Shyeed's Bow",
    grade: "A",
    type: "weapon",
    category: "bow",
    price: 100,
    bodypart: "lrhand",
    weaponType: "BOW",
    icon: "/items/drops/weapon_a/Shyeed_s_Bow.jpg",
    stats: {
      pAtk: 568, // 528 + 40
      mAtk: 165, // 125 + 40
      rCrit: 12,
      pAtkSpd: 317, // 267 + 50
    },
    description: "Лук Шіда A-grade. Покращена версія з більшим уроном та швидкістю атаки.",
    soulshots: 10,
    spiritshots: 1,
  },
  {
    id: "quest_weapon_a_sirra_s_blade",
    itemId: 2500,
    name: "Sirra's Blade",
    grade: "A",
    type: "weapon",
    category: "sword",
    price: 100,
    bodypart: "rhand",
    weaponType: "SWORD",
    icon: "/items/drops/weapon_a/Sirra_s_Blade.jpg",
    stats: {
      pAtk: 291, // 251 + 40
      mAtk: 161, // 121 + 40
      rCrit: 8,
      pAtkSpd: 429, // 379 + 50
    },
    description: "Клинок Сірри A-grade. Покращена версія з більшим уроном та швидкістю атаки.",
    soulshots: 1,
    spiritshots: 1,
  },
  {
    id: "quest_weapon_a_sobekk_s_hurricane",
    itemId: 2500,
    name: "Sobekk's Hurricane",
    grade: "A",
    type: "weapon",
    category: "pole",
    price: 100,
    bodypart: "lrhand",
    weaponType: "POLE",
    icon: "/items/drops/weapon_a/Sobekk_s_Hurricane.jpg",
    stats: {
      pAtk: 320, // 280 + 40
      mAtk: 161, // 121 + 40
      rCrit: 12,
      pAtkSpd: 375, // 325 + 50
    },
    description: "Ураган Собекка A-grade. Покращена версія з більшим уроном та швидкістю атаки.",
    soulshots: 1,
    spiritshots: 1,
  },
  {
    id: "quest_weapon_a_soul_bow",
    itemId: 290,
    name: "Soul Bow",
    grade: "A",
    type: "weapon",
    category: "bow",
    price: 100,
    bodypart: "lrhand",
    weaponType: "BOW",
    icon: "/items/drops/weapon_a/Soul_Bow.jpg",
    stats: {
      pAtk: 568, // 528 + 40
      mAtk: 165, // 125 + 40
      rCrit: 12,
      pAtkSpd: 317, // 267 + 50
    },
    description: "Лук душі A-grade. Покращена версія з більшим уроном та швидкістю атаки.",
    soulshots: 10,
    spiritshots: 1,
  },
  {
    id: "quest_weapon_a_soul_separator",
    itemId: 2500,
    name: "Soul Separator",
    grade: "A",
    type: "weapon",
    category: "bigsword",
    price: 100,
    bodypart: "lrhand",
    weaponType: "BIGSWORD",
    icon: "/items/drops/weapon_a/Soul_Separator.jpg",
    stats: {
      pAtk: 345, // 305 + 40
      mAtk: 161, // 121 + 40
      rCrit: 8,
      pAtkSpd: 375, // 325 + 50
    },
    description: "Роздільник душ A-grade. Покращена версія з більшим уроном та швидкістю атаки.",
    soulshots: 1,
    spiritshots: 1,
  },
  {
    id: "quest_weapon_a_spiritual_eye",
    itemId: 2500,
    name: "Spiritual Eye",
    grade: "A",
    type: "weapon",
    category: "bigblunt",
    price: 100,
    bodypart: "lrhand",
    weaponType: "BIGBLUNT",
    icon: "/items/drops/weapon_a/Spiritual_Eye.jpg",
    stats: {
      pAtk: 320, // 280 + 40
      mAtk: 240, // 200 + 40
      rCrit: 4,
      pAtkSpd: 375, // 325 + 50
    },
    description: "Духовне око A-grade. Покращена версія з більшим уроном та швидкістю атаки.",
    soulshots: 1,
    spiritshots: 1,
  },
  {
    id: "quest_weapon_a_sword_of_ipos",
    itemId: 2500,
    name: "Sword of Ipos",
    grade: "A",
    type: "weapon",
    category: "bigsword",
    price: 100,
    bodypart: "lrhand",
    weaponType: "BIGSWORD",
    icon: "/items/drops/weapon_a/Sword_of_Ipos.jpg",
    stats: {
      pAtk: 345, // 305 + 40
      mAtk: 161, // 121 + 40
      rCrit: 8,
      pAtkSpd: 375, // 325 + 50
    },
    description: "Меч Іпоса A-grade. Покращена версія з більшим уроном та швидкістю атаки.",
    soulshots: 1,
    spiritshots: 1,
  },
  {
    id: "quest_weapon_a_sword_of_miracles",
    itemId: 88,
    name: "Sword of Miracles",
    grade: "A",
    type: "weapon",
    category: "sword",
    price: 100,
    bodypart: "rhand",
    weaponType: "SWORD",
    icon: "/items/drops/weapon_a/Sword_of_Miracles.jpg",
    stats: {
      pAtk: 291, // 251 + 40
      mAtk: 161, // 121 + 40
      rCrit: 8,
      pAtkSpd: 429, // 379 + 50
    },
    description: "Меч див A-grade. Покращена версія з більшим уроном та швидкістю атаки.",
    soulshots: 1,
    spiritshots: 1,
  },
  {
    id: "quest_weapon_a_tallum_blade",
    itemId: 2500,
    name: "Tallum Blade",
    grade: "A",
    type: "weapon",
    category: "dualsword",
    price: 100,
    bodypart: "lrhand",
    weaponType: "DUALSWORD",
    icon: "/items/drops/weapon_a/Tallum_Blade.jpg",
    stats: {
      pAtk: 345, // 305 + 40
      mAtk: 161, // 121 + 40
      rCrit: 8,
      pAtkSpd: 375, // 325 + 50
    },
    description: "Клинок Таллума A-grade. Покращена версія з більшим уроном та швидкістю атаки.",
    soulshots: 1,
    spiritshots: 1,
  },
  {
    id: "quest_weapon_a_tallum_glaive",
    itemId: 2500,
    name: "Tallum Glaive",
    grade: "A",
    type: "weapon",
    category: "pole",
    price: 100,
    bodypart: "lrhand",
    weaponType: "POLE",
    icon: "/items/drops/weapon_a/Tallum_Glaive.jpg",
    stats: {
      pAtk: 320, // 280 + 40
      mAtk: 161, // 121 + 40
      rCrit: 12,
      pAtkSpd: 375, // 325 + 50
    },
    description: "Глефа Таллума A-grade. Покращена версія з більшим уроном та швидкістю атаки.",
    soulshots: 1,
    spiritshots: 1,
  },
  {
    id: "quest_weapon_a_themis_tongue",
    itemId: 2500,
    name: "Themis Tongue",
    grade: "A",
    type: "weapon",
    category: "bigblunt",
    price: 100,
    bodypart: "lrhand",
    weaponType: "BIGBLUNT",
    icon: "/items/drops/weapon_a/Themis_Tongue.jpg",
    stats: {
      pAtk: 320, // 280 + 40
      mAtk: 240, // 200 + 40
      rCrit: 4,
      pAtkSpd: 375, // 325 + 50
    },
    description: "Язик Теміди A-grade. Покращена версія з більшим уроном та швидкістю атаки.",
    soulshots: 1,
    spiritshots: 1,
  },
  {
    id: "quest_weapon_a_tiphon_s_spear",
    itemId: 2500,
    name: "Tiphon's Spear",
    grade: "A",
    type: "weapon",
    category: "pole",
    price: 100,
    bodypart: "lrhand",
    weaponType: "POLE",
    icon: "/items/drops/weapon_a/Tiphon_s_Spear.jpg",
    stats: {
      pAtk: 320, // 280 + 40
      mAtk: 161, // 121 + 40
      rCrit: 12,
      pAtkSpd: 375, // 325 + 50
    },
    description: "Спіс Тіфона A-grade. Покращена версія з більшим уроном та швидкістю атаки.",
    soulshots: 1,
    spiritshots: 1,
  },
  
  // ===== S-GRADE ЗБРОЯ (з папки weapon_s) =====
  // Усі S-grade зброї мають: +58 урону, +60 швидкості бою
  {
    id: "quest_weapon_s_angel_slayer",
    itemId: 20167,
    name: "Angel Slayer",
    grade: "S",
    type: "weapon",
    category: "dagger",
    price: 100,
    bodypart: "rhand",
    weaponType: "DAGGER",
    icon: "/items/drops/weapon_s/Angel_Slayer.jpg",
    stats: {
      pAtk: 304, // 246 + 58
      mAtk: 190, // 132 + 58
      rCrit: 12,
      pAtkSpd: 493, // 433 + 60
    },
    description: "Вбивця янголів S-grade. Покращена версія з більшим уроном та швидкістю атаки.",
    soulshots: 1,
    spiritshots: 1,
  },
  {
    id: "quest_weapon_s_apprentices_spellbook",
    itemId: 2500,
    name: "Apprentice's Spellbook",
    grade: "S",
    type: "weapon",
    category: "staff",
    price: 100,
    bodypart: "rhand",
    weaponType: "ETC",
    icon: "/items/drops/weapon_s/apprentices_spellbook.jpg",
    stats: {
      pAtk: 308, // 250 + 58
      mAtk: 278, // 220 + 58
      rCrit: 8,
      pAtkSpd: 439, // 379 + 60
    },
    description: "Книга заклинань учня S-grade. Покращена версія з більшим уроном та швидкістю атаки.",
    soulshots: 1,
    spiritshots: 1,
  },
  {
    id: "quest_weapon_s_arcana_mace",
    itemId: 20170,
    name: "Arcana Mace",
    grade: "S",
    type: "weapon",
    category: "blunt",
    price: 100,
    bodypart: "rhand",
    weaponType: "BLUNT",
    icon: "/items/drops/weapon_s/Arcana_Mace.jpg",
    stats: {
      pAtk: 283, // 225 + 58
      mAtk: 233, // 175 + 58
      rCrit: 4,
      pAtkSpd: 439, // 379 + 60
    },
    description: "Булава аркани S-grade. Покращена версія з більшим уроном та швидкістю атаки.",
    soulshots: 1,
    spiritshots: 1,
  },
  {
    id: "quest_weapon_s_baguette_s_dualsword",
    itemId: 2500,
    name: "Baguette's Dualsword",
    grade: "S",
    type: "weapon",
    category: "dualsword",
    price: 100,
    bodypart: "lrhand",
    weaponType: "DUALSWORD",
    icon: "/items/drops/weapon_s/Baguette_s_Dualsword.jpg",
    stats: {
      pAtk: 408, // 350 + 58
      mAtk: 193, // 135 + 58
      rCrit: 8,
      pAtkSpd: 385, // 325 + 60
    },
    description: "Дворучний меч Багет S-grade. Покращена версія з більшим уроном та швидкістю атаки.",
    soulshots: 1,
    spiritshots: 1,
  },
  {
    id: "quest_weapon_s_basalt_battlehammer",
    itemId: 20168,
    name: "Basalt Battlehammer",
    grade: "S",
    type: "weapon",
    category: "blunt",
    price: 100,
    bodypart: "rhand",
    weaponType: "BLUNT",
    icon: "/items/drops/weapon_s/Basalt_Battlehammer.jpg",
    stats: {
      pAtk: 339, // 281 + 58
      mAtk: 190, // 132 + 58
      rCrit: 4,
      pAtkSpd: 439, // 379 + 60
    },
    description: "Базальтовий бойовий молот S-grade. Покращена версія з більшим уроном та швидкістю атаки.",
    soulshots: 1,
    spiritshots: 1,
  },
  {
    id: "quest_weapon_s_demon_splinter",
    itemId: 20172,
    name: "Demon Splinter",
    grade: "S",
    type: "weapon",
    category: "dualfist",
    price: 100,
    bodypart: "lrhand",
    weaponType: "DUALFIST",
    icon: "/items/drops/weapon_s/Demon_Splinter.jpg",
    stats: {
      pAtk: 400, // 342 + 58
      mAtk: 190, // 132 + 58
      rCrit: 4,
      pAtkSpd: 385, // 325 + 60
    },
    description: "Уламок демона S-grade. Покращена версія з більшим уроном та швидкістю атаки.",
    soulshots: 1,
    spiritshots: 1,
  },
  {
    id: "quest_weapon_s_draconic_bow",
    itemId: 20173,
    name: "Draconic Bow",
    grade: "S",
    type: "weapon",
    category: "bow",
    price: 100,
    bodypart: "lrhand",
    weaponType: "BOW",
    icon: "/items/drops/weapon_s/Draconic_Bow.jpg",
    stats: {
      pAtk: 639, // 581 + 58
      mAtk: 190, // 132 + 58
      rCrit: 12,
      pAtkSpd: 353, // 293 + 60
    },
    description: "Драконічний лук S-grade. Покращена версія з більшим уроном та швидкістю атаки.",
    soulshots: 1,
    spiritshots: 1,
  },
  {
    id: "quest_weapon_s_dragon_hunter_axe",
    itemId: 20169,
    name: "Dragon Hunter Axe",
    grade: "S",
    type: "weapon",
    category: "bigblunt",
    price: 100,
    bodypart: "lrhand",
    weaponType: "BIGBLUNT",
    icon: "/items/drops/weapon_s/Dragon_Hunter_Axe.jpg",
    stats: {
      pAtk: 400, // 342 + 58
      mAtk: 190, // 132 + 58
      rCrit: 4,
      pAtkSpd: 385, // 325 + 60
    },
    description: "Сокира мисливця на драконів S-grade. Покращена версія з більшим уроном та швидкістю атаки.",
    soulshots: 1,
    spiritshots: 1,
  },
  {
    id: "quest_weapon_s_god_s_blade",
    itemId: 82,
    name: "God's Blade",
    grade: "S",
    type: "weapon",
    category: "sword",
    price: 100,
    bodypart: "rhand",
    weaponType: "SWORD",
    icon: "/items/drops/weapon_s/God_s_Blade.jpg",
    stats: {
      pAtk: 315, // 257 + 58
      mAtk: 182, // 124 + 58
      rCrit: 8,
      pAtkSpd: 439, // 379 + 60
    },
    description: "Клинок бога S-grade. Покращена версія з більшим уроном та швидкістю атаки.",
    soulshots: 1,
    spiritshots: 1,
  },
  {
    id: "quest_weapon_s_heaven_s_divider",
    itemId: 20166,
    name: "Heaven's Divider",
    grade: "S",
    type: "weapon",
    category: "bigsword",
    price: 100,
    bodypart: "lrhand",
    weaponType: "BIGSWORD",
    icon: "/items/drops/weapon_s/Heaven_s_Divider.jpg",
    stats: {
      pAtk: 400, // 342 + 58
      mAtk: 190, // 132 + 58
      rCrit: 8,
      pAtkSpd: 385, // 325 + 60
    },
    description: "Роздільник небес S-grade. Покращена версія з більшим уроном та швидкістю атаки.",
    soulshots: 1,
    spiritshots: 1,
  },
  {
    id: "quest_weapon_s_imperial_staff",
    itemId: 20171,
    name: "Imperial Staff",
    grade: "S",
    type: "weapon",
    category: "bigblunt",
    price: 100,
    bodypart: "lrhand",
    weaponType: "BIGBLUNT",
    icon: "/items/drops/weapon_s/Imperial_Staff.jpg",
    stats: {
      pAtk: 332, // 274 + 58
      mAtk: 233, // 175 + 58
      rCrit: 4,
      pAtkSpd: 385, // 325 + 60
    },
    description: "Імператорський посох S-grade. Покращена версія з більшим уроном та швидкістю атаки.",
    soulshots: 1,
    spiritshots: 1,
  },
  {
    id: "quest_weapon_s_saint_spear",
    itemId: 20174,
    name: "Saint Spear",
    grade: "S",
    type: "weapon",
    category: "pole",
    price: 100,
    bodypart: "lrhand",
    weaponType: "POLE",
    icon: "/items/drops/weapon_s/Saint_Spear.jpg",
    stats: {
      pAtk: 339, // 281 + 58
      mAtk: 190, // 132 + 58
      rCrit: 8,
      pAtkSpd: 385, // 325 + 60
    },
    description: "Святий спіс S-grade. Покращена версія з більшим уроном та швидкістю атаки.",
    soulshots: 1,
    spiritshots: 1,
  },
  {
    id: "quest_weapon_s_shining_bow",
    itemId: 2500,
    name: "Shining Bow",
    grade: "S",
    type: "weapon",
    category: "bow",
    price: 100,
    bodypart: "lrhand",
    weaponType: "BOW",
    icon: "/items/drops/weapon_s/Shining_Bow.jpg",
    stats: {
      pAtk: 638, // 580 + 58
      mAtk: 193, // 135 + 58
      rCrit: 12,
      pAtkSpd: 353, // 293 + 60
    },
    description: "Сяючий лук S-grade. Покращена версія з більшим уроном та швидкістю атаки.",
    soulshots: 1,
    spiritshots: 1,
  },
];

// D-грейд сети
export const QUEST_SHOP_SETS: ShopItem[] = [
  // ===== БРОНЯ - СЕТ OATH (Magic Armor Set - Robe) =====
  {
    id: "quest_shop_oath_helm",
    itemId: 7850,
    name: "Oath Helm",
    grade: "D",
    type: "armor",
    category: "helmet",
    price: 100, // Ціна в Серебряных Монетах
    bodypart: "head",
    icon: "/items/drops/arrom_d/Oath_Helm.jpg",
    stats: {
      pDef: 37,
    },
    description: "Шолом клятви D-grade (Oath Set).",
  },
  {
    id: "quest_shop_oath_aketon",
    itemId: 7857,
    name: "Oath Aketon",
    grade: "D",
    type: "armor",
    category: "chest",
    price: 150,
    bodypart: "chest",
    icon: "/items/drops/arrom_d/Oath_Aketon.jpg",
    stats: {
      pDef: 80,
      mDef: 50,
    },
    description: "Акетон клятви D-grade (Oath Set).",
  },
  {
    id: "quest_shop_oath_padded_gloves_robe",
    itemId: 7858,
    name: "Oath Padded Gloves",
    grade: "D",
    type: "armor",
    category: "gloves",
    price: 80,
    bodypart: "gloves",
    icon: "/items/drops/arrom_d/Oath_Gloves.jpg",
    stats: {
      pDef: 20,
      mDef: 15,
    },
    description: "Підбиті рукавиці клятви D-grade (Oath Set).",
  },
  {
    id: "quest_shop_oath_sandals_robe",
    itemId: 7859,
    name: "Oath Sandals",
    grade: "D",
    type: "armor",
    category: "boots",
    price: 70,
    bodypart: "feet",
    icon: "/items/drops/arrom_d/Oath_Sandals.jpg",
    stats: {
      pDef: 18,
      mDef: 12,
    },
    description: "Сандалі клятви D-grade (Oath Set).",
  },

  // ===== БРОНЯ - СЕТ SHADOW OATH (Heavy Armor Set) =====
  {
    id: "quest_shop_shadow_oath_helm",
    itemId: 10024, // Унікальний ID
    name: "Shadow Oath Helm",
    grade: "D",
    type: "armor",
    category: "helmet",
    price: 130, // Ціна в Серебряных Монетах
    bodypart: "head",
    icon: "/items/drops/arrom_d/Shadow_Oath_Helm.jpg",
    stats: {
      pDef: 50,
    },
    description: "Шолом тіні клятви D-grade (Shadow Oath Set).",
  },
  {
    id: "quest_shop_shadow_oath_armor",
    itemId: 10025, // Унікальний ID
    name: "Shadow Oath Armor",
    grade: "D",
    type: "armor",
    category: "chest",
    price: 200,
    bodypart: "chest",
    icon: "/items/drops/arrom_d/Shadow_Oath_Armor.jpg",
    stats: {
      pDef: 100,
    },
    description: "Броня тіні клятви D-grade (Shadow Oath Set).",
  },
  {
    id: "quest_shop_shadow_oath_gauntlets",
    itemId: 10026, // Унікальний ID
    name: "Shadow Oath Gauntlets",
    grade: "D",
    type: "armor",
    category: "gloves",
    price: 110,
    bodypart: "gloves",
    icon: "/items/drops/arrom_d/Shadow_Oath_Gauntlets.jpg",
    stats: {
      pDef: 35,
    },
    description: "Рукавиці тіні клятви D-grade (Shadow Oath Set).",
  },
  {
    id: "quest_shop_shadow_oath_sabaton",
    itemId: 10027, // Унікальний ID
    name: "Shadow Oath Sabaton",
    grade: "D",
    type: "armor",
    category: "boots",
    price: 95,
    bodypart: "feet",
    icon: "/items/drops/arrom_d/Shadow_Oath_Sabaton.jpg",
    stats: {
      pDef: 30,
    },
    description: "Сабатони тіні клятви D-grade (Shadow Oath Set).",
  },

  // ===== БРОНЯ - СЕТ DIVINE (Magic Armor Set - Robe) C-GRADE =====
  {
    id: "quest_shop_divine_helmet",
    itemId: 10029, // Унікальний ID
    name: "Divine Helmet",
    grade: "C",
    type: "armor",
    category: "helmet",
    price: 200, // Ціна в Серебряных Монетах
    bodypart: "head",
    icon: "/items/drops/arrom_c/Divine_helmet.jpg",
    stats: {
      pDef: 90,
      mDef: 60,
    },
    description: "Шолом божественності C-grade (Divine Set).",
  },
  {
    id: "quest_shop_divine_tunic",
    itemId: 10030, // Унікальний ID
    name: "Divine Tunic",
    grade: "C",
    type: "armor",
    category: "chest",
    price: 300,
    bodypart: "chest",
    icon: "/items/drops/arrom_c/Divine_Tunic.jpg",
    stats: {
      pDef: 140,
      mDef: 95,
    },
    description: "Туніка божественності C-grade (Divine Set).",
  },
  {
    id: "quest_shop_divine_stockings",
    itemId: 10031, // Унікальний ID
    name: "Divine Stockings",
    grade: "C",
    type: "armor",
    category: "legs",
    price: 250,
    bodypart: "legs",
    icon: "/items/drops/arrom_c/Divine_Stockings.jpg",
    stats: {
      pDef: 85,
      mDef: 55,
    },
    description: "Панчохи божественності C-grade (Divine Set).",
  },
  {
    id: "quest_shop_divine_gloves",
    itemId: 10032, // Унікальний ID
    name: "Divine Gloves",
    grade: "C",
    type: "armor",
    category: "gloves",
    price: 180,
    bodypart: "gloves",
    icon: "/items/drops/arrom_c/Divine_Gloves.jpg",
    stats: {
      pDef: 50,
      mDef: 40,
    },
    description: "Рукавиці божественності C-grade (Divine Set).",
  },
  {
    id: "quest_shop_divine_boots",
    itemId: 10033, // Унікальний ID
    name: "Divine Boots",
    grade: "C",
    type: "armor",
    category: "boots",
    price: 160,
    bodypart: "feet",
    icon: "/items/drops/arrom_c/Divine_boots.jpg",
    stats: {
      pDef: 45,
      mDef: 35,
    },
    description: "Черевики божественності C-grade (Divine Set).",
  },

  // ===== БРОНЯ - СЕТ DRAKE LEATHER (Light Armor Set) C-GRADE =====
  {
    id: "quest_shop_drake_leather_helmet",
    itemId: 10034, // Унікальний ID
    name: "Drake Leather Helmet",
    grade: "C",
    type: "armor",
    category: "helmet",
    price: 220, // Ціна в Серебряных Монетах
    bodypart: "head",
    icon: "/items/drops/arrom_c/Drake_Leather_Helmet.jpg",
    stats: {
      pDef: 95,
    },
    description: "Шолом зі шкіри дракона C-grade (Drake Leather Set).",
  },
  {
    id: "quest_shop_drake_leather_armor",
    itemId: 10035, // Унікальний ID
    name: "Drake Leather Armor",
    grade: "C",
    type: "armor",
    category: "chest",
    price: 320,
    bodypart: "chest",
    icon: "/items/drops/arrom_c/Drake_Leather_Armor.jpg",
    stats: {
      pDef: 145,
    },
    description: "Броня зі шкіри дракона C-grade (Drake Leather Set).",
  },
  {
    id: "quest_shop_drake_leather_gloves",
    itemId: 10036, // Унікальний ID
    name: "Drake Leather Gloves",
    grade: "C",
    type: "armor",
    category: "gloves",
    price: 200,
    bodypart: "gloves",
    icon: "/items/drops/arrom_c/Drake_Leather_Gloves.jpg",
    stats: {
      pDef: 55,
    },
    description: "Рукавиці зі шкіри дракона C-grade (Drake Leather Set).",
  },
  {
    id: "quest_shop_drake_leather_boots",
    itemId: 10037, // Унікальний ID
    name: "Drake Leather Boots",
    grade: "C",
    type: "armor",
    category: "boots",
    price: 180,
    bodypart: "feet",
    icon: "/items/drops/arrom_c/Drake_Leather_Boots.jpg",
    stats: {
      pDef: 48,
    },
    description: "Черевики зі шкіри дракона C-grade (Drake Leather Set).",
  },

  // ===== БРОНЯ - СЕТ DOOM (Magic Armor Set - Robe) B-GRADE =====
  {
    id: "quest_shop_doom_helmet",
    itemId: 10039, // Унікальний ID
    name: "Doom Helmet",
    grade: "B",
    type: "armor",
    category: "helmet",
    price: 350, // Ціна в Серебряных Монетах
    bodypart: "head",
    icon: "/items/drops/arrom_b/Doom_Helmet.jpg",
    stats: {
      pDef: 130,
      mDef: 100,
    },
    description: "Шолом загибелі B-grade (Doom Set).",
  },
  {
    id: "quest_shop_doom_tunic",
    itemId: 10040, // Унікальний ID
    name: "Tunic of Doom",
    grade: "B",
    type: "armor",
    category: "chest",
    price: 500,
    bodypart: "chest",
    icon: "/items/drops/arrom_b/Tunic_of_Doom.jpg",
    stats: {
      pDef: 190,
      mDef: 140,
    },
    description: "Туніка загибелі B-grade (Doom Set).",
  },
  {
    id: "quest_shop_doom_stockings",
    itemId: 10041, // Унікальний ID
    name: "Stockings of Doom",
    grade: "B",
    type: "armor",
    category: "legs",
    price: 400,
    bodypart: "legs",
    icon: "/items/drops/arrom_b/Stockings_of_Doom.jpg",
    stats: {
      pDef: 100,
      mDef: 75,
    },
    description: "Панчохи загибелі B-grade (Doom Set).",
  },
  {
    id: "quest_shop_doom_gloves",
    itemId: 10042, // Унікальний ID
    name: "Doom Gloves",
    grade: "B",
    type: "armor",
    category: "gloves",
    price: 300,
    bodypart: "gloves",
    icon: "/items/drops/arrom_b/Doom_Gloves.jpg",
    stats: {
      pDef: 75,
      mDef: 60,
    },
    description: "Рукавиці загибелі B-grade (Doom Set).",
  },
  {
    id: "quest_shop_doom_boots",
    itemId: 10043, // Унікальний ID
    name: "Doom Boots",
    grade: "B",
    type: "armor",
    category: "boots",
    price: 280,
    bodypart: "feet",
    icon: "/items/drops/arrom_b/Doom_Boots.jpg",
    stats: {
      pDef: 70,
      mDef: 55,
    },
    description: "Черевики загибелі B-grade (Doom Set).",
  },

  // ===== ЩИТИ =====
  {
    id: "quest_shop_monster_shield_d",
    itemId: 10028, // Унікальний ID
    name: "Monster Shield",
    grade: "D",
    type: "armor",
    category: "shield",
    price: 150, // Ціна в Серебряных Монетах
    bodypart: "lhand",
    icon: "/items/drops/arrom_d/monster.jpg",
    stats: {
      pDef: 50,
      shieldBlockRate: 20, // +20% шанс блока щитом
      maxHp: 150, // +150 HP
    },
    description: "Щит монстра D-grade. +50 физ защ, +20% шанс блока щитом, +150 HP.",
  },
  {
    id: "quest_shop_monster_shield_c",
    itemId: 10038, // Унікальний ID
    name: "Monster Shield",
    grade: "C",
    type: "armor",
    category: "shield",
    price: 280, // Ціна в Серебряных Монетах
    bodypart: "lhand",
    icon: "/items/drops/arrom_d/monster.jpg",
    stats: {
      pDef: 150,
      shieldBlockRate: 30, // +30% шанс блока щитом
      maxHp: 250, // +250 HP
    },
    description: "Щит монстра C-grade. +150 физ защ, +30% шанс блока щитом, +250 HP.",
  },
  {
    id: "quest_shop_monster_shield_b",
    itemId: 10044, // Унікальний ID
    name: "Monster Shield",
    grade: "B",
    type: "armor",
    category: "shield",
    price: 450, // Ціна в Серебряных Монетах
    bodypart: "lhand",
    icon: "/items/drops/arrom_d/monster.jpg",
    stats: {
      pDef: 200,
      shieldBlockRate: 35, // +35% шанс блока щитом
      maxHp: 300, // +300 HP
      pDefPercent: 5, // +5% физ защ
      mDefPercent: 5, // +5% маг защ
    },
    description: "Щит монстра B-grade. +200 физ защ, +35% шанс блока щитом, +300 HP, +5% физ и маг защ.",
  },

  // ===== БРОНЯ - СЕТ BOUND BLUE WOLF (Light Armor Set) B-GRADE =====
  {
    id: "quest_shop_bound_blue_wolf_helmet",
    itemId: 10045, // Унікальний ID
    name: "Bound Blue Wolf Helmet",
    grade: "B",
    type: "armor",
    category: "helmet",
    price: 400, // Ціна в Серебряных Монетах
    bodypart: "head",
    icon: "/items/drops/arrom_b/Bound_Blue_Wolf_Helmet.jpg",
    stats: {
      pDef: 135,
    },
    description: "Шолом зв'язаного синього вовка B-grade (Bound Blue Wolf Set).",
  },
  {
    id: "quest_shop_bound_blue_wolf_armor",
    itemId: 10046, // Унікальний ID
    name: "Bound Blue Wolf Leather Armor",
    grade: "B",
    type: "armor",
    category: "chest",
    price: 550,
    bodypart: "chest",
    icon: "/items/drops/arrom_b/Bound_Blue_Wolf_Leather_Armor.jpg",
    stats: {
      pDef: 195,
    },
    description: "Броня зв'язаного синього вовка B-grade (Bound Blue Wolf Set).",
  },
  {
    id: "quest_shop_bound_blue_wolf_gloves",
    itemId: 10047, // Унікальний ID
    name: "Bound Blue Wolf Gloves",
    grade: "B",
    type: "armor",
    category: "gloves",
    price: 350,
    bodypart: "gloves",
    icon: "/items/drops/arrom_b/Bound_Blue_Wolf_Gloves.jpg",
    stats: {
      pDef: 85,
    },
    description: "Рукавиці зв'язаного синього вовка B-grade (Bound Blue Wolf Set).",
  },
  {
    id: "quest_shop_bound_blue_wolf_boots",
    itemId: 10048, // Унікальний ID
    name: "Bound Blue Wolf Boots",
    grade: "B",
    type: "armor",
    category: "boots",
    price: 320,
    bodypart: "feet",
    icon: "/items/drops/arrom_b/Bound_Blue_Wolf_Boots.jpg",
    stats: {
      pDef: 80,
    },
    description: "Черевики зв'язаного синього вовка B-grade (Bound Blue Wolf Set).",
  },

  // ===== БРОНЯ - СЕТ ZUBEI'S (Heavy Armor Set) B-GRADE =====
  {
    id: "quest_shop_zubeis_helmet",
    itemId: 10049, // Унікальний ID
    name: "Zubei's Helmet",
    grade: "B",
    type: "armor",
    category: "helmet",
    price: 450, // Ціна в Серебряных Монетах
    bodypart: "head",
    icon: "/items/drops/arrom_b/Zubei's_Helmet.jpg",
    stats: {
      pDef: 145,
    },
    description: "Шолом Зубея B-grade (Zubei's Set).",
  },
  {
    id: "quest_shop_zubeis_breastplate",
    itemId: 10050, // Унікальний ID
    name: "Zubei's Breastplate",
    grade: "B",
    type: "armor",
    category: "chest",
    price: 600,
    bodypart: "chest",
    icon: "/items/drops/arrom_b/Zubei's_Breastplate.jpg",
    stats: {
      pDef: 210,
    },
    description: "Нагрудник Зубея B-grade (Zubei's Set).",
  },
  {
    id: "quest_shop_zubeis_gaiters",
    itemId: 10051, // Унікальний ID
    name: "Zubei's Gaiters",
    grade: "B",
    type: "armor",
    category: "legs",
    price: 500,
    bodypart: "legs",
    icon: "/items/drops/arrom_b/Zubei's_Gaiters.jpg",
    stats: {
      pDef: 130,
    },
    description: "Штани Зубея B-grade (Zubei's Set).",
  },
  {
    id: "quest_shop_zubeis_gauntlets",
    itemId: 10052, // Унікальний ID
    name: "Zubei's Gauntlets",
    grade: "B",
    type: "armor",
    category: "gloves",
    price: 400,
    bodypart: "gloves",
    icon: "/items/drops/arrom_b/Zubei's_Gauntlets.jpg",
    stats: {
      pDef: 90,
    },
    description: "Рукавиці Зубея B-grade (Zubei's Set).",
  },
  {
    id: "quest_shop_zubeis_boots",
    itemId: 10053, // Унікальний ID
    name: "Zubei's Boots",
    grade: "B",
    type: "armor",
    category: "boots",
    price: 380,
    bodypart: "feet",
    icon: "/items/drops/arrom_b/Zubei's_Boot.jpg",
    stats: {
      pDef: 85,
    },
    description: "Черевики Зубея B-grade (Zubei's Set).",
  },

  // ===== БРОНЯ - СЕТ MAJESTIC HEAVY (Heavy Armor Set) A-GRADE =====
  {
    id: "quest_shop_majestic_heavy_circlet",
    itemId: 10065, // Унікальний ID
    name: "Majestic Circlet",
    grade: "A",
    type: "armor",
    category: "helmet",
    price: 800, // Ціна в Серебряных Монетах
    bodypart: "head",
    icon: "/items/drops/arrom_а/Majesticc_Circlet.jpg",
    stats: {
      pDef: 200,
    },
    description: "Діадема величі A-grade (Majestic Heavy Set).",
  },
  {
    id: "quest_shop_majestic_heavy_plate_armor",
    itemId: 10066, // Унікальний ID
    name: "Majestic Plate Armor",
    grade: "A",
    type: "armor",
    category: "chest",
    price: 1200,
    bodypart: "chest",
    icon: "/items/drops/arrom_а/Majesticc_Plate_Armor.jpg",
    stats: {
      pDef: 300,
    },
    description: "Пластинчаста броня величі A-grade (Majestic Heavy Set).",
  },
  {
    id: "quest_shop_majestic_heavy_gauntlets",
    itemId: 10067, // Унікальний ID
    name: "Majestic Gauntlets",
    grade: "A",
    type: "armor",
    category: "gloves",
    price: 600,
    bodypart: "gloves",
    icon: "/items/drops/arrom_а/Majesticc_Gauntlets.jpg",
    stats: {
      pDef: 120,
    },
    description: "Рукавиці величі A-grade (Majestic Heavy Set).",
  },
  {
    id: "quest_shop_majestic_heavy_boots",
    itemId: 10068, // Унікальний ID
    name: "Majestic Boots",
    grade: "A",
    type: "armor",
    category: "boots",
    price: 550,
    bodypart: "feet",
    icon: "/items/drops/arrom_а/Majesticc_Boots.jpg",
    stats: {
      pDef: 110,
    },
    description: "Черевики величі A-grade (Majestic Heavy Set).",
  },

  // ===== БРОНЯ - СЕТ NIGHTMARE LIGHT (Light Armor Set) A-GRADE =====
  {
    id: "quest_shop_nightmare_light_helm",
    itemId: 10070, // Унікальний ID
    name: "Helm of Nightmare",
    grade: "A",
    type: "armor",
    category: "helmet",
    price: 750, // Ціна в Серебряных Монетах
    bodypart: "head",
    icon: "/items/drops/arrom_а/Helm_of_Nightmare.jpg",
    stats: {
      pDef: 190,
    },
    description: "Шолом кошмару A-grade (Nightmare Light Set).",
  },
  {
    id: "quest_shop_nightmare_light_leather_armor",
    itemId: 10071, // Унікальний ID
    name: "Leather Armor of Nightmare",
    grade: "A",
    type: "armor",
    category: "chest",
    price: 1100,
    bodypart: "chest",
    icon: "/items/drops/arrom_а/Bound_Leather_Armor_of_Nightmare.jpg",
    stats: {
      pDef: 280,
    },
    description: "Шкіряна броня кошмару A-grade (Nightmare Light Set).",
  },
  {
    id: "quest_shop_nightmare_light_gauntlets",
    itemId: 10072, // Унікальний ID
    name: "Gauntlets of Nightmare",
    grade: "A",
    type: "armor",
    category: "gloves",
    price: 550,
    bodypart: "gloves",
    icon: "/items/drops/arrom_а/Gauntlets_of_Nightmare.jpg",
    stats: {
      pDef: 110,
    },
    description: "Рукавиці кошмару A-grade (Nightmare Light Set).",
  },
  {
    id: "quest_shop_nightmare_light_boots",
    itemId: 10073, // Унікальний ID
    name: "Boots of Nightmare",
    grade: "A",
    type: "armor",
    category: "boots",
    price: 500,
    bodypart: "feet",
    icon: "/items/drops/arrom_а/Boots_of_Nightmare.jpg",
    stats: {
      pDef: 100,
    },
    description: "Черевики кошмару A-grade (Nightmare Light Set).",
  },

  // ===== БРОНЯ - СЕТ BOUND DARK CRYSTAL (Magic Armor Set - Robe) A-GRADE =====
  {
    id: "quest_shop_bound_dark_crystal_helmet",
    itemId: 10075, // Унікальний ID
    name: "Bound Dark Crystal Helmet",
    grade: "A",
    type: "armor",
    category: "helmet",
    price: 900, // Ціна в Серебряных Монетах
    bodypart: "head",
    icon: "/items/drops/arrom_а/Bound_Dark_Crystal_Helmet.jpg",
    stats: {
      pDef: 160,
      mDef: 130,
    },
    description: "Шолом зв'язаного темного кристалу A-grade (Bound Dark Crystal Set).",
  },
  {
    id: "quest_shop_bound_dark_crystal_robe",
    itemId: 10076, // Унікальний ID
    name: "Bound Dark Crystal Robe",
    grade: "A",
    type: "armor",
    category: "chest",
    price: 1300,
    bodypart: "chest",
    icon: "/items/drops/arrom_а/Bound_Dark_Crystal_Robe.jpg",
    stats: {
      pDef: 230,
      mDef: 190,
    },
    description: "Мантія зв'язаного темного кристалу A-grade (Bound Dark Crystal Set).",
  },
  {
    id: "quest_shop_bound_dark_crystal_gloves",
    itemId: 10077, // Унікальний ID
    name: "Bound Dark Crystal Gloves",
    grade: "A",
    type: "armor",
    category: "gloves",
    price: 650,
    bodypart: "gloves",
    icon: "/items/drops/arrom_а/Bound_Dark_Crystal_Gloves.jpg",
    stats: {
      pDef: 95,
      mDef: 80,
    },
    description: "Рукавиці зв'язаного темного кристалу A-grade (Bound Dark Crystal Set).",
  },
  {
    id: "quest_shop_bound_dark_crystal_boots",
    itemId: 10078, // Унікальний ID
    name: "Bound Dark Crystal Boots",
    grade: "A",
    type: "armor",
    category: "boots",
    price: 600,
    bodypart: "feet",
    icon: "/items/drops/arrom_а/Bound_Dark_Crystal_Boots.jpg",
    stats: {
      pDef: 90,
      mDef: 75,
    },
    description: "Черевики зв'язаного темного кристалу A-grade (Bound Dark Crystal Set).",
  },

  // ===== ЩИТИ =====
  // Monster Shield (A-grade)
  {
    id: "quest_shop_monster_shield_a",
    itemId: 10080, // Унікальний ID
    name: "Monster Shield",
    grade: "A",
    type: "armor",
    category: "shield",
    price: 1000, // Ціна в Серебряных Монетах
    bodypart: "lhand",
    icon: "/items/drops/arrom_а/monster.jpg",
    stats: {
      pDef: 350,
      mDef: 150,
      maxHpPercent: 5,
      pAtkPercent: 5,
      mAtkPercent: 5,
      maxHp: 300,
    },
    description: "Щит монстра A-grade.",
  },

  // ===== БРОНЯ - СЕТ MOIRAI (Magic Armor Set - Robe) S-GRADE =====
  {
    id: "quest_shop_moirai_circlet",
    itemId: 10085, // Унікальний ID
    name: "Moirai Circlet",
    grade: "S",
    type: "armor",
    category: "helmet",
    price: 1200, // Ціна в Серебряных Монетах
    bodypart: "head",
    icon: "/items/drops/arrom_s/Moirai_Circlet.jpg",
    stats: {
      pDef: 210,
      mDef: 170,
    },
    description: "Діадема мойр S-grade (Moirai Set).",
  },
  {
    id: "quest_shop_moirai_tunic",
    itemId: 10086, // Унікальний ID
    name: "Moirai Tunic",
    grade: "S",
    type: "armor",
    category: "chest",
    price: 1800,
    bodypart: "chest",
    icon: "/items/drops/arrom_s/Moirai_Tunic.jpg",
    stats: {
      pDef: 290,
      mDef: 240,
    },
    description: "Туніка мойр S-grade (Moirai Set).",
  },
  {
    id: "quest_shop_moirai_stockings",
    itemId: 10087, // Унікальний ID
    name: "Moirai Stockings",
    grade: "S",
    type: "armor",
    category: "legs",
    price: 1400,
    bodypart: "legs",
    icon: "/items/drops/arrom_s/Moirai_Stockings.jpg",
    stats: {
      pDef: 180,
      mDef: 150,
    },
    description: "Панчохи мойр S-grade (Moirai Set).",
  },
  {
    id: "quest_shop_moirai_gloves",
    itemId: 10088, // Унікальний ID
    name: "Moirai Gloves",
    grade: "S",
    type: "armor",
    category: "gloves",
    price: 1000,
    bodypart: "gloves",
    icon: "/items/drops/arrom_s/Moirai_Gloves.jpg",
    stats: {
      pDef: 130,
      mDef: 110,
    },
    description: "Рукавиці мойр S-grade (Moirai Set).",
  },
  {
    id: "quest_shop_moirai_shoes",
    itemId: 10089, // Унікальний ID
    name: "Moirai Shoes",
    grade: "S",
    type: "armor",
    category: "boots",
    price: 950,
    bodypart: "feet",
    icon: "/items/drops/arrom_s/Moirai_Shoes.jpg",
    stats: {
      pDef: 120,
      mDef: 100,
    },
    description: "Черевики мойр S-grade (Moirai Set).",
  },

  // ===== БРОНЯ - СЕТ VESPER (Heavy Armor Set) S-GRADE =====
  {
    id: "quest_shop_vesper_helmet",
    itemId: 10090, // Унікальний ID
    name: "Vesper Helmet",
    grade: "S",
    type: "armor",
    category: "helmet",
    price: 1500, // Ціна в Серебряных Монетах
    bodypart: "head",
    icon: "/items/drops/arrom_s/Vesper_Helmet.jpg",
    stats: {
      pDef: 240,
    },
    description: "Шолом веспера S-grade (Vesper Set).",
  },
  {
    id: "quest_shop_vesper_breastplate",
    itemId: 10091, // Унікальний ID
    name: "Vesper Breastplate",
    grade: "S",
    type: "armor",
    category: "chest",
    price: 2200,
    bodypart: "chest",
    icon: "/items/drops/arrom_s/Vesper_Breastplate.jpg",
    stats: {
      pDef: 340,
    },
    description: "Нагрудник веспера S-grade (Vesper Set).",
  },
  {
    id: "quest_shop_vesper_gaiters",
    itemId: 10092, // Унікальний ID
    name: "Vesper Gaiters",
    grade: "S",
    type: "armor",
    category: "legs",
    price: 1800,
    bodypart: "legs",
    icon: "/items/drops/arrom_s/Vesper_Gaiters.jpg",
    stats: {
      pDef: 220,
    },
    description: "Штани веспера S-grade (Vesper Set).",
  },
  {
    id: "quest_shop_vesper_gauntlets",
    itemId: 10093, // Унікальний ID
    name: "Vesper Gauntlets",
    grade: "S",
    type: "armor",
    category: "gloves",
    price: 1300,
    bodypart: "gloves",
    icon: "/items/drops/arrom_s/Vesper_Gauntlets.jpg",
    stats: {
      pDef: 140,
    },
    description: "Рукавиці веспера S-grade (Vesper Set).",
  },
  {
    id: "quest_shop_vesper_boots",
    itemId: 10094, // Унікальний ID
    name: "Vesper Boots",
    grade: "S",
    type: "armor",
    category: "boots",
    price: 1200,
    bodypart: "feet",
    icon: "/items/drops/arrom_s/Vesper_Boots.jpg",
    stats: {
      pDef: 130,
    },
    description: "Черевики веспера S-grade (Vesper Set).",
  },

  // ===== БРОНЯ - СЕТ VESPER LEATHER (Light Armor Set) S-GRADE =====
  {
    id: "quest_shop_vesper_leather_helmet",
    itemId: 10095, // Унікальний ID
    name: "Vesper Leather Helmet",
    grade: "S",
    type: "armor",
    category: "helmet",
    price: 1400, // Ціна в Серебряных Монетах
    bodypart: "head",
    icon: "/items/drops/arrom_s/Vesper_Leather_Helmet.jpg",
    stats: {
      pDef: 200,
    },
    description: "Шолом весперської шкіри S-grade (Vesper Leather Set).",
  },
  {
    id: "quest_shop_vesper_leather_breastplate",
    itemId: 10096, // Унікальний ID
    name: "Vesper Leather Breastplate",
    grade: "S",
    type: "armor",
    category: "chest",
    price: 2000,
    bodypart: "chest",
    icon: "/items/drops/arrom_s/Vesper_Leather_Breastplate.jpg",
    stats: {
      pDef: 280,
    },
    description: "Нагрудник весперської шкіри S-grade (Vesper Leather Set).",
  },
  {
    id: "quest_shop_vesper_leather_leggings",
    itemId: 10097, // Унікальний ID
    name: "Vesper Leather Leggings",
    grade: "S",
    type: "armor",
    category: "legs",
    price: 1600,
    bodypart: "legs",
    icon: "/items/drops/arrom_s/Vesper_Leather_Leggings.jpg",
    stats: {
      pDef: 190,
    },
    description: "Штани весперської шкіри S-grade (Vesper Leather Set).",
  },
  {
    id: "quest_shop_vesper_leather_gloves",
    itemId: 10098, // Унікальний ID
    name: "Vesper Leather Gloves",
    grade: "S",
    type: "armor",
    category: "gloves",
    price: 1100,
    bodypart: "gloves",
    icon: "/items/drops/arrom_s/Vesper_Leather_Gloves.jpg",
    stats: {
      pDef: 115,
    },
    description: "Рукавиці весперської шкіри S-grade (Vesper Leather Set).",
  },
  {
    id: "quest_shop_vesper_leather_boots",
    itemId: 10099, // Унікальний ID
    name: "Vesper Leather Boots",
    grade: "S",
    type: "armor",
    category: "boots",
    price: 1000,
    bodypart: "feet",
    icon: "/items/drops/arrom_s/Vesper_Leather_Boots.jpg",
    stats: {
      pDef: 105,
    },
    description: "Черевики весперської шкіри S-grade (Vesper Leather Set).",
  },

  // ===== ЩИТИ =====
  // Vesper Shield (S-grade)
  {
    id: "quest_shop_vesper_shield",
    itemId: 10100, // Унікальний ID
    name: "Vesper Shield",
    grade: "S",
    type: "armor",
    category: "shield",
    price: 1500, // Ціна в Серебряных Монетах
    bodypart: "lhand",
    icon: "/items/drops/arrom_s/Vesper_Shield.jpg",
    stats: {
      pDef: 400,
      mDef: 150,
      maxHp: 400,
      maxHpPercent: 6,
      pAtkPercent: 6,
      mAtkPercent: 6,
    },
    description: "Щит веспера S-grade. +400 физ защ, +150 маг защ, +400 HP, +6% HP, +6% физ урон, +6% маг урон.",
  },

  // ===== БРОНЯ - СЕТ SHADOW (Light Armor Set) =====
  {
    id: "quest_shop_shadow_helm",
    itemId: 10020, // Унікальний ID
    name: "Shadow Helm",
    grade: "D",
    type: "armor",
    category: "helmet",
    price: 120, // Ціна в Серебряных Монетах
    bodypart: "head",
    icon: "/items/drops/arrom_d/Shadow_Helm.jpg",
    stats: {
      pDef: 40,
    },
    description: "Шолом тіні D-grade (Shadow Set).",
  },
  {
    id: "quest_shop_shadow_brigandine",
    itemId: 10021, // Унікальний ID
    name: "Shadow Brigandine",
    grade: "D",
    type: "armor",
    category: "chest",
    price: 180,
    bodypart: "chest",
    icon: "/items/drops/arrom_d/Shadow_Brigandine.jpg",
    stats: {
      pDef: 85,
    },
    description: "Бригантина тіні D-grade (Shadow Set).",
  },
  {
    id: "quest_shop_shadow_gloves",
    itemId: 10022, // Унікальний ID
    name: "Shadow Gloves",
    grade: "D",
    type: "armor",
    category: "gloves",
    price: 100,
    bodypart: "gloves",
    icon: "/items/drops/arrom_d/Shadow_Gloves.jpg",
    stats: {
      pDef: 30,
    },
    description: "Рукавиці тіні D-grade (Shadow Set).",
  },
  {
    id: "quest_shop_shadow_boots",
    itemId: 10023, // Унікальний ID
    name: "Shadow Boots",
    grade: "D",
    type: "armor",
    category: "boots",
    price: 90,
    bodypart: "feet",
    icon: "/items/drops/arrom_d/Shadow_Boots.jpg",
    stats: {
      pDef: 25,
    },
    description: "Черевики тіні D-grade (Shadow Set).",
  },
];

// Тату
export const QUEST_SHOP_TATTOOS: ShopItem[] = [
  {
    id: "quest_shop_tattoo_magic",
    itemId: 10001, // Унікальний ID
    name: "Тату Магії",
    grade: "S",
    type: "tattoo",
    category: "tattoo",
    price: 150, // Ціна в Серебряных Монетах
    bodypart: "tattoo",
    icon: "/items/drops/item/r85_talisman_ma_up_passive_0.jpg",
    stats: {
      castSpeed: 50,
      mAtk: 50,
    },
    description: "Магічне тату, що збільшує швидкість каста на 50 та магічний урон на 50.",
  },
  {
    id: "quest_shop_tattoo_physical",
    itemId: 10002, // Унікальний ID
    name: "Тату Фізики",
    grade: "S",
    type: "tattoo",
    category: "tattoo",
    price: 150, // Ціна в Серебряных Монетах
    bodypart: "tattoo",
    icon: "/items/drops/item/r85_talisman_pa_up_active_0.jpg",
    stats: {
      pAtkSpd: 50,
      pAtk: 50,
    },
    description: "Фізичне тату, що збільшує швидкість атаки на 50 та фізичний урон на 50.",
  },
  {
    id: "quest_shop_tattoo_defense",
    itemId: 10003, // Унікальний ID
    name: "Тату Захисту",
    grade: "S",
    type: "tattoo",
    category: "tattoo",
    price: 150, // Ціна в Серебряных Монетах
    bodypart: "tattoo",
    icon: "/items/drops/item/r85_talisman_pd_up_active_0.jpg",
    stats: {
      pDef: 50,
      mDef: 50,
      maxHp: 150,
    },
    description: "Захисне тату, що збільшує фізичний та магічний захист на 50, а також максимальне HP на 150.",
  },
];

// Пояс та плащ
export const QUEST_SHOP_ACCESSORIES: ShopItem[] = [
  {
    id: "quest_shop_belt",
    itemId: 10004, // Унікальний ID
    name: "Пояс Захисту",
    grade: "S",
    type: "armor",
    category: "belt",
    price: 150, // Ціна в Серебряных Монетах
    bodypart: "belt",
    icon: "/items/drops/item/armor_belt_i02_0.jpg",
    stats: {
      maxHpPercent: 5,
    },
    description: "Міцний пояс, що збільшує максимальне HP на 5%.",
  },
  {
    id: "quest_shop_cloak",
    itemId: 10005, // Унікальний ID
    name: "Плащ Добра",
    grade: "S",
    type: "armor",
    category: "cloak",
    price: 150, // Ціна в Серебряных Монетах
    bodypart: "cloak",
    icon: "/items/drops/item/Amor_goodness_cloak_0.jpg",
    stats: {
      pDefPercent: 5,
      mDefPercent: 5,
      maxHp: 100,
    },
    description: "Плащ, що збільшує фізичний та магічний захист на 5%, а також максимальне HP на 100.",
  },
];

// Благословенні заточки
export const QUEST_SHOP_ENCHANT_SCROLLS: ShopItem[] = [
  {
    id: "quest_shop_d_bless_weapon",
    itemId: 10010,
    name: "Blessed Scroll: Enchant Weapon (D-grade)",
    grade: "D",
    type: "consumable",
    category: "enchant_scroll",
    price: 10,
    bodypart: "consumable",
    icon: "/items/drops/resources/bless-weapon-d.png",
    description: "Благословенна заточка для D-grade зброї. Шанс успіху 95%, безпечна заточка +3.",
  },
  {
    id: "quest_shop_d_bless_armor",
    itemId: 10011,
    name: "Blessed Scroll: Enchant Armor (D-grade)",
    grade: "D",
    type: "consumable",
    category: "enchant_scroll",
    price: 5,
    bodypart: "consumable",
    icon: "/items/drops/resources/bless-armor-d.png",
    description: "Благословенна заточка для D-grade броні. Шанс успіху 95%, безпечна заточка +3.",
  },
  {
    id: "quest_shop_c_bless_weapon",
    itemId: 10012,
    name: "Blessed Scroll: Enchant Weapon (C-grade)",
    grade: "C",
    type: "consumable",
    category: "enchant_scroll",
    price: 20,
    bodypart: "consumable",
    icon: "/items/drops/resources/bless-weapon-c.png",
    description: "Благословенна заточка для C-grade зброї. Шанс успіху 95%, безпечна заточка +3.",
  },
  {
    id: "quest_shop_c_bless_armor",
    itemId: 10013,
    name: "Blessed Scroll: Enchant Armor (C-grade)",
    grade: "C",
    type: "consumable",
    category: "enchant_scroll",
    price: 10,
    bodypart: "consumable",
    icon: "/items/drops/resources/bless-armor-c.png",
    description: "Благословенна заточка для C-grade броні. Шанс успіху 95%, безпечна заточка +3.",
  },
  {
    id: "quest_shop_b_bless_weapon",
    itemId: 10014,
    name: "Blessed Scroll: Enchant Weapon (B-grade)",
    grade: "B",
    type: "consumable",
    category: "enchant_scroll",
    price: 30,
    bodypart: "consumable",
    icon: "/items/drops/resources/bless-weapon-b.png",
    description: "Благословенна заточка для B-grade зброї. Шанс успіху 95%, безпечна заточка +3.",
  },
  {
    id: "quest_shop_b_bless_armor",
    itemId: 10015,
    name: "Blessed Scroll: Enchant Armor (B-grade)",
    grade: "B",
    type: "consumable",
    category: "enchant_scroll",
    price: 15,
    bodypart: "consumable",
    icon: "/items/drops/resources/bless-armor-b.png",
    description: "Благословенна заточка для B-grade броні. Шанс успіху 95%, безпечна заточка +3.",
  },
  {
    id: "quest_shop_a_bless_weapon",
    itemId: 10016,
    name: "Blessed Scroll: Enchant Weapon (A-grade)",
    grade: "A",
    type: "consumable",
    category: "enchant_scroll",
    price: 40,
    bodypart: "consumable",
    icon: "/items/drops/resources/bless-weapon-a.png",
    description: "Благословенна заточка для A-grade зброї. Шанс успіху 95%, безпечна заточка +3.",
  },
  {
    id: "quest_shop_a_bless_armor",
    itemId: 10017,
    name: "Blessed Scroll: Enchant Armor (A-grade)",
    grade: "A",
    type: "consumable",
    category: "enchant_scroll",
    price: 20,
    bodypart: "consumable",
    icon: "/items/drops/resources/bless-armor-a.png",
    description: "Благословенна заточка для A-grade броні. Шанс успіху 95%, безпечна заточка +3.",
  },
  {
    id: "quest_shop_s_bless_weapon",
    itemId: 10018,
    name: "Blessed Scroll: Enchant Weapon (S-grade)",
    grade: "S",
    type: "consumable",
    category: "enchant_scroll",
    price: 50,
    bodypart: "consumable",
    icon: "/items/drops/resources/bless-weapon-s.png",
    description: "Благословенна заточка для S-grade зброї. Шанс успіху 95%, безпечна заточка +3.",
  },
  {
    id: "quest_shop_s_bless_armor",
    itemId: 10019,
    name: "Blessed Scroll: Enchant Armor (S-grade)",
    grade: "S",
    type: "consumable",
    category: "enchant_scroll",
    price: 25,
    bodypart: "consumable",
    icon: "/items/drops/resources/bless-armor-s.png",
    description: "Благословенна заточка для S-grade броні. Шанс успіху 95%, безпечна заточка +3.",
  },
];

export const QUEST_SHOP_ITEMS: ShopItem[] = [
  ...QUEST_SHOP_WEAPONS,
  ...QUEST_SHOP_SETS,
  ...QUEST_SHOP_TATTOOS,
  ...QUEST_SHOP_ACCESSORIES,
  ...QUEST_SHOP_ENCHANT_SCROLLS,
];
