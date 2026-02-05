import {
  HumanFighterSkills,
  HumanFighterWarriorSkills,
  HumanFighterGladiatorSkills,
  HumanFighterDuelistSkills,
  HumanFighterPaladinSkills,
  HumanFighterDarkAvengerSkills,
  HumanFighterDreadnoughtSkills,
  HumanFighterTitanSkills,
  HumanFighterWarlordSkills,
  HumanFighterHumanKnightSkills,
  HumanFighterPhoenixKnightSkills,
  HumanFighterHellKnightSkills,
  HumanFighterRogueSkills,
  HumanFighterHawkeyeSkills,
  HumanFighterTreasureHunterSkills,
  HumanFighterSagittariusSkills,
  HumanFighterAdventurerSkills,
} from "./classes/HumanFighter";
import {
  HumanMysticBaseSkills,
  HumanMysticClericSkills,
  HumanMysticWizardSkills,
  HumanMysticSorcererSkills,
  HumanMysticNecromancerSkills,
  HumanMysticArcanaLordSkills,
  HumanMysticArchmageSkills,
  HumanMysticSoultakerSkills,
  HumanMysticBishopSkills,
  HumanMysticProphetSkills,
  HumanMysticHierophantSkills,
  HumanMysticCardinalSkills,
  HumanMysticWarlockSkills,
} from "./classes/HumanMystic";
// Dark Mystic skills are not wired yet (will be added with proper data parsing)
import { DarkMysticCommonSkills, DarkMysticShillienOracleSkills, DarkMysticShillienElderSkills, DarkMysticShillienSaintSkills, DarkMysticDarkWizardSkills, DarkMysticSpellhowlerSkills, DarkMysticStormScreamerSkills, DarkMysticPhantomSummonerSkills, DarkMysticSpectralMasterSkills } from "./classes/DarkMystic";
import {
  OrcFighterSkills,
  OrcFighterOrcRaiderSkills,
  OrcFighterDestroyerSkills,
  OrcFighterTitanSkills,
  OrcFighterOrcMonkSkills,
  OrcFighterTyrantSkills,
  OrcFighterGrandKhavatariSkills,
} from "./classes/OrcFighter";
import { OrcMysticBaseSkills } from "./classes/OrcMystic";
import { OrcShamanSkills } from "./classes/OrcMystic/OrcShaman";
import { WarcryerSkills } from "./classes/OrcMystic/Warcryer";
import { OverlordSkills } from "./classes/OrcMystic/Overlord";
import { DominatorSkills } from "./classes/OrcMystic/Dominator";
import { DoomcryerSkills } from "./classes/OrcMystic/Doomcryer";
import {
  DwarvenFighterSkills,
  DwarvenFighterScavengerSkills,
  DwarvenFighterBountyHunterSkills,
  DwarvenFighterFortuneSeekerSkills,
  DwarvenFighterArtisanSkills,
  DwarvenFighterWarsmithSkills,
  DwarvenFighterMaestroSkills,
} from "./classes/DwarvenFighter";
import {
  DarkFighterSkills,
  DarkFighterAssasinSkills,
  DarkFighterPhantomRangerSkills,
  DarkFighterGhostSentinelSkills,
  DarkFighterPalusKnightSkills,
  DarkFighterShillienKnightSkills,
  DarkFighterShillienTemplarSkills,
  DarkFighterBladedancerSkills,
  DarkFighterSpectralDancerSkills,
} from "./classes/DarkFighter";
import { ElvenFighterSkills, ElvenFighterElvenKnightSkills, ElvenFighterSwordsingerSkills, ElvenFighterSwordMuseSkills, ElvenFighterTempleKnightSkills, ElvenFighterEvasTemplarSkills, ElvenFighterElvenScoutSkills, ElvenFighterSilverRangerSkills, ElvenFighterMoonlightSentinelSkills, ElvenFighterPlainswalkerSkills, ElvenFighterWindRiderSkills } from "./classes/ElvenFighter";
import { ElvenMysticBaseSkills, ElvenMysticElvenOracleSkills, ElvenMysticElvenElderSkills, ElvenMysticElvenWizardSkills, ElvenMysticElementalSummonerSkills, ElvenMysticElementalMasterSkills, ElvenMysticSpellsingerSkills, ElvenMysticMysticMuseSkills, ElvenMysticEvasSaintSkills } from "./classes/ElvenMystic";
import { AdditionalSkills } from "./additional";
import type { SkillDefinition } from "./types";
import { CLASSES, type Klass } from "../base";
import { buildCanonicalSkills, addAdditionalSkillsToCanonical } from "./buildCanonicalSkills";
import { getSkillModulesForProfession as getSkillModulesForProfessionImpl } from "./getSkillModulesForProfession";
import { getSkillsForProfession as getSkillsForProfessionImpl } from "./getSkillsForProfession";
import type { ProfessionId } from "./professionTypes";

const KL_HUMAN_FIGHTER_BASE = CLASSES[0];
const KL_HUMAN_FIGHTER_ADV = CLASSES[1];
const KL_HUMAN_MYSTIC = CLASSES[2];
const KL_DARK_MYSTIC = CLASSES[2];
const KL_ORC_MYSTIC = CLASSES[2]; // Orc Mystic uses the same "Маг" class

// Re-export ProfessionId for convenience
export type { ProfessionId } from "./professionTypes";

type ProfessionDefinition = {
  id: ProfessionId;
  label: string;
  klasses: Klass[];
  skillModule: Record<string, SkillDefinition>;
  minLevel: number;
  guild: "mage" | "fighter";
};

