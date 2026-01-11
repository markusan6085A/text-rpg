import { SkillDefinition } from "../../../types";

export const Skill_0176: SkillDefinition = {
  id: 176,
  code: "OR_0176",
  name: "Frenzy",
  description: "Temporarily boosts P. Atk. substantially. Only works when HP drops to 30% or lower. Effect 2.\n\nВременно значительно увеличивает физ. атаку на 150%. Работает только когда HP падает до 30% или ниже.",
  icon: "/skills/skill0176.gif",
  category: "buff",
  powerType: "percent",
  target: "self",
  scope: "single",
  castTime: 1.5,
  cooldown: 600,
  duration: 90,
  hpThreshold: 0.3,
  effects: [
    { stat: "pAtk", mode: "multiplier" },
  ],
  levels: [
    { level: 2, requiredLevel: 46, spCost: 50000, mpCost: 21, power: 2.5 },
    { level: 3, requiredLevel: 55, spCost: 180000, mpCost: 25, power: 3.0 },
  ],
};

