import { SkillDefinition } from "../../../types";
import { skill_1078 as base } from "../Cleric/skill_1078";

export const skill_1078: SkillDefinition = { ...base, levels: [
  {
    "level": 3,
    "requiredLevel": 44,
    "spCost": 43000,
    "mpCost": 39,
    "power": 20
  },
  {
    "level": 4,
    "requiredLevel": 52,
    "spCost": 100000,
    "mpCost": 48,
    "power": 20
  },
  {
    "level": 5,
    "requiredLevel": 60,
    "spCost": 180000,
    "mpCost": 55,
    "power": 20
  },
  {
    "level": 6,
    "requiredLevel": 68,
    "spCost": 430000,
    "mpCost": 64,
    "power": 20
  }
] };
