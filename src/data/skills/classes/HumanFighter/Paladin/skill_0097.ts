import { SkillDefinition } from "../../../types";

// Sanctuary для Paladin (рівні 1-11)
export const skill_0097: SkillDefinition = {
  id: 97,
  code: "PAL_0097",
  name: "Sanctuary",
  description: "Instantly reduces P. Atk. of surrounding undead monsters.\n\nМгновенно снижает физ. атаку окружающих нежити на 23% на 15 сек. Радиус: 200. Шанс: 40%. Каст: 1.5 сек. Перезарядка: 8 сек.",
  category: "debuff",
  powerType: "flat",
  target: "enemy",
  scope: "area",
  castTime: 1.5,
  cooldown: 8,
  chance: 40,
  icon: "/skills/skill0097.gif",
  effects: [
    { stat: "pAtk", mode: "percent", duration: 15 }, // value береться з levelDef.power залежно від рівня
  ],
  levels: [
    { level: 1, requiredLevel: 52, spCost: 120000, mpCost: 70, power: 5 },
    { level: 2, requiredLevel: 55, spCost: 150000, mpCost: 75, power: 10 },
    { level: 3, requiredLevel: 58, spCost: 200000, mpCost: 80, power: 14 },
    { level: 4, requiredLevel: 60, spCost: 270000, mpCost: 83, power: 18 },
    { level: 5, requiredLevel: 62, spCost: 330000, mpCost: 86, power: 20 },
    { level: 6, requiredLevel: 64, spCost: 370000, mpCost: 89, power: 23 },
    { level: 7, requiredLevel: 66, spCost: 580000, mpCost: 92, power: 26 },
    { level: 8, requiredLevel: 68, spCost: 650000, mpCost: 95, power: 29 },
    { level: 9, requiredLevel: 70, spCost: 780000, mpCost: 97, power: 32 },
    { level: 10, requiredLevel: 72, spCost: 1200000, mpCost: 100, power: 34 },
    { level: 11, requiredLevel: 74, spCost: 1900000, mpCost: 102, power: 36 },
  ],
};

