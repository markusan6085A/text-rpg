import { SkillDefinition } from "../../../types";

export const Skill_0139: SkillDefinition = {
  id: 139,
  code: "OR_0139",
  name: "Guts",
  description: "Temporarily boosts its P. Def. substantially. Only works when HP becomes 30% or lower. Effect 1.\n\nВременно значительно увеличивает физ. защиту на 100%. Работает только когда HP падает до 30% или ниже.",
  icon: "/skills/skill0139.gif",
  category: "buff",
  powerType: "percent",
  target: "self",
  scope: "single",
  castTime: 1.5,
  cooldown: 600,
  duration: 90,
  hpThreshold: 0.3,
  effects: [
    { stat: "pDef", mode: "multiplier", multiplier: 2 },
  ],
  levels: [
    { level: 1, requiredLevel: 36, spCost: 17000, mpCost: 16, power: 100 },
  ],
};

