/**
 * Таблиці дропу для рейд-босів l2dop / сателітних міст.
 * У кожного індексу РБ свій зміщений набір (зброя/броня), свитки blessed — єдині рядки з min/max 1–3.
 * Маг-роби: Knowledge/Demons/Karmian (C), Avadon/Doom (B), Majestic (A); чергуються з важкими сетами по rbIndex.
 * Ресурси (ранні РБ, рівень боса <20): кожен рядок — шанс 21–34%, кількість випадкова 14–26.
 */
import type { DropEntry } from "../../combat/types";

function eq(id: string, kind: DropEntry["kind"], chance: number, min = 1, max = 1): DropEntry {
  return { id, kind, chance, min, max };
}

function scW(id: string, chance: number): DropEntry {
  return eq(id, "other", chance, 1, 3);
}

function scA(id: string, chance: number): DropEntry {
  return eq(id, "other", chance, 1, 3);
}

function wRotate(pool: readonly string[], rbIndex: number, count: number, stride: number): DropEntry[] {
  const out: DropEntry[] = [];
  const n = pool.length;
  if (n === 0) return out;
  const baseChance = 0.095;
  for (let j = 0; j < count; j++) {
    const id = pool[(rbIndex * stride + j) % n]!;
    out.push(eq(id, "equipment", Math.min(0.12, baseChance + j * 0.01), 1, 1));
  }
  return out;
}

/** Ресурси тиру 1 для РБ рівня <20: шанс рядка 0.21…0.34 (крок 1%), qty roll 14–26. */
const LOW_RB_RESOURCE_MIN = 14;
const LOW_RB_RESOURCE_MAX = 26;
const LOW_RB_RESOURCE_IDS = [
  "stem",
  "varnish",
  "suede",
  "animal_skin",
  "thread",
  "iron_ore",
  "coal",
  "charcoal",
  "animal_bone",
  "silver_nugget",
] as const;

function lowLevelRbResources(rbIndex: number): DropEntry[] {
  return LOW_RB_RESOURCE_IDS.map((id, i) => {
    const chance = 0.21 + (((i + rbIndex * 5) % 14) * 0.01);
    return eq(id, "resource", chance, LOW_RB_RESOURCE_MIN, LOW_RB_RESOURCE_MAX);
  });
}

/* ==================== Gludio ==================== */

const GLUDIO_D_WEAP_LOW = [
  "shop_weapon_d_knights_sword",
  "shop_weapon_d_shilen_knife",
  "shop_weapon_d_tomahawk",
  "shop_weapon_d_dark_elven_bow",
  "shop_weapon_d_war_hammer",
  "shop_weapon_d_atuba_hammer",
  "shop_weapon_d_baguette_dual_sword",
  "shop_weapon_d_triple_edged_jamadhr",
] as const;

const GLUDIO_C_WEAPONS = [
  "shop_weapon_c_paagrian_sword",
  "shop_weapon_c_samurai_longsword",
  "shop_weapon_c_crystal_dagger",
  "shop_weapon_c_battle_axe",
  "shop_weapon_c_widow_maker",
  "shop_weapon_c_yaksa_mace",
  "shop_weapon_c_akat_long_bow",
  "shop_weapon_c_dark_screamer",
] as const;

