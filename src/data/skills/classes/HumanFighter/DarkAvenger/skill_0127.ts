import { SkillDefinition } from "../../../types";

// Hamstring для DarkAvenger (рівні 1-14)
export const skill_0127: SkillDefinition = {
  id: 127,
  code: "DAV_0127",
  name: "Hamstring",
  description: "Temporarily reduces enemy's Speed. Effect 3.\n\nВременно снижает скорость передвижения врага на 50%. Длительность: 2 сек. Шанс: 80% (зависит от WIT врага). Каст: 3 сек. Перезарядка: 7 сек.",
  category: "debuff",
  powerType: "none",
  target: "enemy",
  scope: "single",
  castTime: 3,
  cooldown: 7,
  chance: 80,
  icon: "/skills/skill0127.gif",
  effects: [
    { stat: "runSpeed", mode: "percent", value: -50, duration: 2 },
  ],
  levels: [
    { level: 1, requiredLevel: 43, spCost: 38000, mpCost: 19, power: 0 },
    { level: 2, requiredLevel: 46, spCost: 47000, mpCost: 22, power: 0 },
    { level: 3, requiredLevel: 49, spCost: 70000, mpCost: 23, power: 0 },
    { level: 4, requiredLevel: 52, spCost: 120000, mpCost: 24, power: 0 },
    { level: 5, requiredLevel: 55, spCost: 170000, mpCost: 25, power: 0 },
    { level: 6, requiredLevel: 58, spCost: 170000, mpCost: 28, power: 0 },
    { level: 7, requiredLevel: 60, spCost: 260000, mpCost: 28, power: 0 },
    { level: 8, requiredLevel: 62, spCost: 310000, mpCost: 29, power: 0 },
    { level: 9, requiredLevel: 64, spCost: 370000, mpCost: 30, power: 0 },
    { level: 10, requiredLevel: 66, spCost: 540000, mpCost: 32, power: 0 },
    { level: 11, requiredLevel: 68, spCost: 650000, mpCost: 33, power: 0 },
    { level: 12, requiredLevel: 70, spCost: 660000, mpCost: 33, power: 0 },
    { level: 13, requiredLevel: 72, spCost: 1200000, mpCost: 34, power: 0 },
    { level: 14, requiredLevel: 74, spCost: 1800000, mpCost: 35, power: 0 },
  ],
};