const professionDefinitions: Record<ProfessionId, ProfessionDefinition> = {
  human_fighter: {
    id: "human_fighter",
    label: "Human Fighter",
    klasses: [KL_HUMAN_FIGHTER_BASE, KL_HUMAN_FIGHTER_ADV],
    skillModule: HumanFighterSkills,
    minLevel: 1,
    guild: "fighter",
  },
  human_fighter_warrior: {
    id: "human_fighter_warrior",
    label: "Warrior",
    klasses: [KL_HUMAN_FIGHTER_BASE, KL_HUMAN_FIGHTER_ADV],
    skillModule: HumanFighterWarriorSkills,
    minLevel: 20,
    guild: "fighter",
  },
  human_fighter_gladiator: {
    id: "human_fighter_gladiator",
    label: "Gladiator",
    klasses: [KL_HUMAN_FIGHTER_BASE, KL_HUMAN_FIGHTER_ADV],
    skillModule: HumanFighterGladiatorSkills,
    minLevel: 40,
    guild: "fighter",
  },
  human_fighter_duelist: {
    id: "human_fighter_duelist",
    label: "Duelist",
    klasses: [KL_HUMAN_FIGHTER_BASE, KL_HUMAN_FIGHTER_ADV],
    skillModule: HumanFighterDuelistSkills,
    minLevel: 76,
    guild: "fighter",
  },
  human_fighter_warlord: {
    id: "human_fighter_warlord",
    label: "Warlord",
    klasses: [KL_HUMAN_FIGHTER_BASE, KL_HUMAN_FIGHTER_ADV],
    skillModule: HumanFighterWarlordSkills,
    minLevel: 40,
    guild: "fighter",
  },
  human_fighter_paladin: {
    id: "human_fighter_paladin",
    label: "Paladin",
    klasses: [KL_HUMAN_FIGHTER_BASE, KL_HUMAN_FIGHTER_ADV],
    skillModule: HumanFighterPaladinSkills,
    minLevel: 40,
    guild: "fighter",
  },
  human_fighter_phoenix_knight: {
    id: "human_fighter_phoenix_knight",
    label: "Phoenix Knight",
    klasses: [KL_HUMAN_FIGHTER_BASE, KL_HUMAN_FIGHTER_ADV],
    skillModule: HumanFighterPhoenixKnightSkills,
    minLevel: 76,
    guild: "fighter",
  },
  human_fighter_hell_knight: {
    id: "human_fighter_hell_knight",
    label: "Hell Knight",
    klasses: [KL_HUMAN_FIGHTER_BASE, KL_HUMAN_FIGHTER_ADV],
    skillModule: HumanFighterHellKnightSkills,
    minLevel: 76,
    guild: "fighter",
  },
  human_fighter_dark_avenger: {
    id: "human_fighter_dark_avenger",
    label: "Dark Avenger",
    klasses: [KL_HUMAN_FIGHTER_BASE, KL_HUMAN_FIGHTER_ADV],
    skillModule: HumanFighterDarkAvengerSkills,
    minLevel: 76,
    guild: "fighter",
  },
  human_fighter_dreadnought: {
    id: "human_fighter_dreadnought",
    label: "Dreadnought",
    klasses: [KL_HUMAN_FIGHTER_BASE, KL_HUMAN_FIGHTER_ADV],
    skillModule: HumanFighterDreadnoughtSkills,
    minLevel: 76,
    guild: "fighter",
  },
  human_fighter_titan: {
    id: "human_fighter_titan",
    label: "Titan",
    klasses: [KL_HUMAN_FIGHTER_BASE, KL_HUMAN_FIGHTER_ADV],
    skillModule: HumanFighterTitanSkills,
    minLevel: 76,
    guild: "fighter",
  },
  human_fighter_human_knight: {
    id: "human_fighter_human_knight",
    label: "Human Knight",
    klasses: [KL_HUMAN_FIGHTER_BASE, KL_HUMAN_FIGHTER_ADV],
    skillModule: HumanFighterHumanKnightSkills,
    minLevel: 20,
    guild: "fighter",
  },
  human_fighter_rogue: {
    id: "human_fighter_rogue",
    label: "Rogue",
    klasses: [KL_HUMAN_FIGHTER_BASE, KL_HUMAN_FIGHTER_ADV],
    skillModule: HumanFighterRogueSkills,
    minLevel: 20,
    guild: "fighter",
  },
  human_fighter_hawkeye: {
    id: "human_fighter_hawkeye",
    label: "Hawkeye",
    klasses: [KL_HUMAN_FIGHTER_BASE, KL_HUMAN_FIGHTER_ADV],
    skillModule: HumanFighterHawkeyeSkills,
    minLevel: 40,
    guild: "fighter",
  },
  human_fighter_treasure_hunter: {
    id: "human_fighter_treasure_hunter",
    label: "Treasure Hunter",
    klasses: [KL_HUMAN_FIGHTER_BASE, KL_HUMAN_FIGHTER_ADV],
    skillModule: HumanFighterTreasureHunterSkills,
    minLevel: 40,
    guild: "fighter",
  },
  human_fighter_sagittarius: {
    id: "human_fighter_sagittarius",
    label: "Sagittarius",
    klasses: [KL_HUMAN_FIGHTER_BASE, KL_HUMAN_FIGHTER_ADV],
    skillModule: HumanFighterSagittariusSkills,
    minLevel: 76,
    guild: "fighter",
  },
  human_fighter_adventurer: {
    id: "human_fighter_adventurer",
    label: "Adventurer",
    klasses: [KL_HUMAN_FIGHTER_BASE, KL_HUMAN_FIGHTER_ADV],
    skillModule: HumanFighterAdventurerSkills,
    minLevel: 76,
    guild: "fighter",
  },
  human_mystic_base: {
    id: "human_mystic_base",
    label: "Human Mystic",
    klasses: [KL_HUMAN_MYSTIC],
    skillModule: HumanMysticBaseSkills,
    minLevel: 1,
    guild: "mage",
  },
  human_mystic_cleric: {
    id: "human_mystic_cleric",
    label: "Cleric",
    klasses: [KL_HUMAN_MYSTIC],
    skillModule: HumanMysticClericSkills,
    minLevel: 20,
    guild: "mage",
  },
  human_mystic_wizard: {
    id: "human_mystic_wizard",
    label: "Wizard",
    klasses: [KL_HUMAN_MYSTIC],
    skillModule: HumanMysticWizardSkills,
    minLevel: 20,
    guild: "mage",
  },
  human_mystic_warlock: {
    id: "human_mystic_warlock",
    label: "Warlock",
    klasses: [KL_HUMAN_MYSTIC],
    skillModule: HumanMysticWarlockSkills,
    minLevel: 40,
    guild: "mage",
  },
  human_mystic_sorcerer: {
    id: "human_mystic_sorcerer",
    label: "Sorcerer",
    klasses: [KL_HUMAN_MYSTIC],
    skillModule: HumanMysticSorcererSkills,
    minLevel: 40,
    guild: "mage",
  },
  human_mystic_necromancer: {
    id: "human_mystic_necromancer",
    label: "Necromancer",
    klasses: [KL_HUMAN_MYSTIC],
    skillModule: HumanMysticNecromancerSkills,
    minLevel: 40,
    guild: "mage",
  },
  human_mystic_arcana_lord: {
    id: "human_mystic_arcana_lord",
    label: "Arcana Lord",
    klasses: [KL_HUMAN_MYSTIC],
    skillModule: HumanMysticArcanaLordSkills,
    minLevel: 76,
    guild: "mage",
  },
  human_mystic_soultaker: {
    id: "human_mystic_soultaker",
    label: "Soultaker",
    klasses: [KL_HUMAN_MYSTIC],
    skillModule: HumanMysticSoultakerSkills,
    minLevel: 76,
    guild: "mage",
  },
  human_mystic_archmage: {
    id: "human_mystic_archmage",
    label: "Archmage",
    klasses: [KL_HUMAN_MYSTIC],
    skillModule: HumanMysticArchmageSkills,
    minLevel: 76,
    guild: "mage",
  },
  human_mystic_bishop: {
    id: "human_mystic_bishop",
    label: "Bishop",
    klasses: [KL_HUMAN_MYSTIC],
    skillModule: HumanMysticBishopSkills,
    minLevel: 40,
    guild: "mage",
  },
  human_mystic_prophet: {
    id: "human_mystic_prophet",
    label: "Prophet",
    klasses: [KL_HUMAN_MYSTIC],
    skillModule: HumanMysticProphetSkills,
    minLevel: 40,
    guild: "mage",
  },
  human_mystic_hierophant: {
    id: "human_mystic_hierophant",
    label: "Hierophant",
    klasses: [KL_HUMAN_MYSTIC],
    skillModule: HumanMysticHierophantSkills,
    minLevel: 76,
    guild: "mage",
  },
  human_mystic_cardinal: {
    id: "human_mystic_cardinal",
    label: "Cardinal",
    klasses: [KL_HUMAN_MYSTIC],
    skillModule: HumanMysticCardinalSkills,
    minLevel: 76,
    guild: "mage",
  },
  dark_mystic_base: {
    id: "dark_mystic_base",
    label: "Dark Mystic",
    klasses: [KL_DARK_MYSTIC],
    skillModule: DarkMysticCommonSkills,
    minLevel: 1,
    guild: "mage",
  },
  dark_mystic_oracle: {
    id: "dark_mystic_oracle",
    label: "Shillien Oracle",
    klasses: [KL_DARK_MYSTIC],
    skillModule: DarkMysticShillienOracleSkills,
    minLevel: 20,
    guild: "mage",
  },
  dark_mystic_dark_wizard: {
    id: "dark_mystic_dark_wizard",
    label: "Dark Wizard",
    klasses: [KL_DARK_MYSTIC],
    skillModule: DarkMysticDarkWizardSkills,
    minLevel: 20,
    guild: "mage",
  },
  dark_mystic_spellhowler: {
    id: "dark_mystic_spellhowler",
    label: "Spellhowler",
    klasses: [KL_DARK_MYSTIC],
    skillModule: DarkMysticSpellhowlerSkills,
    minLevel: 40,
    guild: "mage",
  },
  dark_mystic_storm_screamer: {
    id: "dark_mystic_storm_screamer",
    label: "StormScreamer",
    klasses: [KL_DARK_MYSTIC],
    skillModule: DarkMysticStormScreamerSkills,
    minLevel: 76,
    guild: "mage",
  },
  dark_mystic_shillien_elder: {
    id: "dark_mystic_shillien_elder",
    label: "Shillien Elder",
    klasses: [KL_DARK_MYSTIC],
    skillModule: DarkMysticShillienElderSkills,
    minLevel: 40,
    guild: "mage",
  },
  dark_mystic_shillien_saint: {
    id: "dark_mystic_shillien_saint",
    label: "Shillien Saint",
    klasses: [KL_DARK_MYSTIC],
    skillModule: DarkMysticShillienSaintSkills,
    minLevel: 76,
    guild: "mage",
  },
  dark_mystic_phantom_summoner: {
    id: "dark_mystic_phantom_summoner",
    label: "Phantom Summoner",
    klasses: [KL_DARK_MYSTIC],
    skillModule: DarkMysticPhantomSummonerSkills,
    minLevel: 40,
    guild: "mage",
  },
  dark_mystic_spectral_master: {
    id: "dark_mystic_spectral_master",
    label: "Spectral Master",
    klasses: [KL_DARK_MYSTIC],
    skillModule: DarkMysticSpectralMasterSkills,
    minLevel: 77,
    guild: "mage",
  },
  orc_fighter: {
    id: "orc_fighter",
    label: "Orc Fighter",
    klasses: [KL_HUMAN_FIGHTER_BASE, KL_HUMAN_FIGHTER_ADV],
    skillModule: OrcFighterSkills,
    minLevel: 1,
    guild: "fighter",
  },
  orc_fighter_raider: {
    id: "orc_fighter_raider",
    label: "Orc Raider",
    klasses: [KL_HUMAN_FIGHTER_BASE, KL_HUMAN_FIGHTER_ADV],
    skillModule: OrcFighterOrcRaiderSkills,
    minLevel: 20,
    guild: "fighter",
  },
  orc_fighter_destroyer: {
    id: "orc_fighter_destroyer",
    label: "Destroyer",
    klasses: [KL_HUMAN_FIGHTER_BASE, KL_HUMAN_FIGHTER_ADV],
    skillModule: OrcFighterDestroyerSkills,
    minLevel: 40,
    guild: "fighter",
  },
  orc_fighter_titan: {
    id: "orc_fighter_titan",
    label: "Titan",
    klasses: [KL_HUMAN_FIGHTER_BASE, KL_HUMAN_FIGHTER_ADV],
    skillModule: OrcFighterTitanSkills,
    minLevel: 76,
    guild: "fighter",
  },
  orc_fighter_monk: {
    id: "orc_fighter_monk",
    label: "Orc Monk",
    klasses: [KL_HUMAN_FIGHTER_BASE, KL_HUMAN_FIGHTER_ADV],
    skillModule: OrcFighterOrcMonkSkills,
    minLevel: 20,
    guild: "fighter",
  },
  orc_fighter_tyrant: {
    id: "orc_fighter_tyrant",
    label: "Tyrant",
    klasses: [KL_HUMAN_FIGHTER_BASE, KL_HUMAN_FIGHTER_ADV],
    skillModule: OrcFighterTyrantSkills,
    minLevel: 40,
    guild: "fighter",
  },
  orc_fighter_grand_khavatari: {
    id: "orc_fighter_grand_khavatari",
    label: "Grand Khavatari",
    klasses: [KL_HUMAN_FIGHTER_BASE, KL_HUMAN_FIGHTER_ADV],
    skillModule: OrcFighterGrandKhavatariSkills,
    minLevel: 76,
    guild: "fighter",
  },
  orc_mystic_base: {
    id: "orc_mystic_base",
    label: "Orc Mystic",
    klasses: [KL_ORC_MYSTIC],
    skillModule: OrcMysticBaseSkills,
    minLevel: 1,
    guild: "mage",
  },
  orc_mystic_shaman: {
    id: "orc_mystic_shaman",
    label: "Orc Shaman",
    klasses: [KL_ORC_MYSTIC],
    skillModule: OrcShamanSkills,
    minLevel: 20,
    guild: "mage",
  },
  orc_mystic_warcryer: {
    id: "orc_mystic_warcryer",
    label: "Warcryer",
    klasses: [KL_ORC_MYSTIC],
    skillModule: WarcryerSkills,
    minLevel: 40,
    guild: "mage",
  },
  orc_mystic_overlord: {
    id: "orc_mystic_overlord",
    label: "Overlord",
    klasses: [KL_ORC_MYSTIC],
    skillModule: OverlordSkills,
    minLevel: 40,
    guild: "mage",
  },
  orc_mystic_dominator: {
    id: "orc_mystic_dominator",
    label: "Dominator",
    klasses: [KL_ORC_MYSTIC],
    skillModule: DominatorSkills,
    minLevel: 76,
    guild: "mage",
  },
  orc_mystic_doomcryer: {
    id: "orc_mystic_doomcryer",
    label: "Doomcryer",
    klasses: [KL_ORC_MYSTIC],
    skillModule: DoomcryerSkills,
    minLevel: 76,
    guild: "mage",
  },
  dwarven_fighter: {
    id: "dwarven_fighter",
    label: "Dwarven Fighter",
    klasses: [KL_HUMAN_FIGHTER_BASE, KL_HUMAN_FIGHTER_ADV],
    skillModule: DwarvenFighterSkills,
    minLevel: 1,
    guild: "fighter",
  },
  dwarven_fighter_scavenger: {
    id: "dwarven_fighter_scavenger",
    label: "Scavenger",
    klasses: [KL_HUMAN_FIGHTER_BASE, KL_HUMAN_FIGHTER_ADV],
    skillModule: DwarvenFighterScavengerSkills,
    minLevel: 20,
    guild: "fighter",
  },
  dwarven_fighter_bounty_hunter: {
    id: "dwarven_fighter_bounty_hunter",
    label: "Bounty Hunter",
    klasses: [KL_HUMAN_FIGHTER_BASE, KL_HUMAN_FIGHTER_ADV],
    skillModule: DwarvenFighterBountyHunterSkills,
    minLevel: 40,
    guild: "fighter",
  },
  dwarven_fighter_fortune_seeker: {
    id: "dwarven_fighter_fortune_seeker",
    label: "Fortune Seeker",
    klasses: [KL_HUMAN_FIGHTER_BASE, KL_HUMAN_FIGHTER_ADV],
    skillModule: DwarvenFighterFortuneSeekerSkills,
    minLevel: 76,
    guild: "fighter",
  },
  dwarven_fighter_artisan: {
    id: "dwarven_fighter_artisan",
    label: "Artisan",
    klasses: [KL_HUMAN_FIGHTER_BASE, KL_HUMAN_FIGHTER_ADV],
    skillModule: DwarvenFighterArtisanSkills,
    minLevel: 20,
    guild: "fighter",
  },
  dwarven_fighter_warsmith: {
    id: "dwarven_fighter_warsmith",
    label: "Warsmith",
    klasses: [KL_HUMAN_FIGHTER_BASE, KL_HUMAN_FIGHTER_ADV],
    skillModule: DwarvenFighterWarsmithSkills,
    minLevel: 40,
    guild: "fighter",
  },
  dwarven_fighter_maestro: {
    id: "dwarven_fighter_maestro",
    label: "Maestro",
    klasses: [KL_HUMAN_FIGHTER_BASE, KL_HUMAN_FIGHTER_ADV],
    skillModule: DwarvenFighterMaestroSkills,
    minLevel: 76,
    guild: "fighter",
  },
  dark_fighter: {
    id: "dark_fighter",
    label: "Dark Fighter",
    klasses: [KL_HUMAN_FIGHTER_BASE, KL_HUMAN_FIGHTER_ADV],
    skillModule: DarkFighterSkills,
    minLevel: 1,
    guild: "fighter",
  },
  dark_fighter_assassin: {
    id: "dark_fighter_assassin",
    label: "Assassin",
    klasses: [KL_HUMAN_FIGHTER_BASE, KL_HUMAN_FIGHTER_ADV],
    skillModule: DarkFighterAssasinSkills,
    minLevel: 20,
    guild: "fighter",
  },
  dark_fighter_phantom_ranger: {
    id: "dark_fighter_phantom_ranger",
    label: "Phantom Ranger",
    klasses: [KL_HUMAN_FIGHTER_BASE, KL_HUMAN_FIGHTER_ADV],
    skillModule: DarkFighterPhantomRangerSkills,
    minLevel: 40,
    guild: "fighter",
  },
  dark_fighter_ghost_sentinel: {
    id: "dark_fighter_ghost_sentinel",
    label: "Ghost Sentinel",
    klasses: [KL_HUMAN_FIGHTER_BASE, KL_HUMAN_FIGHTER_ADV],
    skillModule: DarkFighterGhostSentinelSkills,
    minLevel: 76,
    guild: "fighter",
  },
  dark_fighter_palus_knight: {
    id: "dark_fighter_palus_knight",
    label: "Palus Knight",
    klasses: [KL_HUMAN_FIGHTER_BASE, KL_HUMAN_FIGHTER_ADV],
    skillModule: DarkFighterPalusKnightSkills,
    minLevel: 20,
    guild: "fighter",
  },
  dark_fighter_shillien_knight: {
    id: "dark_fighter_shillien_knight",
    label: "Shillien Knight",
    klasses: [KL_HUMAN_FIGHTER_BASE, KL_HUMAN_FIGHTER_ADV],
    skillModule: DarkFighterShillienKnightSkills,
    minLevel: 40,
    guild: "fighter",
  },
  dark_fighter_shillien_templar: {
    id: "dark_fighter_shillien_templar",
    label: "Shillien Templar",
    klasses: [KL_HUMAN_FIGHTER_BASE, KL_HUMAN_FIGHTER_ADV],
    skillModule: DarkFighterShillienTemplarSkills,
    minLevel: 76,
    guild: "fighter",
  },
  dark_fighter_bladedancer: {
    id: "dark_fighter_bladedancer",
    label: "Bladedancer",
    klasses: [KL_HUMAN_FIGHTER_BASE, KL_HUMAN_FIGHTER_ADV],
    skillModule: DarkFighterBladedancerSkills,
    minLevel: 40,
    guild: "fighter",
  },
  dark_fighter_spectral_dancer: {
    id: "dark_fighter_spectral_dancer",
    label: "Spectral Dancer",
    klasses: [KL_HUMAN_FIGHTER_BASE, KL_HUMAN_FIGHTER_ADV],
    skillModule: DarkFighterSpectralDancerSkills,
    minLevel: 76,
    guild: "fighter",
  },
  elven_fighter: {
    id: "elven_fighter",
    label: "Elven Fighter",
    klasses: [KL_HUMAN_FIGHTER_BASE, KL_HUMAN_FIGHTER_ADV],
    skillModule: ElvenFighterSkills,
    minLevel: 1,
    guild: "fighter",
  },
  elven_fighter_elven_knight: {
    id: "elven_fighter_elven_knight",
    label: "Elven Knight",
    klasses: [KL_HUMAN_FIGHTER_BASE, KL_HUMAN_FIGHTER_ADV],
    skillModule: ElvenFighterElvenKnightSkills,
    minLevel: 20,
    guild: "fighter",
  },
  elven_fighter_swordsinger: {
    id: "elven_fighter_swordsinger",
    label: "Swordsinger",
    klasses: [KL_HUMAN_FIGHTER_BASE, KL_HUMAN_FIGHTER_ADV],
    skillModule: ElvenFighterSwordsingerSkills,
    minLevel: 40,
    guild: "fighter",
  },
  elven_fighter_sword_muse: {
    id: "elven_fighter_sword_muse",
    label: "Sword Muse",
    klasses: [KL_HUMAN_FIGHTER_BASE, KL_HUMAN_FIGHTER_ADV],
    skillModule: ElvenFighterSwordMuseSkills,
    minLevel: 76,
    guild: "fighter",
  },
  elven_fighter_temple_knight: {
    id: "elven_fighter_temple_knight",
    label: "Temple Knight",
    klasses: [KL_HUMAN_FIGHTER_BASE, KL_HUMAN_FIGHTER_ADV],
    skillModule: ElvenFighterTempleKnightSkills,
    minLevel: 40,
    guild: "fighter",
  },
  elven_fighter_evas_templar: {
    id: "elven_fighter_evas_templar",
    label: "Evas Templar",
    klasses: [KL_HUMAN_FIGHTER_BASE, KL_HUMAN_FIGHTER_ADV],
    skillModule: ElvenFighterEvasTemplarSkills,
    minLevel: 76,
    guild: "fighter",
  },
  elven_fighter_elven_scout: {
    id: "elven_fighter_elven_scout",
    label: "Elven Scout",
    klasses: [KL_HUMAN_FIGHTER_BASE, KL_HUMAN_FIGHTER_ADV],
    skillModule: ElvenFighterElvenScoutSkills,
    minLevel: 20,
    guild: "fighter",
  },
  elven_fighter_silver_ranger: {
    id: "elven_fighter_silver_ranger",
    label: "Silver Ranger",
    klasses: [KL_HUMAN_FIGHTER_BASE, KL_HUMAN_FIGHTER_ADV],
    skillModule: ElvenFighterSilverRangerSkills,
    minLevel: 40,
    guild: "fighter",
  },
  elven_fighter_moonlight_sentinel: {
    id: "elven_fighter_moonlight_sentinel",
    label: "Moonlight Sentinel",
    klasses: [KL_HUMAN_FIGHTER_BASE, KL_HUMAN_FIGHTER_ADV],
    skillModule: ElvenFighterMoonlightSentinelSkills,
    minLevel: 76,
    guild: "fighter",
  },
  elven_fighter_plainswalker: {
    id: "elven_fighter_plainswalker",
    label: "Plainswalker",
    klasses: [KL_HUMAN_FIGHTER_BASE, KL_HUMAN_FIGHTER_ADV],
    skillModule: ElvenFighterPlainswalkerSkills,
    minLevel: 40,
    guild: "fighter",
  },
  elven_fighter_wind_rider: {
    id: "elven_fighter_wind_rider",
    label: "Wind Rider",
    klasses: [KL_HUMAN_FIGHTER_BASE, KL_HUMAN_FIGHTER_ADV],
    skillModule: ElvenFighterWindRiderSkills,
    minLevel: 76,
    guild: "fighter",
  },
  elven_mystic: {
    id: "elven_mystic",
    label: "Elven Mystic",
    klasses: [KL_HUMAN_MYSTIC],
    skillModule: ElvenMysticBaseSkills,
    minLevel: 1,
    guild: "mage",
  },
  elven_mystic_oracle: {
    id: "elven_mystic_oracle",
    label: "Elven Oracle",
    klasses: [KL_HUMAN_MYSTIC],
    skillModule: ElvenMysticElvenOracleSkills,
    minLevel: 20,
    guild: "mage",
  },
  elven_mystic_elven_elder: {
    id: "elven_mystic_elven_elder",
    label: "Elven Elder",
    klasses: [KL_HUMAN_MYSTIC],
    skillModule: ElvenMysticElvenElderSkills,
    minLevel: 40,
    guild: "mage",
  },
  elven_mystic_elven_wizard: {
    id: "elven_mystic_elven_wizard",
    label: "Elven Wizard",
    klasses: [KL_HUMAN_MYSTIC],
    skillModule: ElvenMysticElvenWizardSkills,
    minLevel: 20,
    guild: "mage",
  },
  elven_mystic_elemental_summoner: {
    id: "elven_mystic_elemental_summoner",
    label: "Elemental Summoner",
    klasses: [KL_HUMAN_MYSTIC],
    skillModule: ElvenMysticElementalSummonerSkills,
    minLevel: 40,
    guild: "mage",
  },
  elven_mystic_elemental_master: {
    id: "elven_mystic_elemental_master",
    label: "Elemental Master",
    klasses: [KL_HUMAN_MYSTIC],
    skillModule: ElvenMysticElementalMasterSkills,
    minLevel: 76,
    guild: "mage",
  },
  elven_mystic_spellsinger: {
    id: "elven_mystic_spellsinger",
    label: "Spellsinger",
    klasses: [KL_HUMAN_MYSTIC],
    skillModule: ElvenMysticSpellsingerSkills,
    minLevel: 40,
    guild: "mage",
  },
  elven_mystic_mystic_muse: {
    id: "elven_mystic_mystic_muse",
    label: "Mystic Muse",
    klasses: [KL_HUMAN_MYSTIC],
    skillModule: ElvenMysticMysticMuseSkills,
    minLevel: 76,
    guild: "mage",
  },
  elven_mystic_evas_saint: {
    id: "elven_mystic_evas_saint",
    label: "Evas Saint",
    klasses: [KL_HUMAN_MYSTIC],
    skillModule: ElvenMysticEvasSaintSkills,
    minLevel: 76,
    guild: "mage",
  },
};

