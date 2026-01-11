import { SkillDefinition } from "../../../types";

export const Skill_0208: SkillDefinition = {
  id: 208,
  code: "HF_0208",
  name: "Bow Mastery",
  description: "Increases P. Atk. when using a bow.\n\nУвеличивает физ. атаку при использовании лука.",
  icon: "/skills/skill0208.gif",
  category: "passive",
  powerType: "flat",
  target: "self",
  scope: "single",
  effects: [
  {
    "stat": "pAtk",
    "mode": "flat"
  }
],
  levels: [
  {
    "level": 1,
    "requiredLevel": 20,
    "spCost": 1100,
    "mpCost": 0,
    "power": 10.3
  },
  {
    "level": 2,
    "requiredLevel": 20,
    "spCost": 1100,
    "mpCost": 0,
    "power": 11.4
  },
  {
    "level": 3,
    "requiredLevel": 20,
    "spCost": 1100,
    "mpCost": 0,
    "power": 27.6
  },
  {
    "level": 4,
    "requiredLevel": 24,
    "spCost": 1900,
    "mpCost": 0,
    "power": 32.8
  },
  {
    "level": 5,
    "requiredLevel": 24,
    "spCost": 1900,
    "mpCost": 0,
    "power": 35.6
  },
  {
    "level": 6,
    "requiredLevel": 24,
    "spCost": 1900,
    "mpCost": 0,
    "power": 38.6
  },
  {
    "level": 7,
    "requiredLevel": 28,
    "spCost": 3600,
    "mpCost": 0,
    "power": 45.2
  },
  {
    "level": 8,
    "requiredLevel": 28,
    "spCost": 3600,
    "mpCost": 0,
    "power": 48.9
  },
  {
    "level": 9,
    "requiredLevel": 28,
    "spCost": 3600,
    "mpCost": 0,
    "power": 52.7
  },
  {
    "level": 10,
    "requiredLevel": 32,
    "spCost": 6100,
    "mpCost": 0,
    "power": 61.1
  },
  {
    "level": 11,
    "requiredLevel": 32,
    "spCost": 6100,
    "mpCost": 0,
    "power": 65.6
  },
  {
    "level": 12,
    "requiredLevel": 32,
    "spCost": 6100,
    "mpCost": 0,
    "power": 70.4
  },
  {
    "level": 13,
    "requiredLevel": 36,
    "spCost": 10000,
    "mpCost": 0,
    "power": 80.9
  },
  {
    "level": 14,
    "requiredLevel": 36,
    "spCost": 10000,
    "mpCost": 0,
    "power": 86.5
  },
  {
    "level": 15,
    "requiredLevel": 36,
    "spCost": 10000,
    "mpCost": 0,
    "power": 92.4
  }
]
};
