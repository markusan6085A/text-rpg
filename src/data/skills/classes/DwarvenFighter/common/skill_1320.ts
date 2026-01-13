import { SkillDefinition } from "../../../types";

// Create Common Item - creates level 1-9 common items
export const skill_1320: SkillDefinition = {
  id: 1320,
  code: "DF_1320",
  name: "Create Common Item",
  description: "Creates level 1 common items.\n\nПозволяет создавать предметы 1 уровня общего типа.",
  icon: "/skills/skill0172.gif",
  category: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  levels: [
    { level: 1, requiredLevel: 5, spCost: 0, mpCost: 0, power: 0 },
    { level: 2, requiredLevel: 20, spCost: 0, mpCost: 0, power: 0 },
  ],
};

