// tools/update_weapon_stats_from_xml.mjs
// Оновлює стати зброї в itemsDB з XML. Для квест-шопу: +50 pAtkSpd, +30 critPower

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const XML_STATS = JSON.parse(
  fs.readFileSync(path.join(ROOT, "src", "data", "items", "weaponStatsFromXml.json"), "utf-8")
);

// D-grade quest: QUEST_SHOP_ITEM_MAPPING itemId -> itemsDB_id
const QUEST_D_MAP = {
  99: "quest_apprentices_spellbook",
  261: "quest_baguette_dual_sword",
  159: "quest_bonebreaker",
  70: "quest_claymore",
  2499: "quest_elven_long_sword",
  297: "quest_glaive",
  280: "quest_light_crossbow",
  225: "quest_mithril_dagger",
  262: "quest_scallop_jamadhr",
  187: "quest_titan_hammer",
};

// { itemsDB_id: { itemId, isQuest } }
const WEAPON_MAP = {};

// D-grade quest (use QUEST_SHOP_ITEM_MAPPING)
for (const [itemIdStr, itemsDBId] of Object.entries(QUEST_D_MAP)) {
  WEAPON_MAP[itemsDBId] = { itemId: parseInt(itemIdStr, 10), isQuest: true };
}

// D-grade shop
const D_SHOP = [
  ["shop_weapon_d_atuba_hammer", 187],
  ["shop_weapon_d_baguette_dual_sword", 261],
  ["shop_weapon_d_dark_elven_bow", 277],
  ["shop_weapon_d_knights_sword", 128],
  ["shop_weapon_d_shilen_knife", 241],
  ["shop_weapon_d_tomahawk", 86],
  ["shop_weapon_d_triple_edged_jamadhr", 260],
  ["shop_weapon_d_two_handed_sword", 124],
  ["shop_weapon_d_war_hammer", 293],
];
for (const [id, itemId] of D_SHOP) {
  WEAPON_MAP[id] = { itemId, isQuest: false };
}

// C-grade shop + quest (same id in itemsDB)
const C_WEAPONS = [
  ["shop_weapon_c_akat_long_bow", 283, false],
  ["shop_weapon_c_apprentices_spellbook", 99, false],
  ["shop_weapon_c_battle_axe", 160, false],
  ["shop_weapon_c_berserker_blade", 5286, false],
  ["shop_weapon_c_big_hammer", 89, false],
  ["shop_weapon_c_crystal_dagger", 228, false],
  ["shop_weapon_c_dark_screamer", 233, false],
  ["shop_weapon_c_demon_staff", 206, false],
  ["shop_weapon_c_dwarven_hammer", 7897, false],
  ["shop_weapon_c_ecliptic_sword", 7888, false],
  ["shop_weapon_c_eminence_bow", 286, false],
  ["shop_weapon_c_fisted_blade", 265, false],
  ["shop_weapon_c_great_pata", 266, false],
  ["shop_weapon_c_heathens_book", 326, false],
  ["shop_weapon_c_heavy_doom_axe", 194, false],
  ["shop_weapon_c_heavy_doom_hammer", 191, false],
  ["shop_weapon_c_homunkulus_sword", 84, false],
  ["shop_weapon_c_knuckle_duster", 4233, false],
  ["shop_weapon_c_orcish_poleaxe", 299, false],
  ["shop_weapon_c_paagrian_sword", 7882, false],
  ["shop_weapon_c_paagrian_hammer", 199, false],
  ["shop_weapon_c_paagrian_axe", 203, false],
  ["shop_weapon_c_samurai_longsword", 135, false],
  ["shop_weapon_c_scorpion", 301, false],
  ["shop_weapon_c_war_axe", 162, false],
  ["shop_weapon_c_widow_maker", 303, false],
  ["shop_weapon_c_yaksa_mace", 2503, false],
  ["quest_weapon_c_akat_long_bow", 283, true],
  ["quest_weapon_c_apprentices_spellbook", 99, true],
  ["quest_weapon_c_battle_axe", 160, true],
  ["quest_weapon_c_berserker_blade", 5286, true],
  ["quest_weapon_c_big_hammer", 89, true],
  ["quest_weapon_c_crystal_dagger", 228, true],
  ["quest_weapon_c_dark_screamer", 233, true],
  ["quest_weapon_c_demon_staff", 206, true],
  ["quest_weapon_c_dwarven_hammer", 7897, true],
  ["quest_weapon_c_ecliptic_sword", 7888, true],
  ["quest_weapon_c_eminence_bow", 286, true],
  ["quest_weapon_c_fisted_blade", 265, true],
  ["quest_weapon_c_great_pata", 266, true],
  ["quest_weapon_c_heathens_book", 326, true],
  ["quest_weapon_c_heavy_doom_axe", 194, true],
  ["quest_weapon_c_heavy_doom_hammer", 191, true],
  ["quest_weapon_c_homunkulus_sword", 84, true],
  ["quest_weapon_c_knuckle_duster", 4233, true],
  ["quest_weapon_c_orcish_poleaxe", 299, true],
  ["quest_weapon_c_paagrian_sword", 7882, true],
  ["quest_weapon_c_paagrian_hammer", 199, true],
  ["quest_weapon_c_paagrian_axe", 203, true],
  ["quest_weapon_c_samurai_longsword", 135, true],
  ["quest_weapon_c_scorpion", 301, true],
  ["quest_weapon_c_war_axe", 162, true],
  ["quest_weapon_c_widow_maker", 303, true],
  ["quest_weapon_c_yaksa_mace", 2503, true],
];
for (const [id, itemId, isQuest] of C_WEAPONS) {
  WEAPON_MAP[id] = { itemId, isQuest };
}

