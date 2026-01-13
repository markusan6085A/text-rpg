import { SkillDefinition } from "../../../types";
import { skill_0213 as base } from "../Cleric/skill_0213";

export const skill_0213: SkillDefinition = {
  ...base,
  levels: [
    {
      level: 3,
      requiredLevel: 40,
      spCost: 32000,
      mpCost: 0,
      power: 70,
    },
    {
      level: 4,
      requiredLevel: 48,
      spCost: 75000,
      mpCost: 0,
      power: 100,
    },
    {
      level: 5,
      requiredLevel: 56,
      spCost: 130000,
      mpCost: 0,
      power: 140,
    },
    {
      level: 6,
      requiredLevel: 60,
      spCost: 210000,
      mpCost: 0,
      power: 152,
    },
    {
      level: 7,
      requiredLevel: 66,
      spCost: 540000,
      mpCost: 0,
      power: 180,
    },
    {
      level: 8,
      requiredLevel: 72,
      spCost: 1300000,
      mpCost: 0,
      power: 200,
    },
  ],
};
