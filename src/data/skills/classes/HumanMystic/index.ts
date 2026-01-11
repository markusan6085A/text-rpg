import * as common from "./common";
import * as Cleric from "./Cleric";
import * as Bishop from "./Bishop";
import * as Wizard from "./Wizard";
import * as Sorcerer from "./Sorcerer";
import * as Necromancer from "./Necromancer";
import * as ArcanaLord from "./ArcanaLord";
import * as Prophet from "./Prophet";
import * as Hierophant from "./Hierophant";
import * as Archmage from "./Archmage";
import * as Soultaker from "./Soultaker";
import * as Cardinal from "./Cardinal";
import * as Warlock from "./Warlock";
import type { SkillDefinition } from "../../types";

const pickSkillDefs = (module: Record<string, any>) =>
  Object.fromEntries(
    Object.entries(module).filter(
      ([, v]) => v && typeof v === "object" && "id" in v && "levels" in v
    )
  ) as Record<string, SkillDefinition>;

export const HumanMysticBaseSkills = {
  ...pickSkillDefs(common),
};

export const HumanMysticClericSkills = pickSkillDefs(Cleric);
export const HumanMysticWizardSkills = pickSkillDefs(Wizard);
export const HumanMysticSorcererSkills = pickSkillDefs(Sorcerer);
export const HumanMysticNecromancerSkills = pickSkillDefs(Necromancer);
export const HumanMysticArcanaLordSkills = pickSkillDefs(ArcanaLord);
export const HumanMysticArchmageSkills = pickSkillDefs(Archmage);
export const HumanMysticSoultakerSkills = pickSkillDefs(Soultaker);
export const HumanMysticBishopSkills = pickSkillDefs(Bishop);
export const HumanMysticProphetSkills = pickSkillDefs(Prophet);
export const HumanMysticHierophantSkills = pickSkillDefs(Hierophant);
export const HumanMysticCardinalSkills = pickSkillDefs(Cardinal);
export const HumanMysticWarlockSkills = pickSkillDefs(Warlock);