function gludioLowTier(rbIndex: number): DropEntry[] {
  const w = GLUDIO_D_WEAP_LOW;
  const armorVariants: DropEntry[][] = [
    [
      eq("leather_helmet", "equipment", 0.08),
      eq("reinforced_leather_shirt", "equipment", 0.08),
      eq("reinforced_leather_gaiters", "equipment", 0.07),
    ],
    [
      eq("cloth_cap", "equipment", 0.08),
      eq("tunic_of_knowledge", "equipment", 0.08),
      eq("stockings_of_knowledge", "equipment", 0.07),
    ],
    [
      eq("mithril_helmet", "equipment", 0.08),
      eq("mithril_gloves", "equipment", 0.08),
      eq("mithril_boots", "equipment", 0.07),
    ],
    [
      eq("reinforced_gloves", "equipment", 0.08),
      eq("reinforced_leather_boots", "equipment", 0.08),
      eq("reinforced_leather_shirt", "equipment", 0.07),
    ],
  ];
  const jewD = [
    "shop_jewelry_d_black_pearl_ring",
    "shop_jewelry_d_elven_earing",
    "shop_jewelry_d_enchanted_necklace",
    "shop_jewelry_d_mithril_ring",
  ] as const;
  const a = armorVariants[rbIndex % armorVariants.length]!;
  return [
    ...a,
    eq(w[(rbIndex * 2) % w.length]!, "equipment", 0.1, 1, 1),
    eq(w[(rbIndex * 2 + 3) % w.length]!, "equipment", 0.09, 1, 1),
    eq(jewD[rbIndex % jewD.length]!, "equipment", 0.08, 1, 1),
    eq(jewD[(rbIndex + 2) % jewD.length]!, "equipment", 0.07, 1, 1),
    ...lowLevelRbResources(rbIndex),
    scW("blessed_scroll_enchant_weapon_grade_d", 0.14),
    scA("blessed_scroll_enchant_armor_grade_d", 0.05),
  ];
}

/** Gludio 4–6: 4 — тяжкий mithril, 5 — маг D (Knowledge), 6 — маг C (Karmian). */
function gludioMidTier(rbIndex: number): DropEntry[] {
  const commonWeapons: DropEntry[] = [
    eq("shop_weapon_d_knights_sword", "equipment", 0.1),
    eq("shop_weapon_d_shilen_knife", "equipment", 0.1),
    eq("shop_weapon_d_tomahawk", "equipment", 0.09),
    eq("shop_weapon_d_two_handed_sword", "equipment", 0.1),
  ];
  const scrolls: DropEntry[] = [
    scW("blessed_scroll_enchant_weapon_grade_d", rbIndex === 5 ? 0.17 : 0.18),
    scA("blessed_scroll_enchant_armor_grade_d", 0.06),
  ];
  const jewD: DropEntry[] = [
    eq("shop_jewelry_d_black_pearl_ring", "equipment", 0.07),
    eq("shop_jewelry_d_elven_earing", "equipment", 0.08),
    eq("shop_jewelry_d_enchanted_necklace", "equipment", 0.09),
    eq("shop_jewelry_d_mithril_ring", "equipment", 0.11),
  ];
  if (rbIndex === 5) {
    return [
      eq("cloth_cap", "equipment", 0.08),
      eq("tunic_of_knowledge", "equipment", 0.08),
      eq("stockings_of_knowledge", "equipment", 0.08),
      eq("gloves_of_knowledge", "equipment", 0.08),
      eq("boots_of_knowledge", "equipment", 0.08),
      ...commonWeapons,
      ...scrolls,
      ...jewD,
    ];
  }
  if (rbIndex === 6) {
    return [
      eq("karmian_helmet", "equipment", 0.078),
      eq("karmian_tunic", "equipment", 0.078),
      eq("karmian_stockings", "equipment", 0.078),
      eq("karmian_gloves", "equipment", 0.075),
      eq("karmian_boots", "equipment", 0.075),
      eq("shop_weapon_c_demon_staff", "equipment", 0.095),
      eq("shop_weapon_c_apprentices_spellbook", "equipment", 0.095),
      eq("shop_weapon_d_two_handed_sword", "equipment", 0.09),
      eq("shop_weapon_d_tomahawk", "equipment", 0.085),
      ...scrolls,
      ...jewD,
    ];
  }
  return [
    eq("mithril_helmet", "equipment", 0.08),
    eq("mithril_breastplate", "equipment", 0.08),
    eq("mithril_gaiters", "equipment", 0.08),
    eq("mithril_gloves", "equipment", 0.08),
    eq("mithril_boots", "equipment", 0.08),
    ...commonWeapons,
    ...scrolls,
    ...jewD,
  ];
}

