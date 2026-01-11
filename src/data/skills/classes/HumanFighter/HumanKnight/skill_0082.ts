import { SkillDefinition } from "../../../types";

// Majesty для HumanKnight
export const skill_0082: SkillDefinition = {
  id: 82,
  code: "HK_0082",
  name: "Majesty",
  description: "Temporarily increase P. Def while decreasing Evasion.\n\nВременно увеличивает физ. защиту на 7-15% (зависит от уровня) и снижает уклонение на 2. Длительность: 5 мин. Каст: 1.5 сек. Перезарядка: 10 сек.",
  category: "buff",
  powerType: "percent",
  target: "self",
  scope: "single",
  castTime: 1.5,
  cooldown: 10,
  duration: 300,
  icon: "/skills/skill0082.gif",
  effects: [
    { stat: "pDef", mode: "percent", value: 7 },
    { stat: "evasion", mode: "flat", value: -2 },
  ],
  levels: [
    { level: 1, requiredLevel: 20, spCost: 4700, mpCost: 10, power: 7 },
    { level: 2, requiredLevel: 24, spCost: 10000, mpCost: 18, power: 11 },
    { level: 3, requiredLevel: 28, spCost: 18000, mpCost: 27, power: 15 },
  ],
};