const skillModules: Record<ProfessionId, Record<string, SkillDefinition>> = Object.fromEntries(
  Object.entries(professionDefinitions).map(([id, def]) => [id, def.skillModule])
) as Record<ProfessionId, Record<string, SkillDefinition>>;

// Build canonical skill map (one entry per id) with merged levels.
const baseSkillsDB = buildCanonicalSkills(skillModules);
// Add additional skills (available for all races/classes)
export const skillsDB: Record<number, SkillDefinition> = addAdditionalSkillsToCanonical(baseSkillsDB, AdditionalSkills);
export const allSkills: SkillDefinition[] = Object.values(skillsDB);

// Діагностика для додаткових скілів
if (import.meta.env.DEV) {
  const additionalSkillIds = [130, 429, 401];
  additionalSkillIds.forEach(id => {
    const found = skillsDB[id];
    if (found) {
      console.log(`[skills/index.ts] ✅ Додатковий скіл ID ${id} (${found.name}) додано до skillsDB`);
    } else {
      console.warn(`[skills/index.ts] ⚠️ Додатковий скіл ID ${id} НЕ знайдено в skillsDB!`);
    }
  });
  console.log(`[skills/index.ts] 📊 Всього скілів в allSkills: ${allSkills.length}`);
  console.log(`[skills/index.ts] 📊 Додаткових скілів в allSkills: ${allSkills.filter(s => s.code?.startsWith("ADD_")).length}`);
}