function gludioHighC(rbIndex: number, robe: boolean): DropEntry[] {
  const pool = GLUDIO_C_WEAPONS;
  const armor: DropEntry[] = robe
    ? [
        eq("karmian_helmet", "equipment", 0.08),
        eq("karmian_tunic", "equipment", 0.08),
        eq("karmian_stockings", "equipment", 0.08),
        eq("karmian_gloves", "equipment", 0.07),
        eq("karmian_boots", "equipment", 0.07),
      ]
    : [
        eq("plated_leather_helmet", "equipment", 0.08),
        eq("plated_leather", "equipment", 0.08),
        eq("plated_leather_gaiters", "equipment", 0.08),
        eq("plated_leather_gloves", "equipment", 0.07),
        eq("plated_leather_boots", "equipment", 0.07),
      ];
  const jewC = [
    "shop_jewelry_c_ring_of_ages",
    "shop_jewelry_c_moonstone_earing",
    "shop_jewelry_c_blessed_necklace",
    "shop_jewelry_c_aquastone_ring",
  ] as const;
  return [
    ...armor,
    ...wRotate(pool, rbIndex + (robe ? 3 : 0), 4, 1),
    eq(jewC[rbIndex % jewC.length]!, "equipment", 0.08, 1, 1),
    eq(jewC[(rbIndex + 2) % jewC.length]!, "equipment", 0.09, 1, 1),
    eq(jewC[(rbIndex + 1) % jewC.length]!, "equipment", 0.07, 1, 1),
    scW("blessed_scroll_enchant_weapon_grade_c", 0.16),
    scA("blessed_scroll_enchant_armor_grade_c", 0.06),
  ];
}

/** D-grade трофеї Gludio; індекси 4–6 — канон; 0–3 ранні; 7–8 C-grade. */
export function gludioRbDrops(rbIndex: number): DropEntry[] {
  if (rbIndex >= 4 && rbIndex <= 6) return gludioMidTier(rbIndex);
  if (rbIndex >= 0 && rbIndex <= 3) return gludioLowTier(rbIndex);
  if (rbIndex === 7) return gludioHighC(rbIndex, false);
  if (rbIndex === 8) return gludioHighC(rbIndex, true);
  return [];
}

/* ==================== Gludin (дуже низькі рівні) ==================== */

export function gludinRbDrops(rbIndex: number): DropEntry[] {
  const w = GLUDIO_D_WEAP_LOW;
  const themes: DropEntry[][] = [
    [eq("cloth_cap", "equipment", 0.07), eq("tunic_of_knowledge", "equipment", 0.07), eq("gloves_of_knowledge", "equipment", 0.06)],
    [eq("leather_helmet", "equipment", 0.07), eq("reinforced_leather_shirt", "equipment", 0.07), eq("reinforced_gloves", "equipment", 0.06)],
    [eq("mithril_helmet", "equipment", 0.06), eq("mithril_gloves", "equipment", 0.06), eq("reinforced_leather_boots", "equipment", 0.06)],
    [eq("cloth_cap", "equipment", 0.07), eq("stockings_of_knowledge", "equipment", 0.07), eq("boots_of_knowledge", "equipment", 0.06)],
    [eq("leather_helmet", "equipment", 0.07), eq("reinforced_leather_gaiters", "equipment", 0.07), eq("reinforced_leather_boots", "equipment", 0.06)],
    [eq("tunic_of_knowledge", "equipment", 0.07), eq("mithril_boots", "equipment", 0.06), eq("reinforced_leather_shirt", "equipment", 0.06)],
    [eq("mithril_gloves", "equipment", 0.07), eq("reinforced_gloves", "equipment", 0.06), eq("leather_helmet", "equipment", 0.06)],
    [eq("stockings_of_knowledge", "equipment", 0.07), eq("reinforced_leather_shirt", "equipment", 0.07), eq("cloth_cap", "equipment", 0.06)],
    [eq("reinforced_leather_gaiters", "equipment", 0.07), eq("mithril_helmet", "equipment", 0.06), eq("boots_of_knowledge", "equipment", 0.06)],
  ];
  const jewD = ["shop_jewelry_d_black_pearl_ring", "shop_jewelry_d_mithril_ring"] as const;
  const t = themes[rbIndex % themes.length]!;
  const below20 = rbIndex <= 6;
  return [
    ...t,
    eq(w[rbIndex % w.length]!, "equipment", 0.09, 1, 1),
    eq(w[(rbIndex + 4) % w.length]!, "equipment", 0.08, 1, 1),
    eq(jewD[rbIndex % 2]!, "equipment", 0.07, 1, 1),
    ...(below20 ? lowLevelRbResources(rbIndex + 20) : []),
    scW("blessed_scroll_enchant_weapon_grade_d", 0.1),
    scA("blessed_scroll_enchant_armor_grade_d", 0.04),
  ];
}

