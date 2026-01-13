import * as common from "./common";
import * as ShillienOracle from "./ShillienOracle";
import { DarkMysticShillienElderSkills } from "./ShillienElder";
import { DarkMysticShillienSaintSkills } from "./ShillienSaint";
import { DarkMysticDarkWizardSkills } from "./Dark Wizard";
import { DarkMysticSpellhowlerSkills } from "./Spellhowler";
import { DarkMysticStormScreamerSkills } from "./StormScreamer";
import { DarkMysticPhantomSummonerSkills } from "./PhantomSummoner";
import { DarkMysticSpectralMasterSkills } from "./SpectralMaster";
import type { SkillDefinition } from "../../types";

const pickSkillDefs = (module: Record<string, any>) =>
  Object.fromEntries(
    Object.entries(module).filter(
      ([, v]) => v && typeof v === "object" && "id" in v && "levels" in v
    )
  ) as Record<string, SkillDefinition>;

export const DarkMysticCommonSkills = pickSkillDefs(common);
export const DarkMysticShillienOracleSkills = pickSkillDefs(ShillienOracle);
export { DarkMysticShillienElderSkills };
export { DarkMysticShillienSaintSkills };
export { DarkMysticDarkWizardSkills };
export { DarkMysticSpellhowlerSkills };
export { DarkMysticStormScreamerSkills };
export { DarkMysticPhantomSummonerSkills };
export { DarkMysticSpectralMasterSkills };