// Map label -> id for hero.profession that may be stored as "Warcryer" etc
const LABEL_TO_PROFESSION_ID: Record<string, ProfessionId> = Object.fromEntries(
  Object.values(professionDefinitions).map((d) => [d.label.toLowerCase(), d.id])
);

// API / зовнішні джерела можуть передавати profession з підкресленнями або коротко — мапимо на наш ProfessionId
const API_VARIANT_TO_PROFESSION_ID: Record<string, ProfessionId> = {
  shillien_saint: "dark_mystic_shillien_saint",
  shillien_elder: "dark_mystic_shillien_elder",
  shillien_oracle: "dark_mystic_oracle",
  dark_wizard: "dark_mystic_dark_wizard",
  spellhowler: "dark_mystic_spellhowler",
  storm_screamer: "dark_mystic_storm_screamer",
  phantom_summoner: "dark_mystic_phantom_summoner",
  spectral_master: "dark_mystic_spectral_master",
  orc_destroyer: "orc_fighter_destroyer",
  destroyer: "orc_fighter_destroyer",
  orc_raider: "orc_fighter_raider",
  orc_monk: "orc_fighter_monk",
  tyrant: "orc_fighter_tyrant",
  orc_shaman: "orc_mystic_shaman",
  warcryer: "orc_mystic_warcryer",
  overlord: "orc_mystic_overlord",
  dominator: "orc_mystic_dominator",
  doomcryer: "orc_mystic_doomcryer",
  prophet: "human_mystic_prophet",
  bishop: "human_mystic_bishop",
  hierophant: "human_mystic_hierophant",
  cardinal: "human_mystic_cardinal",
  cleric: "human_mystic_cleric",
  wizard: "human_mystic_wizard",
  warlock: "human_mystic_warlock",
  sorcerer: "human_mystic_sorcerer",
  necromancer: "human_mystic_necromancer",
  elven_elder: "elven_mystic_elven_elder",
  elven_oracle: "elven_mystic_oracle",
  evas_saint: "elven_mystic_evas_saint",
  eva_saint: "elven_mystic_evas_saint",
  spellsinger: "elven_mystic_spellsinger",
  mystic_muse: "elven_mystic_mystic_muse",
  elemental_summoner: "elven_mystic_elemental_summoner",
  elemental_master: "elven_mystic_elemental_master",
  elven_wizard: "elven_mystic_elven_wizard",
  shillien_knight: "dark_fighter_shillien_knight",
  shillien_templar: "dark_fighter_shillien_templar",
  bladedancer: "dark_fighter_bladedancer",
  spectral_dancer: "dark_fighter_spectral_dancer",
  phantom_ranger: "dark_fighter_phantom_ranger",
  ghost_sentinel: "dark_fighter_ghost_sentinel",
  palus_knight: "dark_fighter_palus_knight",
  assassin: "dark_fighter_assassin",
  temple_knight: "elven_fighter_temple_knight",
  evas_templar: "elven_fighter_evas_templar",
  sword_singer: "elven_fighter_swordsinger",
  swordsinger: "elven_fighter_swordsinger",
  sword_muse: "elven_fighter_sword_muse",
  silver_ranger: "elven_fighter_silver_ranger",
  moonlight_sentinel: "elven_fighter_moonlight_sentinel",
  plainswalker: "elven_fighter_plainswalker",
  wind_rider: "elven_fighter_wind_rider",
  elven_knight: "elven_fighter_elven_knight",
  elven_scout: "elven_fighter_elven_scout",
  paladin: "human_fighter_paladin",
  gladiator: "human_fighter_gladiator",
  warlord: "human_fighter_warlord",
  duelist: "human_fighter_duelist",
  dreadnought: "human_fighter_dreadnought",
  phoenix_knight: "human_fighter_phoenix_knight",
  hell_knight: "human_fighter_hell_knight",
  dark_avenger: "human_fighter_dark_avenger",
  human_knight: "human_fighter_human_knight",
  hawkeye: "human_fighter_hawkeye",
  treasure_hunter: "human_fighter_treasure_hunter",
  sagittarius: "human_fighter_sagittarius",
  adventurer: "human_fighter_adventurer",
  rogue: "human_fighter_rogue",
  warrior: "human_fighter_warrior",
  titan: "human_fighter_titan",
  scavenger: "dwarven_fighter_scavenger",
  bounty_hunter: "dwarven_fighter_bounty_hunter",
  fortune_seeker: "dwarven_fighter_fortune_seeker",
  artisan: "dwarven_fighter_artisan",
  warsmith: "dwarven_fighter_warsmith",
  maestro: "dwarven_fighter_maestro",
  grand_khavatari: "orc_fighter_grand_khavatari",
};