/* ==================== Floran Village ==================== */

export function fvRbDrops(rbIndex: number): DropEntry[] {
  if (rbIndex >= 4) return gludioMidTier(4 + (rbIndex % 3));
  const w = GLUDIO_D_WEAP_LOW;
  const below20 = rbIndex <= 2;
  const res = below20 ? lowLevelRbResources(rbIndex + 40) : [];
  if (rbIndex % 2 === 1) {
    return [
      eq("cloth_cap", "equipment", 0.08),
      eq("tunic_of_knowledge", "equipment", 0.08),
      eq("stockings_of_knowledge", "equipment", 0.07),
      eq("gloves_of_knowledge", "equipment", 0.075),
      eq("boots_of_knowledge", "equipment", 0.075),
      eq(w[rbIndex % w.length]!, "equipment", 0.1, 1, 1),
      eq(w[(rbIndex + 2) % w.length]!, "equipment", 0.09),
      eq("shop_jewelry_d_elven_earing", "equipment", 0.08),
      eq("shop_jewelry_d_enchanted_necklace", "equipment", 0.08),
      ...res,
      scW("blessed_scroll_enchant_weapon_grade_d", 0.15),
      scA("blessed_scroll_enchant_armor_grade_d", 0.05),
    ];
  }
  return [
    eq("leather_helmet", "equipment", 0.08),
    eq("reinforced_leather_shirt", "equipment", 0.08),
    eq("reinforced_leather_gaiters", "equipment", 0.07),
    eq(w[rbIndex % w.length]!, "equipment", 0.1, 1, 1),
    eq(w[(rbIndex + 3) % w.length]!, "equipment", 0.09),
    eq("shop_jewelry_d_elven_earing", "equipment", 0.08),
    eq("shop_jewelry_d_enchanted_necklace", "equipment", 0.08),
    ...res,
    scW("blessed_scroll_enchant_weapon_grade_d", 0.15),
    scA("blessed_scroll_enchant_armor_grade_d", 0.05),
  ];
}

/* ==================== Dion (C) ==================== */

const DION_C_WEAP = [
  "shop_weapon_c_homunkulus_sword",
  "shop_weapon_c_ecliptic_sword",
  "shop_weapon_c_fisted_blade",
  "shop_weapon_c_orcish_poleaxe",
  "shop_weapon_c_dwarven_hammer",
  "shop_weapon_c_war_axe",
  "shop_weapon_c_berserker_blade",
  "shop_weapon_c_eminence_bow",
  "shop_weapon_c_demon_staff",
  "shop_weapon_c_apprentices_spellbook",
  "shop_weapon_c_scorpion",
  "shop_weapon_c_big_hammer",
] as const;

const DION_JEW_C = [
  "shop_jewelry_c_ring_of_binding",
  "shop_jewelry_c_nassen_earing",
  "shop_jewelry_c_necklace_of_mermaid",
  "shop_jewelry_c_blessed_ring",
] as const;