// B-grade
const B_WEAPONS = [
  ["shop_weapon_b_apprentices_spellbook", 78, false],
  ["shop_weapon_b_art_of_battle_axe", 7834, false],
  ["shop_weapon_b_arthro_nail", 7788, false],
  ["shop_weapon_b_baguette_s_dualsword", 7792, false],
  ["shop_weapon_b_bellion_cestus", 7893, false],
  ["shop_weapon_b_bow_of_peril", 7891, false],
  ["shop_weapon_b_dark_elven_long_bow", 7890, false],
  ["shop_weapon_b_deadman_s_glory", 7791, false],
  ["shop_weapon_b_great_axe", 7894, false],
  ["shop_weapon_b_great_sword", 7895, false],
  ["shop_weapon_b_guardian_sword", 7883, false],
  ["shop_weapon_b_hell_knife", 7813, false],
  ["shop_weapon_b_ice_storm_hammer", 7900, false],
  ["shop_weapon_b_kaim_vanul_s_bones", 7893, false],
  ["shop_weapon_b_kris", 7783, false],
  ["shop_weapon_b_lance", 7784, false],
  ["shop_weapon_b_spell_breaker", 7892, false],
  ["shop_weapon_b_spirit_s_staff", 7889, false],
  ["shop_weapon_b_staff_of_evil_spirits", 7896, false],
  ["shop_weapon_b_star_buster", 7901, false],
  ["shop_weapon_b_sword_of_damascus", 7897, false],
  ["shop_weapon_b_sword_of_valhalla", 7722, false],
  ["shop_weapon_b_wizard_s_tear", 7889, false],
  ["quest_weapon_b_apprentices_spellbook", 78, true],
  ["quest_weapon_b_art_of_battle_axe", 7834, true],
  ["quest_weapon_b_arthro_nail", 7788, true],
  ["quest_weapon_b_baguette_s_dualsword", 7792, true],
  ["quest_weapon_b_bellion_cestus", 7893, true],
  ["quest_weapon_b_bow_of_peril", 7891, true],
  ["quest_weapon_b_dark_elven_long_bow", 7890, true],
  ["quest_weapon_b_deadman_s_glory", 7791, true],
  ["quest_weapon_b_great_axe", 7894, true],
  ["quest_weapon_b_great_sword", 7895, true],
  ["quest_weapon_b_guardian_sword", 7883, true],
  ["quest_weapon_b_hell_knife", 7813, true],
  ["quest_weapon_b_ice_storm_hammer", 7900, true],
  ["quest_weapon_b_kaim_vanul_s_bones", 7893, true],
  ["quest_weapon_b_kris", 7783, true],
  ["quest_weapon_b_lance", 7784, true],
  ["quest_weapon_b_spell_breaker", 7892, true],
  ["quest_weapon_b_spirit_s_staff", 7889, true],
  ["quest_weapon_b_staff_of_evil_spirits", 7896, true],
  ["quest_weapon_b_star_buster", 7901, true],
  ["quest_weapon_b_sword_of_damascus", 7897, true],
  ["quest_weapon_b_sword_of_valhalla", 7722, true],
  ["quest_weapon_b_wizard_s_tear", 7889, true],
];
for (const [id, itemId, isQuest] of B_WEAPONS) {
  WEAPON_MAP[id] = { itemId, isQuest };
}

