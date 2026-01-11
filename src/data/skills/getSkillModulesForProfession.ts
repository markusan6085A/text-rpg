import type { ProfessionId } from "./professionTypes";

/**
 * Отримує модулі скілів для професії з урахуванням ланцюжка професій
 */
export function getSkillModulesForProfession(
  professionId: ProfessionId | null,
  normalizeProfessionId: (id: ProfessionId | string | null) => ProfessionId | null,
  skillModules: Record<ProfessionId, Record<string, any>>
): Record<string, any>[] {
  const pid = normalizeProfessionId(professionId);
  if (!pid) return [];

  // HumanMystic : base -> cleric -> bishop/prophet -> cardinal/hierophant
  if (pid === "human_mystic_base") return [skillModules["human_mystic_base"]];
  if (pid === "human_mystic_cleric")
    return [skillModules["human_mystic_base"], skillModules["human_mystic_cleric"]];
  if (pid === "human_mystic_wizard")
    return [skillModules["human_mystic_base"], skillModules["human_mystic_wizard"]];
  if (pid === "human_mystic_warlock")
    return [
      skillModules["human_mystic_base"],
      skillModules["human_mystic_wizard"],
      skillModules["human_mystic_warlock"],
    ];
  if (pid === "human_mystic_arcana_lord")
    return [
      skillModules["human_mystic_base"],
      skillModules["human_mystic_wizard"],
      skillModules["human_mystic_warlock"],
      skillModules["human_mystic_arcana_lord"],
    ];
  if (pid === "human_mystic_sorcerer")
    return [
      skillModules["human_mystic_base"],
      skillModules["human_mystic_wizard"],
      skillModules["human_mystic_sorcerer"],
    ];
  if (pid === "human_mystic_necromancer")
    return [
      skillModules["human_mystic_base"],
      skillModules["human_mystic_wizard"],
      skillModules["human_mystic_necromancer"],
    ];
  if (pid === "human_mystic_soultaker")
    return [
      skillModules["human_mystic_base"],
      skillModules["human_mystic_wizard"],
      skillModules["human_mystic_necromancer"],
      skillModules["human_mystic_soultaker"],
    ];
  if (pid === "human_mystic_archmage")
    return [
      skillModules["human_mystic_base"],
      skillModules["human_mystic_wizard"],
      skillModules["human_mystic_sorcerer"],
      skillModules["human_mystic_archmage"],
    ];
  if (pid === "human_mystic_bishop")
    return [
      skillModules["human_mystic_base"],
      skillModules["human_mystic_cleric"],
      skillModules["human_mystic_bishop"],
    ];
  if (pid === "human_mystic_prophet")
    return [
      skillModules["human_mystic_base"],
      skillModules["human_mystic_cleric"],
      skillModules["human_mystic_prophet"],
    ];
  if (pid === "human_mystic_cardinal")
    return [
      skillModules["human_mystic_base"],
      skillModules["human_mystic_cleric"],
      skillModules["human_mystic_bishop"],
      skillModules["human_mystic_cardinal"],
    ];
  if (pid === "human_mystic_hierophant")
    return [
      skillModules["human_mystic_base"],
      skillModules["human_mystic_cleric"],
      skillModules["human_mystic_prophet"],
      skillModules["human_mystic_hierophant"],
    ];

  // Dark Mystic: base -> Shillien Oracle/Dark Wizard -> Spellhowler/Shillien Elder -> StormScreamer/Shillien Saint
  if (pid === "dark_mystic_base") return [skillModules["dark_mystic_base"]];
  if (pid === "dark_mystic_oracle")
    return [skillModules["dark_mystic_base"], skillModules["dark_mystic_oracle"]];
  if (pid === "dark_mystic_dark_wizard")
    return [skillModules["dark_mystic_base"], skillModules["dark_mystic_dark_wizard"]];
  if (pid === "dark_mystic_spellhowler")
    return [
      skillModules["dark_mystic_base"],
      skillModules["dark_mystic_dark_wizard"],
      skillModules["dark_mystic_spellhowler"],
    ];
  if (pid === "dark_mystic_storm_screamer")
    return [
      skillModules["dark_mystic_base"],
      skillModules["dark_mystic_dark_wizard"],
      skillModules["dark_mystic_spellhowler"],
      skillModules["dark_mystic_storm_screamer"],
    ];
  if (pid === "dark_mystic_shillien_elder")
    return [
      skillModules["dark_mystic_base"],
      skillModules["dark_mystic_oracle"],
      skillModules["dark_mystic_shillien_elder"],
    ];
  if (pid === "dark_mystic_shillien_saint")
    return [
      skillModules["dark_mystic_base"],
      skillModules["dark_mystic_oracle"],
      skillModules["dark_mystic_shillien_elder"],
      skillModules["dark_mystic_shillien_saint"],
    ];
  if (pid === "dark_mystic_phantom_summoner")
    return [
      skillModules["dark_mystic_base"],
      skillModules["dark_mystic_dark_wizard"],
      skillModules["dark_mystic_phantom_summoner"],
    ];
  if (pid === "dark_mystic_spectral_master")
    return [
      skillModules["dark_mystic_base"],
      skillModules["dark_mystic_dark_wizard"],
      skillModules["dark_mystic_phantom_summoner"],
      skillModules["dark_mystic_spectral_master"],
    ];

  // Human Fighter: base -> warrior -> gladiator/paladin -> dark_avenger/dreadnought/titan
  if (pid === "human_fighter") return [skillModules["human_fighter"]];
  if (pid === "human_fighter_warrior")
    return [skillModules["human_fighter"], skillModules["human_fighter_warrior"]];
  if (pid === "human_fighter_gladiator")
    return [
      skillModules["human_fighter"],
      skillModules["human_fighter_warrior"],
      skillModules["human_fighter_gladiator"],
    ];
  if (pid === "human_fighter_duelist")
    return [
      skillModules["human_fighter"],
      skillModules["human_fighter_warrior"],
      skillModules["human_fighter_gladiator"],
      skillModules["human_fighter_duelist"],
    ];
  if (pid === "human_fighter_warlord")
    return [
      skillModules["human_fighter"],
      skillModules["human_fighter_warrior"],
      skillModules["human_fighter_warlord"],
    ];
  if (pid === "human_fighter_dreadnought")
    return [
      skillModules["human_fighter"],
      skillModules["human_fighter_warrior"],
      skillModules["human_fighter_warlord"],
      skillModules["human_fighter_dreadnought"],
    ];
  if (pid === "human_fighter_paladin")
    return [
      skillModules["human_fighter"],
      skillModules["human_fighter_human_knight"],
      skillModules["human_fighter_paladin"],
    ];
  if (pid === "human_fighter_phoenix_knight")
    return [
      skillModules["human_fighter"],
      skillModules["human_fighter_human_knight"],
      skillModules["human_fighter_paladin"],
      skillModules["human_fighter_phoenix_knight"],
    ];
  if (pid === "human_fighter_hell_knight")
    return [
      skillModules["human_fighter"],
      skillModules["human_fighter_human_knight"],
      skillModules["human_fighter_paladin"],
      skillModules["human_fighter_hell_knight"],
    ];
  if (pid === "human_fighter_dark_avenger")
    return [
      skillModules["human_fighter"],
      skillModules["human_fighter_human_knight"],
      skillModules["human_fighter_dark_avenger"],
    ];
  if (pid === "human_fighter_titan")
    return [
      skillModules["human_fighter"],
      skillModules["human_fighter_warrior"],
      skillModules["human_fighter_gladiator"],
      skillModules["human_fighter_titan"],
    ];
  if (pid === "human_fighter_human_knight")
    return [
      skillModules["human_fighter"],
      skillModules["human_fighter_human_knight"],
    ];
  if (pid === "human_fighter_rogue")
    return [
      skillModules["human_fighter"],
      skillModules["human_fighter_rogue"],
    ];
  if (pid === "human_fighter_hawkeye")
    return [
      skillModules["human_fighter"],
      skillModules["human_fighter_rogue"],
      skillModules["human_fighter_hawkeye"],
    ];
  if (pid === "human_fighter_treasure_hunter")
    return [
      skillModules["human_fighter"],
      skillModules["human_fighter_rogue"],
      skillModules["human_fighter_treasure_hunter"],
    ];
  if (pid === "human_fighter_sagittarius")
    return [
      skillModules["human_fighter"],
      skillModules["human_fighter_rogue"],
      skillModules["human_fighter_hawkeye"],
      skillModules["human_fighter_sagittarius"],
    ];
  if (pid === "human_fighter_adventurer")
    return [
      skillModules["human_fighter"],
      skillModules["human_fighter_rogue"],
      skillModules["human_fighter_treasure_hunter"],
      skillModules["human_fighter_adventurer"],
    ];

  // Orc Fighter chain
  if (pid === "orc_fighter")
    return [skillModules["orc_fighter"]];
  if (pid === "orc_fighter_raider")
    return [
      skillModules["orc_fighter"],
      skillModules["orc_fighter_raider"],
    ];
  if (pid === "orc_fighter_destroyer")
    return [
      skillModules["orc_fighter"],
      skillModules["orc_fighter_raider"],
      skillModules["orc_fighter_destroyer"],
    ];
  if (pid === "orc_fighter_titan")
    return [
      skillModules["orc_fighter"],
      skillModules["orc_fighter_raider"],
      skillModules["orc_fighter_destroyer"],
      skillModules["orc_fighter_titan"],
    ];
  if (pid === "orc_fighter_monk")
    return [
      skillModules["orc_fighter"],
      skillModules["orc_fighter_monk"],
    ];
  if (pid === "orc_fighter_tyrant")
    return [
      skillModules["orc_fighter"],
      skillModules["orc_fighter_monk"],
      skillModules["orc_fighter_tyrant"],
    ];
  if (pid === "orc_fighter_grand_khavatari")
    return [
      skillModules["orc_fighter"],
      skillModules["orc_fighter_monk"],
      skillModules["orc_fighter_tyrant"],
      skillModules["orc_fighter_grand_khavatari"],
    ];
  
  // Orc Mystic chain
  if (pid === "orc_mystic_base") return [skillModules["orc_mystic_base"]];
  if (pid === "orc_mystic_shaman")
    return [
      skillModules["orc_mystic_base"],
      skillModules["orc_mystic_shaman"],
    ];
  if (pid === "orc_mystic_warcryer")
    return [
      skillModules["orc_mystic_base"],
      skillModules["orc_mystic_shaman"],
      skillModules["orc_mystic_warcryer"],
    ];
  if (pid === "orc_mystic_doomcryer")
    return [
      skillModules["orc_mystic_base"],
      skillModules["orc_mystic_shaman"],
      skillModules["orc_mystic_warcryer"],
      skillModules["orc_mystic_doomcryer"],
    ];
  if (pid === "orc_mystic_overlord")
    return [
      skillModules["orc_mystic_base"],
      skillModules["orc_mystic_shaman"],
      skillModules["orc_mystic_overlord"],
    ];
  if (pid === "orc_mystic_dominator")
    return [
      skillModules["orc_mystic_base"],
      skillModules["orc_mystic_shaman"],
      skillModules["orc_mystic_overlord"],
      skillModules["orc_mystic_dominator"],
    ];

  // Dwarven Fighter chain
  if (pid === "dwarven_fighter")
    return [skillModules["dwarven_fighter"]];
  if (pid === "dwarven_fighter_scavenger")
    return [
      skillModules["dwarven_fighter"],
      skillModules["dwarven_fighter_scavenger"],
    ];
  if (pid === "dwarven_fighter_bounty_hunter")
    return [
      skillModules["dwarven_fighter"],
      skillModules["dwarven_fighter_scavenger"],
      skillModules["dwarven_fighter_bounty_hunter"],
    ];
  if (pid === "dwarven_fighter_fortune_seeker")
    return [
      skillModules["dwarven_fighter"],
      skillModules["dwarven_fighter_scavenger"],
      skillModules["dwarven_fighter_bounty_hunter"],
      skillModules["dwarven_fighter_fortune_seeker"],
    ];
  if (pid === "dwarven_fighter_artisan")
    return [
      skillModules["dwarven_fighter"],
      skillModules["dwarven_fighter_artisan"],
    ];
  if (pid === "dwarven_fighter_warsmith")
    return [
      skillModules["dwarven_fighter"],
      skillModules["dwarven_fighter_artisan"],
      skillModules["dwarven_fighter_warsmith"],
    ];
  if (pid === "dwarven_fighter_maestro")
    return [
      skillModules["dwarven_fighter"],
      skillModules["dwarven_fighter_artisan"],
      skillModules["dwarven_fighter_warsmith"],
      skillModules["dwarven_fighter_maestro"],
    ];

  // Elven Fighter chain
  if (pid === "elven_fighter")
    return [skillModules["elven_fighter"]];
  if (pid === "elven_fighter_elven_knight")
    return [
      skillModules["elven_fighter"],
      skillModules["elven_fighter_elven_knight"],
    ];
  if (pid === "elven_fighter_swordsinger")
    return [
      skillModules["elven_fighter"],
      skillModules["elven_fighter_elven_knight"],
      skillModules["elven_fighter_swordsinger"],
    ];
  if (pid === "elven_fighter_sword_muse")
    return [
      skillModules["elven_fighter"],
      skillModules["elven_fighter_elven_knight"],
      skillModules["elven_fighter_swordsinger"],
      skillModules["elven_fighter_sword_muse"],
    ];
  if (pid === "elven_fighter_temple_knight")
    return [
      skillModules["elven_fighter"],
      skillModules["elven_fighter_elven_knight"],
      skillModules["elven_fighter_temple_knight"],
    ];
  if (pid === "elven_fighter_evas_templar")
    return [
      skillModules["elven_fighter"],
      skillModules["elven_fighter_elven_knight"],
      skillModules["elven_fighter_temple_knight"],
      skillModules["elven_fighter_evas_templar"],
    ];
  if (pid === "elven_fighter_elven_scout")
    return [
      skillModules["elven_fighter"],
      skillModules["elven_fighter_elven_scout"],
    ];
  if (pid === "elven_fighter_silver_ranger")
    return [
      skillModules["elven_fighter"],
      skillModules["elven_fighter_elven_scout"],
      skillModules["elven_fighter_silver_ranger"],
    ];
  if (pid === "elven_fighter_moonlight_sentinel")
    return [
      skillModules["elven_fighter"],
      skillModules["elven_fighter_elven_scout"],
      skillModules["elven_fighter_silver_ranger"],
      skillModules["elven_fighter_moonlight_sentinel"],
    ];
  if (pid === "elven_fighter_plainswalker")
    return [
      skillModules["elven_fighter"],
      skillModules["elven_fighter_elven_scout"],
      skillModules["elven_fighter_plainswalker"],
    ];
  if (pid === "elven_fighter_wind_rider")
    return [
      skillModules["elven_fighter"],
      skillModules["elven_fighter_elven_scout"],
      skillModules["elven_fighter_plainswalker"],
      skillModules["elven_fighter_wind_rider"],
    ];

  // Elven Mystic chain
  if (pid === "elven_mystic")
    return [skillModules["elven_mystic"]];
  if (pid === "elven_mystic_oracle")
    return [
      skillModules["elven_mystic"],
      skillModules["elven_mystic_oracle"],
    ];
  if (pid === "elven_mystic_elven_elder")
    return [
      skillModules["elven_mystic"],
      skillModules["elven_mystic_oracle"],
      skillModules["elven_mystic_elven_elder"],
    ];
  if (pid === "elven_mystic_elven_wizard")
    return [
      skillModules["elven_mystic"],
      skillModules["elven_mystic_elven_wizard"],
    ];
  if (pid === "elven_mystic_elemental_summoner")
    return [
      skillModules["elven_mystic"],
      skillModules["elven_mystic_elven_wizard"],
      skillModules["elven_mystic_elemental_summoner"],
    ];
  if (pid === "elven_mystic_elemental_master")
    return [
      skillModules["elven_mystic"],
      skillModules["elven_mystic_elven_wizard"],
      skillModules["elven_mystic_elemental_summoner"],
      skillModules["elven_mystic_elemental_master"],
    ];
  if (pid === "elven_mystic_spellsinger")
    return [
      skillModules["elven_mystic"],
      skillModules["elven_mystic_elven_wizard"],
      skillModules["elven_mystic_spellsinger"],
    ];
  if (pid === "elven_mystic_mystic_muse")
    return [
      skillModules["elven_mystic"],
      skillModules["elven_mystic_elven_wizard"],
      skillModules["elven_mystic_spellsinger"],
      skillModules["elven_mystic_mystic_muse"],
    ];
  if (pid === "elven_mystic_evas_saint")
    return [
      skillModules["elven_mystic"],
      skillModules["elven_mystic_oracle"],
      skillModules["elven_mystic_elven_elder"],
      skillModules["elven_mystic_evas_saint"],
    ];

  // Dark Fighter chain
  if (pid === "dark_fighter")
    return [skillModules["dark_fighter"]];
  if (pid === "dark_fighter_assassin")
    return [
      skillModules["dark_fighter"],
      skillModules["dark_fighter_assassin"],
    ];
  if (pid === "dark_fighter_phantom_ranger")
    return [
      skillModules["dark_fighter"],
      skillModules["dark_fighter_assassin"],
      skillModules["dark_fighter_phantom_ranger"],
    ];
  if (pid === "dark_fighter_ghost_sentinel")
    return [
      skillModules["dark_fighter"],
      skillModules["dark_fighter_assassin"],
      skillModules["dark_fighter_phantom_ranger"],
      skillModules["dark_fighter_ghost_sentinel"],
    ];
  if (pid === "dark_fighter_palus_knight")
    return [
      skillModules["dark_fighter"],
      skillModules["dark_fighter_palus_knight"],
    ];
  if (pid === "dark_fighter_shillien_knight")
    return [
      skillModules["dark_fighter"],
      skillModules["dark_fighter_palus_knight"],
      skillModules["dark_fighter_shillien_knight"],
    ];
  if (pid === "dark_fighter_shillien_templar")
    return [
      skillModules["dark_fighter"],
      skillModules["dark_fighter_palus_knight"],
      skillModules["dark_fighter_shillien_knight"],
      skillModules["dark_fighter_shillien_templar"],
    ];
  if (pid === "dark_fighter_bladedancer")
    return [
      skillModules["dark_fighter"],
      skillModules["dark_fighter_palus_knight"],
      skillModules["dark_fighter_bladedancer"],
    ];
  if (pid === "dark_fighter_spectral_dancer")
    return [
      skillModules["dark_fighter"],
      skillModules["dark_fighter_palus_knight"],
      skillModules["dark_fighter_bladedancer"],
      skillModules["dark_fighter_spectral_dancer"],
    ];

  // default: single module (fighters etc.)
  return [skillModules[pid] || {}];
}

