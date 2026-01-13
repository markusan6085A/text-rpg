import { SkillDefinition } from "../../../types";

// Create Item - creates items of different levels
// XML: no power values, handled by game logic
export const skill_1320: SkillDefinition = {
  id: 1320,
  code: "AR_1320",
  name: "Create Item",
  description: "Level 2-4 items can be manufactured.\n\nПозволяет создавать предметы 2-4 уровня.",
  icon: "/skills/skill0172.gif",
  category: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  levels: [
    { level: 2, requiredLevel: 20, spCost: 3700, mpCost: 0, power: 0 },
    { level: 3, requiredLevel: 28, spCost: 13000, mpCost: 0, power: 0 },
    { level: 4, requiredLevel: 36, spCost: 34000, mpCost: 0, power: 0 },
  ],
};

