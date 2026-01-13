import { SkillDefinition } from "../../../types";

export const skill_1262: SkillDefinition = {
  id: 1262,
  code: "HM_1262",
  name: "Summon Servant",
  description: "Summon servant skill.\n\nНавык призыва слуги.",
  icon: "/skills/skill1262.gif",
  category: "toggle",
  powerType: "none",
  target: "self",
  scope: "single",
  duration: 3600,
  levels: [
  {
    "level": 1,
    "requiredLevel": 40,
    "spCost": 32000,
    "mpCost": 7,
    "power": 0
  },
  {
    "level": 2,
    "requiredLevel": 48,
    "spCost": 55000,
    "mpCost": 9,
    "power": 0
  },
  {
    "level": 3,
    "requiredLevel": 56,
    "spCost": 83000,
    "mpCost": 11,
    "power": 0
  },
  {
    "level": 4,
    "requiredLevel": 58,
    "spCost": 100000,
    "mpCost": 11,
    "power": 0
  },
  {
    "level": 5,
    "requiredLevel": 70,
    "spCost": 410000,
    "mpCost": 13,
    "power": 0
  }
]
};