function dionArmorTheme(rbIndex: number): DropEntry[] {
  const t = rbIndex % 3;
  if (t === 0)
    return [
      eq("demons_helmet", "equipment", 0.075),
      eq("demons_tunic", "equipment", 0.075),
      eq("demons_stockings", "equipment", 0.075),
      eq("demons_gloves", "equipment", 0.07),
      eq("demons_boots", "equipment", 0.07),
    ];
  if (t === 1)
    return [
      eq("plated_leather_helmet", "equipment", 0.075),
      eq("plated_leather", "equipment", 0.075),
      eq("plated_leather_gaiters", "equipment", 0.075),
      eq("plated_leather_gloves", "equipment", 0.07),
      eq("plated_leather_boots", "equipment", 0.07),
    ];
  return [
    eq("karmian_helmet", "equipment", 0.075),
    eq("karmian_tunic", "equipment", 0.075),
    eq("karmian_stockings", "equipment", 0.075),
    eq("karmian_gloves", "equipment", 0.07),
    eq("karmian_boots", "equipment", 0.07),
  ];
}

export function dionRbDrops(rbIndex: number): DropEntry[] {
  return [
    ...dionArmorTheme(rbIndex),
    ...wRotate(DION_C_WEAP, rbIndex, 4, 2),
    eq(DION_JEW_C[rbIndex % DION_JEW_C.length]!, "equipment", 0.08),
    eq(DION_JEW_C[(rbIndex + 1) % DION_JEW_C.length]!, "equipment", 0.08),
    eq(DION_JEW_C[(rbIndex + 2) % DION_JEW_C.length]!, "equipment", 0.07),
    scW("blessed_scroll_enchant_weapon_grade_c", 0.17),
    scA("blessed_scroll_enchant_armor_grade_c", 0.06),
  ];
}

/* ==================== Heine (C → B) ==================== */

const HEINE_B_WEAP = [
  "shop_weapon_b_great_sword",
  "shop_weapon_b_deadman_s_glory",
  "shop_weapon_b_kris",
  "shop_weapon_b_bow_of_peril",
  "shop_weapon_b_spirit_s_staff",
  "shop_weapon_b_hell_knife",
] as const;

export function heineRbDrops(rbIndex: number): DropEntry[] {
  if (rbIndex < 3) {
    return [
      ...dionArmorTheme(rbIndex + 4),
      ...wRotate(DION_C_WEAP, rbIndex + 7, 4, 1),
      eq("shop_jewelry_c_ring_of_protection", "equipment", 0.08),
      eq("shop_jewelry_c_earing_of_protection", "equipment", 0.08),
      scW("blessed_scroll_enchant_weapon_grade_c", 0.16),
      scA("blessed_scroll_enchant_armor_grade_c", 0.06),
    ];
  }
  const k = rbIndex - 3;
  const heavyB: DropEntry[] = [
    eq("zubeis_helmet", "equipment", 0.08),
    eq("zubeis_breastplate", "equipment", 0.08),
    eq("zubeis_gaiters", "equipment", 0.08),
    eq("zubeis_gauntlets", "equipment", 0.07),
  ];
  const robeB: DropEntry[] = [
    eq("avadon_circlet", "equipment", 0.082),
    eq("avadon_robe", "equipment", 0.082),
    eq("avadon_gloves", "equipment", 0.078),
    eq("avadon_boots", "equipment", 0.078),
  ];
  return [
    ...(k % 2 === 0 ? heavyB : robeB),
    ...wRotate(HEINE_B_WEAP, k, 4, 1),
    eq("shop_jewelry_b_adamantite_ring", "equipment", 0.08),
    eq("shop_jewelry_b_paradia_ring", "equipment", 0.08),
    scW("blessed_scroll_enchant_weapon_grade_b", 0.14),
    scA("blessed_scroll_enchant_armor_grade_b", 0.05),
  ];
}

