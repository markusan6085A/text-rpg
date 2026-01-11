import { SkillDefinition } from "../../../types";

// Create Item - creates items of different levels (continuation from Artisan)
// XML: no power values, handled by game logic
export const skill_1320: SkillDefinition = {
  id: 1320,
  code: "WS_1320",
  name: "Create Item",
  description: "Level 5-9 items can be manufactured.\n\nПозволяет создавать предметы 5-9 уровня.",
  icon: "/skills/skill0172.gif",
  category: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  levels: [
    { level: 5, requiredLevel: 43, spCost: 46000, mpCost: 0, power: 0 },
    { level: 6, requiredLevel: 49, spCost: 110000, mpCost: 0, power: 0 },
    { level: 7, requiredLevel: 55, spCost: 250000, mpCost: 0, power: 0 },
    { level: 8, requiredLevel: 62, spCost: 400000, mpCost: 0, power: 0 },
    { level: 9, requiredLevel: 70, spCost: 850000, mpCost: 0, power: 0 },
  ],
};

