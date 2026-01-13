import * as common from "./common";
import * as OrcRaider from "./OrcRaider";
import * as Destroyer from "./Destroyer";
import * as Titan from "./Titan";
import * as OrcMonk from "./OrcMonk";
import * as Tyrant from "./Tyrant";
import * as GrandKhavatari from "./GrandKhavatari";
import type { SkillDefinition } from "../../types";

const pickSkillDefs = (module: Record<string, any>) =>
  Object.fromEntries(
    Object.entries(module).filter(
      ([, v]) => v && typeof v === "object" && "id" in v && "levels" in v
    )
  ) as Record<string, SkillDefinition>;

// Базові скіли (до 20 лвл) - тільки common
export const OrcFighterSkills: Record<string, SkillDefinition> = {
  ...pickSkillDefs(common),
};

// Окремі модулі для професій (тільки скіли цієї професії, без базових)
export const OrcFighterOrcRaiderSkills: Record<string, SkillDefinition> = {
  ...pickSkillDefs(OrcRaider),
};

export const OrcFighterDestroyerSkills: Record<string, SkillDefinition> = {
  ...pickSkillDefs(Destroyer),
};

export const OrcFighterTitanSkills: Record<string, SkillDefinition> = {
  ...pickSkillDefs(Titan),
};

export const OrcFighterOrcMonkSkills: Record<string, SkillDefinition> = {
  ...pickSkillDefs(OrcMonk),
};

export const OrcFighterTyrantSkills: Record<string, SkillDefinition> = {
  ...pickSkillDefs(Tyrant),
};

export const OrcFighterGrandKhavatariSkills: Record<string, SkillDefinition> = {
  ...pickSkillDefs(GrandKhavatari),
};

