import { SkillDefinition } from "../../../types";

// Battle Heal - quickly recovers HP
// З XML: levels="15", power: 83-301, mpConsume: 20-62
// Для Elven Oracle: рівні 4-15 (requiredLevel: 20-35)
export const skill_1015: SkillDefinition = {
  id: 1015,
  code: "EO_1015",
  name: "Battle Heal",
  description: "Quickly recovers HP. Power 83.\n\nБыстро восстанавливает HP. Сила: 121-301 (зависит от уровня). Каст: 2 сек. Перезарядка: 3 сек.",
  icon: "/skills/Skill1015_0.jpg",
  category: "heal",
  powerType: "flat",
  target: "ally",
  scope: "single",
  castTime: 2,
  cooldown: 3,
  levels: [
    { level: 4, requiredLevel: 20, spCost: 1100, mpCost: 28, power: 121 },
    { level: 5, requiredLevel: 20, spCost: 1100, mpCost: 32, power: 135 },
    { level: 6, requiredLevel: 20, spCost: 1100, mpCost: 35, power: 151 },
    { level: 7, requiredLevel: 25, spCost: 2200, mpCost: 39, power: 176 },
    { level: 8, requiredLevel: 25, spCost: 2200, mpCost: 41, power: 185 },
    { level: 9, requiredLevel: 25, spCost: 2200, mpCost: 43, power: 195 },
    { level: 10, requiredLevel: 30, spCost: 4100, mpCost: 49, power: 224 },
    { level: 11, requiredLevel: 30, spCost: 4100, mpCost: 52, power: 234 },
    { level: 12, requiredLevel: 30, spCost: 4100, mpCost: 53, power: 245 },
    { level: 13, requiredLevel: 35, spCost: 6900, mpCost: 57, power: 278 },
    { level: 14, requiredLevel: 35, spCost: 6900, mpCost: 59, power: 289 },
    { level: 15, requiredLevel: 35, spCost: 6900, mpCost: 62, power: 301 },
  ],
};

