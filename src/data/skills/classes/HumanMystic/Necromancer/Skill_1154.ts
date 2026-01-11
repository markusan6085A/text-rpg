import { SkillDefinition } from "../../../types";

export const skill_1154: SkillDefinition = {
  id: 1154,
  code: "HM_1154",
  name: "Summon Corrupted Man",
  description: "Summons a Corrupted Man out of a corpse. Requires 3 Crystals: D-Grade. 90% of acquired Exp will be consumed.",
  icon: "/skills/skill1154.gif",
  category: "special",
  powerType: "none",
  target: "self",
  scope: "single",
  castTime: 1.5,
  cooldown: 20,
  levels: [
  {
    "level": 1,
    "requiredLevel": 40,
    "spCost": 32000,
    "mpCost": 70,
    "power": 0
  },
  {
    "level": 2,
    "requiredLevel": 48,
    "spCost": 55000,
    "mpCost": 87,
    "power": 0
  },
  {
    "level": 3,
    "requiredLevel": 56,
    "spCost": 83000,
    "mpCost": 103,
    "power": 0
  },
  {
    "level": 4,
    "requiredLevel": 62,
    "spCost": 180000,
    "mpCost": 115,
    "power": 0
  },
  {
    "level": 5,
    "requiredLevel": 66,
    "spCost": 300000,
    "mpCost": 123,
    "power": 0
  },
  {
    "level": 6,
    "requiredLevel": 70,
    "spCost": 410000,
    "mpCost": 130,
    "power": 0
  }
]
};

