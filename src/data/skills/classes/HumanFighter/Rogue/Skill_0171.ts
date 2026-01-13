import { SkillDefinition } from "../../../types";

export const Skill_0171: SkillDefinition = {
  id: 171,
  code: "HF_0171",
  name: "Esprit",
  description: "Increases recovery speed while one is running.\n\nУвеличивает скорость восстановления во время бега.",
  icon: "/skills/skill0171.gif",
  category: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  effects: [
  {
    "stat": "hpRegen",
    "mode": "flat"
  },
  {
    "stat": "mpRegen",
    "mode": "flat"
  }
],
  levels: [
  {
    "level": 1,
    "requiredLevel": 20,
    "spCost": 31000,
    "mpCost": 0,
    "power": 2.5
  },
  {
    "level": 2,
    "requiredLevel": 24,
    "spCost": 0,
    "mpCost": 0,
    "power": 3
  },
  {
    "level": 3,
    "requiredLevel": 28,
    "spCost": 0,
    "mpCost": 0,
    "power": 3.5
  },
  {
    "level": 4,
    "requiredLevel": 32,
    "spCost": 0,
    "mpCost": 0,
    "power": 4
  },
  {
    "level": 5,
    "requiredLevel": 36,
    "spCost": 0,
    "mpCost": 0,
    "power": 4.5
  },
  {
    "level": 6,
    "requiredLevel": 40,
    "spCost": 0,
    "mpCost": 0,
    "power": 5
  }
]
};
