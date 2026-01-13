import { SkillDefinition } from "../../../types";

// Wind Strike - 5 levels from XML
// power: 12.0, 13.0, 15.0, 18.0, 21.0
// mpConsume: 7, 7, 8, 11, 12
export const skill_1177: SkillDefinition = {
  id: 1177,
  code: "DM_1177",
  name: "Wind Strike",
  description: "Blasts a target with violent winds. Wind element.\n\nАтака ветром.",
  icon: "/skills/Skill1177_0.jpg",
  category: "magic_attack",
  powerType: "damage",
  target: "enemy",
  scope: "single",
  element: "wind",
  castTime: 4,
  cooldown: 6,
  levels: [
    { level: 1, requiredLevel: 1, spCost: 0, mpCost: 7, power: 12.0 },
    { level: 2, requiredLevel: 7, spCost: 240, mpCost: 7, power: 13.0 },
    { level: 3, requiredLevel: 7, spCost: 240, mpCost: 8, power: 15.0 },
    { level: 4, requiredLevel: 14, spCost: 1100, mpCost: 11, power: 18.0 },
    { level: 5, requiredLevel: 14, spCost: 1100, mpCost: 12, power: 21.0 },
  ],
};

