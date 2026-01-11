import { SkillDefinition } from "../../../types";
import { skill_1184 as base } from "../common/skill_1184";

// Ice Bolt - freezing attack that temporarily slows enemy's Speed
export const skill_1184: SkillDefinition = {
  ...base,
  code: "EW_1184",
  levels: [
    { level: 5, requiredLevel: 20, spCost: 1600, mpCost: 18, power: 14 },
    { level: 6, requiredLevel: 20, spCost: 1600, mpCost: 20, power: 16 },
  ],
};

