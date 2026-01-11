import { SkillDefinition } from "../../../types";

export const Skill_0139: SkillDefinition = {
  id: 139,
  code: "OR_0139",
  name: "Guts",
  description: "Temporarily boosts its P. Def. substantially. Only works when HP becomes 30% or lower. Effect 2.\n\nВременно значительно увеличивает физ. защиту на 150%. Работает только когда HP падает до 30% или ниже.",
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
    { stat: "pDef", mode: "multiplier" },
  ],
  levels: [
    { level: 2, requiredLevel: 43, spCost: 38000, mpCost: 19, power: 2.5 },
    { level: 3, requiredLevel: 52, spCost: 120000, mpCost: 24, power: 3.0 },
  ],
};