/* ==================== Aden / Oren (C + B) ==================== */

const ADEN_C_WEAP = DION_C_WEAP;

const ADEN_B_WEAP = [
  "shop_weapon_b_guardian_sword",
  "shop_weapon_b_lance",
  "shop_weapon_b_art_of_battle_axe",
  "shop_weapon_b_star_buster",
  "shop_weapon_b_staff_of_evil_spirits",
  "shop_weapon_b_dark_elven_long_bow",
  "shop_weapon_b_great_axe",
  "shop_weapon_b_bellion_cestus",
] as const;

function adenStyle(rbIndex: number, worldSalt: number): DropEntry[] {
  const blueWolf4: DropEntry[] = [
    eq("blue_wolf_helmet", "equipment", 0.08),
    eq("blue_wolf_breastplate", "equipment", 0.08),
    eq("blue_wolf_gloves", "equipment", 0.07),
    eq("blue_wolf_boots", "equipment", 0.07),
  ];
  const doomRobe4: DropEntry[] = [
    eq("doom_helmet", "equipment", 0.08),
    eq("doom_tunic", "equipment", 0.08),
    eq("doom_gloves", "equipment", 0.07),
    eq("doom_boots", "equipment", 0.07),
  ];
  const avadon4: DropEntry[] = [
    eq("avadon_circlet", "equipment", 0.082),
    eq("avadon_robe", "equipment", 0.082),
    eq("avadon_gloves", "equipment", 0.078),
    eq("avadon_boots", "equipment", 0.078),
  ];
  if (rbIndex < 4) {
    return [
      ...dionArmorTheme(rbIndex),
      ...wRotate(ADEN_C_WEAP, rbIndex + worldSalt, 4, 3),
      eq("shop_jewelry_c_aquastone_necklace", "equipment", 0.08),
      eq("shop_jewelry_c_ring_of_protection", "equipment", 0.08),
      scW("blessed_scroll_enchant_weapon_grade_c", 0.16),
      scA("blessed_scroll_enchant_armor_grade_c", 0.06),
    ];
  }
  const j = rbIndex - 4;
  const bPieces: DropEntry[] = j % 3 === 0 ? blueWolf4 : j % 3 === 1 ? doomRobe4 : avadon4;
  return [
    ...bPieces,
    ...wRotate(ADEN_B_WEAP, j + worldSalt, 4, 2),
    eq("shop_jewelry_b_sages_ring", "equipment", 0.08),
    eq("shop_jewelry_b_ring_of_black_ore", "equipment", 0.08),
    scW("blessed_scroll_enchant_weapon_grade_b", 0.15),
    scA("blessed_scroll_enchant_armor_grade_b", 0.06),
  ];
}

export function adenRbDrops(rbIndex: number): DropEntry[] {
  return adenStyle(rbIndex, 0);
}

export function orenRbDrops(rbIndex: number): DropEntry[] {
  return adenStyle(rbIndex, 5);
}

/* ==================== Hunters Village (B) ==================== */

const HV_B_WEAP = [
  "shop_weapon_b_ice_storm_hammer",
  "shop_weapon_b_spell_breaker",
  "shop_weapon_b_apprentices_spellbook",
  "shop_weapon_b_arthro_nail",
  "shop_weapon_b_baguette_s_dualsword",
  "shop_weapon_b_bellion_cestus",
  "shop_weapon_b_great_sword",
  "shop_weapon_b_deadman_s_glory",
  "shop_weapon_b_kris",
] as const;

