/**
 * Server-side quest drop registry.
 * Mirrors questDrops from src/data/quests.ts — keep in sync when quests change.
 *
 * Only quests with questDrops[] are listed here; kill-only quests are omitted.
 */

export interface ServerQuestDropEntry {
  questId: string;
  mobName: string;
  itemId: string;
  requiredCount: number;
  /** If set, drop only fires in zones whose id starts with this prefix */
  dropZoneIdPrefix?: string;
  /** item display metadata for inventory row */
  kind?: string;
  slot?: string;
}

export const SERVER_QUEST_DROPS: ServerQuestDropEntry[] = [
  // gludio_outskirts_wolf_charcoal
  { questId: "gludio_outskirts_wolf_charcoal", mobName: "Гоблин", itemId: "charcoal", requiredCount: 5, kind: "resource", slot: "resource" },
  { questId: "gludio_outskirts_wolf_charcoal", mobName: "Материй Кельтир", itemId: "charcoal", requiredCount: 5, kind: "resource", slot: "resource" },
  { questId: "gludio_outskirts_wolf_charcoal", mobName: "Молодой Шакал", itemId: "charcoal", requiredCount: 5, kind: "resource", slot: "resource" },
  { questId: "gludio_outskirts_wolf_charcoal", mobName: "Бородатий Шакал", itemId: "charcoal", requiredCount: 5, kind: "resource", slot: "resource" },

  // gludio_outskirts_demon_suede
  { questId: "gludio_outskirts_demon_suede", mobName: "Гоблин", itemId: "suede", requiredCount: 10, kind: "resource", slot: "resource" },
  { questId: "gludio_outskirts_demon_suede", mobName: "Бес", itemId: "suede", requiredCount: 10, kind: "resource", slot: "resource" },
  { questId: "gludio_outskirts_demon_suede", mobName: "Старий Бес", itemId: "suede", requiredCount: 10, kind: "resource", slot: "resource" },
  { questId: "gludio_outskirts_demon_suede", mobName: "Орк Лучник", itemId: "suede", requiredCount: 10, kind: "resource", slot: "resource" },

  // gludio_forest_thread
  { questId: "gludio_forest_thread", mobName: "Гоблин", itemId: "thread", requiredCount: 5, kind: "resource", slot: "resource" },
  { questId: "gludio_forest_thread", mobName: "Скелет", itemId: "thread", requiredCount: 5, kind: "resource", slot: "resource" },
  { questId: "gludio_forest_thread", mobName: "Орк Воїн", itemId: "thread", requiredCount: 5, kind: "resource", slot: "resource" },
  { questId: "gludio_forest_thread", mobName: "Глаз Монстра", itemId: "thread", requiredCount: 5, kind: "resource", slot: "resource" },

  // gludio_ruins_raid_varnish
  { questId: "gludio_ruins_raid_varnish", mobName: "Гоблин", itemId: "varnish", requiredCount: 30, kind: "resource", slot: "resource" },
  { questId: "gludio_ruins_raid_varnish", mobName: "Скелет", itemId: "varnish", requiredCount: 30, kind: "resource", slot: "resource" },
  { questId: "gludio_ruins_raid_varnish", mobName: "Волк", itemId: "varnish", requiredCount: 30, kind: "resource", slot: "resource" },
  { questId: "gludio_ruins_raid_varnish", mobName: "Орк Воїн", itemId: "varnish", requiredCount: 30, kind: "resource", slot: "resource" },
  { questId: "gludio_ruins_raid_varnish", mobName: "Ельпі", itemId: "varnish", requiredCount: 30, kind: "resource", slot: "resource" },

  // gludio_orcs_leather
  { questId: "gludio_orcs_leather", mobName: "Тетрарх Орк Турек", itemId: "leather", requiredCount: 15, dropZoneIdPrefix: "l2dop_gludio_07", kind: "resource", slot: "resource" },
  { questId: "gludio_orcs_leather", mobName: "Орк Воїн", itemId: "leather", requiredCount: 15, dropZoneIdPrefix: "l2dop_gludio_07", kind: "resource", slot: "resource" },
  { questId: "gludio_orcs_leather", mobName: "Орк Лейтенант", itemId: "leather", requiredCount: 15, dropZoneIdPrefix: "l2dop_gludio_07", kind: "resource", slot: "resource" },
  { questId: "gludio_orcs_leather", mobName: "Орк Снайпер", itemId: "leather", requiredCount: 15, dropZoneIdPrefix: "l2dop_gludio_07", kind: "resource", slot: "resource" },

  // gludio_caves_compound_braid
  { questId: "gludio_caves_compound_braid", mobName: "Гранітовий Голем", itemId: "compound_braid", requiredCount: 12, dropZoneIdPrefix: "l2dop_gludio_08", kind: "resource", slot: "resource" },
  { questId: "gludio_caves_compound_braid", mobName: "Вождь Ящерів Мель", itemId: "compound_braid", requiredCount: 12, dropZoneIdPrefix: "l2dop_gludio_08", kind: "resource", slot: "resource" },
  { questId: "gludio_caves_compound_braid", mobName: "Тетрарх Орк Турек", itemId: "compound_braid", requiredCount: 12, dropZoneIdPrefix: "l2dop_gludio_08", kind: "resource", slot: "resource" },

  // Elven Mystic first prof
  { questId: "elven_mystic_first_profession_materials", mobName: "Lirein", itemId: "quest_elf_mprof_lirein_whisper", requiredCount: 15, dropZoneIdPrefix: "floran_village", kind: "quest", slot: "quest" },
  { questId: "elven_mystic_first_profession_materials", mobName: "Will-O-Wisp", itemId: "quest_elf_mprof_wisp_flame", requiredCount: 10, dropZoneIdPrefix: "floran_village", kind: "quest", slot: "quest" },
  { questId: "elven_mystic_first_profession_materials", mobName: "Undine", itemId: "quest_elf_mprof_undine_mirror", requiredCount: 5, dropZoneIdPrefix: "floran_village", kind: "quest", slot: "quest" },

  // Elven Fighter first prof
  { questId: "elven_fighter_first_profession_trophies", mobName: "Venomous Spider", itemId: "quest_elf_fprof_spider_fang", requiredCount: 10, dropZoneIdPrefix: "floran_village", kind: "quest", slot: "quest" },
  { questId: "elven_fighter_first_profession_trophies", mobName: "Lirein", itemId: "quest_elf_fprof_lirein_leaf", requiredCount: 10, dropZoneIdPrefix: "floran_village", kind: "quest", slot: "quest" },
  { questId: "elven_fighter_first_profession_trophies", mobName: "Tracker Skeleton Leader", itemId: "quest_elf_fprof_bone_shard", requiredCount: 8, dropZoneIdPrefix: "floran_village", kind: "quest", slot: "quest" },
  { questId: "elven_fighter_first_profession_trophies", mobName: "Boogle Ratman Leader", itemId: "quest_elf_fprof_ratman_badge", requiredCount: 6, dropZoneIdPrefix: "floran_village", kind: "quest", slot: "quest" },

  // Human Fighter first prof
  { questId: "human_fighter_first_profession_reagents", mobName: "Evil Eye Seer", itemId: "quest_human_fprof_seer_orb", requiredCount: 14, dropZoneIdPrefix: "gludin_village", kind: "quest", slot: "quest" },
  { questId: "human_fighter_first_profession_reagents", mobName: "Arachnid Tracker", itemId: "quest_human_fprof_tracker_spur", requiredCount: 14, dropZoneIdPrefix: "gludin_village", kind: "quest", slot: "quest" },
  { questId: "human_fighter_first_profession_reagents", mobName: "Stink Zombie", itemId: "quest_human_fprof_zombie_ichor", requiredCount: 12, dropZoneIdPrefix: "gludin_village", kind: "quest", slot: "quest" },
  { questId: "human_fighter_first_profession_reagents", mobName: "Skeleton Scout", itemId: "quest_human_fprof_scout_sigil", requiredCount: 10, dropZoneIdPrefix: "gludin_village", kind: "quest", slot: "quest" },

  // Human Mystic first prof
  { questId: "human_mystic_first_profession_essences", mobName: "Lirein Elder", itemId: "quest_human_mprof_fae_branch", requiredCount: 14, dropZoneIdPrefix: "gludin_village", kind: "quest", slot: "quest" },
  { questId: "human_mystic_first_profession_essences", mobName: "Salamander Noble", itemId: "quest_human_mprof_salamander_core", requiredCount: 14, dropZoneIdPrefix: "gludin_village", kind: "quest", slot: "quest" },
  { questId: "human_mystic_first_profession_essences", mobName: "Undine Noble", itemId: "quest_human_mprof_undine_tear", requiredCount: 12, dropZoneIdPrefix: "gludin_village", kind: "quest", slot: "quest" },
  { questId: "human_mystic_first_profession_essences", mobName: "Undead Slave", itemId: "quest_human_mprof_bone_script", requiredCount: 10, dropZoneIdPrefix: "gludin_village", kind: "quest", slot: "quest" },

  // Dark Elf Fighter first prof
  { questId: "dark_elf_fighter_first_profession_effigies", mobName: "Lesser Dark Horror", itemId: "quest_defelf_fprof_lesser_cinder", requiredCount: 14, dropZoneIdPrefix: "floran_village", kind: "quest", slot: "quest" },
  { questId: "dark_elf_fighter_first_profession_effigies", mobName: "Shade Horror", itemId: "quest_defelf_fprof_shade_hook", requiredCount: 14, dropZoneIdPrefix: "floran_village", kind: "quest", slot: "quest" },
  { questId: "dark_elf_fighter_first_profession_effigies", mobName: "Crypt Horror", itemId: "quest_defelf_fprof_crypt_chain", requiredCount: 12, dropZoneIdPrefix: "floran_village", kind: "quest", slot: "quest" },
  { questId: "dark_elf_fighter_first_profession_effigies", mobName: "Oblivion Watcher", itemId: "quest_defelf_fprof_oblivion_tag", requiredCount: 10, dropZoneIdPrefix: "floran_village", kind: "quest", slot: "quest" },

  // Dark Elf Mystic first prof
  { questId: "dark_elf_mystic_first_profession_sigils", mobName: "Will-O-Wisp", itemId: "quest_defelf_mprof_wisp_husk", requiredCount: 14, dropZoneIdPrefix: "floran_village", kind: "quest", slot: "quest" },
  { questId: "dark_elf_mystic_first_profession_sigils", mobName: "Mana Seeker", itemId: "quest_defelf_mprof_mana_splinter", requiredCount: 14, dropZoneIdPrefix: "floran_village", kind: "quest", slot: "quest" },
  { questId: "dark_elf_mystic_first_profession_sigils", mobName: "Scarlet Salamander", itemId: "quest_defelf_mprof_ember_scale", requiredCount: 12, dropZoneIdPrefix: "floran_village", kind: "quest", slot: "quest" },
  { questId: "dark_elf_mystic_first_profession_sigils", mobName: "Undine", itemId: "quest_defelf_mprof_undine_drop", requiredCount: 10, dropZoneIdPrefix: "floran_village", kind: "quest", slot: "quest" },

  // Orc Fighter first prof
  { questId: "orc_fighter_first_profession_totems", mobName: "Vuku Orc Fighter", itemId: "quest_orc_fprof_vuku_trophy", requiredCount: 14, dropZoneIdPrefix: "gludin_village", kind: "quest", slot: "quest" },
  { questId: "orc_fighter_first_profession_totems", mobName: "Vuku Orc Archer", itemId: "quest_orc_fprof_archer_feather", requiredCount: 14, dropZoneIdPrefix: "gludin_village", kind: "quest", slot: "quest" },
  { questId: "orc_fighter_first_profession_totems", mobName: "Enku Orc Shaman", itemId: "quest_orc_fprof_enku_fetish", requiredCount: 12, dropZoneIdPrefix: "gludin_village", kind: "quest", slot: "quest" },
  { questId: "orc_fighter_first_profession_totems", mobName: "Enku Orc Champion", itemId: "quest_orc_fprof_champion_brand", requiredCount: 10, dropZoneIdPrefix: "gludin_village", kind: "quest", slot: "quest" },

  // Orc Mystic first prof
  { questId: "orc_mystic_first_profession_charms", mobName: "Orc Shaman", itemId: "quest_orc_mprof_shaman_claw", requiredCount: 14, dropZoneIdPrefix: "gludin_village", kind: "quest", slot: "quest" },
  { questId: "orc_mystic_first_profession_charms", mobName: "Enku Orc Shaman", itemId: "quest_orc_mprof_enku_totem", requiredCount: 14, dropZoneIdPrefix: "gludin_village", kind: "quest", slot: "quest" },
  { questId: "orc_mystic_first_profession_charms", mobName: "Mana Seeker", itemId: "quest_orc_mprof_mana_fractal", requiredCount: 12, dropZoneIdPrefix: "gludin_village", kind: "quest", slot: "quest" },
  { questId: "orc_mystic_first_profession_charms", mobName: "Will-O-Wisp", itemId: "quest_orc_mprof_wisp_cinder", requiredCount: 10, dropZoneIdPrefix: "gludin_village", kind: "quest", slot: "quest" },

  // Dwarven Fighter first prof
  { questId: "dwarven_fighter_first_profession_samples", mobName: "Pitchstone Golem", itemId: "quest_dwarf_fprof_pitchstone_chip", requiredCount: 14, dropZoneIdPrefix: "gludin_village", kind: "quest", slot: "quest" },
  { questId: "dwarven_fighter_first_profession_samples", mobName: "Dwarf Ghost", itemId: "quest_dwarf_fprof_ghost_dust", requiredCount: 14, dropZoneIdPrefix: "gludin_village", kind: "quest", slot: "quest" },
  { questId: "dwarven_fighter_first_profession_samples", mobName: "Ruin Imp", itemId: "quest_dwarf_fprof_ruin_ember", requiredCount: 12, dropZoneIdPrefix: "gludin_village", kind: "quest", slot: "quest" },
  { questId: "dwarven_fighter_first_profession_samples", mobName: "Obsidian Golem", itemId: "quest_dwarf_fprof_obsidian_splinter", requiredCount: 10, dropZoneIdPrefix: "gludin_village", kind: "quest", slot: "quest" },
];
