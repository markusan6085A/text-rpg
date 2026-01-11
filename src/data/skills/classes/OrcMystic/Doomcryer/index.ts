import { skill_0328 } from "./skill_0328";
import { skill_0329 } from "./skill_0329";
import { skill_0331 } from "./skill_0331";
import { skill_0336 } from "./skill_0336";
import { skill_1362 } from "./skill_1362";
import { skill_1363 } from "./skill_1363";

export {
  skill_0328,
  skill_0329,
  skill_0331,
  skill_0336,
  skill_1362,
  skill_1363,
};

const pickSkillDefs = (module: Record<string, any>) =>
  Object.fromEntries(
    Object.entries(module).filter(
      ([, v]) => v && typeof v === "object" && "id" in v && "levels" in v
    )
  ) as Record<string, any>;

export const DoomcryerSkills = pickSkillDefs({
  skill_0328,
  skill_0329,
  skill_0331,
  skill_0336,
  skill_1362,
  skill_1363,
});

