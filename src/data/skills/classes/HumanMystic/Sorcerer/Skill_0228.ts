import { SkillDefinition } from "../../../types";
import { skill_0228 as base } from "../Cleric/skill_0228";

export const skill_0228: SkillDefinition = { ...base, levels: [
  {
    "level": 2,
    "requiredLevel": 40,
    "spCost": 34000,
    "mpCost": 0,
    "power": 7
  },
  {
    "level": 3,
    "requiredLevel": 56,
    "spCost": 110000,
    "mpCost": 0,
    "power": 10
  }
] };