// normalize  id ->  
export const normalizeProfessionId = (id: ProfessionId | string | null): ProfessionId | null => {
  if (!id) return null;
  const s = String(id).trim();
  if (!s) return null;
  if (s === "human_mystic_advanced") return "human_mystic_cleric";
  if (s === "human_mystic") return "human_mystic_base";
  if (s === "elven_mystic_base") return "elven_mystic";
  // hero.profession may be stored as label ("Warcryer", "Prophet") — map to id
  const lower = s.toLowerCase();
  if (LABEL_TO_PROFESSION_ID[lower]) return LABEL_TO_PROFESSION_ID[lower];
  // API / зовнішні варіанти (shillien_saint, orc_destroyer, destroyer, warcryer, prophet тощо)
  if (API_VARIANT_TO_PROFESSION_ID[lower]) return API_VARIANT_TO_PROFESSION_ID[lower];
  // Replace spaces with underscores and try again (e.g. "Shillien Saint" -> "shillien saint" already tried; "Shillien_Saint" -> try shillien_saint)
  const withUnderscores = lower.replace(/\s+/g, "_");
  if (API_VARIANT_TO_PROFESSION_ID[withUnderscores]) return API_VARIANT_TO_PROFESSION_ID[withUnderscores];
  // Already valid id
  if (professionDefinitions[s as ProfessionId]) return s as ProfessionId;
  if (professionDefinitions[withUnderscores as ProfessionId]) return withUnderscores as ProfessionId;
  return s as ProfessionId;
};

