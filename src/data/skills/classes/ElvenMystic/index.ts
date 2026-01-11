import * as common from "./common";
import * as ElvenOracle from "./ElvenOracle";
import * as ElvenElder from "./ElvenElder";
import * as ElvenWizard from "./ElvenWizard";
import { ElvenMysticElementalSummonerSkills } from "./ElementalSummoner";
import { ElvenMysticElementalMasterSkills } from "./ElementalMaster";
import * as Spellsinger from "./Spellsinger";
import * as MysticMuse from "./MysticMuse";
import { ElvenMysticEvasSaintSkills } from "./EvasSaint";
import type { SkillDefinition } from "../../types";

const pickSkillDefs = (module: Record<string, any>) =>
  Object.fromEntries(
    Object.entries(module).filter(
      ([, v]) => v && typeof v === "object" && "id" in v && "levels" in v
    )
  ) as Record<string, SkillDefinition>;

export const ElvenMysticBaseSkills = {
  ...pickSkillDefs(common),
};

export const ElvenMysticElvenOracleSkills = pickSkillDefs(ElvenOracle);
export const ElvenMysticElvenElderSkills = pickSkillDefs(ElvenElder);
export const ElvenMysticElvenWizardSkills = pickSkillDefs(ElvenWizard);
export { ElvenMysticElementalSummonerSkills };
export { ElvenMysticElementalMasterSkills };
export const ElvenMysticSpellsingerSkills = pickSkillDefs(Spellsinger);
export const ElvenMysticMysticMuseSkills = pickSkillDefs(MysticMuse);
export { ElvenMysticEvasSaintSkills };

