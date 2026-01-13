import { SkillDefinition } from "../../../types";

// Deflect Arrow для HumanKnight (рівні 1-2)
export const skill_0112: SkillDefinition = {
  id: 112,
  code: "HK_0112",
  name: "Deflect Arrow",
  description: "Increases defense against bow attacks.\n\nУвеличивает защиту от атак луком на 16-19% (зависит от уровня). Длительность: 20 мин. Каст: 1.5 сек. Перезарядка: 10 сек.",
  category: "buff",
  powerType: "percent",
  target: "self",
  scope: "single",
  castTime: 1.5,
  cooldown: 10,
  duration: 1200,
  icon: "/skills/skill0112.gif",
  effects: [
    { stat: "pDef", mode: "percent" },
  ],
  levels: [
    { level: 1, requiredLevel: 24, spCost: 10000, mpCost: 22, power: 16 },
    { level: 2, requiredLevel: 32, spCost: 25000, mpCost: 28, power: 19 },
  ],
};


