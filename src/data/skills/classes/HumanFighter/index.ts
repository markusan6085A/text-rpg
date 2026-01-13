import * as common from "./common";
import * as Warrior from "./Warrior";
import * as Gladiator from "./Gladiator";
import * as Duelist from "./Duelist";
import * as Warlord from "./Warlord";
import * as Dreadnought from "./Dreadnought";
import * as HumanKnight from "./HumanKnight";
import * as Paladin from "./Paladin";
import * as PhoenixKnight from "./PhoenixKnight";
import * as DarkAvenger from "./DarkAvenger";
import * as HellKnight from "./HellKnight";
import * as Rogue from "./Rogue";
import * as Hawkeye from "./Hawkeye";
import * as TreasureHunter from "./TreasureHunter";
import * as Sagittarius from "./Sagittarius";
import * as Adventurer from "./Adventurer";
import type { SkillDefinition } from "../../types";

const pickSkillDefs = (module: Record<string, any>) =>
  Object.fromEntries(
    Object.entries(module).filter(
      ([, v]) => v && typeof v === "object" && "id" in v && "levels" in v
    )
  ) as Record<string, SkillDefinition>;

// Базові скіли (до 20 лвл) - тільки common
export const HumanFighterSkills: Record<string, SkillDefinition> = {
  ...pickSkillDefs(common),
};

// Окремі модулі для професій (тільки скіли цієї професії, без базових)
export const HumanFighterWarriorSkills = {
  ...pickSkillDefs(Warrior),
};

export const HumanFighterGladiatorSkills = {
  ...pickSkillDefs(Gladiator),
};

export const HumanFighterDuelistSkills: Record<string, SkillDefinition> = {
  ...pickSkillDefs(Duelist),
};

export const HumanFighterPaladinSkills: Record<string, SkillDefinition> = {
  ...pickSkillDefs(Paladin),
};

export const HumanFighterDarkAvengerSkills: Record<string, SkillDefinition> = {
  ...pickSkillDefs(DarkAvenger),
};

export const HumanFighterDreadnoughtSkills: Record<string, SkillDefinition> = {
  ...pickSkillDefs(Dreadnought),
};

export const HumanFighterTitanSkills: Record<string, SkillDefinition> = {
  ...pickSkillDefs(Warrior),
};

export const HumanFighterWarlordSkills: Record<string, SkillDefinition> = {
  ...pickSkillDefs(Warlord),
};

export const HumanFighterHumanKnightSkills: Record<string, SkillDefinition> = {
  ...pickSkillDefs(HumanKnight),
};

export const HumanFighterPhoenixKnightSkills: Record<string, SkillDefinition> = {
  ...pickSkillDefs(PhoenixKnight),
};

export const HumanFighterHellKnightSkills: Record<string, SkillDefinition> = {
  ...pickSkillDefs(HellKnight),
};

export const HumanFighterRogueSkills: Record<string, SkillDefinition> = {
  ...pickSkillDefs(Rogue),
};

export const HumanFighterHawkeyeSkills: Record<string, SkillDefinition> = {
  ...pickSkillDefs(Hawkeye),
};

export const HumanFighterTreasureHunterSkills: Record<string, SkillDefinition> = {
  ...pickSkillDefs(TreasureHunter),
};

export const HumanFighterSagittariusSkills: Record<string, SkillDefinition> = {
  ...pickSkillDefs(Sagittarius),
};

export const HumanFighterAdventurerSkills: Record<string, SkillDefinition> = {
  ...pickSkillDefs(Adventurer),
};