export function huntersVillageRbDrops(rbIndex: number): DropEntry[] {
  const t = rbIndex % 3;
  const heavy: DropEntry[] =
    t === 0
      ? [
          eq("blue_wolf_helmet", "equipment", 0.085),
          eq("blue_wolf_breastplate", "equipment", 0.085),
          eq("blue_wolf_gaiters", "equipment", 0.08),
          eq("blue_wolf_gloves", "equipment", 0.075),
        ]
      : t === 1
        ? [
            eq("doom_helmet", "equipment", 0.085),
            eq("doom_tunic", "equipment", 0.085),
            eq("doom_stockings", "equipment", 0.08),
            eq("doom_gloves", "equipment", 0.078),
          ]
        : [
            eq("avadon_circlet", "equipment", 0.085),
            eq("avadon_robe", "equipment", 0.085),
            eq("avadon_gloves", "equipment", 0.08),
            eq("avadon_boots", "equipment", 0.078),
          ];
  return [
    ...heavy,
    ...wRotate(HV_B_WEAP, rbIndex, 5, 2),
    eq("shop_jewelry_b_elemental_ring", "equipment", 0.08),
    eq("shop_jewelry_b_ring_of_grace", "equipment", 0.08),
    eq("shop_jewelry_b_ring_of_holy_spirit", "equipment", 0.07),
    scW("blessed_scroll_enchant_weapon_grade_b", 0.16),
    scA("blessed_scroll_enchant_armor_grade_b", 0.06),
  ];
}

/* ==================== Rune (B → A) ==================== */

const RUNE_A_WEAP = [
  "shop_weapon_a_halberd",
  "shop_weapon_a_dragon_slayer",
  "shop_weapon_a_carnage_bow",
  "shop_weapon_a_dasparion_s_staff",
  "shop_weapon_a_blood_tornado",
  "shop_weapon_a_naga_storm",
  "shop_weapon_a_infernal_master",
  "shop_weapon_a_dragon_grinder",
] as const;

export function runeRbDrops(rbIndex: number): DropEntry[] {
  if (rbIndex < 4) {
    const zubeis3: DropEntry[] = [
      eq("zubeis_helmet", "equipment", 0.08),
      eq("zubeis_breastplate", "equipment", 0.08),
      eq("zubeis_boots", "equipment", 0.075),
    ];
    const avadon4m: DropEntry[] = [
      eq("avadon_circlet", "equipment", 0.082),
      eq("avadon_robe", "equipment", 0.082),
      eq("avadon_gloves", "equipment", 0.078),
      eq("avadon_boots", "equipment", 0.078),
    ];
    return [
      ...(rbIndex % 2 === 0 ? zubeis3 : avadon4m),
      ...wRotate(ADEN_B_WEAP, rbIndex + 2, 5, 2),
      eq("shop_jewelry_b_ring_of_summoning", "equipment", 0.08),
      eq("shop_jewelry_b_otherworldly_ring", "equipment", 0.08),
      scW("blessed_scroll_enchant_weapon_grade_b", 0.15),
      scA("blessed_scroll_enchant_armor_grade_b", 0.06),
    ];
  }
  const j = rbIndex - 4;
  const physA: DropEntry[] = [
    eq("blue_wolf_breastplate", "equipment", 0.08),
    eq("blue_wolf_gaiters", "equipment", 0.08),
    eq("doom_gloves", "equipment", 0.075),
    eq("doom_boots", "equipment", 0.075),
  ];
  const mageA: DropEntry[] = [
    eq("majestic_circlet", "equipment", 0.085),
    eq("majestic_robe", "equipment", 0.085),
    eq("majestic_gauntlets", "equipment", 0.082),
    eq("majestic_boots", "equipment", 0.082),
  ];
  return [
    ...(j % 2 === 0 ? physA : mageA),
    ...wRotate(RUNE_A_WEAP, j, 4, 1),
    eq("shop_jewelry_a_phoenix_ring", "equipment", 0.085),
    eq("shop_jewelry_a_phoenix_earring", "equipment", 0.08),
    scW("blessed_scroll_enchant_weapon_grade_a", 0.13),
    scA("blessed_scroll_enchant_armor_grade_a", 0.05),
  ];
}

/* ==================== Goddard (A) ==================== */

