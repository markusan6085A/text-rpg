import { SkillDefinition } from "../../../types";

// Aqua Splash - powerful wave attack, useful against multiple enemies
export const skill_1287: SkillDefinition = {
  id: 1287,
  code: "ES_1287",
  name: "Aqua Splash",
  description: "Powerful wave attack, useful against multiple enemies. Power 41-54.\n\nМощная волновая атака, полезная против нескольких врагов. Сила 41-54.",
  icon: "/skills/skill1287.gif",
  category: "magic_attack",
  powerType: "damage",
  element: "water",
  target: "enemy",
  scope: "area",
  castTime: 5,
  cooldown: 20,
  levels: [
    { level: 1, requiredLevel: 58, spCost: 120000, mpCost: 80, power: 41 },
    { level: 2, requiredLevel: 60, spCost: 150000, mpCost: 83, power: 43 },
    { level: 3, requiredLevel: 62, spCost: 180000, mpCost: 85, power: 45 },
    { level: 4, requiredLevel: 64, spCost: 240000, mpCost: 88, power: 47 },
    { level: 5, requiredLevel: 66, spCost: 290000, mpCost: 91, power: 49 },
    { level: 6, requiredLevel: 68, spCost: 390000, mpCost: 95, power: 50 },
    { level: 7, requiredLevel: 70, spCost: 470000, mpCost: 98, power: 51 },
    { level: 8, requiredLevel: 72, spCost: 790000, mpCost: 100, power: 53 },
    { level: 9, requiredLevel: 74, spCost: 1100000, mpCost: 103, power: 54 },
  ],
};

