import { SkillDefinition } from "../../../types";
import { skill_0212 as base } from "../Cleric/skill_0212";

export const skill_0212: SkillDefinition = { ...base, levels: [
  {
    "level": 2,
    "requiredLevel": 44,
    "spCost": 43000,
    "mpCost": 0,
    "power": 1.6
  },
  {
    "level": 3,
    "requiredLevel": 52,
    "spCost": 100000,
    "mpCost": 0,
    "power": 1.7
  },
  {
    "level": 4,
    "requiredLevel": 58,
    "spCost": 150000,
    "mpCost": 0,
    "power": 2.1
  },
  {
    "level": 5,
    "requiredLevel": 64,
    "spCost": 300000,
    "mpCost": 0,
    "power": 2.6
  },
  {
    "level": 6,
    "requiredLevel": 74,
    "spCost": 1300000,
    "mpCost": 0,
    "power": 2.7
  }
] };