// A-grade (many use itemId 2500 placeholder - skip or use first available)
const A_WEAPONS = [
  ["shop_weapon_a_dark_legions_edge", 2500, false],
  ["shop_weapon_a_meteor_shower", 2504, false],
  ["shop_weapon_a_apprentices_spellbook", 78, false],
  ["shop_weapon_a_baguette_s_dualsword", 7792, false],
  ["shop_weapon_a_barakiel_s_axe", 2500, false],
  ["shop_weapon_a_behemoth_s_tuning_fork", 2500, false],
  ["shop_weapon_a_blood_tornado", 2500, false],
  ["shop_weapon_a_bloody_orchid", 2500, false],
  ["shop_weapon_a_branch_of_the_mother_tree", 2500, false],
  ["shop_weapon_a_cabrio_s_hand", 2500, false],
  ["shop_weapon_a_carnage_bow", 2500, false],
  ["shop_weapon_a_daimon_crystal", 2500, false],
  ["shop_weapon_a_dasparion_s_staff", 210, false],
  ["shop_weapon_a_dragon_grinder", 231, false],
  ["shop_weapon_a_dragon_slayer", 2500, false],
  ["shop_weapon_a_elysian", 290, false],
  ["shop_weapon_a_halberd", 304, false],
  ["shop_weapon_a_infernal_master", 2500, false],
  ["shop_weapon_a_naga_storm", 2500, false],
  ["shop_weapon_a_shyeed_s_bow", 2500, false],
  ["shop_weapon_a_sirra_s_blade", 2500, false],
  ["shop_weapon_a_sobekk_s_hurricane", 2500, false],
  ["shop_weapon_a_soul_bow", 2500, false],
  ["shop_weapon_a_soul_separator", 2500, false],
  ["shop_weapon_a_spiritual_eye", 2500, false],
  ["shop_weapon_a_sword_of_ipos", 2500, false],
  ["shop_weapon_a_sword_of_miracles", 88, false],
  ["shop_weapon_a_tallum_blade", 2500, false],
  ["shop_weapon_a_tallum_glaive", 2500, false],
  ["shop_weapon_a_themis_tongue", 2500, false],
  ["shop_weapon_a_tiphon_s_spear", 2500, false],
  ["quest_weapon_a_dark_legions_edge", 2500, true],
  ["quest_weapon_a_meteor_shower", 2504, true],
  ["quest_weapon_a_apprentices_spellbook", 78, true],
  ["quest_weapon_a_baguette_s_dualsword", 7792, true],
  ["quest_weapon_a_barakiel_s_axe", 2500, true],
  ["quest_weapon_a_behemoth_s_tuning_fork", 2500, true],
  ["quest_weapon_a_blood_tornado", 2500, true],
  ["quest_weapon_a_bloody_orchid", 2500, true],
  ["quest_weapon_a_branch_of_the_mother_tree", 2500, true],
  ["quest_weapon_a_cabrio_s_hand", 2500, true],
  ["quest_weapon_a_carnage_bow", 2500, true],
  ["quest_weapon_a_daimon_crystal", 2500, true],
  ["quest_weapon_a_dasparion_s_staff", 210, true],
  ["quest_weapon_a_dragon_grinder", 231, true],
  ["quest_weapon_a_dragon_slayer", 2500, true],
  ["quest_weapon_a_elysian", 290, true],
  ["quest_weapon_a_halberd", 304, true],
  ["quest_weapon_a_infernal_master", 2500, true],
  ["quest_weapon_a_naga_storm", 2500, true],
  ["quest_weapon_a_shyeed_s_bow", 2500, true],
  ["quest_weapon_a_sirra_s_blade", 2500, true],
  ["quest_weapon_a_sobekk_s_hurricane", 2500, true],
  ["quest_weapon_a_soul_bow", 2500, true],
  ["quest_weapon_a_soul_separator", 2500, true],
  ["quest_weapon_a_spiritual_eye", 2500, true],
  ["quest_weapon_a_sword_of_ipos", 2500, true],
  ["quest_weapon_a_sword_of_miracles", 88, true],
  ["quest_weapon_a_tallum_blade", 2500, true],
  ["quest_weapon_a_tallum_glaive", 2500, true],
  ["quest_weapon_a_themis_tongue", 2500, true],
  ["quest_weapon_a_tiphon_s_spear", 2500, true],
];
for (const [id, itemId, isQuest] of A_WEAPONS) {
  WEAPON_MAP[id] = { itemId, isQuest };
}

