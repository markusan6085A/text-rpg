import { SkillDefinition } from "../../../types";

// Twister
export const skill_1178: SkillDefinition = {
  id: 1178,
  code: "DW_1178",
  name: "Twister",
  description: "Blasts a target with violent winds. Power 23.\n\nАтака ветром, кастуется на врагов, действует в пределах дальности 750: - Магическая атака силой 23.",
  icon: "/skills/skill1178.gif",
  category: "magic_attack",
  powerType: "damage",
  target: "enemy",
  scope: "single",
  castTime: 4,
  cooldown: 6,
  element: "wind",
  levels: [
    { level: 1, requiredLevel: 17, spCost: 3200, mpCost: 18, power: 23.0 },
    { level: 2, requiredLevel: 20, spCost: 5800, mpCost: 20, power: 26.0 },
    { level: 3, requiredLevel: 23, spCost: 12000, mpCost: 22, power: 29.0 },
    { level: 4, requiredLevel: 25, spCost: 23000, mpCost: 23, power: 32.0 },
    { level: 5, requiredLevel: 28, spCost: 39000, mpCost: 26, power: 35.0 },
    { level: 6, requiredLevel: 30, spCost: 56000, mpCost: 27, power: 38.0 },
    { level: 7, requiredLevel: 33, spCost: 71000, mpCost: 29, power: 42.0 },
    { level: 8, requiredLevel: 35, spCost: 92000, mpCost: 30, power: 44.0 },
  ],
};

