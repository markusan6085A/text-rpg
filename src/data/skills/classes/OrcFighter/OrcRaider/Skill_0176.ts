import { SkillDefinition } from "../../../types";

export const Skill_0176: SkillDefinition = {
  id: 176,
  code: "OR_0176",
  name: "Frenzy",
  description: "Temporarily boosts P. Atk. substantially. Only works when HP drops to 30% or lower. Effect 1.\n\nВременно значительно увеличивает физ. атаку на 100%. Работает только когда HP падает до 30% или ниже.",
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
    { stat: "pAtk", mode: "percent", value: 100 },
  ],
  levels: [
    { level: 1, requiredLevel: 32, spCost: 17000, mpCost: 14, power: 100 },
  ],
};

