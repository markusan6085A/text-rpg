import { SkillDefinition } from "../../../types";

// Entangle - continuation from Elven Knight (lv.2-16)
export const skill_0102: SkillDefinition = {
  id: 102,
  code: "TK_0102",
  name: "Entangle",
  description: "Temporarily reduces target's Speed. Effect 3.\n\nВременно уменьшает скорость передвижения на 50% на 2 сек. Шанс 80% (зависит от WIT стата), действует на врагов, действует в радиусе 600.",
  icon: "/skills/skill0102.gif",
  category: "debuff",
  powerType: "none",
  target: "enemy",
  scope: "single",
  castTime: 3,
  cooldown: 7,
  duration: 2,
  chance: 80,
  effects: [
    { stat: "runSpeed", mode: "percent", value: -50 }, // -50% speed reduction
  ],
  levels: [
    { level: 2, requiredLevel: 40, spCost: 40000, mpCost: 18, power: 0 },
    { level: 3, requiredLevel: 43, spCost: 41000, mpCost: 19, power: 0 },
    { level: 4, requiredLevel: 46, spCost: 50000, mpCost: 22, power: 0 },
    { level: 5, requiredLevel: 49, spCost: 82000, mpCost: 23, power: 0 },
    { level: 6, requiredLevel: 52, spCost: 120000, mpCost: 24, power: 0 },
    { level: 7, requiredLevel: 55, spCost: 180000, mpCost: 25, power: 0 },
    { level: 8, requiredLevel: 58, spCost: 200000, mpCost: 28, power: 0 },
    { level: 9, requiredLevel: 60, spCost: 220000, mpCost: 28, power: 0 },
    { level: 10, requiredLevel: 62, spCost: 310000, mpCost: 29, power: 0 },
    { level: 11, requiredLevel: 64, spCost: 370000, mpCost: 30, power: 0 },
    { level: 12, requiredLevel: 66, spCost: 580000, mpCost: 32, power: 0 },
    { level: 13, requiredLevel: 68, spCost: 650000, mpCost: 33, power: 0 },
    { level: 14, requiredLevel: 70, spCost: 720000, mpCost: 33, power: 0 },
    { level: 15, requiredLevel: 72, spCost: 1200000, mpCost: 34, power: 0 },
    { level: 16, requiredLevel: 74, spCost: 1900000, mpCost: 35, power: 0 },
  ],
};

