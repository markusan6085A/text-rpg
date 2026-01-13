import { SkillDefinition } from "../../../types";

// Solar Flare - launches a sacred magical attack
export const skill_1220: SkillDefinition = {
  id: 1220,
  code: "ES_1220",
  name: "Solar Flare",
  description: "Launches a sacred magical attack. Over-hit is possible. Power 65-119.\n\nЗапускает священную магическую атаку. Возможен оверхит. Сила 65-119.",
  icon: "/skills/skill1220.gif",
  category: "magic_attack",
  powerType: "damage",
  element: "holy",
  target: "enemy",
  scope: "single",
  castTime: 5,
  cooldown: 30,
  levels: [
    { level: 1, requiredLevel: 40, spCost: 28000, mpCost: 44, power: 65 },
    { level: 2, requiredLevel: 44, spCost: 37000, mpCost: 49, power: 73 },
    { level: 3, requiredLevel: 48, spCost: 60000, mpCost: 54, power: 81 },
    { level: 4, requiredLevel: 52, spCost: 95000, mpCost: 59, power: 89 },
    { level: 5, requiredLevel: 56, spCost: 95000, mpCost: 64, power: 98 },
    { level: 6, requiredLevel: 58, spCost: 120000, mpCost: 67, power: 102 },
    { level: 7, requiredLevel: 60, spCost: 150000, mpCost: 69, power: 107 },
    { level: 8, requiredLevel: 62, spCost: 180000, mpCost: 72, power: 111 },
    { level: 9, requiredLevel: 64, spCost: 250000, mpCost: 74, power: 115 },
    { level: 10, requiredLevel: 66, spCost: 350000, mpCost: 77, power: 119 },
  ],
};

