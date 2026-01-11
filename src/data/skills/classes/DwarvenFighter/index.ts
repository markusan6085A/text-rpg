import * as common from "./common";
import * as Scavenger from "./Scavenger";
import * as BountyHunter from "./BountyHunter";
import * as FortuneSeeker from "./FortuneSeeker";
import * as Artisan from "./Artisan";
import * as Warsmith from "./Warsmith";
import * as Maestro from "./Maestro";
import type { SkillDefinition } from "../../types";

const pickSkillDefs = (module: Record<string, any>) =>
  Object.fromEntries(
    Object.entries(module).filter(
      ([, v]) => v && typeof v === "object" && "id" in v && "levels" in v
    )
  ) as Record<string, SkillDefinition>;

// Базові скіли (до 20 лвл) - тільки common
export const DwarvenFighterSkills: Record<string, SkillDefinition> = {
  ...pickSkillDefs(common),
};

// Окремі модулі для професій (тільки скіли цієї професії, без базових)
export const DwarvenFighterScavengerSkills: Record<string, SkillDefinition> = {
  ...pickSkillDefs(Scavenger),
};

export const DwarvenFighterBountyHunterSkills: Record<string, SkillDefinition> = {
  ...pickSkillDefs(BountyHunter),
};

export const DwarvenFighterFortuneSeekerSkills: Record<string, SkillDefinition> = {
  ...pickSkillDefs(FortuneSeeker),
};

export const DwarvenFighterArtisanSkills: Record<string, SkillDefinition> = {
  ...pickSkillDefs(Artisan),
};

export const DwarvenFighterWarsmithSkills: Record<string, SkillDefinition> = {
  ...pickSkillDefs(Warsmith),
};

export const DwarvenFighterMaestroSkills: Record<string, SkillDefinition> = {
  ...pickSkillDefs(Maestro),
};

