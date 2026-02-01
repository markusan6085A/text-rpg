// src/data/shop/itemMappings.ts
// Маппінг між числовими itemId (з XML) та string id (з itemsDB)

export const SHOP_ITEM_ID_MAPPING: Record<number, string> = {
  // D-Grade Mithril Set
  499: "mithril_helmet",
  58: "mithril_breastplate",
  59: "mithril_gaiters",
  61: "mithril_gloves",
  62: "mithril_boots",
  
  // D-Grade Reinforced Set
  44: "leather_helmet", // Використовуємо Leather Helmet як Reinforced Helmet
  394: "reinforced_leather_shirt",
  416: "reinforced_leather_gaiters",
  720: "reinforced_gloves",
  2422: "reinforced_leather_boots",
  
  // D-Grade Knowledge Set
  41: "cloth_cap", // Використовуємо Cloth Cap як Knowledge Helmet
  436: "tunic_of_knowledge",
  469: "stockings_of_knowledge",
  2447: "gloves_of_knowledge",
  2423: "boots_of_knowledge",
  
  // D-Grade Shields
  626: "bronze_shield",
  628: "hoplon",
  2494: "plate_shield",
  
  // D-Grade Jewelry - Rings
  879: "shop_jewelry_d_enchanted_ring",
  880: "shop_jewelry_d_black_pearl_ring",
  881: "shop_jewelry_d_elven_ring",
  882: "shop_jewelry_d_mithril_ring",
  890: "shop_jewelry_d_ring_of_devotion",
  
  // D-Grade Jewelry - Earrings
  847: "shop_jewelry_d_red_crescent_earing",
  848: "shop_jewelry_d_enchanted_earing",
  849: "shop_jewelry_d_tigerseye_earing",
  850: "shop_jewelry_d_elven_earing",
  851: "shop_jewelry_d_onyxbeastseye_earing",
  
  // D-Grade Jewelry - Necklaces
  910: "shop_jewelry_d_necklace_of_devotion",
  911: "shop_jewelry_d_enchanted_necklace",
  912: "shop_jewelry_d_near_forest_necklace",
  913: "shop_jewelry_d_elven_necklace",
  914: "shop_jewelry_d_necklace_of_darkness",
  
  // C-Grade Demon's Set
  20001: "demons_helmet",
  441: "demons_tunic",
  472: "demons_stockings",
  2459: "demons_gloves",
  2435: "demons_boots",
  
  // C-Grade Karmian Set
  20002: "karmian_helmet",
  439: "karmian_tunic",
  471: "karmian_stockings",
  2454: "karmian_gloves",
  2430: "karmian_boots",
  
  // C-Grade Plated Leather Set
  20003: "plated_leather_helmet",
  398: "plated_leather",
  418: "plated_leather_gaiters",
  2455: "plated_leather_gloves",
  2431: "plated_leather_boots",
  
  // C-Grade Shields
  107: "composite_shield",
  2497: "full_plate_shield",
  
  // C-Grade Jewelry - Rings
  883: "shop_jewelry_c_aquastone_ring",
  884: "shop_jewelry_c_ring_of_protection",
  885: "shop_jewelry_c_ring_of_ages",
  886: "shop_jewelry_c_ring_of_binding",
  888: "shop_jewelry_c_blessed_ring",
  
  // C-Grade Jewelry - Earrings
  852: "shop_jewelry_c_moonstone_earing",
  853: "shop_jewelry_c_earing_of_protection",
  854: "shop_jewelry_c_earing_of_binding",
  855: "shop_jewelry_c_nassens_earing",
  857: "shop_jewelry_c_blessed_earing",
  
  // C-Grade Jewelry - Necklaces
  915: "shop_jewelry_c_aquastone_necklace",
  916: "shop_jewelry_c_necklace_of_protection",
  917: "shop_jewelry_c_necklace_of_mermaid",
  919: "shop_jewelry_c_blessed_necklace",
  119: "shop_jewelry_c_necklace_of_binding",
  
  // B-Grade Avadon Set
  30001: "avadon_circlet",
  30002: "avadon_robe",
  30003: "avadon_gloves",
  30004: "avadon_boots",
  
  // B-Grade Shields
  673: "avadon_shield",
  110: "doom_shield",
  111: "shield_of_pledge",
  
  // B-Grade Blue Wolf Set
  2416: "blue_wolf_helmet",
  358: "blue_wolf_breastplate",
  2380: "blue_wolf_gaiters",
  2487: "blue_wolf_gloves",
  2439: "blue_wolf_boots",
  
  // B-Grade Doom of Fortune Set
  30008: "doom_helmet_of_fortune",
  30009: "leather_armor_of_doom_of_fortune",
  30010: "doom_gloves_of_fortune",
  30011: "doom_boots_of_fortune",
  
  // B-Grade Jewelry - Rings
  887: "shop_jewelry_b_adamantite_ring",
  891: "shop_jewelry_b_sages_ring",
  892: "shop_jewelry_b_paradia_ring",
  894: "shop_jewelry_b_ring_of_solar_eclipse",
  895: "shop_jewelry_b_ring_of_black_ore",
  896: "shop_jewelry_b_ring_of_summoning",
  897: "shop_jewelry_b_otherworldly_ring",
  898: "shop_jewelry_b_elemental_ring",
  900: "shop_jewelry_b_ring_of_grace",
  901: "shop_jewelry_b_ring_of_holy_spirit",
  904: "shop_jewelry_b_ring_of_aid",
  905: "shop_jewelry_b_ring_of_blessing",
  
  // B-Grade Jewelry - Earrings
  856: "shop_jewelry_b_adamantite_earring",
  859: "shop_jewelry_b_earring_of_mana",
  860: "shop_jewelry_b_sages_earring",
  861: "shop_jewelry_b_paradia_earring",
  863: "shop_jewelry_b_earring_of_solar_eclipse",
  864: "shop_jewelry_b_earring_of_black_ore",
  865: "shop_jewelry_b_earring_of_summoning",
  866: "shop_jewelry_b_otherworldly_earring",
  867: "shop_jewelry_b_elemental_earring",
  869: "shop_jewelry_b_earring_of_grace",
  870: "shop_jewelry_b_earring_of_holy_spirit",
  873: "shop_jewelry_b_earring_of_aid",
  874: "shop_jewelry_b_earring_of_blessing",
  
  // B-Grade Jewelry - Necklaces
  918: "shop_jewelry_b_adamantite_necklace",
  921: "shop_jewelry_b_necklace_of_mana",
  922: "shop_jewelry_b_sages_necklace",
  923: "shop_jewelry_b_paradia_necklace",
  925: "shop_jewelry_b_necklace_of_solar_eclipse",
  926: "shop_jewelry_b_necklace_of_black_ore",
  927: "shop_jewelry_b_necklace_of_summoning",
  928: "shop_jewelry_b_otherworldly_necklace",
  929: "shop_jewelry_b_elemental_necklace",
  931: "shop_jewelry_b_necklace_of_grace",
  932: "shop_jewelry_b_necklace_of_holy_spirit",
  935: "shop_jewelry_b_necklace_of_aid",
  936: "shop_jewelry_b_necklace_of_blessing",
  
  // A-Grade Majestic Set
  2419: "majestic_circlet",
  2409: "majestic_robe",
  2482: "majestic_gauntlets",
  583: "majestic_boots",
  
  // A-Grade Apella Set
  7860: "apella_helm",
  7864: "apella_brigandine",
  7865: "apella_leather_gloves_light_armor",
  7866: "apella_boots_light_armor",
  
  // A-Grade Dark Crystal Set
  512: "dark_crystal_helmet",
  365: "dark_crystal_breastplate",
  388: "dark_crystal_gaiters",
  2472: "dark_crystal_gloves",
  563: "dark_crystal_boots",
  
  // A-Grade Shields
  641: "dark_crystal_shield",
  2498: "shield_of_nightmare",
  
  // A-Grade Jewelry - Rings
  893: "shop_jewelry_a_majestic_ring",
  899: "shop_jewelry_a_ring_of_phantom",
  902: "shop_jewelry_a_phoenix_ring",
  903: "shop_jewelry_a_cerberus_ring",
  
  // A-Grade Jewelry - Earrings
  862: "shop_jewelry_a_majestic_earring",
  868: "shop_jewelry_a_earring_of_phantom",
  871: "shop_jewelry_a_phoenix_earring",
  872: "shop_jewelry_a_cerberus_earring",
  
  // A-Grade Jewelry - Necklaces
  924: "shop_jewelry_a_majestic_necklace",
  930: "shop_jewelry_a_necklace_of_phantom",
  933: "shop_jewelry_a_phoenix_necklace",
  934: "shop_jewelry_a_cerberus_necklace",
  
  // S-Grade Major Arcana Set
  6386: "major_arcana_circlet",
  6383: "major_arcana_robe",
  6384: "major_arcana_gloves",
  6385: "major_arcana_boots",
  
  // S-Grade Draconic Leather Set
  6382: "draconic_leather_helmet",
  6379: "draconic_leather_armor",
  6380: "draconic_leather_gloves",
  6381: "draconic_leather_boots",
  
  // S-Grade Draconic Leather Set (додано вище)
  // 6382: "draconic_leather_helmet", // Дубльовано, видалено
  // 6379: "draconic_leather_armor", // Дубльовано, видалено
  // 6380: "draconic_leather_gloves", // Дубльовано, видалено
  // 6381: "draconic_leather_boots", // Дубльовано, видалено
  
  // S-Grade Imperial Crusader Set
  6378: "imperial_crusader_helmet",
  6373: "imperial_crusader_breastplate",
  6374: "imperial_crusader_gaiters",
  6375: "imperial_crusader_gauntlets",
  6376: "imperial_crusader_boots",
  6377: "imperial_crusader_shield",
  
  // S-Grade Jewelry
  889: "shop_jewelry_s_tateossian_ring",
  858: "shop_jewelry_s_tateossian_earring",
  920: "shop_jewelry_s_tateossian_necklace",
  
  // ===== SHOTS (СОСКИ) =====
  // NG-Grade
  2001: "soulshot_ng",
  2002: "spiritshot_ng",
  // D-Grade
  2003: "soulshot_d",
  2004: "spiritshot_d",
  // C-Grade
  2006: "soulshot_c",
  2007: "spiritshot_c",
  // B-Grade
  2009: "soulshot_b",
  2010: "spiritshot_b",
  // A-Grade
  2012: "soulshot_a",
  2013: "spiritshot_a",
  // S-Grade
  2015: "soulshot_s",
  2016: "spiritshot_s",
  
  // ===== ARROWS (СТРІЛИ) =====
  17: "wooden_arrow", // NG-Grade
  2005: "bone_arrow", // D-Grade
  2008: "fine_steel_arrow", // C-Grade
  2011: "silver_arrow", // B-Grade
  2014: "mithril_arrow", // A-Grade
  2017: "shining_arrow", // S-Grade
  
  // ===== POTIONS (БУТИЛКИ) =====
  3001: "lesser_healing_potion", // Lesser Healing Potion
  3002: "healing_potion", // Healing Potion
  3003: "lesser_mana_potion", // Lesser Mana Potion
  3004: "mana_potion", // Mana Potion
  3005: "cp_potion", // CP Potion
  
  // ===== ENCHANT SCROLLS - WEAPON =====
  4001: "d_enchant_weapon_scroll", // D-grade Weapon
  4002: "c_enchant_weapon_scroll", // C-grade Weapon
  4003: "b_enchant_weapon_scroll", // B-grade Weapon
  4004: "a_enchant_weapon_scroll", // A-grade Weapon
  4005: "s_enchant_weapon_scroll", // S-grade Weapon
  
  // ===== ENCHANT SCROLLS - ARMOR =====
  4006: "d_enchant_armor_scroll", // D-grade Armor
  4007: "c_enchant_armor_scroll", // C-grade Armor
  4008: "b_enchant_armor_scroll", // B-grade Armor
  4009: "a_enchant_armor_scroll", // A-grade Armor
  4010: "s_enchant_armor_scroll", // S-grade Armor
  
  // ===== BLESSED ENCHANT SCROLLS (QUEST SHOP) =====
  10010: "blessed_scroll_enchant_weapon_grade_d", // D-grade Weapon
  10011: "blessed_scroll_enchant_armor_grade_d", // D-grade Armor
  10012: "blessed_scroll_enchant_weapon_grade_c", // C-grade Weapon
  10013: "blessed_scroll_enchant_armor_grade_c", // C-grade Armor
  10014: "blessed_scroll_enchant_weapon_grade_b", // B-grade Weapon
  10015: "blessed_scroll_enchant_armor_grade_b", // B-grade Armor
  10016: "blessed_scroll_enchant_weapon_grade_a", // A-grade Weapon
  10017: "blessed_scroll_enchant_armor_grade_a", // A-grade Armor
  10018: "blessed_scroll_enchant_weapon_grade_s", // S-grade Weapon
  10019: "blessed_scroll_enchant_armor_grade_s", // S-grade Armor
  
  // ===== D-GRADE WEAPONS (з папки weapon_d) =====
  // Drop items (старий маппінг, залишаємо для сумісності)
  187: "d_atuba_hammer", // Atuba Hammer
  86: "d_tomahawk", // Tomahawk
  124: "d_two_handed_sword", // Two-Handed Sword
  241: "d_shilen_knife", // Shilen Knife
  260: "d_triple_edged_jamadhr", // Triple-Edged Jamadhr
  277: "d_dark_elven_bow", // Dark Elven Bow
  128: "d_knights_sword", // Knight's Sword
  293: "d_war_hammer", // War Hammer
  261: "d_baguette_dual_sword", // Baguette's Dualsword (використовуємо Bich'Hwa ID як основу)
  
  // D-Grade Shop Weapons (Магазин вещей) - використовуємо той самий itemId, але з shop_ префіксом
  // Примітка: itemId 187, 86, 124, 241, 260, 277, 128, 293, 261 вже використані вище для drop items
  // Але shop зброї мають інші ID в shop файлах, тому додаємо маппінг тут
  // (Але насправді, itemId однакові, тому маппінг буде конфліктувати. Використовуємо shop_ префікс для shop зброї)
  // Насправді, маппінг по itemId, тому якщо itemId однаковий, то буде конфлікт
  // Можливо, потрібно використати fallback механізм за назвою, або змінити itemId для shop зброї
  // Поки що залишаємо як є, fallback механізм за назвою допоможе
  
  // ===== C-GRADE WEAPONS (з папки weapon_c) =====
  // Drop items (старий маппінг, залишаємо для сумісності)
  283: "c_akat_long_bow", // Akat Long Bow
  99: "c_apprentices_spellbook", // Apprentice's Spellbook
  160: "c_battle_axe", // Battle Axe
  5286: "c_berserker_blade", // Berserker Blade
  89: "c_big_hammer", // Big Hammer
  228: "c_crystal_dagger", // Crystal Dagger
  233: "c_dark_screamer", // Dark Screamer
  206: "c_demon_staff", // Demon's Staff
  7897: "c_dwarven_hammer", // Dwarven Hammer (Примітка: 7897 також використовується для shop_weapon_c_dwarven_hammer)
  7888: "c_ecliptic_sword", // Ecliptic Sword
  286: "c_eminence_bow", // Eminence Bow
  265: "c_fisted_blade", // Fisted Blade
  266: "c_great_pata", // Great Pata
  326: "c_heathens_book", // Heathen's Book
  194: "c_heavy_doom_axe", // Heavy Doom Axe
  191: "c_heavy_doom_hammer", // Heavy Doom Hammer
  84: "c_homunkulus_sword", // Homunkulus's Sword
  4233: "c_knuckle_duster", // Knuckle Duster
  299: "c_orcish_poleaxe", // Orcish Poleaxe
  7882: "c_paagrian_sword", // Pa'agrian Sword
  199: "c_paagrian_hammer", // Pa'agrian Hammer
  203: "c_paagrian_axe", // Pa'agrian Axe
  135: "c_samurai_longsword", // Samurai Longsword
  301: "c_scorpion", // Scorpion
  162: "c_war_axe", // War Axe
  303: "c_widow_maker", // Widow Maker
  2503: "c_yaksa_mace", // Yaksa Mace
  
  // C-Grade Shop Weapons (Магазин вещей)
  // Примітка: Багато C-grade shop зброї мають той самий itemId, що і drop items
  // Fallback механізм за назвою допоможе знайти правильний itemsDB ID
  
  // Materials (NG-Grade)
  5001: "gludio_fish_lure", // Наживка для риби (Gludio)
  
  // Weapons (NG-Grade)
  6529: "baby_duck_rod", // Baby Duck Rod (Удочка)
  
  // B-Grade Weapons (Магазин вещей)
  78: "shop_weapon_b_apprentices_spellbook",
  7834: "shop_weapon_b_art_of_battle_axe",
  7788: "shop_weapon_b_arthro_nail",
  7792: "shop_weapon_b_baguette_s_dualsword",
  7893: "shop_weapon_b_bellion_cestus", // Примітка: Kaim Vanul's Bones також має itemId 7893
  7891: "shop_weapon_b_bow_of_peril",
  7890: "shop_weapon_b_dark_elven_long_bow",
  7791: "shop_weapon_b_deadman_s_glory",
  7894: "shop_weapon_b_great_axe",
  7895: "shop_weapon_b_great_sword",
  7883: "shop_weapon_b_guardian_sword",
  7813: "shop_weapon_b_hell_knife",
  7900: "shop_weapon_b_ice_storm_hammer",
  7783: "shop_weapon_b_kris",
  7784: "shop_weapon_b_lance",
  7892: "shop_weapon_b_spell_breaker",
  7889: "shop_weapon_b_spirit_s_staff", // Примітка: Wizard's Tear також має itemId 7889
  7896: "shop_weapon_b_staff_of_evil_spirits",
  7901: "shop_weapon_b_star_buster",
  // 7897: "shop_weapon_b_sword_of_damascus", // Дубльовано (вже використовується для c_dwarven_hammer на рядку 329), видалено
  7722: "shop_weapon_b_sword_of_valhalla",
  
  // A-Grade Weapons (Магазин вещей)
  2500: "shop_weapon_a_dark_legions_edge", // Багато A-grade зброї мають itemId 2500 (placeholder)
  2504: "shop_weapon_a_meteor_shower",
  210: "shop_weapon_a_dasparion_s_staff",
  231: "shop_weapon_a_dragon_grinder",
  290: "shop_weapon_a_elysian",
  304: "shop_weapon_a_halberd",
  88: "shop_weapon_a_sword_of_miracles",
  // Примітка: Багато A-grade зброї мають itemId 2500 (placeholder), можливо потрібно використати унікальні ID
  
  // S-Grade Weapons (Магазин вещей)
  20167: "shop_weapon_s_angel_slayer",
  20170: "shop_weapon_s_arcana_mace",
  20168: "shop_weapon_s_basalt_battlehammer",
  20172: "shop_weapon_s_demon_splinter",
  20173: "shop_weapon_s_draconic_bow",
  20169: "shop_weapon_s_dragon_hunter_axe",
  82: "shop_weapon_s_god_s_blade",
  20166: "shop_weapon_s_heaven_s_divider",
  20171: "shop_weapon_s_imperial_staff",
  20174: "shop_weapon_s_saint_spear",
  // Примітка: Деякі S-grade зброї мають itemId 2500 (placeholder)
};

// Маппінг для квест-шопу
export const QUEST_SHOP_ITEM_MAPPING: Record<number, string> = {
  // ===== КВЕСТ-ШОП ЗБРОЯ (з папки kv_shop) =====
  99: "quest_apprentices_spellbook", // Apprentice's Spellbook
  261: "quest_baguette_dual_sword", // Baguette's Dualsword (Bich'Hwa ID)
  159: "quest_bonebreaker", // Bonebreaker
  70: "quest_claymore", // Claymore
  2499: "quest_elven_long_sword", // Elven Long Sword
  297: "quest_glaive", // Glaive
  280: "quest_light_crossbow", // Light Crossbow
  225: "quest_mithril_dagger", // Mithril Dagger
  262: "quest_scallop_jamadhr", // Scallop Jamadhr
  187: "quest_titan_hammer", // Titan Hammer (Atuba Hammer ID)
};
