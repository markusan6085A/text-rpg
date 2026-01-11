import { SkillDefinition } from "../../../types";

export const Skill_0209: SkillDefinition = {
  id: 209,
  code: "HF_0209",
  name: "Dagger Mastery",
  description: "Increases P. Atk. when using a dagger.\n\nУвеличивает физ. атаку при использовании кинжала.",
  icon: "/skills/skill0209.gif",
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
    "spCost": 16000,
    "mpCost": 0,
    "power": 3.6
  },
  {
    "level": 2,
    "requiredLevel": 24,
    "spCost": 0,
    "mpCost": 0,
    "power": 6
  },
  {
    "level": 3,
    "requiredLevel": 28,
    "spCost": 0,
    "mpCost": 0,
    "power": 7.4
  },
  {
    "level": 4,
    "requiredLevel": 32,
    "spCost": 0,
    "mpCost": 0,
    "power": 9
  },
  {
    "level": 5,
    "requiredLevel": 36,
    "spCost": 0,
    "mpCost": 0,
    "power": 10.8
  },
  {
    "level": 6,
    "requiredLevel": 40,
    "spCost": 0,
    "mpCost": 0,
    "power": 12.8
  },
  {
    "level": 7,
    "requiredLevel": 40,
    "spCost": 0,
    "mpCost": 0,
    "power": 17.6
  }
]
};