const getSkillModulesForProfession = (professionId: ProfessionId | null) => {
  return getSkillModulesForProfessionImpl(professionId, normalizeProfessionId, skillModules);
};

const normalizeKlass = (klass: string) => (klass || "").toLowerCase();
const isMysticKlass = (klass: string) => {
  const k = normalizeKlass(klass);
  return (
    k.includes("mystic") ||
    k.includes("mage") ||
    k.includes("cleric") ||
    k === normalizeKlass(CLASSES[2])
  );
};
const isFighterKlass = (klass: string) => !isMysticKlass(klass);

export const getProfessionCandidatesForKlass = (klass: Klass | string) =>
  Object.values(professionDefinitions)
    .filter((def) => def.klasses.includes(klass as Klass))
    .map((def) => def.id);

export const getDefaultProfessionForKlass = (
  klass: Klass | string,
  race?: string
): ProfessionId | null => {
  const defaults: Record<string, ProfessionId | null> = {
    [KL_HUMAN_FIGHTER_BASE]: "human_fighter",
    [KL_HUMAN_FIGHTER_ADV]: "human_fighter",
    [KL_HUMAN_MYSTIC]: "human_mystic_base",
  };

  const normalizedRace = (race || "").toLowerCase();
  const isDarkElf =
    normalizedRace.includes("dark") ||
    normalizedRace.includes("тёмный") ||
    normalizedRace.includes("темный") ||
    normalizedRace.includes("گ÷گçگ?گ?‘<گü گ-گ>‘?‘");
  const isOrc =
    normalizedRace.includes("orc") ||
    normalizedRace.includes("орк");
  const isDwarf =
    normalizedRace.includes("dwarf") ||
    normalizedRace.includes("гном") ||
    normalizedRace.includes("dwarven");
  const isElf =
    normalizedRace.includes("elf") ||
    normalizedRace.includes("ельф") ||
    normalizedRace.includes("эльф");

  if (isMysticKlass(klass) && isDarkElf) return "dark_mystic_base";
  if (isMysticKlass(klass) && isOrc) return "orc_mystic_base";
  if (isMysticKlass(klass) && isElf) return "elven_mystic";
  if (isFighterKlass(klass) && isDarkElf) return "dark_fighter";
  if (isFighterKlass(klass) && isOrc) return "orc_fighter";
  if (isFighterKlass(klass) && isDwarf) return "dwarven_fighter";
  if (isFighterKlass(klass) && isElf) return "elven_fighter";
  if (defaults[klass]) return defaults[klass] ?? null;
  if (isMysticKlass(klass)) return "human_mystic_base";
  if (isFighterKlass(klass)) return "human_fighter";
  return null;
};

