import { SkillDefinition } from "../../../types";
import { skill_0164 as base } from "../Prophet/skill_0164";

export const skill_0164: SkillDefinition = { ...base, levels: [
  {
    "level": 3,
    "requiredLevel": 48,
    "spCost": 75000,
    "mpCost": 0,
    "power": 0.7 // -30% CD
  }
] };