const GODD_A_WEAP = [
  "shop_weapon_a_meteor_shower",
  "shop_weapon_a_bloody_orchid",
  "shop_weapon_a_branch_of_the_mother_tree",
  "shop_weapon_a_elysian",
  "shop_weapon_a_dark_legions_edge",
  "shop_weapon_a_behemoth_s_tuning_fork",
  "shop_weapon_a_daimon_crystal",
] as const;

export function goddardRbDrops(rbIndex: number): DropEntry[] {
  const physMix: DropEntry[] = [
    eq("blue_wolf_helmet", "equipment", 0.08),
    eq("blue_wolf_gloves", "equipment", 0.075),
    eq("doom_helmet", "equipment", 0.078),
    eq("doom_tunic", "equipment", 0.078),
  ];
  const mageA: DropEntry[] = [
    eq("majestic_circlet", "equipment", 0.086),
    eq("majestic_robe", "equipment", 0.086),
    eq("majestic_gauntlets", "equipment", 0.083),
    eq("majestic_boots", "equipment", 0.083),
  ];
  return [
    ...(rbIndex % 2 === 0 ? physMix : mageA),
    ...wRotate(GODD_A_WEAP, rbIndex, 5, 2),
    eq("shop_jewelry_a_majestic_ring", "equipment", 0.085),
    eq("shop_jewelry_a_majestic_earring", "equipment", 0.085),
    eq("shop_jewelry_a_majestic_necklace", "equipment", 0.08),
    eq("shop_jewelry_a_cerberus_ring", "equipment", 0.078),
    scW("blessed_scroll_enchant_weapon_grade_a", 0.14),
    scA("blessed_scroll_enchant_armor_grade_a", 0.055),
  ];
}

/* ==================== Schuttgart (A, топ — шанс S-свитків) ==================== */

const SCHU_A_WEAP = [
  "shop_weapon_a_cabrio_s_hand",
  "shop_weapon_a_barakiel_s_axe",
  "shop_weapon_a_baguette_s_dualsword",
  "shop_weapon_a_halberd",
  "shop_weapon_a_dragon_slayer",
  "shop_weapon_a_carnage_bow",
  "shop_weapon_a_apprentices_spellbook",
  "shop_weapon_a_blood_tornado",
  "shop_weapon_a_naga_storm",
  "shop_weapon_a_dragon_grinder",
  "shop_weapon_a_infernal_master",
] as const;

export function schuttgartRbDrops(rbIndex: number): DropEntry[] {
  const physMix: DropEntry[] = [
    eq("doom_helmet", "equipment", 0.082),
    eq("doom_stockings", "equipment", 0.08),
    eq("blue_wolf_breastplate", "equipment", 0.082),
    eq("blue_wolf_boots", "equipment", 0.078),
  ];
  const mageA: DropEntry[] = [
    eq("majestic_circlet", "equipment", 0.086),
    eq("majestic_robe", "equipment", 0.086),
    eq("majestic_gauntlets", "equipment", 0.083),
    eq("majestic_boots", "equipment", 0.083),
  ];
  const base: DropEntry[] = [
    ...(rbIndex % 2 === 0 ? physMix : mageA),
    ...wRotate(SCHU_A_WEAP, rbIndex, 5, 2),
    eq("shop_jewelry_a_necklace_of_phantom", "equipment", 0.085),
    eq("shop_jewelry_a_earring_of_phantom", "equipment", 0.082),
    eq("shop_jewelry_a_ring_of_phantom", "equipment", 0.082),
    eq("shop_jewelry_a_cerberus_earring", "equipment", 0.08),
    scW("blessed_scroll_enchant_weapon_grade_a", 0.15),
    scA("blessed_scroll_enchant_armor_grade_a", 0.058),
  ];
  if (rbIndex >= 8) {
    base.push(scW("blessed_scroll_enchant_weapon_grade_s", 0.05));
    base.push(scA("blessed_scroll_enchant_armor_grade_s", 0.03));
  }
  return base;
}