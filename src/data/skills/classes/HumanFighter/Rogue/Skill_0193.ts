import { SkillDefinition } from "../../../types";

export const Skill_0193: SkillDefinition = {
  id: 193,
  code: "HF_0193",
  name: "Critical Power",
  description: "Increases the power of a critical attack.\n\nУвеличивает силу критического удара.",
  icon: "/skills/skill0193.gif",
  category: "passive",
  powerType: "flat",
  target: "self",
  scope: "single",
  effects: [
    {
      "stat": "critDamage",
      "mode": "flat"
    }
  ],
  levels: [
    {
      "level": 1,
      "requiredLevel": 24,
      "spCost": 0,
      "mpCost": 0,
      "power": 32
    },
    {
      "level": 2,
      "requiredLevel": 32,
      "spCost": 0,
      "mpCost": 0,
      "power": 56
    },
    {
      "level": 3,
      "requiredLevel": 40,
      "spCost": 0,
      "mpCost": 0,
      "power": 93
    }
  ]
};

