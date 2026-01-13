import { SkillDefinition } from "../../../types";

// Recharge - regenerates MP (continuation for Elven Elder)
// З XML: levels="32", mpConsume: 39-109, power: 49-136
// Для Elven Elder: рівні 5-32 (requiredLevel: 40-74)
export const skill_1013: SkillDefinition = {
  id: 1013,
  code: "EE_1013",
  name: "Recharge",
  description: "Restores one's MP. Power 66.\n\nВосстанавливает MP. Сила: 66-136 (зависит от уровня). Нельзя использовать на классах, которые имеют Recharge. Каст: 6 сек. Перезарядка: 12 сек.",
  icon: "/skills/skill1013.gif",
  category: "heal",
  powerType: "flat",
  target: "ally",
  scope: "single",
  castTime: 6,
  cooldown: 12,
  effects: [],
  levels: [
    { level: 5, requiredLevel: 40, spCost: 17000, mpCost: 67, power: 66 },
    { level: 6, requiredLevel: 40, spCost: 17000, mpCost: 70, power: 70 },
    { level: 7, requiredLevel: 44, spCost: 21000, mpCost: 74, power: 73 },
    { level: 8, requiredLevel: 44, spCost: 21000, mpCost: 78, power: 77 },
    { level: 9, requiredLevel: 48, spCost: 22000, mpCost: 82, power: 81 },
    { level: 10, requiredLevel: 48, spCost: 22000, mpCost: 87, power: 86 },
    { level: 11, requiredLevel: 52, spCost: 50000, mpCost: 90, power: 90 },
    { level: 12, requiredLevel: 52, spCost: 50000, mpCost: 94, power: 94 },
    { level: 13, requiredLevel: 56, spCost: 53000, mpCost: 98, power: 98 },
    { level: 14, requiredLevel: 56, spCost: 53000, mpCost: 103, power: 102 },
    { level: 15, requiredLevel: 58, spCost: 79000, mpCost: 104, power: 104 },
    { level: 16, requiredLevel: 58, spCost: 79000, mpCost: 107, power: 106 },
    { level: 17, requiredLevel: 60, spCost: 110000, mpCost: 109, power: 108 },
    { level: 18, requiredLevel: 60, spCost: 110000, mpCost: 110, power: 110 },
    { level: 19, requiredLevel: 62, spCost: 150000, mpCost: 113, power: 113 },
    { level: 20, requiredLevel: 62, spCost: 150000, mpCost: 115, power: 115 },
    { level: 21, requiredLevel: 64, spCost: 170000, mpCost: 117, power: 116 },
    { level: 22, requiredLevel: 64, spCost: 170000, mpCost: 119, power: 118 },
    { level: 23, requiredLevel: 66, spCost: 250000, mpCost: 120, power: 120 },
    { level: 24, requiredLevel: 66, spCost: 250000, mpCost: 123, power: 122 },
    { level: 25, requiredLevel: 68, spCost: 300000, mpCost: 124, power: 124 },
    { level: 26, requiredLevel: 68, spCost: 300000, mpCost: 127, power: 126 },
    { level: 27, requiredLevel: 70, spCost: 360000, mpCost: 128, power: 128 },
    { level: 28, requiredLevel: 70, spCost: 360000, mpCost: 130, power: 129 },
    { level: 29, requiredLevel: 72, spCost: 540000, mpCost: 132, power: 131 },
    { level: 30, requiredLevel: 72, spCost: 540000, mpCost: 133, power: 133 },
    { level: 31, requiredLevel: 74, spCost: 820000, mpCost: 135, power: 134 },
    { level: 32, requiredLevel: 74, spCost: 820000, mpCost: 137, power: 136 },
  ],
};













