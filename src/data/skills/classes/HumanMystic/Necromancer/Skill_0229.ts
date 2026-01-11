import { SkillDefinition } from "../../../types";
import { skill_0229 as base } from "../Cleric/skill_0229";

export const skill_0229: SkillDefinition = {
  ...base,
  levels: [
    {
      level: 3,
      requiredLevel: 44,
      spCost: 35000,
      mpCost: 0,
      power: 1.9,
    },
    {
      level: 4,
      requiredLevel: 52,
      spCost: 78000,
      mpCost: 0,
      power: 2.3,
    },
    {
      level: 5,
      requiredLevel: 60,
      spCost: 130000,
      mpCost: 0,
      power: 2.7,
    },
    {
      level: 6,
      requiredLevel: 68,
      spCost: 330000,
      mpCost: 0,
      power: 3.1,
    },
    {
      level: 7,
      requiredLevel: 74,
      spCost: 920000,
      mpCost: 0,
      power: 3.4,
    },
  ],
};

