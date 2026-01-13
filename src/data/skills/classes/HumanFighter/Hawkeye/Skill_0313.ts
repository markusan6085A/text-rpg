import { SkillDefinition } from "../../../types";

export const Skill_0313: SkillDefinition = {
  id: 313,
  code: "HF_0313",
  name: "Snipe",
  description: "Temporarily increases Accuracy, P. Atk., range of attack, and critical attack rate. Immobilizes while in effect. Effect 1.\n\nВременно увеличивает точность, физ. атаку, дальность атаки и шанс критического удара. Обездвиживает во время действия.",
  icon: "/skills/skill0313.gif",
  category: "buff",
  powerType: "none",
  target: "self",
  scope: "single",
  duration: 120,
  effects: [
    {
      "stat": "pAtk",
      "mode": "flat"
    },
    {
      "stat": "accuracy",
      "mode": "flat"
    },
    {
      "stat": "critRate",
      "mode": "percent",
      "value": 20
    }
  ],
  castTime: 1.5,
  cooldown: 10,
  levels: [
    { level: 1, requiredLevel: 40, spCost: 0, mpCost: 28, power: 124 },
    { level: 2, requiredLevel: 42, spCost: 0, mpCost: 29, power: 134 },
    { level: 3, requiredLevel: 44, spCost: 0, mpCost: 30, power: 145 },
    { level: 4, requiredLevel: 46, spCost: 0, mpCost: 31, power: 155 },
    { level: 5, requiredLevel: 48, spCost: 0, mpCost: 32, power: 166 },
    { level: 6, requiredLevel: 50, spCost: 0, mpCost: 33, power: 177 },
    { level: 7, requiredLevel: 52, spCost: 0, mpCost: 34, power: 188 },
    { level: 8, requiredLevel: 54, spCost: 0, mpCost: 34, power: 199 },
  ],
};

