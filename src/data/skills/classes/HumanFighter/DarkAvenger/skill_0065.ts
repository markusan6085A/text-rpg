import { SkillDefinition } from "../../../types";

// Horror для DarkAvenger (рівні 1-13)
export const skill_0065: SkillDefinition = {
  id: 65,
  code: "DAV_0065",
  name: "Horror",
  description: "Makes enemy fearful and run away.\n\nЗаставляет врага испытывать страх и убегать. Длительность: 10 сек. Шанс: зависит от MEN врага. Каст: 3 сек. Перезарядка: 20 сек.",
  category: "debuff",
  powerType: "none",
  target: "enemy",
  scope: "single",
  castTime: 3,
  cooldown: 20,
  icon: "/skills/skill0065.gif",
  effects: [
    { stat: "fearResist", mode: "flat", duration: 10 },
  ],
  levels: [
    { level: 1, requiredLevel: 46, spCost: 47000, mpCost: 22, power: 0 },
    { level: 2, requiredLevel: 49, spCost: 70000, mpCost: 23, power: 0 },
    { level: 3, requiredLevel: 52, spCost: 120000, mpCost: 24, power: 0 },
    { level: 4, requiredLevel: 55, spCost: 170000, mpCost: 25, power: 0 },
    { level: 5, requiredLevel: 58, spCost: 170000, mpCost: 28, power: 0 },
    { level: 6, requiredLevel: 60, spCost: 260000, mpCost: 28, power: 0 },
    { level: 7, requiredLevel: 62, spCost: 310000, mpCost: 29, power: 0 },
    { level: 8, requiredLevel: 64, spCost: 370000, mpCost: 30, power: 0 },
    { level: 9, requiredLevel: 66, spCost: 540000, mpCost: 32, power: 0 },
    { level: 10, requiredLevel: 68, spCost: 650000, mpCost: 33, power: 0 },
    { level: 11, requiredLevel: 70, spCost: 660000, mpCost: 33, power: 0 },
    { level: 12, requiredLevel: 72, spCost: 1200000, mpCost: 34, power: 0 },
    { level: 13, requiredLevel: 74, spCost: 1800000, mpCost: 35, power: 0 },
  ],
};

