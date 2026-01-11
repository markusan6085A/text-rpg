import { SkillDefinition } from "../../../types";

// Aqua Swirl - attacks target with a burst of water
export const skill_1178: SkillDefinition = {
  id: 1178,
  code: "EW_1178",
  name: "Aqua Swirl",
  description: "Attacks target with a burst of water. Power 23.\n\nАтака водой, кастуется на врагов, действует в пределах дальности 750. Сила: 23-44 (зависит от уровня). Каст: 4 сек. Перезарядка: 6 сек.",
  icon: "/skills/skill1178.gif",
  category: "magic_attack",
  powerType: "damage",
  target: "enemy",
  scope: "single",
  element: "water",
  castTime: 4,
  cooldown: 6,
  levels: [
    { level: 1, requiredLevel: 20, spCost: 1600, mpCost: 18, power: 23 },
    { level: 2, requiredLevel: 20, spCost: 1600, mpCost: 20, power: 26 },
    { level: 3, requiredLevel: 25, spCost: 3100, mpCost: 22, power: 29 },
    { level: 4, requiredLevel: 25, spCost: 3100, mpCost: 23, power: 32 },
    { level: 5, requiredLevel: 30, spCost: 5800, mpCost: 25, power: 35 },
    { level: 6, requiredLevel: 30, spCost: 5800, mpCost: 27, power: 38 },
    { level: 7, requiredLevel: 35, spCost: 10000, mpCost: 29, power: 42 },
    { level: 8, requiredLevel: 35, spCost: 10000, mpCost: 30, power: 44 },
  ],
};