export const getProfessionDefinition = (id: ProfessionId | null) =>
  (id ? professionDefinitions[id] : null) ?? null;

/** Отримує скіл для професії — використовує profession-specific версію (buff vs toggle) */
export const getSkillDefForProfession = (
  professionId: ProfessionId | string | null,
  skillId: number
): import("./types").SkillDefinition | undefined => {
  const pid = normalizeProfessionId(professionId);
  if (!pid) return skillsDB[skillId];

  const modules = getSkillModulesForProfession(pid);
  // Шукаємо з кінця (найбільш специфічна професія) — щоб Warcryer WC_1001 (buff) перезаписав OrcShaman OS_1001 (toggle)
  for (let i = modules.length - 1; i >= 0; i--) {
    const mod = modules[i];
    if (!mod) continue;
    const found = Object.values(mod).find((s: any) => s?.id === skillId);
    if (found) return found as import("./types").SkillDefinition;
  }
  return skillsDB[skillId];
};

export const getSkillsForProfession = (professionId: ProfessionId | null) => {
  return getSkillsForProfessionImpl(
    professionId,
    normalizeProfessionId,
    getSkillModulesForProfession,
    skillsDB
  );
};

export const isSkillInProfession = (skillId: number, professionId: ProfessionId | null) => {
  const modules = getSkillModulesForProfession(professionId);
  return modules.some((m) => Object.values(m || {}).some((s) => s.id === skillId));
};

export const getProfessionLevelRequirement = (professionId: ProfessionId | null) =>
  professionId ? professionDefinitions[professionId].minLevel : 0;