// S-grade
const S_WEAPONS = [
  ["shop_weapon_s_angel_slayer", 20167, false],
  ["shop_weapon_s_apprentices_spellbook", 78, false],
  ["shop_weapon_s_arcana_mace", 20170, false],
  ["shop_weapon_s_baguette_s_dualsword", 7792, false],
  ["shop_weapon_s_basalt_battlehammer", 20168, false],
  ["shop_weapon_s_demon_splinter", 20172, false],
  ["shop_weapon_s_draconic_bow", 20173, false],
  ["shop_weapon_s_dragon_hunter_axe", 20169, false],
  ["shop_weapon_s_god_s_blade", 82, false],
  ["shop_weapon_s_heaven_s_divider", 20166, false],
  ["shop_weapon_s_imperial_staff", 20171, false],
  ["shop_weapon_s_saint_spear", 20174, false],
  ["shop_weapon_s_shining_bow", 20173, false],
  ["quest_weapon_s_angel_slayer", 20167, true],
  ["quest_weapon_s_apprentices_spellbook", 78, true],
  ["quest_weapon_s_arcana_mace", 20170, true],
  ["quest_weapon_s_baguette_s_dualsword", 7792, true],
  ["quest_weapon_s_basalt_battlehammer", 20168, true],
  ["quest_weapon_s_demon_splinter", 20172, true],
  ["quest_weapon_s_draconic_bow", 20173, true],
  ["quest_weapon_s_dragon_hunter_axe", 20169, true],
  ["quest_weapon_s_god_s_blade", 82, true],
  ["quest_weapon_s_heaven_s_divider", 20166, true],
  ["quest_weapon_s_imperial_staff", 20171, true],
  ["quest_weapon_s_saint_spear", 20174, true],
  ["quest_weapon_s_shining_bow", 20173, true],
];
for (const [id, itemId, isQuest] of S_WEAPONS) {
  WEAPON_MAP[id] = { itemId, isQuest };
}

function buildStats(id, itemId, isQuest) {
  const xml = XML_STATS[String(itemId)];
  if (!xml) return null;
  let pAtk = xml.pAtk ?? 0;
  let mAtk = xml.mAtk ?? 0;
  let rCrit = xml.rCrit ?? 4;
  let pAtkSpd = xml.pAtkSpd ?? 379;
  const castSpeed = xml.castSpeed;
  let critPower;
  if (isQuest) {
    pAtkSpd += 50;
    critPower = 30;
  }
  const parts = [`pAtk: ${pAtk}`, `mAtk: ${mAtk}`, `rCrit: ${rCrit}`, `pAtkSpd: ${pAtkSpd}`];
  if (critPower !== undefined) parts.push(`critPower: ${critPower}`);
  if (castSpeed !== undefined) parts.push(`castSpeed: ${castSpeed}`);
  return `stats: { ${parts.join(", ")} }`;
}

const ITEMSDB_FILES = ["itemsDB_d.ts", "itemsDB_c.ts", "itemsDB_b.ts", "itemsDB_a.ts", "itemsDB_s.ts"];

let updated = 0;
let skipped = 0;

for (const file of ITEMSDB_FILES) {
  const filePath = path.join(ROOT, "src", "data", "items", file);
  let content = fs.readFileSync(filePath, "utf-8");
  for (const [itemsDBId, { itemId, isQuest }] of Object.entries(WEAPON_MAP)) {
    const newStats = buildStats(itemsDBId, itemId, isQuest);
    if (!newStats) {
      skipped++;
      continue;
    }
    const regex = new RegExp(
      `(${itemsDBId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}:\\s*\\{[\\s\\S]*?)\\s*stats:\\s*\\{[^}]+\\}`,
      "m"
    );
    const m = content.match(regex);
    if (m) {
      content = content.replace(regex, `$1\n    ${newStats}`);
      updated++;
    }
  }
  fs.writeFileSync(filePath, content, "utf-8");
}

console.log(`Updated ${updated} weapon stats, skipped ${skipped} (no XML)`);
